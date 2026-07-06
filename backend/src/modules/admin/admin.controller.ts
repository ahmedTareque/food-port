import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Res,
  UseGuards, HttpCode, HttpStatus, SetMetadata,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import {
  CreateVendorDto, UpdateVendorDto, VendorStatusDto,
  CreateStaffDto, UpdateOrderStatusDto, CancelOrderDto,
  CreatePromotionDto, UpdatePromotionDto, ValidatePromoDto, CashLogDto,
  CreateUserDto, UpdateUserDto, SystemSettingsDto,
} from './dto/admin.dto';

@SkipThrottle({ auth: true, order: true })
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ── Overview ───────────────────────────────────────────────────────────────
  @Get('overview')
  @Roles('super_admin', 'admin')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('orders/live')
  @Roles('super_admin', 'admin')
  getLiveOrders() {
    return this.adminService.getLiveOrders();
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  @Get('analytics/revenue')
  @Roles('super_admin', 'admin')
  getRevenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('interval') interval?: 'day' | 'hour',
  ) {
    return this.adminService.getRevenueAnalytics(from, to, interval ?? 'day');
  }

  @Get('analytics/vendors')
  @Roles('super_admin', 'admin')
  getVendorAnalytics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getVendorAnalytics(from, to);
  }

  @Get('analytics/peak-hours')
  @Roles('super_admin', 'admin')
  getPeakHours(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getPeakHours(from, to);
  }

  @Get('analytics/top-items')
  @Roles('super_admin', 'admin')
  getTopItems(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('vendor_id') vendorId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getTopItems(from, to, vendorId, limit ? +limit : 10);
  }

  @Get('analytics/prep-times')
  @Roles('super_admin', 'admin')
  getPrepTimes(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('vendor_id') vendorId?: string,
  ) {
    return this.adminService.getPrepTimeReport(from, to, vendorId);
  }

  @Get('analytics/by-cuisine')
  @Roles('super_admin', 'admin')
  getByCuisine(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getByCuisine(from, to);
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  @Get('orders/export')
  @Roles('super_admin', 'admin')
  async exportOrders(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.adminService.exportOrders(from, to);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get('orders')
  @Roles('super_admin', 'admin')
  getOrders(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('vendor_id') vendorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getOrders(from, to, status, vendorId, page ? +page : 1, limit ? +limit : 20);
  }

  @Get('orders/:id')
  @Roles('super_admin', 'admin')
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  @Roles('super_admin', 'admin')
  updateOrderStatus(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.adminService.updateOrderStatus(user, id, dto);
  }

  @Post('orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('super_admin', 'admin')
  cancelOrder(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.adminService.cancelOrder(user, id, dto);
  }

  // ── Vendors ───────────────────────────────────────────────────────────────
  @Get('vendors')
  @Roles('super_admin', 'admin')
  getVendors(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getVendors(status, page ? +page : 1, limit ? +limit : 20);
  }

  @Post('vendors')
  @Roles('super_admin', 'admin')
  createVendor(@CurrentUser() user: JwtUser, @Body() dto: CreateVendorDto) {
    return this.adminService.createVendor(user, dto);
  }

  @Put('vendors/:id')
  @Roles('super_admin', 'admin')
  updateVendor(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.adminService.updateVendor(user, id, dto);
  }

  @Patch('vendors/:id/status')
  @Roles('super_admin', 'admin')
  setVendorStatus(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: VendorStatusDto) {
    return this.adminService.setVendorStatus(user, id, dto);
  }

  @Delete('vendors/:id')
  @Roles('super_admin', 'admin')
  deleteVendor(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.adminService.deleteVendor(user, id);
  }

  @Get('vendors/:id/staff')
  @Roles('super_admin', 'admin')
  getVendorStaff(@Param('id') id: string) {
    return this.adminService.getVendorStaff(id);
  }

  @Delete('vendors/:vendorId/staff/:userId')
  @Roles('super_admin', 'admin')
  removeStaff(@CurrentUser() user: JwtUser, @Param('vendorId') vendorId: string, @Param('userId') userId: string) {
    return this.adminService.removeStaff(user, vendorId, userId);
  }

  @Post('vendors/:id/staff')
  @Roles('super_admin', 'admin')
  createStaffForVendor(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: CreateStaffDto) {
    return this.adminService.createStaffForVendor(user, id, dto);
  }

  @Get('vendors/:id/detail')
  @Roles('super_admin', 'admin')
  getVendorDetail(@Param('id') id: string) {
    return this.adminService.getVendorDetail(id);
  }

  // ── User Management ───────────────────────────────────────────────────────
  @Get('users')
  @Roles('super_admin', 'admin')
  getUsers(@Query('role') role?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers(role, page ? +page : 1, limit ? +limit : 20);
  }

  @Post('users')
  @Roles('super_admin', 'admin')
  createUser(@CurrentUser() user: JwtUser, @Body() dto: CreateUserDto) {
    return this.adminService.createUser(user, dto);
  }

  @Put('users/:id')
  @Roles('super_admin', 'admin')
  updateUser(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(user, id, dto);
  }

  // ── System Settings ───────────────────────────────────────────────────────
  @Get('settings')
  @Roles('super_admin', 'admin')
  getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('settings')
  @Roles('super_admin')
  updateSystemSettings(@CurrentUser() user: JwtUser, @Body() dto: SystemSettingsDto) {
    return this.adminService.updateSystemSettings(user, dto);
  }

  // ── Finance ───────────────────────────────────────────────────────────────
  @Get('finance/daily')
  @Roles('super_admin', 'admin')
  getDailySummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getDailySummary(from, to);
  }

  @Get('finance/by-vendor')
  @Roles('super_admin', 'admin')
  getRevenueByVendor(@Query('from') from?: string, @Query('to') to?: string) {
    return this.adminService.getRevenueByVendor(from, to);
  }

  @Get('finance/cash-log')
  @Roles('super_admin', 'admin')
  getCashLog(
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getCashLog(date, page ? +page : 1, limit ? +limit : 20, from, to);
  }

  @Post('finance/cash-log')
  @Roles('super_admin', 'admin')
  createCashLog(@CurrentUser() user: JwtUser, @Body() dto: CashLogDto) {
    return this.adminService.createCashLog(user, dto);
  }

  @Get('finance/export')
  @Roles('super_admin', 'admin')
  async exportFinance(@Query('from') from: string | undefined, @Query('to') to: string | undefined, @Res() res: Response) {
    const data = await this.adminService.getDailySummary(from, to);
    const header = 'date,total_orders,gross_revenue,tax_collected,net_revenue\n';
    const rows = data.map((d) =>
      `${d.date},${d.total_orders},${d.gross_revenue.toFixed(2)},${d.tax_collected.toFixed(2)},${d.net_revenue.toFixed(2)}`
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="finance-${Date.now()}.csv"`);
    res.send(header + rows.join('\n'));
  }

  // ── Promotions ────────────────────────────────────────────────────────────
  @Get('promotions')
  @Roles('super_admin', 'admin')
  getPromotions(
    @Query('active') active?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const isActive = active === undefined ? undefined : active === 'true';
    return this.adminService.getPromotions(isActive, page ? +page : 1, limit ? +limit : 20);
  }

  @Post('promotions')
  @Roles('super_admin', 'admin')
  createPromotion(@CurrentUser() user: JwtUser, @Body() dto: CreatePromotionDto) {
    return this.adminService.createPromotion(user, dto);
  }

  @Put('promotions/:id')
  @Roles('super_admin', 'admin')
  updatePromotion(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.adminService.updatePromotion(user, id, dto);
  }

  @Patch('promotions/:id/toggle')
  @Roles('super_admin', 'admin')
  togglePromotion(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.adminService.togglePromotion(user, id);
  }

  @Delete('promotions/:id')
  @Roles('super_admin', 'admin')
  deletePromotion(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.adminService.deletePromotion(user, id);
  }

  @Get('promotions/:id/stats')
  @Roles('super_admin', 'admin')
  getPromotionStats(@Param('id') id: string) {
    return this.adminService.getPromotionStats(id);
  }

  // ── Audit Log ─────────────────────────────────────────────────────────────
  @Get('audit')
  @Roles('super_admin', 'admin')
  getAuditLog(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('actor_id') actorId?: string,
    @Query('action') action?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLog(from, to, actorId, action, page ? +page : 1, limit ? +limit : 30);
  }
}

// ── Health check (public, no auth) ────────────────────────────────────────────
@SkipThrottle({ auth: true, order: true })
@Controller('health')
export class HealthController {
  constructor(private adminService: AdminService) {}

  @SetMetadata('isPublic', true)
  @Get()
  getHealth() {
    return this.adminService.getHealth();
  }
}

// ── Promo validation (public customer-facing) ─────────────────────────────────
@SkipThrottle({ auth: true, order: true })
@Controller('promotions')
export class PromotionsPublicController {
  constructor(private adminService: AdminService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validatePromo(@Body() dto: ValidatePromoDto) {
    return this.adminService.validatePromoCode(dto);
  }
}
