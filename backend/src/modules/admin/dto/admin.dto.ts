import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString, IsEmail, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVendorDto {
  @IsString() name: string;
  @IsString() cuisine_type: string;
  @IsNumber() booth_number: number;
  @IsString() booth_color: string;
  @IsEmail() email: string;
  @IsString() @IsOptional() pin?: string;
}

export class UpdateVendorDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() cuisine_type?: string;
  @IsString() @IsOptional() booth_color?: string;
  @IsNumber() @IsOptional() booth_number?: number;
  @IsNumber() @IsOptional() avg_prep_time_minutes?: number;
}

export class VendorStatusDto {
  @IsEnum(['online', 'offline', 'suspended']) status: 'online' | 'offline' | 'suspended';
}

export class CreateStaffDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsEnum(['vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'waiter']) role: string;
  @IsString() @IsOptional() pin?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'confirmed', 'partially_ready', 'ready', 'completed', 'cancelled']) status: string;
  @IsString() @IsOptional() reason?: string;
}

export class CancelOrderDto {
  @IsString() reason: string;
}

export class CreatePromotionDto {
  @IsString() code: string;
  @IsEnum(['percent', 'fixed']) type: 'percent' | 'fixed';
  @IsNumber() value: number;
  @IsNumber() @IsOptional() min_order_amount?: number;
  @IsNumber() @IsOptional() max_uses?: number;
  @IsString() @IsOptional() vendor_id?: string;
  @IsDateString() valid_from: string;
  @IsDateString() valid_to: string;
}

export class UpdatePromotionDto {
  @IsString() @IsOptional() code?: string;
  @IsNumber() @IsOptional() value?: number;
  @IsNumber() @IsOptional() min_order_amount?: number;
  @IsNumber() @IsOptional() max_uses?: number;
  @IsDateString() @IsOptional() valid_from?: string;
  @IsDateString() @IsOptional() valid_to?: string;
  @IsBoolean() @IsOptional() is_active?: boolean;
}

export class ValidatePromoDto {
  @IsString() code: string;
  @IsNumber() subtotal: number;
  @IsString() @IsOptional() vendor_id?: string;
}

export class CashLogDto {
  @IsString() order_id: string;
  @IsNumber() amount: number;
  @IsString() collected_by: string;
  @IsString() @IsOptional() notes?: string;
}

export class CreateUserDto {
  @IsString() full_name: string;
  @IsEmail() email: string;
  @IsString() password: string;
  @IsEnum(['super_admin', 'admin', 'vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'waiter']) role: string;
  @IsString() @IsOptional() vendor_id?: string;
}

export class UpdateUserDto {
  @IsString() @IsOptional() full_name?: string;
  @IsEnum(['super_admin', 'admin', 'vendor_owner', 'vendor_kitchen', 'vendor_cashier', 'waiter']) @IsOptional() role?: string;
  @IsBoolean() @IsOptional() is_active?: boolean;
}

export class SystemSettingsDto {
  @IsString() @IsOptional() food_village_name?: string;
  @IsNumber() @IsOptional() tax_rate?: number;
  @IsNumber() @IsOptional() default_commission_rate?: number;
  @IsString() @IsOptional() currency?: string;
  @IsString() @IsOptional() timezone?: string;
}
