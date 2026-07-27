import {
    getStore,
} from '@netlify/blobs';

import type Stripe from 'stripe';

import {
    products,
} from '../data/products';

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

import type {
    Product,
    ProductVariant,
} from '../types/product';

const ORDER_STORE_NAME =
    'maxipawz-orders';

const EVENT_STORE_NAME =
    'maxipawz-stripe-events';

const MAXIMUM_PROCESSED_EVENT_IDS = 100;
const MAXIMUM_WRITE_ATTEMPTS = 5;

interface StoredOrderEntry {
    data: OrderRecord;
    etag: string;
    metadata?: Record<string, unknown>;
}

interface CatalogSelection {
    product: Product;
    variant?: ProductVariant;
}

interface BuildOrderRecordOptions {
    session: Stripe.Checkout.Session;
    lineItems: Stripe.LineItem[];

    eventId: string;
    eventType:
    SupportedCheckoutEventType;

    eventCreated: number;
}

function getOrderStore() {
    return getStore({
        name: ORDER_STORE_NAME,
        consistency: 'strong',
    });
}

function getEventStore() {
    return getStore({
        name: EVENT_STORE_NAME,
        consistency: 'strong',
    });
}

function getOrderKey(
    sessionId: string,
): string {
    return `session/${sessionId}`;
}

function getEventKey(
    eventId: string,
): string {
    return `event/${eventId}`;
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

    return typeof value === 'string'
        ? value
        : value.id;
}

function getStripeProductMetadata(
    price?: Stripe.Price | null,
): {
    id?: string;
    name?: string;
    metadata: Record<string, string>;
} {
    const productReference =
        price?.product;

    if (!productReference) {
        return {
            metadata: {},
        };
    }

    if (
        typeof productReference === 'string'
    ) {
        return {
            id: productReference,
            metadata: {},
        };
    }

    const productId =
        productReference.id;

    if (
        'deleted' in productReference &&
        productReference.deleted
    ) {
        return {
            id: productId,
            metadata: {},
        };
    }

    return {
        id: productId,
        name: productReference.name,
        metadata:
            productReference.metadata,
    };
}

