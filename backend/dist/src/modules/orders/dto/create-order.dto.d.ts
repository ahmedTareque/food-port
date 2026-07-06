export declare class CartModifierDto {
    modifier_id: string;
    quantity: number;
}
export declare class CartItemDto {
    menu_item_id: string;
    vendor_id: string;
    quantity: number;
    modifiers: CartModifierDto[];
    special_instructions?: string;
}
export declare class CreateOrderDto {
    session_id: string;
    table_id: string;
    waiter_id?: string;
    idempotency_key: string;
    items: CartItemDto[];
    special_notes?: string;
}
