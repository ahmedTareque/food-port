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
exports.MenuController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const menu_service_1 = require("./menu.service");
const Public = () => (0, common_1.SetMetadata)('isPublic', true);
let MenuController = class MenuController {
    constructor(menuService) {
        this.menuService = menuService;
    }
    getVendors(status) {
        return this.menuService.getVendors(status);
    }
    getVendorMenu(vendorId, available) {
        const availableBool = available === undefined ? true : available !== 'false';
        return this.menuService.getVendorMenu(vendorId, availableBool);
    }
    getVendorCategories(vendorId) {
        return this.menuService.getVendorCategories(vendorId);
    }
    getMenuItemDetail(itemId) {
        return this.menuService.getMenuItemDetail(itemId);
    }
    validatePromo(body) {
        return this.menuService.validatePromoCode(body.code, body.subtotal);
    }
};
exports.MenuController = MenuController;
__decorate([
    Public(),
    (0, common_1.Get)('vendors'),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "getVendors", null);
__decorate([
    Public(),
    (0, common_1.Get)('vendors/:vendorId/menu'),
    (0, swagger_1.ApiQuery)({ name: 'available', required: false, type: Boolean }),
    __param(0, (0, common_1.Param)('vendorId')),
    __param(1, (0, common_1.Query)('available')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "getVendorMenu", null);
__decorate([
    Public(),
    (0, common_1.Get)('vendors/:vendorId/categories'),
    __param(0, (0, common_1.Param)('vendorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "getVendorCategories", null);
__decorate([
    Public(),
    (0, common_1.Get)('menu-items/:itemId'),
    __param(0, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "getMenuItemDetail", null);
__decorate([
    Public(),
    (0, common_1.Post)('promos/validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "validatePromo", null);
exports.MenuController = MenuController = __decorate([
    (0, throttler_1.SkipThrottle)({ auth: true, order: true }),
    (0, swagger_1.ApiTags)('Menu'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [menu_service_1.MenuService])
], MenuController);
//# sourceMappingURL=menu.controller.js.map