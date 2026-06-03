import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { VendorOperationsService } from './vendor-operations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UpdateTransactionDto, CreateFeedbackDto, AdminReviewFeedbackDto } from './dto/vendor-operations.dto';

@SkipThrottle()
@ApiTags('Vendor Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendor/operations')
export class VendorOperationsController {
  constructor(private svc: VendorOperationsService) {}

  // ─── Vendor: Transactions ──────────────────────────────────────────────────
  @Get('transactions')
  @Roles('vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'admin', 'super_admin')
  getTransactions(@CurrentUser() user: JwtUser, @Query('month') month?: string) {
    return this.svc.getTransactions(user, month);
  }

  @Patch('transactions/:id')
  @Roles('vendor_owner', 'admin', 'super_admin')
  updateTransaction(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.svc.updateTransaction(user, id, dto);
  }

  // ─── Vendor: Feedback ──────────────────────────────────────────────────────
  @Get('feedback')
  @Roles('vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'admin', 'super_admin')
  getFeedback(@CurrentUser() user: JwtUser, @Query('month') month?: string) {
    return this.svc.getFeedback(user, month);
  }

  @Post('feedback')
  @Roles('vendor_owner', 'vendor_kitchen', 'vendor_cashier')
  createFeedback(@CurrentUser() user: JwtUser, @Body() dto: CreateFeedbackDto) {
    return this.svc.createFeedback(user, dto);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────
  @Get('admin/feedback')
  @Roles('admin', 'super_admin')
  adminGetFeedback(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('month') month?: string,
  ) {
    return this.svc.adminGetAllFeedback(type, status, severity, month);
  }

  @Patch('admin/feedback/:id')
  @Roles('admin', 'super_admin')
  adminReviewFeedback(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: AdminReviewFeedbackDto,
  ) {
    return this.svc.adminReviewFeedback(id, dto, user.email);
  }

  @Get('admin/transactions')
  @Roles('admin', 'super_admin')
  adminGetTransactions(
    @Query('month') month?: string,
    @Query('vendor_id') vendorId?: string,
  ) {
    return this.svc.adminGetTransactions(month, vendorId);
  }
}
