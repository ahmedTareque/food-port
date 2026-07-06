"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);
        const [todayOrders, weekOrders, activeVendors, completedItemsToday] = await Promise.all([
            this.prisma.order.findMany({
                where: { created_at: { gte: today }, status: { not: 'cancelled' } },
                select: { total: true, status: true },
            }),
            this.prisma.order.findMany({
                where: { created_at: { gte: weekAgo }, status: { not: 'cancelled' } },
                select: { total: true },
            }),
            this.prisma.vendor.count({ where: { status: 'online' } }),
            this.prisma.orderItem.findMany({
                where: { status: 'completed', completed_at: { gte: today } },
                select: { estimated_prep_time: true, accepted_at: true, completed_at: true },
            }),
        ]);
        const revenue_today = todayOrders.reduce((s, o) => s + o.total, 0);
        const revenue_this_week = weekOrders.reduce((s, o) => s + o.total, 0);
        const avgPrepTime = completedItemsToday.length > 0
            ? Math.round(completedItemsToday.reduce((s, i) => s + i.estimated_prep_time, 0) / completedItemsToday.length)
            : 0;
        return {
            orders_today: todayOrders.length,
            revenue_today,
            orders_this_week: weekOrders.length,
            revenue_this_week,
            active_vendors: activeVendors,
            avg_prep_time: avgPrepTime,
        };
    }
    async getRevenueAnalytics(from, to, interval = 'day') {
        const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
        const end = to ? new Date(to) : new Date();
        const orders = await this.prisma.order.findMany({
            where: { created_at: { gte: start, lte: end }, status: { not: 'cancelled' } },
            select: { total: true, created_at: true },
            orderBy: { created_at: 'asc' },
        });
        const map = new Map();
        for (const o of orders) {
            const key = interval === 'hour'
                ? `${o.created_at.toISOString().slice(0, 13)}:00`
                : o.created_at.toISOString().slice(0, 10);
            const existing = map.get(key) ?? { revenue: 0, order_count: 0 };
            existing.revenue += o.total;
            existing.order_count += 1;
            map.set(key, existing);
        }
        return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
    }
    async getVendorAnalytics(from, to) {
        const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
        const end = to ? new Date(to) : new Date();
        const vendors = await this.prisma.vendor.findMany({
            include: {
                order_items: {
                    where: { created_at: { gte: start, lte: end }, status: { not: 'rejected' } },
                    select: { total_price: true, estimated_prep_time: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return vendors.map((v) => ({
            vendor_id: v.id,
            vendor_name: v.name,
            booth_color: v.booth_color,
            order_count: v.order_items.length,
            revenue: v.order_items.reduce((s, i) => s + i.total_price, 0),
            avg_prep_time: v.order_items.length > 0
                ? Math.round(v.order_items.reduce((s, i) => s + i.estimated_prep_time, 0) / v.order_items.length)
                : 0,
        })).sort((a, b) => b.revenue - a.revenue);
    }
    async getPeakHours(from, to) {
        const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
        const end = to ? new Date(to) : new Date();
        const orders = await this.prisma.order.findMany({
            where: { created_at: { gte: start, lte: end } },
            select: { created_at: true },
        });
        const map = new Map();
        for (const o of orders) {
            const hour = o.created_at.getHours();
            const day = o.created_at.getDay();
            const key = `${day}:${hour}`;
            map.set(key, (map.get(key) ?? 0) + 1);
        }
        return Array.from(map.entries()).map(([key, count]) => {
            const [day, hour] = key.split(':').map(Number);
            return { day_of_week: day, hour, count };
        });
    }
    async getTopItems(from, to, vendorId, limit = 10) {
        const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
        const end = to ? new Date(to) : new Date();
        const items = await this.prisma.orderItem.findMany({
            where: {
                created_at: { gte: start, lte: end },
                status: { not: 'rejected' },
                ...(vendorId ? { vendor_id: vendorId } : {}),
            },
            select: { item_name: true, total_price: true, vendor: { select: { name: true } } },
        });
        const map = new Map();
        for (const i of items) {
            const existing = map.get(i.item_name) ?? { count: 0, revenue: 0, vendor_name: i.vendor.name };
            existing.count += 1;
            existing.revenue += i.total_price;
            map.set(i.item_name, existing);
        }
        return Array.from(map.entries())
            .map(([item_name, v]) => ({ item_name, ...v }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    async getPrepTimeReport(from, to, vendorId) {
        const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
        const end = to ? new Date(to) : new Date();
        const vendors = await this.prisma.vendor.findMany({
            where: vendorId ? { id: vendorId } : {},
            include: {
                order_items: {
                    where: { created_at: { gte: start, lte: end }, status: 'completed' },
                    select: { estimated_prep_time: true },
                },
            },
        });
        return vendors.map((v) => {
            const times = v.order_items.map((i) => i.estimated_prep_time).sort((a, b) => a - b);
            const avg = times.length > 0 ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : 0;
            const p50 = times.length > 0 ? times[Math.floor(times.length * 0.5)] : 0;
            const p90 = times.length > 0 ? times[Math.floor(times.length * 0.9)] : 0;
            return { vendor_id: v.id, vendor_name: v.name, avg_prep_time: avg, p50, p90, sample_count: times.length };
        });
    }
    async getByCuisine(from, to) {
        const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
        const end = to ? new Date(to) : new Date();
        const vendors = await this.prisma.vendor.findMany({
            include: {
                order_items: {
                    where: { created_at: { gte: start, lte: end }, status: { not: 'rejected' } },
                    select: { total_price: true },
                },
            },
        });
        const map = new Map();
        for (const v of vendors) {
            const existing = map.get(v.cuisine_type) ?? { order_count: 0, revenue: 0 };
            existing.order_count += v.order_items.length;
            existing.revenue += v.order_items.reduce((s, i) => s + i.total_price, 0);
            map.set(v.cuisine_type, existing);
        }
        return Array.from(map.entries())
            .map(([cuisine_type, v]) => ({ cuisine_type, ...v }))
            .sort((a, b) => b.revenue - a.revenue);
    }
    async getLiveOrders() {
        const orders = await this.prisma.orderItem.findMany({
            where: { status: { in: ['pending', 'accepted', 'preparing', 'ready'] } },
            include: {
                order: { select: { token_number: true, table: { select: { table_number: true } } } },
                vendor: { select: { name: true, booth_color: true } },
                modifiers: { select: { modifier_name: true } },
            },
            orderBy: { created_at: 'asc' },
            take: 20,
        });
        return orders.map((i) => ({
            order_item_id: i.id,
            order_id: i.order_id,
            token_number: i.order.token_number,
            table_number: String(i.order.table.table_number),
            vendor_name: i.vendor.name,
            booth_color: i.vendor.booth_color,
            item_name: i.item_name,
            quantity: i.quantity,
            status: i.status,
            created_at: i.created_at,
        }));
    }
    async getOrders(from, to, status, vendorId, page = 1, limit = 20) {
        const start = from ? new Date(from) : undefined;
        const end = to ? new Date(to) : undefined;
        const where = {};
        if (start || end)
            where.created_at = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };
        if (status)
            where.status = status;
        if (vendorId)
            where.items = { some: { vendor_id: vendorId } };
        const [total, orders] = await Promise.all([
            this.prisma.order.count({ where }),
            this.prisma.order.findMany({
                where,
                include: {
                    table: { select: { table_number: true } },
                    items: {
                        select: {
                            id: true, item_name: true, quantity: true, total_price: true,
                            status: true, vendor: { select: { name: true, booth_color: true } },
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return {
            orders: orders.map((o) => ({
                id: o.id,
                token_number: o.token_number,
                table_number: o.table.table_number,
                status: o.status,
                subtotal: o.subtotal,
                tax: o.tax_amount,
                total: o.total,
                item_count: o.items.length,
                items: o.items,
                created_at: o.created_at,
            })),
            total,
            page,
            pages: Math.ceil(total / limit),
        };
    }
    async getOrder(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                table: { select: { table_number: true } },
                items: {
                    include: {
                        vendor: { select: { id: true, name: true, booth_color: true } },
                        modifiers: true,
                    },
                },
                history: { orderBy: { created_at: 'asc' } },
                promotions: { include: { promotion: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async updateOrderStatus(actor, id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const updated = await this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
        });
        await this.logAudit(actor, 'order.status_update', 'order', id, { from: order.status, to: dto.status, reason: dto.reason });
        return updated;
    }
    async cancelOrder(actor, id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status === 'completed')
            throw new common_1.BadRequestException('Cannot cancel completed order');
        await this.prisma.order.update({ where: { id }, data: { status: 'cancelled' } });
        await this.prisma.orderItem.updateMany({ where: { order_id: id, status: { not: 'completed' } }, data: { status: 'rejected', reject_reason: dto.reason } });
        await this.logAudit(actor, 'order.cancel', 'order', id, { reason: dto.reason });
        return { id, status: 'cancelled' };
    }
    async exportOrders(from, to) {
        const { orders } = await this.getOrders(from, to, undefined, undefined, 1, 10000);
        const header = 'token,table,status,subtotal,tax,total,items,created_at\n';
        const rows = orders.map((o) => `${o.token_number},${o.table_number},${o.status},${o.subtotal.toFixed(2)},${(o.tax ?? 0).toFixed(2)},${o.total.toFixed(2)},${o.item_count},"${o.created_at}"`);
        return header + rows.join('\n');
    }
    async getVendors(status, page = 1, limit = 20) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const vendors = await this.prisma.vendor.findMany({
            where: status ? { status: status } : {},
            include: {
                order_items: {
                    where: { created_at: { gte: today } },
                    select: { total_price: true, status: true },
                },
                _count: { select: { users: true } },
            },
            orderBy: { booth_number: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return vendors.map((v) => ({
            id: v.id,
            name: v.name,
            cuisine_type: v.cuisine_type,
            booth_number: v.booth_number,
            booth_color: v.booth_color,
            status: v.status,
            is_accepting_orders: v.is_accepting_orders,
            staff_count: v._count.users,
            revenue_today: v.order_items.reduce((s, i) => s + i.total_price, 0),
            order_count_today: v.order_items.length,
        }));
    }
    async createVendor(actor, dto) {
        const existing = await this.prisma.vendor.findFirst({ where: { booth_number: dto.booth_number } });
        if (existing)
            throw new common_1.ConflictException('Booth number already in use');
        const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const vendor = await this.prisma.vendor.create({
            data: {
                name: dto.name,
                slug: `${slug}-${dto.booth_number}`,
                cuisine_type: dto.cuisine_type,
                booth_number: dto.booth_number,
                booth_color: dto.booth_color,
            },
        });
        await this.logAudit(actor, 'vendor.create', 'vendor', vendor.id, { name: dto.name });
        return vendor;
    }
    async updateVendor(actor, id, dto) {
        const vendor = await this.prisma.vendor.findUnique({ where: { id } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const updated = await this.prisma.vendor.update({ where: { id }, data: dto });
        await this.logAudit(actor, 'vendor.update', 'vendor', id, dto);
        return updated;
    }
    async setVendorStatus(actor, id, dto) {
        const vendor = await this.prisma.vendor.findUnique({ where: { id } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const updated = await this.prisma.vendor.update({
            where: { id },
            data: { status: dto.status, is_accepting_orders: dto.status === 'online' },
        });
        await this.logAudit(actor, 'vendor.status_change', 'vendor', id, { status: dto.status });
        return { id: updated.id, status: updated.status };
    }
    async deleteVendor(actor, id) {
        await this.prisma.vendor.update({ where: { id }, data: { status: 'suspended' } });
        await this.logAudit(actor, 'vendor.delete', 'vendor', id, {});
        return { success: true };
    }
    async getVendorStaff(vendorId) {
        const users = await this.prisma.user.findMany({
            where: { vendor_id: vendorId },
            select: { id: true, full_name: true, email: true, role: true, is_active: true, created_at: true },
        });
        const pins = await this.prisma.staffPin.findMany({
            where: { vendor_id: vendorId },
            select: { id: true, label: true, role: true, is_active: true },
        });
        return { users, pins };
    }
    async removeStaff(actor, vendorId, userId) {
        await this.prisma.user.update({ where: { id: userId }, data: { is_active: false } });
        await this.logAudit(actor, 'staff.remove', 'user', userId, { vendor_id: vendorId });
        return { success: true };
    }
    async getDailySummary(from, to) {
        const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
        const end = to ? new Date(to) : new Date();
        const orders = await this.prisma.order.findMany({
            where: { created_at: { gte: start, lte: end }, status: { not: 'cancelled' } },
            select: { subtotal: true, tax_amount: true, total: true, created_at: true },
        });
        const map = new Map();
        for (const o of orders) {
            const date = o.created_at.toISOString().slice(0, 10);
            const existing = map.get(date) ?? { total_orders: 0, gross_revenue: 0, tax_collected: 0, net_revenue: 0 };
            existing.total_orders += 1;
            existing.gross_revenue += o.total;
            existing.tax_collected += o.tax_amount;
            existing.net_revenue += o.subtotal;
            map.set(date, existing);
        }
        return Array.from(map.entries())
            .map(([date, v]) => ({ date, ...v }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
    async getRevenueByVendor(from, to) {
        const start = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
        const end = to ? new Date(to) : new Date();
        const vendors = await this.prisma.vendor.findMany({
            include: {
                order_items: {
                    where: { created_at: { gte: start, lte: end }, status: { not: 'rejected' } },
                    select: { total_price: true, unit_price: true, modifier_price: true },
                },
            },
        });
        return vendors
            .map((v) => ({
            vendor_id: v.id,
            vendor_name: v.name,
            orders: v.order_items.length,
            revenue: v.order_items.reduce((s, i) => s + i.total_price, 0),
            tax: v.order_items.reduce((s, i) => s + i.total_price, 0) * 0.0825,
            net: v.order_items.reduce((s, i) => s + i.total_price, 0) * (1 - 0.0825),
        }))
            .sort((a, b) => b.revenue - a.revenue);
    }
    async getCashLog(date, page = 1, limit = 20, from, to) {
        let where = {};
        if (from || to) {
            where = { created_at: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to + 'T23:59:59') } : {}) } };
        }
        else if (date) {
            where = { created_at: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } };
        }
        const [total, logs] = await Promise.all([
            this.prisma.cashLog.count({ where }),
            this.prisma.cashLog.findMany({
                where,
                include: { order: { select: { token_number: true } } },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return {
            logs: logs.map((l) => ({ id: l.id, order_id: l.order_id, token_number: l.order.token_number, amount: l.amount, collected_by: l.collected_by, notes: l.notes, created_at: l.created_at })),
            total,
            page,
            pages: Math.ceil(total / limit),
        };
    }
    async createCashLog(actor, dto) {
        const order = await this.prisma.order.findUnique({ where: { id: dto.order_id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const log = await this.prisma.cashLog.create({ data: dto });
        await this.logAudit(actor, 'cash.log', 'cash_log', log.id, { order_id: dto.order_id, amount: dto.amount });
        return log;
    }
    async getPromotions(active, page = 1, limit = 20) {
        const where = active !== undefined ? { is_active: active } : {};
        const [total, promotions] = await Promise.all([
            this.prisma.promotion.count({ where }),
            this.prisma.promotion.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { promotions, total, page, pages: Math.ceil(total / limit) };
    }
    async createPromotion(actor, dto) {
        const existing = await this.prisma.promotion.findFirst({ where: { code: dto.code.toUpperCase() } });
        if (existing)
            throw new common_1.ConflictException('Promo code already exists');
        const promo = await this.prisma.promotion.create({
            data: { ...dto, code: dto.code.toUpperCase(), valid_from: new Date(dto.valid_from), valid_to: new Date(dto.valid_to) },
        });
        await this.logAudit(actor, 'promotion.create', 'promotion', promo.id, { code: promo.code });
        return promo;
    }
    async updatePromotion(actor, id, dto) {
        const promo = await this.prisma.promotion.findUnique({ where: { id } });
        if (!promo)
            throw new common_1.NotFoundException('Promotion not found');
        const data = { ...dto };
        if (dto.valid_from)
            data.valid_from = new Date(dto.valid_from);
        if (dto.valid_to)
            data.valid_to = new Date(dto.valid_to);
        const updated = await this.prisma.promotion.update({ where: { id }, data });
        await this.logAudit(actor, 'promotion.update', 'promotion', id, dto);
        return updated;
    }
    async togglePromotion(actor, id) {
        const promo = await this.prisma.promotion.findUnique({ where: { id } });
        if (!promo)
            throw new common_1.NotFoundException('Promotion not found');
        const updated = await this.prisma.promotion.update({ where: { id }, data: { is_active: !promo.is_active } });
        await this.logAudit(actor, 'promotion.toggle', 'promotion', id, { is_active: updated.is_active });
        return { id: updated.id, is_active: updated.is_active };
    }
    async deletePromotion(actor, id) {
        await this.prisma.promotion.delete({ where: { id } });
        await this.logAudit(actor, 'promotion.delete', 'promotion', id, {});
        return { success: true };
    }
    async getPromotionStats(id) {
        const uses = await this.prisma.orderPromotion.findMany({
            where: { promotion_id: id },
            include: { order: { select: { token_number: true, total: true, created_at: true } } },
        });
        return {
            uses: uses.length,
            total_discount: uses.reduce((s, u) => s + u.discount_amount, 0),
            orders: uses.map((u) => ({ order_id: u.order_id, token_number: u.order.token_number, discount: u.discount_amount, order_total: u.order.total, date: u.order.created_at })),
        };
    }
    async validatePromoCode(dto) {
        const promo = await this.prisma.promotion.findFirst({
            where: {
                code: dto.code.toUpperCase(),
                is_active: true,
                valid_from: { lte: new Date() },
                valid_to: { gte: new Date() },
            },
        });
        if (!promo)
            return { valid: false, reason: 'Invalid or expired code' };
        if (promo.max_uses && promo.current_uses >= promo.max_uses)
            return { valid: false, reason: 'Code has reached max uses' };
        if (promo.min_order_amount && dto.subtotal < promo.min_order_amount) {
            return { valid: false, reason: `Minimum order $${promo.min_order_amount.toFixed(2)} required` };
        }
        if (promo.vendor_id && promo.vendor_id !== dto.vendor_id)
            return { valid: false, reason: 'Code not valid for this vendor' };
        const discount_amount = promo.type === 'percent'
            ? Math.min(dto.subtotal * (promo.value / 100), dto.subtotal)
            : Math.min(promo.value, dto.subtotal);
        return { valid: true, discount_amount, promotion: promo };
    }
    async getAuditLog(from, to, actorId, action, page = 1, limit = 30) {
        const where = {};
        if (from || to)
            where.created_at = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) };
        if (actorId)
            where.actor_id = actorId;
        if (action)
            where.action = { contains: action };
        const [total, logs] = await Promise.all([
            this.prisma.auditLog.count({ where }),
            this.prisma.auditLog.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { logs, total, page, pages: Math.ceil(total / limit) };
    }
    async getUsers(role, page = 1, limit = 20) {
        const where = {};
        if (role)
            where.role = role;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: { id: true, full_name: true, email: true, role: true, is_active: true, vendor_id: true, created_at: true,
                    vendor: { select: { name: true, booth_number: true } } },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, page, pages: Math.ceil(total / limit) };
    }
    async createUser(actor, dto) {
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.ConflictException('Email already in use');
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
        const password_hash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: { full_name: dto.full_name, email: dto.email, password_hash, role: dto.role, vendor_id: dto.vendor_id ?? null, is_active: true, supabase_id: `admin-created-${Date.now()}` },
            select: { id: true, full_name: true, email: true, role: true, is_active: true, created_at: true },
        });
        await this.logAudit(actor, 'user.create', 'user', user.id, { email: user.email, role: user.role });
        return user;
    }
    async updateUser(actor, userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { ...(dto.full_name ? { full_name: dto.full_name } : {}), ...(dto.role ? { role: dto.role } : {}), ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}) },
            select: { id: true, full_name: true, email: true, role: true, is_active: true },
        });
        await this.logAudit(actor, 'user.update', 'user', userId, dto);
        return updated;
    }
    async createStaffForVendor(actor, vendorId, dto) {
        const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (exists)
            throw new common_1.ConflictException('Email already in use');
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
        const password_hash = await bcrypt.hash(dto.pin ?? 'changeme123', 10);
        const user = await this.prisma.user.create({
            data: { full_name: dto.name, email: dto.email, password_hash, role: dto.role, vendor_id: vendorId, is_active: true, supabase_id: `staff-created-${Date.now()}` },
            select: { id: true, full_name: true, email: true, role: true, is_active: true },
        });
        await this.logAudit(actor, 'staff.create', 'user', user.id, { vendor_id: vendorId, role: dto.role });
        return user;
    }
    async getSystemSettings() {
        const config = await this.prisma.foodVillage.findFirst();
        return config ?? { name: 'Food Village', tax_rate: 0.0825 };
    }
    async updateSystemSettings(actor, dto) {
        const config = await this.prisma.foodVillage.findFirst();
        const data = {};
        if (dto.food_village_name)
            data.name = dto.food_village_name;
        if (dto.tax_rate !== undefined)
            data.tax_rate = dto.tax_rate;
        let updated;
        if (config) {
            updated = await this.prisma.foodVillage.update({ where: { id: config.id }, data });
        }
        else {
            updated = await this.prisma.foodVillage.create({ data: { name: dto.food_village_name ?? 'Food Village', tax_rate: dto.tax_rate ?? 0.0825 } });
        }
        await this.logAudit(actor, 'settings.update', 'config', updated.id, dto);
        return updated;
    }
    async getVendorDetail(id) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { id },
            include: {
                categories: { include: { items: { where: { is_deleted: false }, select: { id: true, name: true, price: true, is_available: true } } } },
                users: { select: { id: true, full_name: true, email: true, role: true, is_active: true } },
                staff_pins: { select: { id: true, label: true, role: true, is_active: true } },
            },
        });
        if (!vendor)
            throw new common_1.NotFoundException('Vendor not found');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [ordersToday, revenueData, totalOrders] = await Promise.all([
            this.prisma.order.count({ where: { items: { some: { vendor_id: id } }, created_at: { gte: today } } }),
            this.prisma.orderItem.aggregate({
                where: { vendor_id: id },
                _sum: { total_price: true },
            }),
            this.prisma.order.count({ where: { items: { some: { vendor_id: id } } } }),
        ]);
        const { staff_pins, ...rest } = vendor;
        return {
            ...rest,
            staffPins: staff_pins,
            stats: {
                orders_today: ordersToday,
                total_orders: totalOrders,
                total_revenue: Math.round((revenueData._sum.total_price ?? 0) * 100) / 100,
            },
        };
    }
    async getHealth() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return { status: 'ok', db: 'ok', timestamp: new Date().toISOString() };
        }
        catch {
            return { status: 'degraded', db: 'error', timestamp: new Date().toISOString() };
        }
    }
    async logAudit(actor, action, entityType, entityId, metadata) {
        await this.prisma.auditLog.create({
            data: {
                actor_id: actor.id,
                actor_name: actor.full_name ?? actor.email ?? 'system',
                actor_role: actor.role,
                action,
                entity_type: entityType,
                entity_id: entityId,
                metadata: metadata,
            },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map