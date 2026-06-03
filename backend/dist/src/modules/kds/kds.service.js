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
exports.KdsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const orders_service_1 = require("../orders/orders.service");
let KdsService = class KdsService {
    constructor(prisma, ordersService) {
        this.prisma = prisma;
        this.ordersService = ordersService;
    }
    async getOrders(user) {
        const vendorId = user.vendor_id;
        if (!vendorId)
            throw new common_1.ForbiddenException('No vendor associated with this account');
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
    async updateItemStatus(itemId, newStatus, user, rejectDto) {
        const item = await this.prisma.orderItem.findUnique({ where: { id: itemId } });
        if (!item)
            throw new common_1.NotFoundException('Order item not found');
        if (item.vendor_id !== user.vendor_id)
            throw new common_1.ForbiddenException('Item belongs to a different vendor');
        const transitions = this.ordersService.getItemTransitions();
        const allowed = transitions[item.status] ?? [];
        if (!allowed.includes(newStatus)) {
            throw new common_1.BadRequestException(`Cannot transition from ${item.status} to ${newStatus}`);
        }
        const timestamps = {};
        if (newStatus === 'accepted')
            timestamps.accepted_at = new Date();
        if (newStatus === 'preparing')
            timestamps.preparing_at = new Date();
        if (newStatus === 'ready')
            timestamps.ready_at = new Date();
        if (newStatus === 'completed')
            timestamps.completed_at = new Date();
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
        await this.ordersService.syncOrderStatus(item.order_id);
        const tables = await this.prisma.table.findMany({
            where: { id: updated.order.table_id },
            select: { id: true, table_number: true },
        });
        const tableMap = Object.fromEntries(tables.map((t) => [t.id, t.table_number]));
        return this.formatCard(updated, tableMap);
    }
    async getQueueStats(user) {
        const vendorId = user.vendor_id;
        if (!vendorId)
            throw new common_1.ForbiddenException('No vendor associated');
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
    formatCard(item, tableMap) {
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
};
exports.KdsService = KdsService;
exports.KdsService = KdsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        orders_service_1.OrdersService])
], KdsService);
//# sourceMappingURL=kds.service.js.map