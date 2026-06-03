import { Response } from 'express';
import { AdminService } from './admin.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { CreateVendorDto, UpdateVendorDto, VendorStatusDto, UpdateOrderStatusDto, CancelOrderDto, CreatePromotionDto, UpdatePromotionDto, ValidatePromoDto, CashLogDto } from './dto/admin.dto';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getOverview(): Promise<{
        orders_today: number;
        revenue_today: number;
        orders_this_week: number;
        revenue_this_week: number;
        active_vendors: number;
        avg_prep_time: number;
    }>;
    getLiveOrders(): Promise<{
        order_item_id: string;
        order_id: string;
        token_number: number;
        table_number: string;
        vendor_name: string;
        booth_color: string;
        item_name: string;
        quantity: number;
        status: import(".prisma/client").$Enums.OrderItemStatus;
        created_at: Date;
    }[]>;
    getRevenue(from?: string, to?: string, interval?: 'day' | 'hour'): Promise<{
        revenue: number;
        order_count: number;
        date: string;
    }[]>;
    getVendorAnalytics(from?: string, to?: string): Promise<{
        vendor_id: string;
        vendor_name: string;
        booth_color: string;
        order_count: number;
        revenue: number;
        avg_prep_time: number;
    }[]>;
    getPeakHours(from?: string, to?: string): Promise<{
        day_of_week: number;
        hour: number;
        count: number;
    }[]>;
    getTopItems(from?: string, to?: string, vendorId?: string, limit?: string): Promise<{
        count: number;
        revenue: number;
        vendor_name: string;
        item_name: string;
    }[]>;
    getPrepTimes(from?: string, to?: string, vendorId?: string): Promise<{
        vendor_id: string;
        vendor_name: string;
        avg_prep_time: number;
        p50: number;
        p90: number;
        sample_count: number;
    }[]>;
    getByCuisine(from?: string, to?: string): Promise<{
        order_count: number;
        revenue: number;
        cuisine_type: string;
    }[]>;
    exportOrders(from: string | undefined, to: string | undefined, res: Response): Promise<void>;
    getOrders(from?: string, to?: string, status?: string, vendorId?: string, page?: string, limit?: string): Promise<{
        orders: {
            id: string;
            token_number: number;
            table_number: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            subtotal: number;
            tax: number;
            total: number;
            item_count: number;
            items: {
                id: string;
                vendor: {
                    name: string;
                    booth_color: string;
                };
                status: import(".prisma/client").$Enums.OrderItemStatus;
                item_name: string;
                quantity: number;
                total_price: number;
            }[];
            created_at: Date;
        }[];
        total: number;
        page: number;
        pages: number;
    }>;
    getOrder(id: string): Promise<{
        table: {
            table_number: number;
        };
        promotions: ({
            promotion: {
                id: string;
                vendor_id: string | null;
                is_active: boolean;
                created_at: Date;
                updated_at: Date;
                type: string;
                code: string;
                value: number;
                min_order_amount: number | null;
                max_uses: number | null;
                current_uses: number;
                valid_from: Date;
                valid_to: Date;
            };
        } & {
            id: string;
            created_at: Date;
            order_id: string;
            promotion_id: string;
            discount_amount: number;
        })[];
        items: ({
            vendor: {
                id: string;
                name: string;
                booth_color: string;
            };
            modifiers: {
                id: string;
                quantity: number;
                order_item_id: string;
                modifier_id: string;
                modifier_name: string;
                price_at_order: number;
            }[];
        } & {
            id: string;
            vendor_id: string;
            created_at: Date;
            updated_at: Date;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            menu_item_id: string;
            order_id: string;
            item_name: string;
            quantity: number;
            unit_price: number;
            modifier_price: number;
            total_price: number;
            special_instructions: string | null;
            estimated_prep_time: number;
            accepted_at: Date | null;
            preparing_at: Date | null;
            ready_at: Date | null;
            completed_at: Date | null;
            rejected_at: Date | null;
            reject_reason: string | null;
        })[];
        history: {
            id: string;
            created_at: Date;
            order_id: string;
            from_status: import(".prisma/client").$Enums.OrderStatus | null;
            to_status: import(".prisma/client").$Enums.OrderStatus;
            reason: string | null;
            actor_id: string | null;
        }[];
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        table_id: string;
        waiter_id: string | null;
        idempotency_key: string;
        token_number: number;
        token_date: string;
        session_id: string | null;
        payment_method: string;
        payment_status: string;
        subtotal: number;
        tax_amount: number;
        total: number;
    }>;
    updateOrderStatus(user: JwtUser, id: string, dto: UpdateOrderStatusDto): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        table_id: string;
        waiter_id: string | null;
        idempotency_key: string;
        token_number: number;
        token_date: string;
        session_id: string | null;
        payment_method: string;
        payment_status: string;
        subtotal: number;
        tax_amount: number;
        total: number;
    }>;
    cancelOrder(user: JwtUser, id: string, dto: CancelOrderDto): Promise<{
        id: string;
        status: string;
    }>;
    getVendors(status?: string, page?: string, limit?: string): Promise<{
        id: string;
        name: string;
        cuisine_type: string;
        booth_number: number;
        booth_color: string;
        status: import(".prisma/client").$Enums.VendorStatus;
        is_accepting_orders: boolean;
        staff_count: number;
        revenue_today: number;
        order_count_today: number;
    }[]>;
    createVendor(user: JwtUser, dto: CreateVendorDto): Promise<{
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
    updateVendor(user: JwtUser, id: string, dto: UpdateVendorDto): Promise<{
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
    setVendorStatus(user: JwtUser, id: string, dto: VendorStatusDto): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.VendorStatus;
    }>;
    deleteVendor(user: JwtUser, id: string): Promise<{
        success: boolean;
    }>;
    getVendorStaff(id: string): Promise<{
        users: {
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            full_name: string;
            is_active: boolean;
            created_at: Date;
        }[];
        pins: {
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            is_active: boolean;
            label: string;
        }[];
    }>;
    removeStaff(user: JwtUser, vendorId: string, userId: string): Promise<{
        success: boolean;
    }>;
    getDailySummary(from?: string, to?: string): Promise<{
        total_orders: number;
        gross_revenue: number;
        tax_collected: number;
        net_revenue: number;
        date: string;
    }[]>;
    getRevenueByVendor(from?: string, to?: string): Promise<{
        vendor_id: string;
        vendor_name: string;
        orders: number;
        revenue: number;
        tax: number;
        net: number;
    }[]>;
    getCashLog(date?: string, page?: string, limit?: string): Promise<{
        logs: {
            id: string;
            order_id: string;
            token_number: number;
            amount: number;
            collected_by: string;
            notes: string | null;
            created_at: Date;
        }[];
        total: number;
        page: number;
        pages: number;
    }>;
    createCashLog(user: JwtUser, dto: CashLogDto): Promise<{
        id: string;
        created_at: Date;
        order_id: string;
        amount: number;
        collected_by: string;
        notes: string | null;
    }>;
    exportFinance(from: string | undefined, to: string | undefined, res: Response): Promise<void>;
    getPromotions(active?: string, page?: string, limit?: string): Promise<{
        promotions: {
            id: string;
            vendor_id: string | null;
            is_active: boolean;
            created_at: Date;
            updated_at: Date;
            type: string;
            code: string;
            value: number;
            min_order_amount: number | null;
            max_uses: number | null;
            current_uses: number;
            valid_from: Date;
            valid_to: Date;
        }[];
        total: number;
        page: number;
        pages: number;
    }>;
    createPromotion(user: JwtUser, dto: CreatePromotionDto): Promise<{
        id: string;
        vendor_id: string | null;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        type: string;
        code: string;
        value: number;
        min_order_amount: number | null;
        max_uses: number | null;
        current_uses: number;
        valid_from: Date;
        valid_to: Date;
    }>;
    updatePromotion(user: JwtUser, id: string, dto: UpdatePromotionDto): Promise<{
        id: string;
        vendor_id: string | null;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        type: string;
        code: string;
        value: number;
        min_order_amount: number | null;
        max_uses: number | null;
        current_uses: number;
        valid_from: Date;
        valid_to: Date;
    }>;
    togglePromotion(user: JwtUser, id: string): Promise<{
        id: string;
        is_active: boolean;
    }>;
    deletePromotion(user: JwtUser, id: string): Promise<{
        success: boolean;
    }>;
    getPromotionStats(id: string): Promise<{
        uses: number;
        total_discount: number;
        orders: {
            order_id: string;
            token_number: number;
            discount: number;
            order_total: number;
            date: Date;
        }[];
    }>;
    getAuditLog(from?: string, to?: string, actorId?: string, action?: string, page?: string, limit?: string): Promise<{
        logs: {
            id: string;
            created_at: Date;
            actor_id: string | null;
            action: string;
            actor_name: string;
            actor_role: string;
            entity_type: string;
            entity_id: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue;
        }[];
        total: number;
        page: number;
        pages: number;
    }>;
}
export declare class HealthController {
    private adminService;
    constructor(adminService: AdminService);
    getHealth(): Promise<{
        status: string;
        db: string;
        timestamp: string;
    }>;
}
export declare class PromotionsPublicController {
    private adminService;
    constructor(adminService: AdminService);
    validatePromo(dto: ValidatePromoDto): Promise<{
        valid: boolean;
        reason: string;
        discount_amount?: undefined;
        promotion?: undefined;
    } | {
        valid: boolean;
        discount_amount: number;
        promotion: {
            id: string;
            vendor_id: string | null;
            is_active: boolean;
            created_at: Date;
            updated_at: Date;
            type: string;
            code: string;
            value: number;
            min_order_amount: number | null;
            max_uses: number | null;
            current_uses: number;
            valid_from: Date;
            valid_to: Date;
        };
        reason?: undefined;
    }>;
}
