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
exports.VendorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const vendor_service_1 = require("./vendor.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const create_menu_item_dto_1 = require("./dto/create-menu-item.dto");
let VendorController = class VendorController {
    constructor(vendorService) {
        this.vendorService = vendorService;
    }
    getWeeklyRevenue(user) {
        return this.vendorService.getWeeklyRevenue(user);
    }
    getDashboard(user) {
        return this.vendorService.getDashboard(user);
    }
    getOrders(user, from, to, status, page, limit) {
        return this.vendorService.getOrders(user, from, to, status, page ? +page : 1, limit ? +limit : 20);
    }
    getOrder(user, orderId) {
        return this.vendorService.getOrderDetail(user, orderId);
    }
    getMenu(user) {
        return this.vendorService.getMenu(user);
    }
    getMenuItems(user, categoryId, available) {
        const avail = available === undefined ? undefined : available !== 'false';
        return this.vendorService.getMenuItems(user, categoryId, avail);
    }
    createMenuItem(user, dto) {
        return this.vendorService.createMenuItem(user, dto);
    }
    updateMenuItem(user, id, dto) {
        return this.vendorService.updateMenuItem(user, id, dto);
    }
    deleteMenuItem(user, id) {
        return this.vendorService.deleteMenuItem(user, id);
    }
    duplicateMenuItem(user, id) {
        return this.vendorService.duplicateMenuItem(user, id);
    }
    updateAvailability(user, id, dto) {
        return this.vendorService.updateAvailability(user, id, dto);
    }
    getCategories(user) {
        return this.vendorService.getCategories(user);
    }
    createCategory(user, dto) {
        return this.vendorService.createCategory(user, dto);
    }
    updateCategory(user, id, dto) {
        return this.vendorService.updateCategory(user, id, dto);
    }
    deleteCategory(user, id) {
        return this.vendorService.deleteCategory(user, id);
    }
    bulkCategoryAvailability(user, id, is_available) {
        return this.vendorService.bulkSetCategoryAvailability(user, id, is_available);
    }
    createModifierGroup(user, dto) {
        return this.vendorService.createModifierGroup(user, dto);
    }
    updateModifierGroup(user, id, dto) {
        return this.vendorService.updateModifierGroup(user, id, dto);
    }
    addModifier(user, id, dto) {
        return this.vendorService.addModifier(user, id, dto);
    }
    removeModifier(user, groupId, modId) {
        return this.vendorService.removeModifier(user, groupId, modId);
    }
    deleteModifierGroup(user, id) {
        return this.vendorService.deleteModifierGroup(user, id);
    }
    linkModifierGroup(user, itemId, groupId) {
        return this.vendorService.linkModifierGroupToItem(user, itemId, groupId);
    }
    unlinkModifierGroup(user, itemId, groupId) {
        return this.vendorService.unlinkModifierGroupFromItem(user, itemId, groupId);
    }
    getSettings(user) {
        return this.vendorService.getSettings(user);
    }
    updateSettings(user, dto) {
        return this.vendorService.updateSettings(user, dto);
    }
    updateStatus(user, dto) {
        return this.vendorService.updateStatus(user, dto);
    }
    listStaffPins(user) {
        return this.vendorService.listStaffPins(user);
    }
    createStaffPin(user, label, pin) {
        return this.vendorService.createStaffPin(user, label, pin);
    }
    toggleStaffPin(user, id, is_active) {
        return this.vendorService.toggleStaffPin(user, id, is_active);
    }
    deleteStaffPin(user, id) {
        return this.vendorService.deleteStaffPin(user, id);
    }
    getPayoutSummary(user) {
        return this.vendorService.getPayoutSummary(user);
    }
    getSalesReport(user, from, to) {
        return this.vendorService.getSalesReport(user, from, to);
    }
    getTopItemsReport(user, from, to, limit) {
        return this.vendorService.getTopItemsReport(user, from, to, limit ? parseInt(limit) : 10);
    }
    getPeakHoursReport(user, from, to) {
        return this.vendorService.getPeakHoursReport(user, from, to);
    }
};
exports.VendorController = VendorController;
__decorate([
    (0, common_1.Get)('revenue/weekly'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getWeeklyRevenue", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('orders/:orderId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)('menu'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getMenu", null);
__decorate([
    (0, common_1.Get)('menu-items'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('available')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getMenuItems", null);
__decorate([
    (0, common_1.Post)('menu-items'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_menu_item_dto_1.CreateMenuItemDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "createMenuItem", null);
__decorate([
    (0, common_1.Put)('menu-items/:id'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_menu_item_dto_1.UpdateMenuItemDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "updateMenuItem", null);
__decorate([
    (0, common_1.Delete)('menu-items/:id'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "deleteMenuItem", null);
__decorate([
    (0, common_1.Post)('menu-items/:id/duplicate'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "duplicateMenuItem", null);
__decorate([
    (0, common_1.Patch)('menu-items/:id/availability'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_menu_item_dto_1.UpdateAvailabilityDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "updateAvailability", null);
__decorate([
    (0, common_1.Get)('categories'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_menu_item_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Put)('categories/:id'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_menu_item_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:id/bulk-availability'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('is_available')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "bulkCategoryAvailability", null);
__decorate([
    (0, common_1.Post)('modifier-groups'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_menu_item_dto_1.CreateModifierGroupDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "createModifierGroup", null);
__decorate([
    (0, common_1.Put)('modifier-groups/:id'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_menu_item_dto_1.UpdateModifierGroupDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "updateModifierGroup", null);
__decorate([
    (0, common_1.Post)('modifier-groups/:id/modifiers'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_menu_item_dto_1.CreateModifierDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "addModifier", null);
__decorate([
    (0, common_1.Delete)('modifier-groups/:groupId/modifiers/:modId'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('groupId')),
    __param(2, (0, common_1.Param)('modId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "removeModifier", null);
__decorate([
    (0, common_1.Delete)('modifier-groups/:id'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "deleteModifierGroup", null);
__decorate([
    (0, common_1.Post)('menu-items/:itemId/modifier-groups/:groupId'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "linkModifierGroup", null);
__decorate([
    (0, common_1.Delete)('menu-items/:itemId/modifier-groups/:groupId'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "unlinkModifierGroup", null);
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_menu_item_dto_1.UpdateVendorSettingsDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Patch)('status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_menu_item_dto_1.UpdateVendorStatusDto]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('staff-pins'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "listStaffPins", null);
__decorate([
    (0, common_1.Post)('staff-pins'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('label')),
    __param(2, (0, common_1.Body)('pin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "createStaffPin", null);
__decorate([
    (0, common_1.Patch)('staff-pins/:id/toggle'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('is_active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "toggleStaffPin", null);
__decorate([
    (0, common_1.Delete)('staff-pins/:id'),
    (0, roles_decorator_1.Roles)('vendor_owner', 'admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "deleteStaffPin", null);
__decorate([
    (0, common_1.Get)('payout/summary'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getPayoutSummary", null);
__decorate([
    (0, common_1.Get)('reports/sales'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getSalesReport", null);
__decorate([
    (0, common_1.Get)('reports/top-items'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getTopItemsReport", null);
__decorate([
    (0, common_1.Get)('reports/peak-hours'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], VendorController.prototype, "getPeakHoursReport", null);
exports.VendorController = VendorController = __decorate([
    (0, throttler_1.SkipThrottle)({ auth: true, order: true }),
    (0, swagger_1.ApiTags)('Vendor'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'admin'),
    (0, common_1.Controller)('vendor'),
    __metadata("design:paramtypes", [vendor_service_1.VendorService])
], VendorController);
//# sourceMappingURL=vendor.controller.js.map