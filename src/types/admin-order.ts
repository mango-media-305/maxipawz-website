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

export type AdminOrderAction =
    | 'save-fulfillment'
    | 'resend-shipping-email'
    | 'mark-delivered';

export interface AdminSaveFulfillmentRequest {
    action:
    'save-fulfillment';

    sessionId: string;

    carrier:
    OrderCarrier;

    service?: string;

    trackingNumber: string;

    trackingUrl?: string;

    postageAmount: number;

    /**
     * True only when initially marking an order shipped.
     *
     * Editing an existing shipment sends false so customer
     * communication remains a separate, deliberate action.
     */
    sendEmail: boolean;
}

export interface AdminResendShippingEmailRequest {
    action:
    'resend-shipping-email';

    sessionId: string;
}

export interface AdminMarkDeliveredRequest {
    action:
    'mark-delivered';

    sessionId: string;
}

export type AdminFulfillOrderRequest =
    | AdminSaveFulfillmentRequest
    | AdminResendShippingEmailRequest
    | AdminMarkDeliveredRequest;

export type AdminEmailStatus =
    | 'sent'
    | 'skipped'
    | 'failed';

export interface AdminFulfillOrderSuccessResponse {
    ok: true;

    action:
    AdminOrderAction;

    order:
    AdminOrder;

    emailStatus:
    AdminEmailStatus;

    message: string;
}

export interface AdminFulfillOrderErrorResponse {
    ok: false;

    message: string;
}

export type AdminFulfillOrderResponse =
    | AdminFulfillOrderSuccessResponse
    | AdminFulfillOrderErrorResponse;