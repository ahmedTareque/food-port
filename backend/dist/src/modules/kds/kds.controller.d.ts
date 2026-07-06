import { KdsService } from './kds.service';
import { RejectItemDto } from './dto/reject-item.dto';
import { JwtUser } from '../../common/decorators/current-user.decorator';
export declare class KdsController {
    private kdsService;
    constructor(kdsService: KdsService);
    getOrders(user: JwtUser): Promise<{
        vendor_id: string;
        new: {
            order_item_id: string;
            order_id: string;
            token_number: number;
            table_number: number;
            item_name: string;
            quantity: number;
            modifiers: {
                name: string;
                type: string;
                price: number;
            }[];
            special_instructions: string | null;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            estimated_prep_time_minutes: number;
            accepted_at: string | undefined;
            preparing_at: string | undefined;
            created_at: string;
        }[];
        preparing: {
            order_item_id: string;
            order_id: string;
            token_number: number;
            table_number: number;
            item_name: string;
            quantity: number;
            modifiers: {
                name: string;
                type: string;
                price: number;
            }[];
            special_instructions: string | null;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            estimated_prep_time_minutes: number;
            accepted_at: string | undefined;
            preparing_at: string | undefined;
            created_at: string;
        }[];
        ready: {
            order_item_id: string;
            order_id: string;
            token_number: number;
            table_number: number;
            item_name: string;
            quantity: number;
            modifiers: {
                name: string;
                type: string;
                price: number;
            }[];
            special_instructions: string | null;
            status: import(".prisma/client").$Enums.OrderItemStatus;
            estimated_prep_time_minutes: number;
            accepted_at: string | undefined;
            preparing_at: string | undefined;
            created_at: string;
        }[];
    }>;
    accept(itemId: string, user: JwtUser): Promise<{
        order_item_id: string;
        order_id: string;
        token_number: number;
        table_number: number;
        item_name: string;
        quantity: number;
        modifiers: {
            name: string;
            type: string;
            price: number;
        }[];
        special_instructions: string | null;
        status: import(".prisma/client").$Enums.OrderItemStatus;
        estimated_prep_time_minutes: number;
        accepted_at: string | undefined;
        preparing_at: string | undefined;
        created_at: string;
    }>;
    preparing(itemId: string, user: JwtUser): Promise<{
        order_item_id: string;
        order_id: string;
        token_number: number;
        table_number: number;
        item_name: string;
        quantity: number;
        modifiers: {
            name: string;
            type: string;
            price: number;
        }[];
        special_instructions: string | null;
        status: import(".prisma/client").$Enums.OrderItemStatus;
        estimated_prep_time_minutes: number;
        accepted_at: string | undefined;
        preparing_at: string | undefined;
        created_at: string;
    }>;
    ready(itemId: string, user: JwtUser): Promise<{
        order_item_id: string;
        order_id: string;
        token_number: number;
        table_number: number;
        item_name: string;
        quantity: number;
        modifiers: {
            name: string;
            type: string;
            price: number;
        }[];
        special_instructions: string | null;
        status: import(".prisma/client").$Enums.OrderItemStatus;
        estimated_prep_time_minutes: number;
        accepted_at: string | undefined;
        preparing_at: string | undefined;
        created_at: string;
    }>;
    complete(itemId: string, user: JwtUser): Promise<{
        order_item_id: string;
        order_id: string;
        token_number: number;
        table_number: number;
        item_name: string;
        quantity: number;
        modifiers: {
            name: string;
            type: string;
            price: number;
        }[];
        special_instructions: string | null;
        status: import(".prisma/client").$Enums.OrderItemStatus;
        estimated_prep_time_minutes: number;
        accepted_at: string | undefined;
        preparing_at: string | undefined;
        created_at: string;
    }>;
    reject(itemId: string, dto: RejectItemDto, user: JwtUser): Promise<{
        order_item_id: string;
        order_id: string;
        token_number: number;
        table_number: number;
        item_name: string;
        quantity: number;
        modifiers: {
            name: string;
            type: string;
            price: number;
        }[];
        special_instructions: string | null;
        status: import(".prisma/client").$Enums.OrderItemStatus;
        estimated_prep_time_minutes: number;
        accepted_at: string | undefined;
        preparing_at: string | undefined;
        created_at: string;
    }>;
    queueStats(user: JwtUser): Promise<{
        vendor_id: string;
        queue_depth: number;
        avg_wait_minutes: number;
        oldest_pending_minutes: number;
    }>;
}
