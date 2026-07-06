import { IsString, IsNumber, IsUUID, IsOptional, IsArray, IsBoolean, Min, IsInt, IsNotEmpty } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsUUID()
  category_id: string;

  @IsInt()
  @Min(1)
  prep_time_minutes: number;

  @IsOptional()
  @IsArray()
  dietary_tags?: string[];

  @IsOptional()
  @IsArray()
  allergens?: string[];

  @IsOptional()
  @IsArray()
  modifier_group_ids?: string[];
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsUUID() category_id?: string;
  @IsOptional() @IsInt() @Min(1) prep_time_minutes?: number;
  @IsOptional() @IsArray() dietary_tags?: string[];
  @IsOptional() @IsArray() allergens?: string[];
  @IsOptional() @IsArray() modifier_group_ids?: string[];
}

export class UpdateAvailabilityDto {
  @IsBoolean()
  is_available: boolean;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() sort_order?: number;
}

export class CreateModifierGroupDto {
  @IsString()
  name: string;

  @IsBoolean()
  is_required: boolean;

  @IsInt()
  @Min(0)
  min_selections: number;

  @IsInt()
  @Min(1)
  max_selections: number;

  @IsOptional()
  @IsArray()
  modifiers?: Array<{ name: string; price_adjustment: number }>;
}

export class UpdateModifierGroupDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() is_required?: boolean;
  @IsOptional() @IsInt() @Min(0) min_selections?: number;
  @IsOptional() @IsInt() @Min(1) max_selections?: number;
}

export class CreateModifierDto {
  @IsString()
  name: string;

  @IsNumber()
  price_adjustment: number;
}

export class UpdateVendorSettingsDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() cuisine_type?: string;
  @IsOptional() @IsString() booth_color?: string;
  @IsOptional() @IsInt() @Min(1) avg_prep_time_minutes?: number;
  @IsOptional() operating_hours?: Record<string, { open: string; close: string; is_closed: boolean }>;
  @IsOptional() notification_preferences?: { new_order_sound?: boolean; volume?: number };
  @IsOptional() @IsString() logo_url?: string;
}

export class UpdateVendorStatusDto {
  @IsBoolean()
  is_accepting_orders: boolean;
}
