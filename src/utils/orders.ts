import { getStore } from '@netlify/blobs';

import type Stripe from 'stripe';

import { products } from '../data/products';

import type {
  OrderCartSource,
  OrderItem,
  OrderPaymentStatus,
  OrderRecord,
  OrderStatus,
  OrderStatusSuccessResponse,
  ProcessedStripeEvent,
  SupportedCheckoutEventType,
} from '../types/order';

import type { Product, ProductVariant } from '../types/product';

const MAXIMUM_PROCESSED_EVENT_IDS = 100;
const MAXIMUM_WRITE_ATTEMPTS = 5;

interface CatalogSelection {
  product: Product;
  variant?: ProductVariant;
}

interface BuildOrderRecordOptions {
  session: Stripe.Checkout.Session;
  lineItems: Stripe.LineItem[];

  eventId: string;
  eventType: SupportedCheckoutEventType;
  eventCreated: number;
}

function getEnvironmentSuffix(livemode: boolean): 'live' | 'test' {
  return livemode ? 'live' : 'test';
}

function getOrderStore(livemode: boolean) {
  return getStore(`maxipawz-orders-${getEnvironmentSuffix(livemode)}`, {
    consistency: 'strong',
  });
}

function getEventStore(livemode: boolean) {
  return getStore(`maxipawz-stripe-events-${getEnvironmentSuffix(livemode)}`, {
    consistency: 'strong',
  });
}

function getOrderKey(sessionId: string): string {
  return `session/${sessionId}`;
}

function getEventKey(eventId: string): string {
  return `event/${eventId}`;
}

function getSessionLivemode(sessionId: string): boolean {
  return sessionId.startsWith('cs_live_');
}

function normalizeStripeId(
  value:
    | string
    | {
        id: string;
      }
    | null,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return typeof value === 'string' ? value : value.id;
}

function getStripeProductMetadata(price?: Stripe.Price | null): {
  id?: string;
  name?: string;
  metadata: Record<string, string>;
} {
  const productReference = price?.product;

  if (!productReference) {
    return {
      metadata: {},
    };
  }

  if (typeof productReference === 'string') {
    return {
      id: productReference,
      metadata: {},
    };
  }

  if ('deleted' in productReference && productReference.deleted) {
    return {
      id: productReference.id,
      metadata: {},
    };
  }

  return {
    id: productReference.id,
    name: productReference.name,
    metadata: productReference.metadata,
  };
}

function findCatalogSelection(stripePriceId?: string): CatalogSelection | undefined {
  if (!stripePriceId) {
    return undefined;
  }

  for (const product of products) {
    if (product.stripeDefaultPriceId === stripePriceId) {
      return {
        product,
      };
    }

    const variant = product.variants?.find(
      (productVariant) => productVariant.stripePriceId === stripePriceId,
    );

    if (variant) {
      return {
        product,
        variant,
      };
    }
  }

  return undefined;
}

function buildOrderItem(lineItem: Stripe.LineItem): OrderItem {
  const price = lineItem.price ?? undefined;

  const stripePriceId = price?.id;

  const catalogSelection = findCatalogSelection(stripePriceId);

  const stripeProduct = getStripeProductMetadata(price);

  const priceMetadata = price?.metadata ?? {};

  const quantity = lineItem.quantity ?? 1;

  const calculatedUnitAmount =
    quantity > 0 ? Math.round(lineItem.amount_subtotal / quantity) : lineItem.amount_subtotal;

  const productSlug =
    catalogSelection?.product.slug ??
    priceMetadata.catalog_slug ??
    stripeProduct.metadata.catalog_slug ??
    `stripe-product-${stripeProduct.id ?? stripePriceId ?? 'unknown'}`;

  const variantId =
    catalogSelection?.variant?.id ??
    priceMetadata.variant_id ??
    stripeProduct.metadata.variant_id ??
    undefined;

  const productName =
    catalogSelection?.product.name ??
    stripeProduct.name ??
    lineItem.description ??
    'Stripe product';

  const variantLabel = catalogSelection?.variant?.label ?? priceMetadata.variant_label ?? undefined;

  return {
    productSlug,
    variantId,

    productName,
    variantLabel,

    stripePriceId,

    stripeProductId: stripeProduct.id,

    quantity,

    unitAmount: price?.unit_amount ?? calculatedUnitAmount,

    lineTotalAmount: lineItem.amount_total,

    currency: lineItem.currency,
  };
}

function getPaymentStatus(
  session: Stripe.Checkout.Session,
  eventType: SupportedCheckoutEventType,
): OrderPaymentStatus {
  if (eventType === 'checkout.session.async_payment_failed') {
    return 'failed';
  }

  if (eventType === 'checkout.session.async_payment_succeeded') {
    return 'paid';
  }

  if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
    return 'paid';
  }

  return 'processing';
}

function getOrderStatus(paymentStatus: OrderPaymentStatus): OrderStatus {
  if (paymentStatus === 'paid') {
    return 'confirmed';
  }

  if (paymentStatus === 'failed') {
    return 'payment-failed';
  }

  return 'pending';
}

function getCheckoutMode(session: Stripe.Checkout.Session): OrderCheckoutMode {
  return session.metadata?.checkout_mode === 'live' ? 'live' : 'test';
}

function getCartSource(session: Stripe.Checkout.Session): OrderCartSource {
  const source = session.metadata?.cart_source;

  if (source === 'storefront-cart' || source === 'stripe-fixture-script') {
    return source;
  }

  return 'unknown';
}

