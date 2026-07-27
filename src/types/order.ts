export type OrderPaymentStatus = 'processing' | 'paid' | 'failed';

export type OrderStatus = 'pending' | 'confirmed' | 'payment-failed';

export type OrderCheckoutMode = 'test' | 'live';

export type OrderCartSource = 'storefront-cart' | 'stripe-fixture-script' | 'unknown';

export type SupportedCheckoutEventType =
  | 'checkout.session.completed'
  | 'checkout.session.async_payment_succeeded'
  | 'checkout.session.async_payment_failed';

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

  stripeSessionStatus?: string;

  currency: string;

  amountSubtotal: number;
  amountTotal: number;
  amountTax: number;
  amountShipping: number;
  amountDiscount: number;

  items: OrderItem[];

  processedEventIds: string[];

  lastEventType: SupportedCheckoutEventType;
  lastEventCreated: number;

  createdAt: string;
  updatedAt: string;
}

export interface ProcessedStripeEvent {
  version: 1;

  eventId: string;
  eventType: SupportedCheckoutEventType;

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
