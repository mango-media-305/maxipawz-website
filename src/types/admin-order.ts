import type {
    OrderCarrier,
    OrderCustomer,
    OrderFulfillment,
    OrderFulfillmentStatus,
    OrderItem,
    OrderPaymentStatus,
    OrderRefundRecord,
    OrderRefundStatus,
    OrderReturnReason,
    OrderReturnRecord,
    OrderReturnStatus,
    OrderShippingAddress,
    OrderStatus,
} from './order';

export interface AdminOrder {
    sessionId: string;

    reference: string;

    livemode: boolean;

    paymentIntentId?: string;

    paymentStatus:
    OrderPaymentStatus;

    orderStatus:
    OrderStatus;

    fulfillmentStatus:
    OrderFulfillmentStatus;

    refundStatus:
    OrderRefundStatus;

    amountRefunded: number;

    amountRefundPending: number;

    amountRefundable: number;

    refunds:
    OrderRefundRecord[];

    /**
     * Optional for compatibility with responses produced by
     * fulfillment functions until Dashboard Checkpoint B.
     */
    returnStatus?:
    OrderReturnStatus;

    activeReturnId?: string;

    returns?:
    OrderReturnRecord[];

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

export type AdminReturnAction =
    | 'start-return'
    | 'approve-return'
    | 'reject-return'
    | 'mark-return-received'
    | 'confirm-refund-synced'
    | 'close-return';

export interface AdminReturnItemInput {
    productSlug: string;

    variantId?: string;

    quantity: number;
}

export interface AdminStartReturnRequest {
    action:
    'start-return';

    sessionId: string;

    reason:
    OrderReturnReason;

    items:
    AdminReturnItemInput[];

    expectedRefundAmount: number;

    customerMessage?: string;

    internalNotes?: string;

    policyException: boolean;
}

export interface AdminApproveReturnRequest {
    action:
    'approve-return';

    sessionId: string;

    returnDeadline: string;

    decisionMessage: string;
}

export interface AdminRejectReturnRequest {
    action:
    'reject-return';

    sessionId: string;

    decisionMessage: string;
}

export interface AdminMarkReturnReceivedRequest {
    action:
    'mark-return-received';

    sessionId: string;

    conditionNotes?: string;
}

export interface AdminConfirmRefundSyncedRequest {
    action:
    'confirm-refund-synced';

    sessionId: string;
}

export interface AdminCloseReturnRequest {
    action:
    'close-return';

    sessionId: string;
}

export type AdminReturnOrderRequest =
    | AdminStartReturnRequest
    | AdminApproveReturnRequest
    | AdminRejectReturnRequest
    | AdminMarkReturnReceivedRequest
    | AdminConfirmRefundSyncedRequest
    | AdminCloseReturnRequest;

export interface AdminReturnOrderSuccessResponse {
    ok: true;

    action:
    AdminReturnAction;

    order:
    AdminOrder;

    returnRecord:
    OrderReturnRecord;

    emailStatus:
    AdminEmailStatus;

    message: string;
}

export interface AdminReturnOrderErrorResponse {
    ok: false;

    message: string;
}

export type AdminReturnOrderResponse =
    | AdminReturnOrderSuccessResponse
    | AdminReturnOrderErrorResponse;