function getIsoDate(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString();
}

function getPaymentPriority(status: OrderPaymentStatus): number {
  switch (status) {
    case 'paid':
      return 3;

    case 'failed':
      return 2;

    default:
      return 1;
  }
}

function mergeProcessedEventIds(existingIds: string[], incomingIds: string[]): string[] {
  return Array.from(new Set([...existingIds, ...incomingIds])).slice(-MAXIMUM_PROCESSED_EVENT_IDS);
}

function mergeOrderRecords(existing: OrderRecord, incoming: OrderRecord): OrderRecord {
  const processedEventIds = mergeProcessedEventIds(
    existing.processedEventIds,
    incoming.processedEventIds,
  );

  const existingPriority = getPaymentPriority(existing.paymentStatus);

  const incomingPriority = getPaymentPriority(incoming.paymentStatus);

  const shouldUseIncoming =
    incomingPriority > existingPriority ||
    (incomingPriority === existingPriority &&
      incoming.lastEventCreated >= existing.lastEventCreated);

  if (!shouldUseIncoming) {
    return {
      ...existing,

      processedEventIds,

      updatedAt: incoming.updatedAt,
    };
  }

  return {
    ...incoming,

    createdAt: existing.createdAt,

    processedEventIds,
  };
}

function isIncomingEventSaved(saved: OrderRecord, incoming: OrderRecord): boolean {
  const eventId = incoming.processedEventIds[0];

  if (!eventId || !saved.processedEventIds.includes(eventId)) {
    return false;
  }

  return getPaymentPriority(saved.paymentStatus) >= getPaymentPriority(incoming.paymentStatus);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function buildOrderRecord(options: BuildOrderRecordOptions): OrderRecord {
  const { session, lineItems, eventId, eventType, eventCreated } = options;

  const paymentStatus = getPaymentStatus(session, eventType);

  const eventDate = getIsoDate(eventCreated);

  return {
    version: 1,

    sessionId: session.id,

    cartReference: session.metadata?.cart_reference ?? session.client_reference_id ?? session.id,

    cartSource: getCartSource(session),

    checkoutMode: getCheckoutMode(session),

    livemode: session.livemode,

    paymentIntentId: normalizeStripeId(session.payment_intent),

    paymentStatus,

    orderStatus: getOrderStatus(paymentStatus),

    stripeSessionStatus: session.status ?? undefined,

    currency: session.currency ?? lineItems[0]?.currency ?? 'usd',

    amountSubtotal: session.amount_subtotal ?? 0,

    amountTotal: session.amount_total ?? 0,

    amountTax: session.total_details?.amount_tax ?? 0,

    amountShipping: session.total_details?.amount_shipping ?? 0,

    amountDiscount: session.total_details?.amount_discount ?? 0,

    items: lineItems.map(buildOrderItem),

    processedEventIds: [eventId],

    lastEventType: eventType,

    lastEventCreated: eventCreated,

    createdAt: getIsoDate(session.created),

    updatedAt: eventDate,
  };
}

export async function getOrderBySessionId(sessionId: string): Promise<OrderRecord | null> {
  const store = getOrderStore(getSessionLivemode(sessionId));

  return (await store.get(getOrderKey(sessionId), {
    type: 'json',
  })) as OrderRecord | null;
}

export async function hasProcessedStripeEvent(
  eventId: string,
  livemode: boolean,
): Promise<boolean> {
  const store = getEventStore(livemode);

  const value = await store.get(getEventKey(eventId));

  return value !== null;
}

export async function saveOrderRecord(incoming: OrderRecord): Promise<OrderRecord> {
  const store = getOrderStore(incoming.livemode);

  const key = getOrderKey(incoming.sessionId);

  for (let attempt = 0; attempt < MAXIMUM_WRITE_ATTEMPTS; attempt += 1) {
    const existing = (await store.get(key, {
      type: 'json',
    })) as OrderRecord | null;

    if (
      existing &&
      incoming.processedEventIds.some((eventId) => existing.processedEventIds.includes(eventId))
    ) {
      return existing;
    }

    const nextRecord = existing ? mergeOrderRecords(existing, incoming) : incoming;

    await store.setJSON(key, nextRecord);

    const confirmed = (await store.get(key, {
      type: 'json',
    })) as OrderRecord | null;

    if (confirmed && isIncomingEventSaved(confirmed, incoming)) {
      return confirmed;
    }

    await delay(25 * (attempt + 1));
  }

  throw new Error('The order record could not be saved after multiple attempts.');
}

export async function recordProcessedStripeEvent(event: ProcessedStripeEvent): Promise<void> {
  const store = getEventStore(event.livemode);

  await store.setJSON(getEventKey(event.eventId), event);
}

export function toPublicOrderStatus(order: OrderRecord): OrderStatusSuccessResponse {
  let status: 'processing' | 'confirmed' | 'failed';

  if (order.orderStatus === 'confirmed') {
    status = 'confirmed';
  } else if (order.orderStatus === 'payment-failed') {
    status = 'failed';
  } else {
    status = 'processing';
  }

  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

  return {
    ok: true,

    sessionId: order.sessionId,

    status,

    paymentStatus: order.paymentStatus,

    orderStatus: order.orderStatus,

    livemode: order.livemode,

    currency: order.currency,

    amountTotal: order.amountTotal,

    itemCount,

    clearCart: status === 'confirmed' && order.cartSource === 'storefront-cart',

    updatedAt: order.updatedAt,
  };
}
