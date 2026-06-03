import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KdsModule } from './modules/kds/kds.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { AdminModule } from './modules/admin/admin.module';
import { VendorOperationsModule } from './modules/vendor-operations/vendor-operations.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 100 },   // 100 req/min general
      { name: 'auth',  ttl: 60000, limit: 5 },      // 5 req/min auth (applied per-route)
      { name: 'order', ttl: 60000, limit: 30 },     // 30 req/min orders (applied per-route)
    ]),
    AuthModule,
    SessionsModule,
    MenuModule,
    OrdersModule,
    KdsModule,
    VendorModule,
    AdminModule,
    VendorOperationsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    Reflector,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useFactory: (ref: Reflector) => new JwtAuthGuard(ref), inject: [Reflector] },
  ],
})
export class AppModule {}
