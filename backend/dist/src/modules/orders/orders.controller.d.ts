import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersController {
    private ordersService;
    constructor(ordersService: OrdersService);
    create(dto: CreateOrderDto): Promise<{
        id: string;
        token_number: number;
        table_id: string | null;
        session_id: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        payment_method: string;
        payment_status: string;
        subtotal: number;
        tax_amount: number;
        total: number;
        items: {
            id: string;
            vendor_id: string;
            vendor_name: string;
            vendor_color: string;
            menu_item_id: string;
            item_name: string;
            quantity: number;
            unit_price: number;
            modifier_price: number;
            total_price: number;
            modifiers: {
                name: string;
                price: number;
            }[];
            special_instructions: string | null;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            estimated_prep_time_minutes: number;
            accepted_at: string | undefined;
            preparing_at: string | undefined;
            ready_at: string | undefined;
            completed_at: string | undefined;
        }[];
        created_at: string;
        updated_at: string;
    }>;
    findOne(orderId: string): Promise<{
        id: string;
        token_number: number;
        table_id: string | null;
        session_id: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        payment_method: string;
        payment_status: string;
        subtotal: number;
        tax_amount: number;
        total: number;
        items: {
            id: string;
            vendor_id: string;
            vendor_name: string;
            vendor_color: string;
            menu_item_id: string;
            item_name: string;
            quantity: number;
            unit_price: number;
            modifier_price: number;
            total_price: number;
            modifiers: {
                name: string;
                price: number;
            }[];
            special_instructions: string | null;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            estimated_prep_time_minutes: number;
            accepted_at: string | undefined;
            preparing_at: string | undefined;
            ready_at: string | undefined;
            completed_at: string | undefined;
        }[];
        created_at: string;
        updated_at: string;
    }>;
    getStatus(orderId: string): Promise<{
        order_id: string;
        token_number: number;
        overall_status: import(".prisma/client").$Enums.OrderStatus;
        items: {
            id: string;
            vendor_name: string;
            vendor_color: string;
            item_name: string;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            estimated_prep_time_minutes: number;
        }[];
    }>;
    findByToken(token: string): Promise<{
        id: string;
        token_number: number;
        status: import(".prisma/client").$Enums.OrderStatus;
        created_at: Date;
    }>;
    cancel(orderId: string, body: {
        reason?: string;
    }): Promise<{
        id: string;
        token_number: number;
        table_id: string | null;
        session_id: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        payment_method: string;
        payment_status: string;
        subtotal: number;
        tax_amount: number;
        total: number;
        items: {
            id: string;
            vendor_id: string;
            vendor_name: string;
            vendor_color: string;
            menu_item_id: string;
            item_name: string;
            quantity: number;
            unit_price: number;
            modifier_price: number;
            total_price: number;
            modifiers: {
                name: string;
                price: number;
            }[];
            special_instructions: string | null;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            estimated_prep_time_minutes: number;
            accepted_at: string | undefined;
            preparing_at: string | undefined;
            ready_at: string | undefined;
            completed_at: string | undefined;
        }[];
        created_at: string;
        updated_at: string;
    }>;
    rate(orderId: string, rating: number, comment?: string): Promise<{
        id: string;
        created_at: Date;
        rating: number;
        order_id: string;
        vendor_id: string;
        comment: string | null;
    }>;
    getRating(orderId: string): Promise<{
        id: string;
        created_at: Date;
        rating: number;
        order_id: string;
        vendor_id: string;
        comment: string | null;
    } | null>;
}
