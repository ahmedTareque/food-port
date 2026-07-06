export declare class CreateMenuItemDto {
    name: string;
    description?: string;
    price: number;
    category_id: string;
    prep_time_minutes: number;
    dietary_tags?: string[];
    allergens?: string[];
    modifier_group_ids?: string[];
}
export declare class UpdateMenuItemDto {
    name?: string;
    description?: string;
    price?: number;
    category_id?: string;
    prep_time_minutes?: number;
    dietary_tags?: string[];
    allergens?: string[];
    modifier_group_ids?: string[];
}
export declare class UpdateAvailabilityDto {
    is_available: boolean;
}
export declare class CreateCategoryDto {
    name: string;
    sort_order?: number;
}
export declare class UpdateCategoryDto {
    name?: string;
    sort_order?: number;
}
export declare class CreateModifierGroupDto {
    name: string;
    is_required: boolean;
    min_selections: number;
    max_selections: number;
    modifiers?: Array<{
        name: string;
        price_adjustment: number;
    }>;
}
export declare class UpdateModifierGroupDto {
    name?: string;
    is_required?: boolean;
    min_selections?: number;
    max_selections?: number;
}
export declare class CreateModifierDto {
    name: string;
    price_adjustment: number;
}
export declare class UpdateVendorSettingsDto {
    name?: string;
    cuisine_type?: string;
    booth_color?: string;
    avg_prep_time_minutes?: number;
    operating_hours?: Record<string, {
        open: string;
        close: string;
        is_closed: boolean;
    }>;
    notification_preferences?: {
        new_order_sound?: boolean;
        volume?: number;
    };
    logo_url?: string;
}
export declare class UpdateVendorStatusDto {
    is_accepting_orders: boolean;
}
