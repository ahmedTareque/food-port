export declare class CreateVendorDto {
    name: string;
    cuisine_type: string;
    booth_number: number;
    booth_color: string;
    email: string;
    pin?: string;
}
export declare class UpdateVendorDto {
    name?: string;
    cuisine_type?: string;
    booth_color?: string;
    booth_number?: number;
    avg_prep_time_minutes?: number;
}
export declare class VendorStatusDto {
    status: 'online' | 'offline' | 'suspended';
}
export declare class CreateStaffDto {
    name: string;
    email: string;
    role: string;
    pin?: string;
}
export declare class UpdateOrderStatusDto {
    status: string;
    reason?: string;
}
export declare class CancelOrderDto {
    reason: string;
}
export declare class CreatePromotionDto {
    code: string;
    type: 'percent' | 'fixed';
    value: number;
    min_order_amount?: number;
    max_uses?: number;
    vendor_id?: string;
    valid_from: string;
    valid_to: string;
}
export declare class UpdatePromotionDto {
    code?: string;
    value?: number;
    min_order_amount?: number;
    max_uses?: number;
    valid_from?: string;
    valid_to?: string;
    is_active?: boolean;
}
export declare class ValidatePromoDto {
    code: string;
    subtotal: number;
    vendor_id?: string;
}
export declare class CashLogDto {
    order_id: string;
    amount: number;
    collected_by: string;
    notes?: string;
}
export declare class CreateUserDto {
    full_name: string;
    email: string;
    password: string;
    role: string;
    vendor_id?: string;
}
export declare class UpdateUserDto {
    full_name?: string;
    role?: string;
    is_active?: boolean;
}
export declare class SystemSettingsDto {
    food_village_name?: string;
    tax_rate?: number;
    default_commission_rate?: number;
    currency?: string;
    timezone?: string;
}
