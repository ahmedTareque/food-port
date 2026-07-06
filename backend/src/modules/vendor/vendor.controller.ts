import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import {
  CreateMenuItemDto, UpdateMenuItemDto, UpdateAvailabilityDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateModifierGroupDto, UpdateModifierGroupDto, CreateModifierDto,
  UpdateVendorSettingsDto, UpdateVendorStatusDto,
} from './dto/create-menu-item.dto';

@SkipThrottle({ auth: true, order: true })
@ApiTags('Vendor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'admin')
@Controller('vendor')
export class VendorController {
  constructor(private vendorService: VendorService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────────
  @Get('revenue/weekly')
  getWeeklyRevenue(@CurrentUser() user: JwtUser) {
    return this.vendorService.getWeeklyRevenue(user);
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtUser) {
    return this.vendorService.getDashboard(user);
  }

  @Get('orders')
  getOrders(
    @CurrentUser() user: JwtUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vendorService.getOrders(user, from, to, status, page ? +page : 1, limit ? +limit : 20);
  }

  @Get('orders/:orderId')
  getOrder(@CurrentUser() user: JwtUser, @Param('orderId') orderId: string) {
    return this.vendorService.getOrderDetail(user, orderId);
  }

  // ── Full structured menu ───────────────────────────────────────────────────
  @Get('menu')
  getMenu(@CurrentUser() user: JwtUser) {
    return this.vendorService.getMenu(user);
  }

  // ── Menu Items ─────────────────────────────────────────────────────────────
  @Get('menu-items')
  getMenuItems(
    @CurrentUser() user: JwtUser,
    @Query('category') categoryId?: string,
    @Query('available') available?: string,
  ) {
    const avail = available === undefined ? undefined : available !== 'false';
    return this.vendorService.getMenuItems(user, categoryId, avail);
  }

  @Post('menu-items')
  @Roles('vendor_owner', 'admin')
  createMenuItem(@CurrentUser() user: JwtUser, @Body() dto: CreateMenuItemDto) {
    return this.vendorService.createMenuItem(user, dto);
  }

  @Put('menu-items/:id')
  @Roles('vendor_owner', 'admin')
  updateMenuItem(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.vendorService.updateMenuItem(user, id, dto);
  }

  @Delete('menu-items/:id')
  @Roles('vendor_owner', 'admin')
  deleteMenuItem(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.vendorService.deleteMenuItem(user, id);
  }

  @Post('menu-items/:id/duplicate')
  @Roles('vendor_owner', 'admin')
  duplicateMenuItem(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.vendorService.duplicateMenuItem(user, id);
  }

  @Patch('menu-items/:id/availability')
  updateAvailability(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateAvailabilityDto) {
    return this.vendorService.updateAvailability(user, id, dto);
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  @Get('categories')
  getCategories(@CurrentUser() user: JwtUser) {
    return this.vendorService.getCategories(user);
  }

  @Post('categories')
  @Roles('vendor_owner', 'admin')
  createCategory(@CurrentUser() user: JwtUser, @Body() dto: CreateCategoryDto) {
    return this.vendorService.createCategory(user, dto);
  }

  @Put('categories/:id')
  @Roles('vendor_owner', 'admin')
  updateCategory(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.vendorService.updateCategory(user, id, dto);
  }

  @Delete('categories/:id')
  @Roles('vendor_owner', 'admin')
  deleteCategory(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.vendorService.deleteCategory(user, id);
  }

  @Patch('categories/:id/bulk-availability')
  @Roles('vendor_owner', 'admin')
  bulkCategoryAvailability(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body('is_available') is_available: boolean,
  ) {
    return this.vendorService.bulkSetCategoryAvailability(user, id, is_available);
  }

  // ── Modifier Groups ────────────────────────────────────────────────────────
  @Post('modifier-groups')
  @Roles('vendor_owner', 'admin')
  createModifierGroup(@CurrentUser() user: JwtUser, @Body() dto: CreateModifierGroupDto) {
    return this.vendorService.createModifierGroup(user, dto);
  }

  @Put('modifier-groups/:id')
  @Roles('vendor_owner', 'admin')
  updateModifierGroup(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.vendorService.updateModifierGroup(user, id, dto);
  }

  @Post('modifier-groups/:id/modifiers')
  @Roles('vendor_owner', 'admin')
  addModifier(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: CreateModifierDto) {
    return this.vendorService.addModifier(user, id, dto);
  }

  @Delete('modifier-groups/:groupId/modifiers/:modId')
  @Roles('vendor_owner', 'admin')
  removeModifier(@CurrentUser() user: JwtUser, @Param('groupId') groupId: string, @Param('modId') modId: string) {
    return this.vendorService.removeModifier(user, groupId, modId);
  }

  @Delete('modifier-groups/:id')
  @Roles('vendor_owner', 'admin')
  deleteModifierGroup(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.vendorService.deleteModifierGroup(user, id);
  }

  @Post('menu-items/:itemId/modifier-groups/:groupId')
  @Roles('vendor_owner', 'admin')
  linkModifierGroup(@CurrentUser() user: JwtUser, @Param('itemId') itemId: string, @Param('groupId') groupId: string) {
    return this.vendorService.linkModifierGroupToItem(user, itemId, groupId);
  }

  @Delete('menu-items/:itemId/modifier-groups/:groupId')
  @Roles('vendor_owner', 'admin')
  unlinkModifierGroup(@CurrentUser() user: JwtUser, @Param('itemId') itemId: string, @Param('groupId') groupId: string) {
    return this.vendorService.unlinkModifierGroupFromItem(user, itemId, groupId);
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  @Get('settings')
  getSettings(@CurrentUser() user: JwtUser) {
    return this.vendorService.getSettings(user);
  }

  @Put('settings')
  @Roles('vendor_owner', 'admin')
  updateSettings(@CurrentUser() user: JwtUser, @Body() dto: UpdateVendorSettingsDto) {
    return this.vendorService.updateSettings(user, dto);
  }

  @Patch('status')
  updateStatus(@CurrentUser() user: JwtUser, @Body() dto: UpdateVendorStatusDto) {
    return this.vendorService.updateStatus(user, dto);
  }

  // ── Staff PINs ─────────────────────────────────────────────────────────────
  @Get('staff-pins')
  @Roles('vendor_owner', 'admin')
  listStaffPins(@CurrentUser() user: JwtUser) {
    return this.vendorService.listStaffPins(user);
  }

  @Post('staff-pins')
  @Roles('vendor_owner', 'admin')
  createStaffPin(@CurrentUser() user: JwtUser, @Body('label') label: string, @Body('pin') pin: string) {
    return this.vendorService.createStaffPin(user, label, pin);
  }

  @Patch('staff-pins/:id/toggle')
  @Roles('vendor_owner', 'admin')
  toggleStaffPin(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body('is_active') is_active: boolean) {
    return this.vendorService.toggleStaffPin(user, id, is_active);
  }

  @Delete('staff-pins/:id')
  @Roles('vendor_owner', 'admin')
  deleteStaffPin(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.vendorService.deleteStaffPin(user, id);
  }

  // ── Payout Summary ─────────────────────────────────────────────────────────
  @Get('payout/summary')
  getPayoutSummary(@CurrentUser() user: JwtUser) {
    return this.vendorService.getPayoutSummary(user);
  }

  // ── Reports ────────────────────────────────────────────────────────────────
  @Get('reports/sales')
  getSalesReport(@CurrentUser() user: JwtUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.vendorService.getSalesReport(user, from, to);
  }

  @Get('reports/top-items')
  getTopItemsReport(@CurrentUser() user: JwtUser, @Query('from') from?: string, @Query('to') to?: string, @Query('limit') limit?: string) {
    return this.vendorService.getTopItemsReport(user, from, to, limit ? parseInt(limit) : 10);
  }

  @Get('reports/peak-hours')
  getPeakHoursReport(@CurrentUser() user: JwtUser, @Query('from') from?: string, @Query('to') to?: string) {
    return this.vendorService.getPeakHoursReport(user, from, to);
  }
}
