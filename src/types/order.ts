export type OrderPaymentStatus = 'processing' | 'paid' | 'failed';

export type OrderStatus = 'pending' | 'confirmed' | 'payment-failed';

export type OrderFulfillmentStatus =
  | 'unfulfilled'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderCheckoutMode = 'test' | 'live';

export type OrderCartSource = 'storefront-cart' | 'stripe-fixture-script' | 'unknown';

export type SupportedCheckoutEventType =
  | 'checkout.session.completed'
  | 'checkout.session.async_payment_succeeded'
  | 'checkout.session.async_payment_failed';

export type SupportedCheckoutExpirationEventType = 'checkout.session.expired';

export type SupportedRefundEventType = 'refund.created' | 'refund.updated' | 'refund.failed';

export type SupportedStripeEventType =
  | SupportedCheckoutEventType
  | SupportedCheckoutExpirationEventType
  | SupportedRefundEventType;

export type OrderCarrier = 'USPS' | 'UPS' | 'FedEx' | 'Other';

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
   * Actual postage Maxi Pawz paid to ship the package.
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

  status: OrderRefundEntryStatus;

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

export interface OrderRecord {
  version: 1;

  sessionId: string;

  cartReference: string;

  cartSource: OrderCartSource;

  checkoutMode: OrderCheckoutMode;

  livemode: boolean;

  paymentIntentId?: string;

  paymentStatus: OrderPaymentStatus;

  orderStatus: OrderStatus;

  fulfillmentStatus: OrderFulfillmentStatus;

  fulfillment?: OrderFulfillment;

  customer?: OrderCustomer;

  shippingAddress?: OrderShippingAddress;

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

  refundStatus: OrderRefundStatus;

  /**
   * Total amount from refunds whose Stripe status
   * is succeeded.
   */
  amountRefunded: number;

  /**
   * Total amount currently pending or requiring action.
   */
  amountRefundPending: number;

  /**
   * Amount not already succeeded, pending, or requiring
   * action in Stripe.
   */
  amountRefundable: number;

  refunds: OrderRefundRecord[];

  items: OrderItem[];

  processedEventIds: string[];

  lastEventType: SupportedStripeEventType;

  lastEventCreated: number;

  createdAt: string;

  updatedAt: string;
}

export interface ProcessedStripeEvent {
  version: 1;

  eventId: string;

  eventType: SupportedStripeEventType;

  sessionId: string;

  livemode: boolean;

  processedAt: string;
}

export type PublicOrderState = 'processing' | 'confirmed' | 'failed';

export interface OrderStatusSuccessResponse {
  ok: true;

  sessionId: string;

  status: PublicOrderState;

  paymentStatus: OrderPaymentStatus;

  orderStatus: OrderStatus;

  fulfillmentStatus: OrderFulfillmentStatus;

  livemode: boolean;

  currency: string;

  amountTotal: number;

  itemCount: number;

  clearCart: boolean;

  updatedAt: string;
}

export interface OrderStatusErrorResponse {
  ok: false;

  status: 'invalid-request' | 'not-found' | 'service-unavailable';

  message: string;
}

export type OrderStatusResponse = OrderStatusSuccessResponse | OrderStatusErrorResponse;
