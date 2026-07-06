import { IsString, IsArray, IsUUID, IsOptional, ValidateNested, IsInt, Min, MaxLength, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CartModifierDto {
  @IsUUID()
  modifier_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CartItemDto {
  @IsUUID()
  menu_item_id: string;

  @IsUUID()
  vendor_id: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartModifierDto)
  modifiers: CartModifierDto[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  special_instructions?: string;
}

export class CreateOrderDto {
  @IsUUID()
  session_id: string;

  @IsString()
  table_id: string;

  @IsOptional()
  @IsUUID()
  waiter_id?: string;

  @IsString()
  idempotency_key: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  special_notes?: string;
}
