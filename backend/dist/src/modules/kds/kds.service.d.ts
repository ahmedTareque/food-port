import { PrismaService } from '../../database/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { RejectItemDto } from './dto/reject-item.dto';
import { OrderItemStatus } from '@prisma/client';
import { JwtUser } from '../../common/decorators/current-user.decorator';
export declare class KdsService {
    private prisma;
    private ordersService;
    constructor(prisma: PrismaService, ordersService: OrdersService);
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
    updateItemStatus(itemId: string, newStatus: OrderItemStatus, user: JwtUser, rejectDto?: RejectItemDto): Promise<{
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
    getQueueStats(user: JwtUser): Promise<{
        vendor_id: string;
        queue_depth: number;
        avg_prep_time_minutes: number;
        oldest_pending_minutes: number;
    }>;
    private formatCard;
}
