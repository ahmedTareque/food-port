"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let VendorService = class VendorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard(user) {
        const vendorId = this.requireVendor(user);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [orders, activeItems, completedItems] = await Promise.all([
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
        ]);
        const revenue = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.total_price, 0), 0);
        const itemCounts = {};
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
            top_items: topItems,
            recent_orders: recentOrders,
        };
    }
    async getOrders(user, from, to, status, page = 1, limit = 20) {
        const vendorId = this.requireVendor(user);
        const skip = (page - 1) * limit;
        const orderWhere = {
            items: { some: { vendor_id: vendorId } },
            ...(status ? { status: status } : {}),
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
    async getMenuItems(user, categoryId, available) {
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
    async createMenuItem(user, dto) {
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
    async updateMenuItem(user, itemId, dto) {
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
    async deleteMenuItem(user, itemId) {
        const vendorId = this.requireVendor(user);
        await this.assertItemOwnership(vendorId, itemId);
        await this.prisma.menuItem.update({ where: { id: itemId }, data: { is_deleted: true } });
        return { success: true };
    }
    async updateAvailability(user, itemId, dto) {
        const vendorId = this.requireVendor(user);
        await this.assertItemOwnership(vendorId, itemId);
        return this.prisma.menuItem.update({ where: { id: itemId }, data: { is_available: dto.is_available } });
    }
    async getMenu(user) {
        const vendorId = this.requireVendor(user);
        const vendor = await this.prisma.vendor.findUnique({
            where: { id: vendorId },
            select: { id: true, name: true, booth_color: true },
        });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
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
    async deleteModifierGroup(user, groupId) {
        const vendorId = this.requireVendor(user);
        const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
        if (!group)
            throw new common_1.NotFoundException('Modifier group not found');
        await this.prisma.menuItemModifierGroup.deleteMany({ where: { modifier_group_id: groupId } });
        await this.prisma.modifier.deleteMany({ where: { modifier_group_id: groupId } });
        await this.prisma.modifierGroup.delete({ where: { id: groupId } });
        return { success: true };
    }
    async linkModifierGroupToItem(user, itemId, groupId) {
        const vendorId = this.requireVendor(user);
        await this.assertItemOwnership(vendorId, itemId);
        const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
        if (!group)
            throw new common_1.NotFoundException('Modifier group not found');
        await this.prisma.menuItemModifierGroup.upsert({
            where: { menu_item_id_modifier_group_id: { menu_item_id: itemId, modifier_group_id: groupId } },
            create: { menu_item_id: itemId, modifier_group_id: groupId },
            update: {},
        });
        return { success: true };
    }
    async unlinkModifierGroupFromItem(user, itemId, groupId) {
        const vendorId = this.requireVendor(user);
        await this.assertItemOwnership(vendorId, itemId);
        await this.prisma.menuItemModifierGroup.deleteMany({
            where: { menu_item_id: itemId, modifier_group_id: groupId },
        });
        return { success: true };
    }
    async getCategories(user) {
        const vendorId = this.requireVendor(user);
        const cats = await this.prisma.menuCategory.findMany({
            where: { vendor_id: vendorId, is_active: true },
            include: { _count: { select: { items: { where: { is_deleted: false } } } } },
            orderBy: { sort_order: 'asc' },
        });
        return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, sort_order: c.sort_order, item_count: c._count.items }));
    }
    async createCategory(user, dto) {
        const vendorId = this.requireVendor(user);
        return this.prisma.menuCategory.create({
            data: {
                vendor_id: vendorId,
                name: dto.name,
                slug: dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                sort_order: dto.sort_order ?? 0,
            },
        });
    }
    async updateCategory(user, categoryId, dto) {
        const vendorId = this.requireVendor(user);
        const cat = await this.prisma.menuCategory.findFirst({ where: { id: categoryId, vendor_id: vendorId } });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        return this.prisma.menuCategory.update({ where: { id: categoryId }, data: dto });
    }
    async createModifierGroup(user, dto) {
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
    async updateModifierGroup(user, groupId, dto) {
        const vendorId = this.requireVendor(user);
        const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
        if (!group)
            throw new common_1.NotFoundException('Modifier group not found');
        return this.prisma.modifierGroup.update({ where: { id: groupId }, data: dto, include: { modifiers: true } });
    }
    async addModifier(user, groupId, dto) {
        const vendorId = this.requireVendor(user);
        const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
        if (!group)
            throw new common_1.NotFoundException('Modifier group not found');
        return this.prisma.modifier.create({ data: { modifier_group_id: groupId, name: dto.name, price_adjustment: dto.price_adjustment } });
    }
    async removeModifier(user, groupId, modifierId) {
        const vendorId = this.requireVendor(user);
        const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, vendor_id: vendorId } });
        if (!group)
            throw new common_1.NotFoundException('Modifier group not found');
        await this.prisma.modifier.delete({ where: { id: modifierId } });
        return { success: true };
    }
    async getSettings(user) {
        const vendorId = this.requireVendor(user);
        const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        return { id: vendor.id, name: vendor.name, slug: vendor.slug, cuisine_type: vendor.cuisine_type,
            booth_number: vendor.booth_number, booth_color: vendor.booth_color, logo_url: vendor.logo_url,
            avg_prep_time_minutes: vendor.avg_prep_time_minutes, is_accepting_orders: vendor.is_accepting_orders,
            operating_hours: vendor.operating_hours, notification_preferences: vendor.notification_prefs };
    }
    async updateSettings(user, dto) {
        const vendorId = this.requireVendor(user);
        const updated = await this.prisma.vendor.update({
            where: { id: vendorId },
            data: {
                ...(dto.name ? { name: dto.name } : {}),
                ...(dto.cuisine_type ? { cuisine_type: dto.cuisine_type } : {}),
                ...(dto.booth_color ? { booth_color: dto.booth_color } : {}),
                ...(dto.avg_prep_time_minutes ? { avg_prep_time_minutes: dto.avg_prep_time_minutes } : {}),
                ...(dto.operating_hours ? { operating_hours: dto.operating_hours } : {}),
                ...(dto.notification_preferences ? { notification_prefs: dto.notification_preferences } : {}),
            },
        });
        return updated;
    }
    async updateStatus(user, dto) {
        const vendorId = this.requireVendor(user);
        const updated = await this.prisma.vendor.update({
            where: { id: vendorId },
            data: { is_accepting_orders: dto.is_accepting_orders, status: dto.is_accepting_orders ? 'online' : 'offline' },
        });
        return { id: updated.id, is_accepting_orders: updated.is_accepting_orders, status: updated.status };
    }
    requireVendor(user) {
        if (!user.vendor_id)
            throw new common_1.ForbiddenException('No vendor associated with this account');
        return user.vendor_id;
    }
    async assertItemOwnership(vendorId, itemId) {
        const item = await this.prisma.menuItem.findFirst({ where: { id: itemId, vendor_id: vendorId, is_deleted: false } });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        return item;
    }
};
exports.VendorService = VendorService;
exports.VendorService = VendorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendorService);
//# sourceMappingURL=vendor.service.js.map