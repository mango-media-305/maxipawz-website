export type OrderPaymentStatus =
  | 'processing'
  | 'paid'
  | 'failed';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'payment-failed';

export type OrderFulfillmentStatus =
  | 'unfulfilled'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderCheckoutMode =
  | 'test'
  | 'live';

export type OrderCartSource =
  | 'storefront-cart'
  | 'stripe-fixture-script'
  | 'unknown';

export type SupportedCheckoutEventType =
  | 'checkout.session.completed'
  | 'checkout.session.async_payment_succeeded'
  | 'checkout.session.async_payment_failed';

export type SupportedRefundEventType =
  | 'refund.created'
  | 'refund.updated'
  | 'refund.failed';

export type SupportedStripeEventType =
  | SupportedCheckoutEventType
  | SupportedRefundEventType;

export type OrderCarrier =
  | 'USPS'
  | 'UPS'
  | 'FedEx'
  | 'Other';

export type OrderRefundStatus =
  | 'none'
  | 'pending'
  | 'partially-refunded'
  | 'refunded'
  | 'failed'
  | 'canceled';

export type OrderRefundEntryStatus =
  | 'pending'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'unknown';

export type OrderReturnStatus =
  | 'none'
  | 'under-review'
  | 'awaiting-return'
  | 'rejected'
  | 'refund-pending'
  | 'refunded'
  | 'closed';

export type OrderReturnReason =
  | 'changed-mind'
  | 'damaged'
  | 'defective'
  | 'wrong-item'
  | 'missing-item'
  | 'not-as-described'
  | 'other';

export interface OrderItem {
  productSlug: string;

  variantId?: string;

  productName: string;

  variantLabel?: string;

  stripePriceId?: string;

  stripeProductId?: string;

  quantity: number;

  unitAmount: number;

  lineTotalAmount: number;

  currency: string;
}

export interface OrderCustomer {
  name?: string;

  email?: string;

  phone?: string;
}

export interface OrderShippingAddress {
  name?: string;

  line1?: string;

  line2?: string;

  city?: string;

  state?: string;

  postalCode?: string;

  country?: string;
}

export interface OrderFulfillment {
  carrier: OrderCarrier;

  service?: string;

  trackingNumber: string;

  trackingUrl?: string;

  /**
   * Actual postage MaxiPawz paid to ship the package.
   *
   * Stored in cents.
   */
  postageAmount: number;

  shippedAt: string;

  deliveredAt?: string;

  updatedAt: string;
}

export interface OrderRefundRecord {
  stripeRefundId: string;

  paymentIntentId: string;

  chargeId?: string;

  amount: number;

  currency: string;

  status:
  OrderRefundEntryStatus;

  reason?: string;

  failureReason?: string;

  pendingReason?: string;

  /**
   * ARN, STAN, RRN, or another bank/payment-method
   * tracing reference when Stripe makes one available.
   */
  reference?: string;

  referenceType?: string;

  referenceStatus?: string;

  receiptNumber?: string;

  createdAt: string;

  updatedAt: string;
}

export interface OrderReturnItem {
  productSlug: string;

  variantId?: string;

  productName: string;

  variantLabel?: string;

  quantity: number;
}

export interface OrderReturnRecord {
  returnId: string;

  status:
  OrderReturnStatus;

  reason:
  OrderReturnReason;

  items:
  OrderReturnItem[];

  /**
   * Expected refund associated with this return.
   *
   * Stored in cents. The actual financial refund is still
   * controlled and recorded by Stripe.
   */
  expectedRefundAmount: number;

  /**
   * Amount already refunded before this return was opened.
   *
   * This lets MaxiPawz determine whether a later Stripe
   * refund belongs to this return.
   */
  refundBaselineAmount: number;

  /**
   * The final day of the standard 30-day eligibility window.
   */
  returnWindowEndsAt: string;

  policyException: boolean;

  /**
   * Customer's original explanation or request.
   */
  customerMessage?: string;

  /**
   * Private MaxiPawz notes. Never included in customer email.
   */
  internalNotes?: string;

  /**
   * Customer-facing approval or rejection explanation.
   */
  decisionMessage?: string;

  /**
   * Optional return mailing deadline selected by MaxiPawz.
   *
   * Stored as YYYY-MM-DD.
   */
  returnDeadline?: string;

  /**
   * Internal condition or inspection notes.
   */
  conditionNotes?: string;

  requestedAt: string;

  approvedAt?: string;

  rejectedAt?: string;

  receivedAt?: string;

  refundedAt?: string;

  closedAt?: string;

  updatedAt: string;
}

export interface OrderRecord {
  version: 1;

  sessionId: string;

  cartReference: string;

  cartSource:
  OrderCartSource;

  checkoutMode:
  OrderCheckoutMode;

  livemode: boolean;

  paymentIntentId?: string;

  paymentStatus:
  OrderPaymentStatus;

  orderStatus:
  OrderStatus;

  fulfillmentStatus:
  OrderFulfillmentStatus;

  fulfillment?:
  OrderFulfillment;

  customer?:
  OrderCustomer;

  shippingAddress?:
  OrderShippingAddress;

  stripeSessionStatus?: string;

  currency: string;

  amountSubtotal: number;

  amountTotal: number;

  amountTax: number;

  /**
   * Shipping amount charged to the customer.
   *
   * This can be 0 when free shipping applies.
   */
  amountShipping: number;

  amountDiscount: number;

  refundStatus:
  OrderRefundStatus;

  amountRefunded: number;

  amountRefundPending: number;

  amountRefundable: number;

  refunds:
  OrderRefundRecord[];

  /**
   * Optional during migration so orders created before
   * Return Management v1 remain readable.
   */
  returnStatus?:
  OrderReturnStatus;

  activeReturnId?: string;

  returns?:
  OrderReturnRecord[];

  items:
  OrderItem[];

  processedEventIds:
  string[];

  lastEventType:
  SupportedStripeEventType;

  lastEventCreated: number;

  createdAt: string;

  updatedAt: string;
}

export interface ProcessedStripeEvent {
  version: 1;

  eventId: string;

  eventType:
  SupportedStripeEventType;

  sessionId: string;

  livemode: boolean;

  processedAt: string;
}

export type PublicOrderState =
  | 'processing'
  | 'confirmed'
  | 'failed';

export interface OrderStatusSuccessResponse {
  ok: true;

  sessionId: string;

  status:
  PublicOrderState;

  paymentStatus:
  OrderPaymentStatus;

  orderStatus:
  OrderStatus;

  fulfillmentStatus:
  OrderFulfillmentStatus;

  livemode: boolean;

  currency: string;

  amountTotal: number;

  itemCount: number;

  clearCart: boolean;

  updatedAt: string;
}

export interface OrderStatusErrorResponse {
  ok: false;

  status:
  | 'invalid-request'
  | 'not-found'
  | 'service-unavailable';

  message: string;
}

export type OrderStatusResponse =
  | OrderStatusSuccessResponse
  | OrderStatusErrorResponse;