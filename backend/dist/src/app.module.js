"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const configuration_1 = __importDefault(require("./config/configuration"));
const auth_module_1 = require("./modules/auth/auth.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const menu_module_1 = require("./modules/menu/menu.module");
const orders_module_1 = require("./modules/orders/orders.module");
const kds_module_1 = require("./modules/kds/kds.module");
const vendor_module_1 = require("./modules/vendor/vendor.module");
const admin_module_1 = require("./modules/admin/admin.module");
const vendor_operations_module_1 = require("./modules/vendor-operations/vendor-operations.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const response_transform_interceptor_1 = require("./common/interceptors/response-transform.interceptor");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const core_2 = require("@nestjs/core");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 60000, limit: 100 },
                { name: 'auth', ttl: 60000, limit: 5 },
                { name: 'order', ttl: 60000, limit: 30 },
            ]),
            auth_module_1.AuthModule,
            sessions_module_1.SessionsModule,
            menu_module_1.MenuModule,
            orders_module_1.OrdersModule,
            kds_module_1.KdsModule,
            vendor_module_1.VendorModule,
            admin_module_1.AdminModule,
            vendor_operations_module_1.VendorOperationsModule,
        ],
        providers: [
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.HttpExceptionFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: response_transform_interceptor_1.ResponseTransformInterceptor },
            core_2.Reflector,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useFactory: (ref) => new jwt_auth_guard_1.JwtAuthGuard(ref), inject: [core_2.Reflector] },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map