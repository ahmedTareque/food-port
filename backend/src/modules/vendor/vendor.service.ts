import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import {
  CreateMenuItemDto, UpdateMenuItemDto, UpdateAvailabilityDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateModifierGroupDto, UpdateModifierGroupDto, CreateModifierDto,
  UpdateVendorSettingsDto, UpdateVendorStatusDto,
} from './dto/create-menu-item.dto';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboard(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, activeItems, completedItems, ratingAgg] = await Promise.all([
      this.prisma.order.findMany({
        where: { items: { some: { vendor_id: vendorId } }, created_at: { gte: today } },
        include: { items: { where: { vendor_id: vendorId }, select: { total_price: true, status: true, item_name: true } } },
      }),
      this.prisma.orderItem.count({
        where: { vendor_id: vendorId, status: { in: ['pending', 'accepted', 'preparing', 'ready'] } },
      }),
      this.prisma.orderItem.findMany({
        where: { vendor_id: vendorId, status: 'completed', completed_at: { gte: today } },
        select: { estimated_prep_time: true, accepted_at: true, completed_at: true },
      }),
      this.prisma.orderRating.aggregate({
        where: { order: { items: { some: { vendor_id: vendorId } } } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const revenue = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.total_price, 0), 0);

    // Top items by count
    const itemCounts: Record<string, number> = {};
    orders.forEach((o) => o.items.forEach((i) => { itemCounts[i.item_name] = (itemCounts[i.item_name] ?? 0) + 1; }));
    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const avgPrepTime = completedItems.length > 0
      ? Math.round(completedItems.reduce((sum, i) => sum + i.estimated_prep_time, 0) / completedItems.length)
      : 10;

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        token_number: o.token_number,
        total: o.items.reduce((s, i) => s + i.total_price, 0),
        status: o.status,
        created_at: o.created_at.toISOString(),
      }));

    return {
      orders_today: orders.length,
      revenue_today: Math.round(revenue * 100) / 100,
      active_queue: activeItems,
      avg_prep_time: avgPrepTime,
      avg_rating: ratingAgg._avg.rating ? Math.round(ratingAgg._avg.rating * 10) / 10 : null,
      rating_count: ratingAgg._count.rating,
      top_items: topItems,
      recent_orders: recentOrders,
    };
  }

  async getOrders(user: JwtUser, from?: string, to?: string, status?: string, page = 1, limit = 20) {
    const vendorId = this.requireVendor(user);
    const skip = (page - 1) * limit;

    const orderWhere = {
      items: { some: { vendor_id: vendorId } },
      ...(status ? { status: status as 'pending' } : {}),
      ...(from || to ? { created_at: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: orderWhere,
        include: {
          items: { where: { vendor_id: vendorId }, select: { total_price: true } },
          table: { select: { table_number: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: orderWhere }),
    ]);

    return {
      data: orders.map((o) => ({
        id: o.id,
        token_number: o.token_number,
        table_number: o.table?.table_number ?? null,
        item_count: o.items.length,
        total: o.items.reduce((s, i) => s + i.total_price, 0),
        status: o.status,
        created_at: o.created_at.toISOString(),
      })),
      meta: { page, limit, total, total_pages: Math.ceil(total / limit), has_next: skip + limit < total, has_prev: page > 1 },
    };
  }

  async getWeeklyRevenue(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      const items = await this.prisma.orderItem.findMany({
        where: { vendor_id: vendorId, status: 'completed', completed_at: { gte: start, lte: end } },
        select: { total_price: true, order_id: true },
      });
      const uniqueOrders = new Set(items.map((i) => i.order_id)).size;
      days.push({
        date: start.toISOString().slice(0, 10),
        revenue: Math.round(items.reduce((s, i) => s + i.total_price, 0) * 100) / 100,
        orders: uniqueOrders,
      });
    }
    return { days };
  }

  async getOrderDetail(user: JwtUser, orderId: string) {
    const vendorId = this.requireVendor(user);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, items: { some: { vendor_id: vendorId } } },
      include: {
        items: {
          where: { vendor_id: vendorId },
          include: { modifiers: true },
        },
        table: { select: { table_number: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return {
      id: order.id,
      token_number: order.token_number,
      table_number: order.table?.table_number ?? null,
      status: order.status,
      created_at: order.created_at.toISOString(),
      special_notes: order.special_notes,
      items: order.items.map((i) => ({
        id: i.id,
        item_name: i.item_name,
        quantity: i.quantity,
        base_price: i.unit_price,
        total_price: i.total_price,
        status: i.status,
        special_instructions: i.special_instructions,
        modifiers: i.modifiers.map((m) => ({ name: m.modifier_name, price: m.price_at_order })),
      })),
      total: order.items.reduce((s, i) => s + i.total_price, 0),
    };
  }

  // ─── Menu Items ─────────────────────────────────────────────────────────────

  async getMenuItems(user: JwtUser, categoryId?: string, available?: boolean) {
    const vendorId = this.requireVendor(user);
    const items = await this.prisma.menuItem.findMany({
      where: {
        vendor_id: vendorId,
        is_deleted: false,
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(available !== undefined ? { is_available: available } : {}),
      },
      include: {
        modifier_group_links: {
          include: { modifier_group: { include: { modifiers: true } } },
        },
        category: { select: { name: true } },
      },
      orderBy: [{ category_id: 'asc' }, { sort_order: 'asc' }],
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category_id,
      category_name: item.category.name,
      image_url: item.image_url,
      thumbnail_url: item.thumbnail_url,
      prep_time_minutes: item.prep_time_minutes,
      dietary_tags: item.dietary_tags,
      allergens: item.allergens,
      is_available: item.is_available,
      modifier_groups: item.modifier_group_links.map(({ modifier_group: mg }) => ({
        id: mg.id, name: mg.name, is_required: mg.is_required,
        min_selections: mg.min_selections, max_selections: mg.max_selections,
        modifiers: mg.modifiers.map((m) => ({ id: m.id, name: m.name, price_adjustment: m.price_adjustment, is_available: m.is_available })),
      })),
    }));
  }

  async createMenuItem(user: JwtUser, dto: CreateMenuItemDto) {
    const vendorId = this.requireVendor(user);

    const item = await this.prisma.menuItem.create({
      data: {
        vendor_id: vendorId,
        category_id: dto.category_id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        prep_time_minutes: dto.prep_time_minutes,
        dietary_tags: dto.dietary_tags ?? [],
        allergens: dto.allergens ?? [],
        ...(dto.modifier_group_ids?.length
          ? { modifier_group_links: { create: dto.modifier_group_ids.map((id) => ({ modifier_group_id: id })) } }
          : {}),
      },
      include: { modifier_group_links: { include: { modifier_group: { include: { modifiers: true } } } }, category: { select: { name: true } } },
    });

    return item;
  }

  async updateMenuItem(user: JwtUser, itemId: string, dto: UpdateMenuItemDto) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);

    const { modifier_group_ids, ...rest } = dto;

    const item = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...rest,
        ...(modifier_group_ids !== undefined ? {
          modifier_group_links: {
            deleteMany: {},
            create: modifier_group_ids.map((id) => ({ modifier_group_id: id })),
          },
        } : {}),
      },
      include: { modifier_group_links: { include: { modifier_group: { include: { modifiers: true } } } }, category: { select: { name: true } } },
    });

    return item;
  }

  async deleteMenuItem(user: JwtUser, itemId: string) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);
    await this.prisma.menuItem.update({ where: { id: itemId }, data: { is_deleted: true } });
    return { success: true };
  }

  async updateAvailability(user: JwtUser, itemId: string, dto: UpdateAvailabilityDto) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);
    return this.prisma.menuItem.update({ where: { id: itemId }, data: { is_available: dto.is_available } });
  }

  // ─── Full Menu (structured for frontend menu management) ─────────────────────

  async getMenu(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, booth_color: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    const categories = await this.prisma.menuCategory.findMany({
      where: { vendor_id: vendorId, is_active: true },
      include: {
        items: {
          where: { is_deleted: false },
          include: {
            modifier_group_links: {
              include: {
                modifier_group: {
                  include: { modifiers: { orderBy: { sort_order: 'asc' } } },
                },
              },
            },
          },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    return {
      vendor,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        sort_order: cat.sort_order,
        menu_items: cat.items.map((item) => ({
          id: item.id,
          vendor_id: item.vendor_id,
          category_id: item.category_id,
          name: item.name,
          description: item.description,
          base_price: item.price,
          image_url: item.image_url,
          is_available: item.is_available,
          is_featured: false,
          prep_time_minutes: item.prep_time_minutes,
          dietary_tags: item.dietary_tags,
          modifier_groups: item.modifier_group_links.map((link) => ({
            id: link.modifier_group.id,
            name: link.modifier_group.name,
            selection_type: link.modifier_group.max_selections > 1 ? 'multiple' : 'single',
            min_selections: link.modifier_group.min_selections,
            max_selections: link.modifier_group.max_selections,
            is_required: link.modifier_group.is_required,
            modifiers: link.modifier_group.modifiers.map((m) => ({
              id: m.id,
              name: m.name,
              price_delta: m.price_adjustment,
              is_available: m.is_available,
            })),
          })),
        })),
      })),
    };
  }

  async deleteModifierGroup(user: JwtUser, groupId: string) {
    const vendorId = this.requireVendor(user);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    await this.prisma.menuItemModifierGroup.deleteMany({ where: { modifier_group_id: groupId } });
    await this.prisma.modifier.deleteMany({ where: { modifier_group_id: groupId } });
    await this.prisma.modifierGroup.delete({ where: { id: groupId } });
    return { success: true };
  }

  async linkModifierGroupToItem(user: JwtUser, itemId: string, groupId: string) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    await this.prisma.menuItemModifierGroup.upsert({
      where: { menu_item_id_modifier_group_id: { menu_item_id: itemId, modifier_group_id: groupId } },
      create: { menu_item_id: itemId, modifier_group_id: groupId },
      update: {},
    });
    return { success: true };
  }

  async unlinkModifierGroupFromItem(user: JwtUser, itemId: string, groupId: string) {
    const vendorId = this.requireVendor(user);
    await this.assertItemOwnership(vendorId, itemId);
    await this.prisma.menuItemModifierGroup.deleteMany({
      where: { menu_item_id: itemId, modifier_group_id: groupId },
    });
    return { success: true };
  }

  // ─── Categories ──────────────────────────────────────────────────────────────

  async getCategories(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const cats = await this.prisma.menuCategory.findMany({
      where: { vendor_id: vendorId, is_active: true },
      include: { _count: { select: { items: { where: { is_deleted: false } } } } },
      orderBy: { sort_order: 'asc' },
    });
    return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, sort_order: c.sort_order, item_count: c._count.items }));
  }

  async createCategory(user: JwtUser, dto: CreateCategoryDto) {
    const vendorId = this.requireVendor(user);
    const existing = await this.prisma.menuCategory.findFirst({ where: { vendor_id: vendorId, name: dto.name } });
    if (existing) throw new ConflictException('Category name already exists');
    return this.prisma.menuCategory.create({
      data: {
        vendor_id: vendorId,
        name: dto.name,
        slug: dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        sort_order: dto.sort_order ?? 0,
      },
    });
  }

  async updateCategory(user: JwtUser, categoryId: string, dto: UpdateCategoryDto) {
    const vendorId = this.requireVendor(user);
    const cat = await this.prisma.menuCategory.findFirst({ where: { id: categoryId, vendor_id: vendorId } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.menuCategory.update({ where: { id: categoryId }, data: dto });
  }

  async bulkSetCategoryAvailability(user: JwtUser, categoryId: string, is_available: boolean) {
    const vendorId = this.requireVendor(user);
    const cat = await this.prisma.menuCategory.findFirst({ where: { id: categoryId, vendor_id: vendorId } });
    if (!cat) throw new NotFoundException('Category not found');
    const result = await this.prisma.menuItem.updateMany({
      where: { category_id: categoryId, vendor_id: vendorId, is_deleted: false },
      data: { is_available },
    });
    return { updated: result.count, is_available };
  }

  async deleteCategory(user: JwtUser, categoryId: string) {
    const vendorId = this.requireVendor(user);
    const cat = await this.prisma.menuCategory.findFirst({ where: { id: categoryId, vendor_id: vendorId } });
    if (!cat) throw new NotFoundException('Category not found');
    const itemCount = await this.prisma.menuItem.count({ where: { category_id: categoryId, is_deleted: false } });
    if (itemCount > 0) throw new BadRequestException(`Cannot delete category with ${itemCount} active items`);
    await this.prisma.menuCategory.delete({ where: { id: categoryId } });
    return { deleted: true };
  }

  // ─── Modifier Groups ─────────────────────────────────────────────────────────

  async createModifierGroup(user: JwtUser, dto: CreateModifierGroupDto) {
    const vendorId = this.requireVendor(user);
    return this.prisma.modifierGroup.create({
      data: {
        vendor_id: vendorId,
        name: dto.name,
        is_required: dto.is_required,
        min_selections: dto.min_selections,
        max_selections: dto.max_selections,
        modifiers: dto.modifiers?.length
          ? { create: dto.modifiers.map((m, i) => ({ name: m.name, price_adjustment: m.price_adjustment, sort_order: i })) }
          : undefined,
      },
      include: { modifiers: true },
    });
  }

  async updateModifierGroup(user: JwtUser, groupId: string, dto: UpdateModifierGroupDto) {
    const vendorId = this.requireVendor(user);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    return this.prisma.modifierGroup.update({ where: { id: groupId }, data: dto, include: { modifiers: true } });
  }

  async addModifier(user: JwtUser, groupId: string, dto: CreateModifierDto) {
    const vendorId = this.requireVendor(user);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    return this.prisma.modifier.create({ data: { modifier_group_id: groupId, name: dto.name, price_adjustment: dto.price_adjustment } });
  }

  async removeModifier(user: JwtUser, groupId: string, modifierId: string) {
    const vendorId = this.requireVendor(user);
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
    if (!group) throw new NotFoundException('Modifier group not found');
    await this.prisma.modifier.delete({ where: { id: modifierId } });
    return { success: true };
  }

  // ─── Settings ────────────────────────────────────────────────────────────────

  async getSettings(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return { id: vendor.id, name: vendor.name, slug: vendor.slug, cuisine_type: vendor.cuisine_type,
      booth_number: vendor.booth_number, booth_color: vendor.booth_color, logo_url: vendor.logo_url,
      avg_prep_time_minutes: vendor.avg_prep_time_minutes, is_accepting_orders: vendor.is_accepting_orders,
      operating_hours: vendor.operating_hours, notification_preferences: vendor.notification_prefs };
  }

  async updateSettings(user: JwtUser, dto: UpdateVendorSettingsDto) {
    const vendorId = this.requireVendor(user);
    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.cuisine_type !== undefined ? { cuisine_type: dto.cuisine_type } : {}),
        ...(dto.booth_color !== undefined ? { booth_color: dto.booth_color } : {}),
        ...(dto.avg_prep_time_minutes !== undefined ? { avg_prep_time_minutes: dto.avg_prep_time_minutes } : {}),
        ...(dto.operating_hours !== undefined ? { operating_hours: dto.operating_hours } : {}),
        ...(dto.notification_preferences !== undefined ? { notification_prefs: dto.notification_preferences } : {}),
        ...(dto.logo_url !== undefined ? { logo_url: dto.logo_url } : {}),
      },
    });
    return updated;
  }

  async updateStatus(user: JwtUser, dto: UpdateVendorStatusDto) {
    const vendorId = this.requireVendor(user);
    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { is_accepting_orders: dto.is_accepting_orders, status: dto.is_accepting_orders ? 'online' : 'offline' },
    });
    return { id: updated.id, is_accepting_orders: updated.is_accepting_orders, status: updated.status };
  }

  // ─── Menu Item Duplication ───────────────────────────────────────────────────

  async duplicateMenuItem(user: JwtUser, itemId: string) {
    const vendorId = this.requireVendor(user);
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, vendor_id: vendorId, is_deleted: false },
      include: { modifier_group_links: true },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    const copy = await this.prisma.menuItem.create({
      data: {
        vendor_id: item.vendor_id,
        category_id: item.category_id,
        name: `${item.name} (Copy)`,
        description: item.description,
        price: item.price,
        image_url: item.image_url,
        is_available: false,
        sort_order: item.sort_order + 1,
        prep_time_minutes: item.prep_time_minutes,
      },
    });
    if (item.modifier_group_links.length > 0) {
      await this.prisma.menuItemModifierGroup.createMany({
        data: item.modifier_group_links.map((l) => ({ menu_item_id: copy.id, modifier_group_id: l.modifier_group_id })),
        skipDuplicates: true,
      });
    }
    return { id: copy.id, name: copy.name };
  }

  // ─── Payout Summary ──────────────────────────────────────────────────────────

  async getPayoutSummary(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const now = new Date();
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revenueThisMonth, transactions, allTimeRevenue] = await Promise.all([
      this.prisma.orderItem.aggregate({
        where: { vendor_id: vendorId, status: 'completed', completed_at: { gte: startOfMonth } },
        _sum: { total_price: true },
      }),
      this.prisma.vendorTransaction.findMany({
        where: { vendor_id: vendorId },
        orderBy: [{ month: 'desc' }, { type: 'asc' }],
        take: 20,
      }),
      this.prisma.orderItem.aggregate({
        where: { vendor_id: vendorId, status: 'completed' },
        _sum: { total_price: true },
      }),
    ]);

    const thisMonthDeductions = transactions
      .filter((t) => t.month === thisMonthStr && t.is_paid)
      .reduce((s, t) => s + (t.amount ?? 0), 0);

    return {
      revenue_this_month: Math.round((revenueThisMonth._sum.total_price ?? 0) * 100) / 100,
      deductions_this_month: Math.round(thisMonthDeductions * 100) / 100,
      net_this_month: Math.round(((revenueThisMonth._sum.total_price ?? 0) - thisMonthDeductions) * 100) / 100,
      all_time_revenue: Math.round((allTimeRevenue._sum.total_price ?? 0) * 100) / 100,
      transactions: transactions.map((t) => ({
        id: t.id, type: t.type, month: t.month, amount: t.amount,
        is_paid: t.is_paid, due_date: t.due_date?.toISOString(), paid_at: t.paid_at?.toISOString(), notes: t.notes,
      })),
    };
  }

  // ─── Staff PINs ─────────────────────────────────────────────────────────────

  async listStaffPins(user: JwtUser) {
    const vendorId = this.requireVendor(user);
    const pins = await this.prisma.staffPin.findMany({
      where: { vendor_id: vendorId },
      select: { id: true, label: true, role: true, is_active: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });
    return pins;
  }

  async createStaffPin(user: JwtUser, label: string, pin: string) {
    const vendorId = this.requireVendor(user);
    if (!/^\d{4,6}$/.test(pin)) throw new BadRequestException('PIN must be 4-6 digits');
    const bcrypt = await import('bcrypt');
    const pin_hash = await bcrypt.hash(`pin:${pin}`, 10);
    const created = await this.prisma.staffPin.create({
      data: { vendor_id: vendorId, label, pin_hash, role: 'vendor_kitchen', is_active: true },
      select: { id: true, label: true, role: true, is_active: true, created_at: true },
    });
    return created;
  }

  async toggleStaffPin(user: JwtUser, pinId: string, is_active: boolean) {
    const vendorId = this.requireVendor(user);
    const pin = await this.prisma.staffPin.findFirst({ where: { id: pinId, vendor_id: vendorId } });
    if (!pin) throw new NotFoundException('Staff PIN not found');
    return this.prisma.staffPin.update({ where: { id: pinId }, data: { is_active }, select: { id: true, is_active: true } });
  }

  async deleteStaffPin(user: JwtUser, pinId: string) {
    const vendorId = this.requireVendor(user);
    const pin = await this.prisma.staffPin.findFirst({ where: { id: pinId, vendor_id: vendorId } });
    if (!pin) throw new NotFoundException('Staff PIN not found');
    await this.prisma.staffPin.delete({ where: { id: pinId } });
    return { deleted: true };
  }

  // ─── Reports ─────────────────────────────────────────────────────────────────

  async getSalesReport(user: JwtUser, from?: string, to?: string) {
    const vendorId = this.requireVendor(user);
    const fromDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0,0,0,0); return d; })();
    const toDate = to ? new Date(to) : new Date();

    const orders = await this.prisma.order.findMany({
      where: { items: { some: { vendor_id: vendorId } }, created_at: { gte: fromDate, lte: toDate } },
      include: { items: { where: { vendor_id: vendorId }, select: { total_price: true } } },
      orderBy: { created_at: 'asc' },
    });

    const byDate: Record<string, { date: string; orders: number; revenue: number }> = {};
    for (const order of orders) {
      const key = order.created_at.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { date: key, orders: 0, revenue: 0 };
      byDate[key].orders += 1;
      byDate[key].revenue += order.items.reduce((s, i) => s + i.total_price, 0);
    }

    const days = Object.values(byDate).map((d) => ({ ...d, revenue: Math.round(d.revenue * 100) / 100 }));
    const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = days.reduce((s, d) => s + d.orders, 0);
    return { days, total_revenue: Math.round(totalRevenue * 100) / 100, total_orders: totalOrders };
  }

  async getTopItemsReport(user: JwtUser, from?: string, to?: string, limit = 10) {
    const vendorId = this.requireVendor(user);
    const fromDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0,0,0,0); return d; })();
    const toDate = to ? new Date(to) : new Date();

    const items = await this.prisma.orderItem.findMany({
      where: { vendor_id: vendorId, created_at: { gte: fromDate, lte: toDate } },
      select: { item_name: true, total_price: true, quantity: true },
    });

    const agg: Record<string, { item_name: string; count: number; revenue: number }> = {};
    for (const item of items) {
      if (!agg[item.item_name]) agg[item.item_name] = { item_name: item.item_name, count: 0, revenue: 0 };
      agg[item.item_name].count += item.quantity;
      agg[item.item_name].revenue += item.total_price;
    }

    return Object.values(agg)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((i) => ({ ...i, revenue: Math.round(i.revenue * 100) / 100 }));
  }

  async getPeakHoursReport(user: JwtUser, from?: string, to?: string) {
    const vendorId = this.requireVendor(user);
    const fromDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0,0,0,0); return d; })();
    const toDate = to ? new Date(to) : new Date();

    const orders = await this.prisma.order.findMany({
      where: { items: { some: { vendor_id: vendorId } }, created_at: { gte: fromDate, lte: toDate } },
      select: { created_at: true },
    });

    const grid: Record<string, number> = {};
    for (const order of orders) {
      const d = order.created_at;
      const key = `${d.getDay()}-${d.getHours()}`;
      grid[key] = (grid[key] ?? 0) + 1;
    }

    const result: { day_of_week: number; hour: number; count: number }[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        result.push({ day_of_week: day, hour, count: grid[`${day}-${hour}`] ?? 0 });
      }
    }
    return result;
  }

  private requireVendor(user: JwtUser): string {
    if (!user.vendor_id) throw new ForbiddenException('No vendor associated with this account');
    return user.vendor_id;
  }

  private async assertItemOwnership(vendorId: string, itemId: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, vendor_id: vendorId, is_deleted: false } });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }
}
