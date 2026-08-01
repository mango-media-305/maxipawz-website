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

export type OrderCarrier =
  | 'USPS'
  | 'UPS'
  | 'FedEx'
  | 'Other';

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

  items: OrderItem[];

  processedEventIds: string[];

  lastEventType:
  SupportedCheckoutEventType;

  lastEventCreated: number;

  createdAt: string;

  updatedAt: string;
}

export interface ProcessedStripeEvent {
  version: 1;

  eventId: string;

  eventType:
  SupportedCheckoutEventType;

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

  status: PublicOrderState;

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