import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto, CartItemDto } from './dto/create-order.dto';
import { OrderStatus, OrderItemStatus } from '@prisma/client';

const TAX_RATE = 0.0825; // Oklahoma default

// Valid state machine transitions for order items
const ITEM_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  pending: ['accepted', 'rejected'],
  accepted: ['preparing', 'rejected'],
  preparing: ['ready'],
  ready: ['completed'],
  completed: [],
  rejected: [],
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    // Idempotency check
    const existing = await this.prisma.order.findUnique({
      where: { idempotency_key: dto.idempotency_key },
      include: { items: { include: { modifiers: true, vendor: true } } },
    });
    if (existing) return this.formatOrder(existing);

    // Table is optional — orders are identified by token, not table
    let tableId: string | null = null;
    if (dto.table_id) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.table_id);
      const tableNumber = isUuid ? NaN : parseInt(dto.table_id, 10);
      if (!isUuid && isNaN(tableNumber)) throw new NotFoundException('Table not found');
      const table = await this.prisma.table.findFirst({
        where: isUuid
          ? { id: dto.table_id, is_active: true }
          : { table_number: tableNumber, is_active: true },
      });
      if (!table) throw new NotFoundException('Table not found');
      tableId = table.id;
    }

    // Validate & price all cart items
    const priced = await this.priceCartItems(dto.items);

    const subtotal = priced.reduce((sum, i) => sum + i.totalPrice, 0);
    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    // Generate token number (daily sequence)
    const tokenDate = new Date().toISOString().slice(0, 10);
    const tokenNumber = await this.nextTokenNumber(tokenDate);

    const order = await this.prisma.order.create({
      data: {
        token_number: tokenNumber,
        token_date: tokenDate,
        table_id: tableId,
        session_id: dto.session_id,
        waiter_id: dto.waiter_id ?? null,
        idempotency_key: dto.idempotency_key,
        special_notes: dto.special_notes ?? null,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: taxAmount,
        total,
        status: 'pending',
        items: {
          create: priced.map((pi) => ({
            vendor_id: pi.vendorId,
            menu_item_id: pi.menuItemId,
            item_name: pi.itemName,
            quantity: pi.quantity,
            unit_price: pi.unitPrice,
            modifier_price: pi.modifierPrice,
            total_price: pi.totalPrice,
            special_instructions: pi.specialInstructions ?? null,
            estimated_prep_time: pi.prepTime,
            modifiers: {
              create: pi.modifierDetails.map((md) => ({
                modifier_id: md.id,
                modifier_name: md.name,
                price_at_order: md.price,
                quantity: md.quantity,
              })),
            },
          })),
        },
        history: {
          create: { from_status: null, to_status: 'pending' },
        },
      },
      include: {
        items: {
          include: {
            modifiers: true,
            vendor: { select: { name: true, booth_color: true } },
          },
        },
      },
    });

    return this.formatOrder(order);
  }

  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            modifiers: true,
            vendor: { select: { name: true, booth_color: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.formatOrder(order);
  }

  async getStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { vendor: { select: { name: true, booth_color: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      order_id: order.id,
      token_number: order.token_number,
      overall_status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        vendor_name: item.vendor.name,
        vendor_color: item.vendor.booth_color,
        item_name: item.item_name,
        status: item.status,
        estimated_prep_time_minutes: item.estimated_prep_time,
      })),
    };
  }

  async findByToken(tokenNumber: number) {
    const order = await this.prisma.order.findFirst({
      where: { token_number: tokenNumber },
      orderBy: { created_at: 'desc' },
      select: { id: true, token_number: true, status: true, created_at: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancel(orderId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');

    const hasAccepted = order.items.some((i) => i.status !== 'pending');
    if (hasAccepted) {
      throw new ConflictException('Cannot cancel order — some items already accepted');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        history: { create: { from_status: order.status, to_status: 'cancelled', reason } },
      },
      include: {
        items: { include: { modifiers: true, vendor: { select: { name: true, booth_color: true } } } },
      },
    });

    return this.formatOrder(updated);
  }

  // Called after all order items for a vendor change status — updates aggregate order status
  async syncOrderStatus(orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { order_id: orderId } });
    if (items.length === 0) return;

    const allCompleted = items.every((i) => i.status === 'completed' || i.status === 'rejected');
    const allReady = items.every((i) => ['ready', 'completed', 'rejected'].includes(i.status));
    const anyReady = items.some((i) => i.status === 'ready' || i.status === 'completed');
    const anyAccepted = items.some((i) => ['accepted', 'preparing', 'ready', 'completed'].includes(i.status));

    let newStatus: OrderStatus = 'pending';
    if (allCompleted) newStatus = 'completed';
    else if (allReady) newStatus = 'ready';
    else if (anyReady) newStatus = 'partially_ready';
    else if (anyAccepted) newStatus = 'confirmed';

    await this.prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
  }

  async getDisplayBoard(vendorId?: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { status: { in: ['preparing', 'ready'] }, ...(vendorId ? { vendor_id: vendorId } : {}) },
      include: {
        order: { select: { token_number: true } },
        vendor: { select: { id: true, name: true, booth_color: true, logo_url: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    const foodVillage = await this.prisma.foodVillage.findFirst();
    const vendorMap = new Map<string, { vendor_id: string; vendor_name: string; booth_color: string; logo_url: string | null; preparing: number[]; ready: number[] }>();

    for (const item of items) {
      if (!vendorMap.has(item.vendor_id)) {
        vendorMap.set(item.vendor_id, {
          vendor_id: item.vendor_id,
          vendor_name: item.vendor.name,
          booth_color: item.vendor.booth_color,
          logo_url: item.vendor.logo_url,
          preparing: [],
          ready: [],
        });
      }
      const v = vendorMap.get(item.vendor_id)!;
      if (item.status === 'preparing') v.preparing.push(item.order.token_number);
      else if (item.status === 'ready') v.ready.push(item.order.token_number);
    }

    return {
      food_village_name: foodVillage?.name ?? 'Food Port',
      vendors: Array.from(vendorMap.values()),
      last_updated: new Date().toISOString(),
    };
  }

  private async nextTokenNumber(tokenDate: string): Promise<number> {
    const last = await this.prisma.order.findFirst({
      where: { token_date: tokenDate },
      orderBy: { token_number: 'desc' },
      select: { token_number: true },
    });
    return (last?.token_number ?? 0) + 1;
  }

  private async priceCartItems(items: CartItemDto[]) {
    return Promise.all(items.map(async (item) => {
      const menuItem = await this.prisma.menuItem.findFirst({
        where: { id: item.menu_item_id, vendor_id: item.vendor_id, is_deleted: false },
      });
      if (!menuItem) throw new NotFoundException(`Menu item ${item.menu_item_id} not found`);
      if (!menuItem.is_available) throw new BadRequestException(`Item "${menuItem.name}" is sold out`);

      const modifierDetails: { id: string; name: string; price: number; quantity: number }[] = [];
      let modifierPrice = 0;

      for (const mod of item.modifiers) {
        const modifier = await this.prisma.modifier.findUnique({ where: { id: mod.modifier_id } });
        if (!modifier) throw new NotFoundException(`Modifier ${mod.modifier_id} not found`);
        const linePrice = modifier.price_adjustment * mod.quantity;
        modifierPrice += linePrice;
        modifierDetails.push({ id: modifier.id, name: modifier.name, price: modifier.price_adjustment, quantity: mod.quantity });
      }

      const unitTotal = menuItem.price;
      const lineTotal = Math.round((unitTotal + modifierPrice) * item.quantity * 100) / 100;

      return {
        vendorId: item.vendor_id,
        menuItemId: item.menu_item_id,
        itemName: menuItem.name,
        quantity: item.quantity,
        unitPrice: unitTotal,
        modifierPrice: Math.round(modifierPrice * 100) / 100,
        totalPrice: lineTotal,
        prepTime: menuItem.prep_time_minutes,
        specialInstructions: item.special_instructions,
        modifierDetails,
      };
    }));
  }

  private formatOrder(order: {
    id: string; token_number: number; table_id: string | null; session_id: string | null;
    status: OrderStatus; payment_method: string; payment_status: string;
    subtotal: number; tax_amount: number; total: number;
    created_at: Date; updated_at: Date;
    items: Array<{
      id: string; vendor_id: string; menu_item_id: string; item_name: string;
      quantity: number; unit_price: number; modifier_price: number; total_price: number;
      special_instructions: string | null; status: OrderItemStatus;
      estimated_prep_time: number; accepted_at: Date | null; preparing_at: Date | null;
      ready_at: Date | null; completed_at: Date | null;
      vendor: { name: string; booth_color: string };
      modifiers: Array<{ modifier_id: string; modifier_name: string; price_at_order: number; quantity: number }>;
    }>;
  }) {
    return {
      id: order.id,
      token_number: order.token_number,
      table_id: order.table_id,
      session_id: order.session_id,
      status: order.status,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      total: order.total,
      items: order.items.map((item) => ({
        id: item.id,
        vendor_id: item.vendor_id,
        vendor_name: item.vendor.name,
        vendor_color: item.vendor.booth_color,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        modifier_price: item.modifier_price,
        total_price: item.total_price,
        modifiers: item.modifiers.map((m) => ({ name: m.modifier_name, price: m.price_at_order })),
        special_instructions: item.special_instructions,
        status: item.status,
        estimated_prep_time_minutes: item.estimated_prep_time,
        accepted_at: item.accepted_at?.toISOString(),
        preparing_at: item.preparing_at?.toISOString(),
        ready_at: item.ready_at?.toISOString(),
        completed_at: item.completed_at?.toISOString(),
      })),
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
    };
  }

  // Exposed for KDS service to call
  getItemTransitions() { return ITEM_TRANSITIONS; }

  async rateOrder(orderId: string, rating: number, comment?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { id: true, items: { select: { vendor_id: true }, take: 1 } } });
    if (!order) throw new NotFoundException('Order not found');
    const vendorId = order.items[0]?.vendor_id;
    if (!vendorId) throw new BadRequestException('Cannot rate order with no items');
    return this.prisma.orderRating.upsert({
      where: { order_id: orderId },
      create: { order_id: orderId, vendor_id: vendorId, rating, comment },
      update: { rating, comment },
    });
  }

  async getOrderRating(orderId: string) {
    return this.prisma.orderRating.findUnique({ where: { order_id: orderId } });
  }
}
