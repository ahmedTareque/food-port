import { PrismaService } from '../../database/prisma.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { CreateMenuItemDto, UpdateMenuItemDto, UpdateAvailabilityDto, CreateCategoryDto, UpdateCategoryDto, CreateModifierGroupDto, UpdateModifierGroupDto, CreateModifierDto, UpdateVendorSettingsDto, UpdateVendorStatusDto } from './dto/create-menu-item.dto';
export declare class VendorService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboard(user: JwtUser): Promise<{
        orders_today: number;
        revenue_today: number;
        active_queue: number;
        avg_prep_time: number;
        top_items: {
            name: string;
            count: number;
        }[];
        recent_orders: {
            id: string;
            token_number: number;
            total: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            created_at: string;
        }[];
    }>;
    getOrders(user: JwtUser, from?: string, to?: string, status?: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            token_number: number;
            table_number: number;
            item_count: number;
            total: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            created_at: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
            has_next: boolean;
            has_prev: boolean;
        };
    }>;
    getMenuItems(user: JwtUser, categoryId?: string, available?: boolean): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: number;
        category_id: string;
        category_name: string;
        image_url: string | null;
        thumbnail_url: string | null;
        prep_time_minutes: number;
        dietary_tags: string[];
        allergens: string[];
        is_available: boolean;
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
    }[]>;
    createMenuItem(user: JwtUser, dto: CreateMenuItemDto): Promise<{
        category: {
            name: string;
        };
        modifier_group_links: ({
            modifier_group: {
                modifiers: {
                    id: string;
                    created_at: Date;
                    name: string;
                    sort_order: number;
                    is_available: boolean;
                    modifier_group_id: string;
                    price_adjustment: number;
                }[];
            } & {
                id: string;
                vendor_id: string;
                is_active: boolean;
                created_at: Date;
                updated_at: Date;
                name: string;
                is_required: boolean;
                min_selections: number;
                max_selections: number;
            };
        } & {
            menu_item_id: string;
            modifier_group_id: string;
        })[];
    } & {
        id: string;
        vendor_id: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        sort_order: number;
        is_deleted: boolean;
        is_available: boolean;
        category_id: string;
        description: string | null;
        price: number;
        image_url: string | null;
        thumbnail_url: string | null;
        prep_time_minutes: number;
        dietary_tags: string[];
        allergens: string[];
    }>;
    updateMenuItem(user: JwtUser, itemId: string, dto: UpdateMenuItemDto): Promise<{
        category: {
            name: string;
        };
        modifier_group_links: ({
            modifier_group: {
                modifiers: {
                    id: string;
                    created_at: Date;
                    name: string;
                    sort_order: number;
                    is_available: boolean;
                    modifier_group_id: string;
                    price_adjustment: number;
                }[];
            } & {
                id: string;
                vendor_id: string;
                is_active: boolean;
                created_at: Date;
                updated_at: Date;
                name: string;
                is_required: boolean;
                min_selections: number;
                max_selections: number;
            };
        } & {
            menu_item_id: string;
            modifier_group_id: string;
        })[];
    } & {
        id: string;
        vendor_id: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        sort_order: number;
        is_deleted: boolean;
        is_available: boolean;
        category_id: string;
        description: string | null;
        price: number;
        image_url: string | null;
        thumbnail_url: string | null;
        prep_time_minutes: number;
        dietary_tags: string[];
        allergens: string[];
    }>;
    deleteMenuItem(user: JwtUser, itemId: string): Promise<{
        success: boolean;
    }>;
    updateAvailability(user: JwtUser, itemId: string, dto: UpdateAvailabilityDto): Promise<{
        id: string;
        vendor_id: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        sort_order: number;
        is_deleted: boolean;
        is_available: boolean;
        category_id: string;
        description: string | null;
        price: number;
        image_url: string | null;
        thumbnail_url: string | null;
        prep_time_minutes: number;
        dietary_tags: string[];
        allergens: string[];
    }>;
    getMenu(user: JwtUser): Promise<{
        vendor: {
            id: string;
            name: string;
            booth_color: string;
        };
        categories: {
            id: string;
            name: string;
            sort_order: number;
            menu_items: {
                id: string;
                vendor_id: string;
                category_id: string;
                name: string;
                description: string | null;
                base_price: number;
                image_url: string | null;
                is_available: boolean;
                is_featured: boolean;
                prep_time_minutes: number;
                dietary_tags: string[];
                modifier_groups: {
                    id: string;
                    name: string;
                    selection_type: string;
                    min_selections: number;
                    max_selections: number;
                    is_required: boolean;
                    modifiers: {
                        id: string;
                        name: string;
                        price_delta: number;
                        is_available: boolean;
                    }[];
                }[];
            }[];
        }[];
    }>;
    deleteModifierGroup(user: JwtUser, groupId: string): Promise<{
        success: boolean;
    }>;
    linkModifierGroupToItem(user: JwtUser, itemId: string, groupId: string): Promise<{
        success: boolean;
    }>;
    unlinkModifierGroupFromItem(user: JwtUser, itemId: string, groupId: string): Promise<{
        success: boolean;
    }>;
    getCategories(user: JwtUser): Promise<{
        id: string;
        name: string;
        slug: string;
        sort_order: number;
        item_count: number;
    }[]>;
    createCategory(user: JwtUser, dto: CreateCategoryDto): Promise<{
        id: string;
        vendor_id: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        name: string;
        slug: string;
        sort_order: number;
    }>;
    updateCategory(user: JwtUser, categoryId: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        vendor_id: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        name: string;
        slug: string;
        sort_order: number;
    }>;
    createModifierGroup(user: JwtUser, dto: CreateModifierGroupDto): Promise<{
        modifiers: {
            id: string;
            created_at: Date;
            name: string;
            sort_order: number;
            is_available: boolean;
            modifier_group_id: string;
            price_adjustment: number;
        }[];
    } & {
        id: string;
        vendor_id: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        name: string;
        is_required: boolean;
        min_selections: number;
        max_selections: number;
    }>;
    updateModifierGroup(user: JwtUser, groupId: string, dto: UpdateModifierGroupDto): Promise<{
        modifiers: {
            id: string;
            created_at: Date;
            name: string;
            sort_order: number;
            is_available: boolean;
            modifier_group_id: string;
            price_adjustment: number;
        }[];
    } & {
        id: string;
        vendor_id: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        name: string;
        is_required: boolean;
        min_selections: number;
        max_selections: number;
    }>;
    addModifier(user: JwtUser, groupId: string, dto: CreateModifierDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        sort_order: number;
        is_available: boolean;
        modifier_group_id: string;
        price_adjustment: number;
    }>;
    removeModifier(user: JwtUser, groupId: string, modifierId: string): Promise<{
        success: boolean;
    }>;
    getSettings(user: JwtUser): Promise<{
        id: string;
        name: string;
        slug: string;
        cuisine_type: string;
        booth_number: number;
        booth_color: string;
        logo_url: string | null;
        avg_prep_time_minutes: number;
        is_accepting_orders: boolean;
        operating_hours: import("@prisma/client/runtime/library").JsonValue;
        notification_preferences: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateSettings(user: JwtUser, dto: UpdateVendorSettingsDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        slug: string;
        booth_number: number;
        cuisine_type: string;
        booth_color: string;
        logo_url: string | null;
        avg_prep_time_minutes: number;
        status: import(".prisma/client").$Enums.VendorStatus;
        is_accepting_orders: boolean;
        operating_hours: import("@prisma/client/runtime/library").JsonValue | null;
        notification_prefs: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateStatus(user: JwtUser, dto: UpdateVendorStatusDto): Promise<{
        id: string;
        is_accepting_orders: boolean;
        status: import(".prisma/client").$Enums.VendorStatus;
    }>;
    private requireVendor;
    private assertItemOwnership;
}
