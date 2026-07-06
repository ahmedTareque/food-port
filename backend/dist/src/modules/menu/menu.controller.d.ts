import { MenuService } from './menu.service';
export declare class MenuController {
    private menuService;
    constructor(menuService: MenuService);
    getVendors(status?: string): Promise<{
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        cuisine_type: string;
        booth_number: number;
        booth_color: string;
        avg_prep_time_minutes: number;
        status: import(".prisma/client").$Enums.VendorStatus;
        is_accepting_orders: boolean;
    }[]>;
    getVendorMenu(vendorId: string, available?: string): Promise<{
        vendor: {
            id: string;
            name: string;
            slug: string;
            logo_url: string | null;
            cuisine_type: string;
            booth_number: number;
            booth_color: string;
            avg_prep_time_minutes: number;
            status: import(".prisma/client").$Enums.VendorStatus;
            is_accepting_orders: boolean;
        };
        categories: {
            category: {
                id: string;
                name: string;
                slug: string;
                sort_order: number;
                item_count: number;
            };
            items: {
                id: string;
                name: string;
                description: string | null;
                price: number;
                image_url: string | null;
                thumbnail_url: string | null;
                prep_time_minutes: number;
                dietary_tags: string[];
                allergens: string[];
                is_available: boolean;
                has_modifiers: boolean;
                category_id: string;
            }[];
        }[];
    }>;
    getVendorCategories(vendorId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        sort_order: number;
        item_count: number;
    }[]>;
    getMenuItemDetail(itemId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: number;
        image_url: string | null;
        thumbnail_url: string | null;
        prep_time_minutes: number;
        dietary_tags: string[];
        allergens: string[];
        is_available: boolean;
        has_modifiers: boolean;
        category_id: string;
        modifier_groups: {
            id: string;
            name: string;
            is_required: boolean;
            min_selections: number;
            max_selections: number;
            modifiers: {
                id: string;
                name: string;
                price_adjustment: number;
                is_available: boolean;
            }[];
        }[];
    }>;
    validatePromo(body: {
        code: string;
        subtotal: number;
    }): Promise<{
        promotion_id: string;
        code: string;
        type: string;
        value: number;
        discount_amount: number;
    }>;
}
