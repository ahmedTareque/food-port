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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsPublicController = exports.HealthController = exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const admin_dto_1 = require("./dto/admin.dto");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getOverview() {
        return this.adminService.getOverview();
    }
    getLiveOrders() {
        return this.adminService.getLiveOrders();
    }
    getRevenue(from, to, interval) {
        return this.adminService.getRevenueAnalytics(from, to, interval ?? 'day');
    }
    getVendorAnalytics(from, to) {
        return this.adminService.getVendorAnalytics(from, to);
    }
    getPeakHours(from, to) {
        return this.adminService.getPeakHours(from, to);
    }
    getTopItems(from, to, vendorId, limit) {
        return this.adminService.getTopItems(from, to, vendorId, limit ? +limit : 10);
    }
    getPrepTimes(from, to, vendorId) {
        return this.adminService.getPrepTimeReport(from, to, vendorId);
    }
    getByCuisine(from, to) {
        return this.adminService.getByCuisine(from, to);
    }
    async exportOrders(from, to, res) {
        const csv = await this.adminService.exportOrders(from, to);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
        res.send(csv);
    }
    getOrders(from, to, status, vendorId, page, limit) {
        return this.adminService.getOrders(from, to, status, vendorId, page ? +page : 1, limit ? +limit : 20);
    }
    getOrder(id) {
        return this.adminService.getOrder(id);
    }
    updateOrderStatus(user, id, dto) {
        return this.adminService.updateOrderStatus(user, id, dto);
    }
    cancelOrder(user, id, dto) {
        return this.adminService.cancelOrder(user, id, dto);
    }
    getVendors(status, page, limit) {
        return this.adminService.getVendors(status, page ? +page : 1, limit ? +limit : 20);
    }
    createVendor(user, dto) {
        return this.adminService.createVendor(user, dto);
    }
    updateVendor(user, id, dto) {
        return this.adminService.updateVendor(user, id, dto);
    }
    setVendorStatus(user, id, dto) {
        return this.adminService.setVendorStatus(user, id, dto);
    }
    deleteVendor(user, id) {
        return this.adminService.deleteVendor(user, id);
    }
    getVendorStaff(id) {
        return this.adminService.getVendorStaff(id);
    }
    removeStaff(user, vendorId, userId) {
        return this.adminService.removeStaff(user, vendorId, userId);
    }
    createStaffForVendor(user, id, dto) {
        return this.adminService.createStaffForVendor(user, id, dto);
    }
    getVendorDetail(id) {
        return this.adminService.getVendorDetail(id);
    }
    getUsers(role, page, limit) {
        return this.adminService.getUsers(role, page ? +page : 1, limit ? +limit : 20);
    }
    createUser(user, dto) {
        return this.adminService.createUser(user, dto);
    }
    updateUser(user, id, dto) {
        return this.adminService.updateUser(user, id, dto);
    }
    getSystemSettings() {
        return this.adminService.getSystemSettings();
    }
    updateSystemSettings(user, dto) {
        return this.adminService.updateSystemSettings(user, dto);
    }
    getDailySummary(from, to) {
        return this.adminService.getDailySummary(from, to);
    }
    getRevenueByVendor(from, to) {
        return this.adminService.getRevenueByVendor(from, to);
    }
    getCashLog(date, page, limit, from, to) {
        return this.adminService.getCashLog(date, page ? +page : 1, limit ? +limit : 20, from, to);
    }
    createCashLog(user, dto) {
        return this.adminService.createCashLog(user, dto);
    }
    async exportFinance(from, to, res) {
        const data = await this.adminService.getDailySummary(from, to);
        const header = 'date,total_orders,gross_revenue,tax_collected,net_revenue\n';
        const rows = data.map((d) => `${d.date},${d.total_orders},${d.gross_revenue.toFixed(2)},${d.tax_collected.toFixed(2)},${d.net_revenue.toFixed(2)}`);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="finance-${Date.now()}.csv"`);
        res.send(header + rows.join('\n'));
    }
    getPromotions(active, page, limit) {
        const isActive = active === undefined ? undefined : active === 'true';
        return this.adminService.getPromotions(isActive, page ? +page : 1, limit ? +limit : 20);
    }
    createPromotion(user, dto) {
        return this.adminService.createPromotion(user, dto);
    }
    updatePromotion(user, id, dto) {
        return this.adminService.updatePromotion(user, id, dto);
    }
    togglePromotion(user, id) {
        return this.adminService.togglePromotion(user, id);
    }
    deletePromotion(user, id) {
        return this.adminService.deletePromotion(user, id);
    }
    getPromotionStats(id) {
        return this.adminService.getPromotionStats(id);
    }
    getAuditLog(from, to, actorId, action, page, limit) {
        return this.adminService.getAuditLog(from, to, actorId, action, page ? +page : 1, limit ? +limit : 30);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('orders/live'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getLiveOrders", null);
__decorate([
    (0, common_1.Get)('analytics/revenue'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('interval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('analytics/vendors'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getVendorAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/peak-hours'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPeakHours", null);
__decorate([
    (0, common_1.Get)('analytics/top-items'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('vendor_id')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTopItems", null);
__decorate([
    (0, common_1.Get)('analytics/prep-times'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('vendor_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPrepTimes", null);
__decorate([
    (0, common_1.Get)('analytics/by-cuisine'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getByCuisine", null);
__decorate([
    (0, common_1.Get)('orders/export'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportOrders", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('vendor_id')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Patch)('orders/:id/status'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.CancelOrderDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Get)('vendors'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getVendors", null);
__decorate([
    (0, common_1.Post)('vendors'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_dto_1.CreateVendorDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createVendor", null);
__decorate([
    (0, common_1.Put)('vendors/:id'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.UpdateVendorDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateVendor", null);
__decorate([
    (0, common_1.Patch)('vendors/:id/status'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.VendorStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setVendorStatus", null);
__decorate([
    (0, common_1.Delete)('vendors/:id'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteVendor", null);
__decorate([
    (0, common_1.Get)('vendors/:id/staff'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getVendorStaff", null);
__decorate([
    (0, common_1.Delete)('vendors/:vendorId/staff/:userId'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('vendorId')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "removeStaff", null);
__decorate([
    (0, common_1.Post)('vendors/:id/staff'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createStaffForVendor", null);
__decorate([
    (0, common_1.Get)('vendors/:id/detail'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getVendorDetail", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSystemSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, roles_decorator_1.Roles)('super_admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_dto_1.SystemSettingsDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateSystemSettings", null);
__decorate([
    (0, common_1.Get)('finance/daily'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getDailySummary", null);
__decorate([
    (0, common_1.Get)('finance/by-vendor'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getRevenueByVendor", null);
__decorate([
    (0, common_1.Get)('finance/cash-log'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCashLog", null);
__decorate([
    (0, common_1.Post)('finance/cash-log'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_dto_1.CashLogDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createCashLog", null);
__decorate([
    (0, common_1.Get)('finance/export'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportFinance", null);
__decorate([
    (0, common_1.Get)('promotions'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('active')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPromotions", null);
__decorate([
    (0, common_1.Post)('promotions'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_dto_1.CreatePromotionDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createPromotion", null);
__decorate([
    (0, common_1.Put)('promotions/:id'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.UpdatePromotionDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updatePromotion", null);
__decorate([
    (0, common_1.Patch)('promotions/:id/toggle'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "togglePromotion", null);
__decorate([
    (0, common_1.Delete)('promotions/:id'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deletePromotion", null);
__decorate([
    (0, common_1.Get)('promotions/:id/stats'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPromotionStats", null);
__decorate([
    (0, common_1.Get)('audit'),
    (0, roles_decorator_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('actor_id')),
    __param(3, (0, common_1.Query)('action')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAuditLog", null);
exports.AdminController = AdminController = __decorate([
    (0, throttler_1.SkipThrottle)({ auth: true, order: true }),
    (0, swagger_1.ApiTags)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
let HealthController = class HealthController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    getHealth() {
        return this.adminService.getHealth();
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.SetMetadata)('isPublic', true),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getHealth", null);
exports.HealthController = HealthController = __decorate([
    (0, throttler_1.SkipThrottle)({ auth: true, order: true }),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], HealthController);
let PromotionsPublicController = class PromotionsPublicController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    validatePromo(dto) {
        return this.adminService.validatePromoCode(dto);
    }
};
exports.PromotionsPublicController = PromotionsPublicController;
__decorate([
    (0, common_1.Post)('validate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.ValidatePromoDto]),
    __metadata("design:returntype", void 0)
], PromotionsPublicController.prototype, "validatePromo", null);
exports.PromotionsPublicController = PromotionsPublicController = __decorate([
    (0, throttler_1.SkipThrottle)({ auth: true, order: true }),
    (0, common_1.Controller)('promotions'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], PromotionsPublicController);
//# sourceMappingURL=admin.controller.js.map