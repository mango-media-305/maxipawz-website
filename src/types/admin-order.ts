import type {
    OrderCarrier,
    OrderCustomer,
    OrderFulfillment,
    OrderFulfillmentStatus,
    OrderItem,
    OrderPaymentStatus,
    OrderShippingAddress,
    OrderStatus,
} from './order';

export interface AdminOrder {
    sessionId: string;

    reference: string;

    paymentStatus:
    OrderPaymentStatus;

    orderStatus:
    OrderStatus;

    fulfillmentStatus:
    OrderFulfillmentStatus;

    customer?:
    OrderCustomer;

    shippingAddress?:
    OrderShippingAddress;

    fulfillment?:
    OrderFulfillment;

    currency: string;

    amountSubtotal: number;

    amountShipping: number;

    amountTax: number;

    amountDiscount: number;

    amountTotal: number;

    items:
    OrderItem[];

    createdAt: string;

    updatedAt: string;
}

export interface AdminOrdersSuccessResponse {
    ok: true;

    orders:
    AdminOrder[];
}

export interface AdminOrdersErrorResponse {
    ok: false;

    message: string;
}

export type AdminOrdersResponse =
    | AdminOrdersSuccessResponse
    | AdminOrdersErrorResponse;

export interface AdminFulfillOrderRequest {
    sessionId: string;

    carrier:
    OrderCarrier;

    service?: string;

    trackingNumber: string;

    trackingUrl?: string;

    postageAmount: number;
}

export interface AdminFulfillOrderSuccessResponse {
    ok: true;

    order:
    AdminOrder;

    emailStatus:
    | 'sent'
    | 'skipped'
    | 'failed';
}

export interface AdminFulfillOrderErrorResponse {
    ok: false;

    message: string;
}

export type AdminFulfillOrderResponse =
    | AdminFulfillOrderSuccessResponse
    | AdminFulfillOrderErrorResponse;