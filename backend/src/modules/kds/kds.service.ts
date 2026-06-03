import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { RejectItemDto } from './dto/reject-item.dto';
import { OrderItemStatus } from '@prisma/client';
import { JwtUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class KdsService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  async getOrders(user: JwtUser) {
    const vendorId = user.vendor_id;
    if (!vendorId) throw new ForbiddenException('No vendor associated with this account');

    const items = await this.prisma.orderItem.findMany({
      where: {
        vendor_id: vendorId,
        status: { in: ['pending', 'accepted', 'preparing', 'ready'] },
      },
      include: {
        order: { select: { token_number: true, table_id: true } },
        vendor: { select: { booth_color: true } },
        modifiers: true,
      },
      orderBy: { created_at: 'asc' },
    });

    // Get table numbers
    const tableIds = [...new Set(items.map((i) => i.order.table_id))];
    const tables = await this.prisma.table.findMany({
      where: { id: { in: tableIds } },
      select: { id: true, table_number: true },
    });
    const tableMap = Object.fromEntries(tables.map((t) => [t.id, t.table_number]));

    const formatted = items.map((item) => this.formatCard(item, tableMap));

    return {
      vendor_id: vendorId,
      new: formatted.filter((i) => i.status === 'pending'),
      preparing: formatted.filter((i) => i.status === 'accepted' || i.status === 'preparing'),
      ready: formatted.filter((i) => i.status === 'ready'),
    };
  }

  async updateItemStatus(itemId: string, newStatus: OrderItemStatus, user: JwtUser, rejectDto?: RejectItemDto) {
    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.vendor_id !== user.vendor_id) throw new ForbiddenException('Item belongs to a different vendor');

    const transitions = this.ordersService.getItemTransitions();
    const allowed = transitions[item.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${item.status} to ${newStatus}`);
    }

    const timestamps: Record<string, Date | string | null> = {};
    if (newStatus === 'accepted') timestamps.accepted_at = new Date();
    if (newStatus === 'preparing') timestamps.preparing_at = new Date();
    if (newStatus === 'ready') timestamps.ready_at = new Date();
    if (newStatus === 'completed') timestamps.completed_at = new Date();
    if (newStatus === 'rejected') {
      timestamps.rejected_at = new Date();
      timestamps.reject_reason = rejectDto
        ? rejectDto.reason === 'custom'
          ? rejectDto.custom_reason ?? 'Custom reason'
          : rejectDto.reason
        : 'No reason';
    }

    const updated = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: newStatus, ...timestamps },
      include: {
        order: { select: { token_number: true, table_id: true } },
        vendor: { select: { booth_color: true } },
        modifiers: true,
      },
    });

    // Sync parent order aggregate status
    await this.ordersService.syncOrderStatus(item.order_id);

    const tables = await this.prisma.table.findMany({
      where: { id: updated.order.table_id },
      select: { id: true, table_number: true },
    });
    const tableMap = Object.fromEntries(tables.map((t) => [t.id, t.table_number]));

    return this.formatCard(updated, tableMap);
  }

  async getQueueStats(user: JwtUser) {
    const vendorId = user.vendor_id;
    if (!vendorId) throw new ForbiddenException('No vendor associated');

    const [queueItems, avgResult] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { vendor_id: vendorId, status: { in: ['pending', 'accepted', 'preparing'] } },
        orderBy: { created_at: 'asc' },
        select: { created_at: true, estimated_prep_time: true },
      }),
      this.prisma.orderItem.aggregate({
        where: { vendor_id: vendorId, status: 'completed', completed_at: { gte: new Date(Date.now() - 3600000) } },
        _avg: { estimated_prep_time: true },
      }),
    ]);

    const oldestMinutes = queueItems.length > 0
      ? Math.round((Date.now() - queueItems[0].created_at.getTime()) / 60000)
      : 0;

    return {
      vendor_id: vendorId,
      queue_depth: queueItems.length,
      avg_prep_time_minutes: Math.round(avgResult._avg.estimated_prep_time ?? 10),
      oldest_pending_minutes: oldestMinutes,
    };
  }

  private formatCard(
    item: {
      id: string; order_id: string; item_name: string; quantity: number;
      status: OrderItemStatus; estimated_prep_time: number; special_instructions: string | null;
      created_at: Date; accepted_at: Date | null; preparing_at: Date | null;
      order: { token_number: number; table_id: string };
      vendor: { booth_color: string };
      modifiers: Array<{ modifier_name: string; price_at_order: number }>;
    },
    tableMap: Record<string, number>,
  ) {
    return {
      order_item_id: item.id,
      order_id: item.order_id,
      token_number: item.order.token_number,
      table_number: tableMap[item.order.table_id] ?? 0,
      item_name: item.item_name,
      quantity: item.quantity,
      modifiers: item.modifiers.map((m) => ({
        name: m.modifier_name,
        type: m.price_at_order >= 0 ? 'add' : 'remove',
        price: m.price_at_order,
      })),
      special_instructions: item.special_instructions,
      status: item.status,
      estimated_prep_time_minutes: item.estimated_prep_time,
      accepted_at: item.accepted_at?.toISOString(),
      preparing_at: item.preparing_at?.toISOString(),
      created_at: item.created_at.toISOString(),
    };
  }
}