function findCatalogSelection(
    stripePriceId?: string,
): CatalogSelection | undefined {
    if (!stripePriceId) {
        return undefined;
    }

    for (const product of products) {
        if (
            product.stripeDefaultPriceId ===
            stripePriceId
        ) {
            return {
                product,
            };
        }

        const variant =
            product.variants?.find(
                (productVariant) =>
                    productVariant.stripePriceId ===
                    stripePriceId,
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

function buildOrderItem(
    lineItem: Stripe.LineItem,
): OrderItem {
    const price =
        lineItem.price ?? undefined;

    const stripePriceId =
        price?.id;

    const catalogSelection =
        findCatalogSelection(
            stripePriceId,
        );

    const stripeProduct =
        getStripeProductMetadata(price);

    const priceMetadata =
        price?.metadata ?? {};

    const quantity =
        lineItem.quantity ?? 1;

    const calculatedUnitAmount =
        quantity > 0
            ? Math.round(
                lineItem.amount_subtotal /
                quantity,
            )
            : lineItem.amount_subtotal;

    const productSlug =
        catalogSelection?.product.slug ??
        priceMetadata.catalog_slug ??
        stripeProduct.metadata
            .catalog_slug ??
        `stripe-product-${stripeProduct.id ??
        stripePriceId ??
        'unknown'
        }`;

    const variantId =
        catalogSelection?.variant?.id ??
        priceMetadata.variant_id ??
        stripeProduct.metadata
            .variant_id ??
        undefined;

    const productName =
        catalogSelection?.product.name ??
        stripeProduct.name ??
        lineItem.description ??
        'Stripe product';

    const variantLabel =
        catalogSelection?.variant?.label ??
        priceMetadata.variant_label ??
        undefined;

    return {
        productSlug,
        variantId,

        productName,
        variantLabel,

        stripePriceId,

        stripeProductId:
            stripeProduct.id,

        quantity,

        unitAmount:
            price?.unit_amount ??
            calculatedUnitAmount,

        lineTotalAmount:
            lineItem.amount_total,

        currency:
            lineItem.currency,
    };
}

function getPaymentStatus(
    session: Stripe.Checkout.Session,
    eventType:
        SupportedCheckoutEventType,
): OrderPaymentStatus {
    if (
        eventType ===
        'checkout.session.async_payment_failed'
    ) {
        return 'failed';
    }

    if (
        eventType ===
        'checkout.session.async_payment_succeeded'
    ) {
        return 'paid';
    }

    if (
        session.payment_status === 'paid' ||
        session.payment_status ===
        'no_payment_required'
    ) {
        return 'paid';
    }

    return 'processing';
}

function getOrderStatus(
    paymentStatus:
        OrderPaymentStatus,
): OrderStatus {
    if (paymentStatus === 'paid') {
        return 'confirmed';
    }

    if (paymentStatus === 'failed') {
        return 'payment-failed';
    }

    return 'pending';
}

function getCheckoutMode(
    session: Stripe.Checkout.Session,
): 'test' | 'live' {
    return session.metadata
        ?.checkout_mode === 'live'
        ? 'live'
        : 'test';
}

function getCartSource(
    session: Stripe.Checkout.Session,
): OrderCartSource {
    const source =
        session.metadata?.cart_source;

    if (
        source === 'storefront-cart' ||
        source ===
        'stripe-fixture-script'
    ) {
        return source;
    }

    return 'unknown';
}

function getIsoDate(
    unixTimestamp: number,
): string {
    return new Date(
        unixTimestamp * 1000,
    ).toISOString();
}

export function buildOrderRecord(
    options: BuildOrderRecordOptions,
): OrderRecord {
    const {
        session,
        lineItems,
        eventId,
        eventType,
        eventCreated,
    } = options;

    const paymentStatus =
        getPaymentStatus(
            session,
            eventType,
        );

    const eventDate =
        getIsoDate(eventCreated);

    return {
        version: 1,

        sessionId: session.id,

        cartReference:
            session.metadata
                ?.cart_reference ??
            session.client_reference_id ??
            session.id,

        cartSource:
            getCartSource(session),

        checkoutMode:
            getCheckoutMode(session),

        livemode:
            session.livemode,

        paymentIntentId:
            normalizeStripeId(
                session.payment_intent,
            ),

        paymentStatus,

        orderStatus:
            getOrderStatus(
                paymentStatus,
            ),

        stripeSessionStatus:
            session.status ?? undefined,

        currency:
            session.currency ??
            lineItems[0]?.currency ??
            'usd',

        amountSubtotal:
            session.amount_subtotal ?? 0,

        amountTotal:
            session.amount_total ?? 0,

        amountTax:
            session.total_details
                ?.amount_tax ?? 0,

        amountShipping:
            session.total_details
                ?.amount_shipping ?? 0,

        amountDiscount:
            session.total_details
                ?.amount_discount ?? 0,

        items:
            lineItems.map(
                buildOrderItem,
            ),

        processedEventIds: [
            eventId,
        ],

        lastEventType:
            eventType,

        lastEventCreated:
            eventCreated,

        createdAt:
            getIsoDate(session.created),

        updatedAt:
            eventDate,
    };
}

function mergeProcessedEventIds(
    existingIds: string[],
    incomingIds: string[],
): string[] {
    return Array.from(
        new Set([
            ...existingIds,
            ...incomingIds,
        ]),
    ).slice(
        -MAXIMUM_PROCESSED_EVENT_IDS,
    );
}

function shouldApplyIncomingRecord(
    existing: OrderRecord,
    incoming: OrderRecord,
): boolean {
    if (
        existing.paymentStatus ===
        'paid' &&
        incoming.paymentStatus !==
        'paid'
    ) {
        return false;
    }

    if (
        incoming.paymentStatus ===
        'paid' &&
        existing.paymentStatus !==
        'paid'
    ) {
        return true;
    }

    return (
        incoming.lastEventCreated >=
        existing.lastEventCreated
    );
}

function mergeOrderRecords(
    existing: OrderRecord,
    incoming: OrderRecord,
): OrderRecord {
    const processedEventIds =
        mergeProcessedEventIds(
            existing.processedEventIds,
            incoming.processedEventIds,
        );

    if (
        !shouldApplyIncomingRecord(
            existing,
            incoming,
        )
    ) {
        return {
            ...existing,

            processedEventIds,

            updatedAt:
                incoming.updatedAt,
        };
    }

    return {
        ...incoming,

        createdAt:
            existing.createdAt,

        processedEventIds,
    };
}

export async function getOrderBySessionId(
    sessionId: string,
): Promise<OrderRecord | null> {
    const store =
        getOrderStore();

    const value =
        await store.get(
            getOrderKey(sessionId),
            {
                type: 'json',
                consistency: 'strong',
            },
        );

    return value as
        | OrderRecord
        | null;
}

export async function hasProcessedStripeEvent(
    eventId: string,
): Promise<boolean> {
    const store =
        getEventStore();

    const value =
        await store.get(
            getEventKey(eventId),
            {
                consistency: 'strong',
            },
        );

    return value !== null;
}

export async function saveOrderRecord(
    incoming: OrderRecord,
): Promise<OrderRecord> {
    const store =
        getOrderStore();

    const key =
        getOrderKey(
            incoming.sessionId,
        );

    for (
        let attempt = 0;
        attempt <
        MAXIMUM_WRITE_ATTEMPTS;
        attempt += 1
    ) {
        const existingEntry =
            (await store.getWithMetadata(
                key,
                {
                    type: 'json',
                    consistency: 'strong',
                },
            )) as
            | StoredOrderEntry
            | null;

        if (!existingEntry) {
            const result =
                await store.setJSON(
                    key,
                    incoming,
                    {
                        onlyIfNew: true,

                        metadata: {
                            sessionId:
                                incoming.sessionId,

                            orderStatus:
                                incoming.orderStatus,
                        },
                    },
                );

            if (result.modified) {
                return incoming;
            }

            continue;
        }

        const existing =
            existingEntry.data;

        if (
            incoming.processedEventIds.some(
                (eventId) =>
                    existing.processedEventIds.includes(
                        eventId,
                    ),
            )
        ) {
            return existing;
        }

        const merged =
            mergeOrderRecords(
                existing,
                incoming,
            );

        const result =
            await store.setJSON(
                key,
                merged,
                {
                    onlyIfMatch:
                        existingEntry.etag,

                    metadata: {
                        sessionId:
                            merged.sessionId,

                        orderStatus:
                            merged.orderStatus,
                    },
                },
            );

        if (result.modified) {
            return merged;
        }
    }

    throw new Error(
        'The order record could not be updated after multiple attempts.',
    );
}

export async function recordProcessedStripeEvent(
    event: ProcessedStripeEvent,
): Promise<void> {
    const store =
        getEventStore();

    await store.setJSON(
        getEventKey(event.eventId),
        event,
        {
            onlyIfNew: true,

            metadata: {
                sessionId:
                    event.sessionId,

                eventType:
                    event.eventType,
            },
        },
    );
}

export function toPublicOrderStatus(
    order: OrderRecord,
): OrderStatusSuccessResponse {
    let status:
        | 'processing'
        | 'confirmed'
        | 'failed';

    if (
        order.orderStatus ===
        'confirmed'
    ) {
        status = 'confirmed';
    } else if (
        order.orderStatus ===
        'payment-failed'
    ) {
        status = 'failed';
    } else {
        status = 'processing';
    }

    const itemCount =
        order.items.reduce(
            (total, item) =>
                total + item.quantity,
            0,
        );

    return {
        ok: true,

        sessionId:
            order.sessionId,

        status,

        paymentStatus:
            order.paymentStatus,

        orderStatus:
            order.orderStatus,

        livemode:
            order.livemode,

        currency:
            order.currency,

        amountTotal:
            order.amountTotal,

        itemCount,

        clearCart:
            status === 'confirmed' &&
            order.cartSource ===
            'storefront-cart',

        updatedAt:
            order.updatedAt,
    };
}