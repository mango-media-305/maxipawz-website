import { shippingConfig } from '../config/shipping';

import { products } from '../data/products';

import type {
    CheckoutErrorCode,
    CheckoutRequestLine,
    CheckoutSessionRequest,
} from '../types/checkout';

import type { InventoryReservationRequestLine } from '../types/inventory-reservation';

import type { Product, ProductPrice, ProductVariant, ProductWeight } from '../types/product';

import {
    getInventorySku,
    isInventoryTrackingEnabledForSelection,
} from '../utils/product-inventory';

const MAXIMUM_CART_LINES = 50;

const MAXIMUM_QUANTITY = 99;

export interface ValidatedCheckoutCart {
    lineItems: Array<{
        price: string;

        quantity: number;
    }>;

    inventoryLines: InventoryReservationRequestLine[];

    merchandiseSubtotalAmount: number;

    shippingWeightOz: number;
}

export class CheckoutValidationError extends Error {
    readonly status: number;

    readonly code: CheckoutErrorCode;

    constructor(status: number, code: CheckoutErrorCode, message: string) {
        super(message);

        this.name = 'CheckoutValidationError';

        this.status = status;

        this.code = code;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCheckoutLine(value: unknown): CheckoutRequestLine {
    if (!isRecord(value)) {
        throw new CheckoutValidationError(400, 'invalid-cart', 'A cart item has an invalid format.');
    }

    if (typeof value.productSlug !== 'string' || !value.productSlug.trim()) {
        throw new CheckoutValidationError(
            400,
            'invalid-cart',
            'A cart item is missing its product identifier.',
        );
    }

    const quantity = typeof value.quantity === 'number' ? value.quantity : Number.NaN;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAXIMUM_QUANTITY) {
        throw new CheckoutValidationError(
            400,
            'invalid-cart',
            `Cart quantities must be whole numbers between 1 and ${MAXIMUM_QUANTITY}.`,
        );
    }

    const variantId =
        typeof value.variantId === 'string' && value.variantId.trim()
            ? value.variantId.trim()
            : undefined;

    return {
        productSlug: value.productSlug.trim(),

        variantId,

        quantity,
    };
}

export function parseCheckoutRequest(value: unknown): CheckoutSessionRequest {
    if (!isRecord(value) || !Array.isArray(value.lines)) {
        throw new CheckoutValidationError(
            400,
            'invalid-request',
            'The checkout request is missing its cart lines.',
        );
    }

    if (value.lines.length === 0 || value.lines.length > MAXIMUM_CART_LINES) {
        throw new CheckoutValidationError(
            400,
            'invalid-cart',
            `The cart must contain between 1 and ${MAXIMUM_CART_LINES} lines.`,
        );
    }

    return {
        lines: value.lines.map(parseCheckoutLine),
    };
}

function getProduct(slug: string, allowDemoProducts: boolean): Product {
    const product = products.find((catalogProduct) => catalogProduct.slug === slug);

    if (!product || product.status !== 'active') {
        throw new CheckoutValidationError(
            400,
            'product-not-found',
            'One of the selected products is no longer available.',
        );
    }

    if (product.isDemo && !allowDemoProducts) {
        throw new CheckoutValidationError(
            400,
            'demo-product',
            'Demo products are disabled for Stripe Checkout.',
        );
    }

    return product;
}

function getVariant(product: Product, variantId?: string): ProductVariant | undefined {
    const hasVariants = Boolean(product.variants?.length);

    if (hasVariants && !variantId) {
        throw new CheckoutValidationError(
            400,
            'variant-required',
            `Select an option for ${product.name}.`,
        );
    }

    if (!hasVariants && variantId) {
        throw new CheckoutValidationError(
            400,
            'variant-not-found',
            `The selected option for ${product.name} is invalid.`,
        );
    }

    if (!variantId) {
        return undefined;
    }

    const variant = product.variants?.find((productVariant) => productVariant.id === variantId);

    if (!variant) {
        throw new CheckoutValidationError(
            400,
            'variant-not-found',
            `The selected option for ${product.name} is no longer available.`,
        );
    }

    return variant;
}

function getPrice(product: Product, variant?: ProductVariant): ProductPrice {
    const price = variant?.price ?? product.price;

    if (!price || price.amount < 0 || price.currency !== 'USD') {
        throw new CheckoutValidationError(
            400,
            'price-not-configured',
            `${product.name} does not have a valid USD catalog price.`,
        );
    }

    return price;
}

function weightToOunces(weight: ProductWeight): number {
    switch (weight.unit) {
        case 'oz':
            return weight.value;

        case 'lb':
            return weight.value * 16;

        case 'g':
            return weight.value / 28.349523125;

        case 'kg':
            return weight.value * 35.27396195;
    }
}

function getProductShippingWeightOz(product: Product): number {
    const weight = product.dimensions?.weight;

    if (weight && Number.isFinite(weight.value) && weight.value > 0) {
        return weightToOunces(weight);
    }

    if (product.isDemo) {
        return shippingConfig.demoFallbackItemWeightOz;
    }

    throw new CheckoutValidationError(
        400,
        'invalid-cart',
        `${product.name} does not have a shipping weight configured.`,
    );
}

export function validateCheckoutCart(
    request: CheckoutSessionRequest,

    allowDemoProducts: boolean,
): ValidatedCheckoutCart {
    const groupedLines = new Map<string, number>();

    const inventoryLines: InventoryReservationRequestLine[] = [];

    let merchandiseSubtotalAmount = 0;

    let productWeightOz = 0;

    request.lines.forEach((line) => {
        const product = getProduct(line.productSlug, allowDemoProducts);

        const variant = getVariant(product, line.variantId);

        const availability = variant?.availability ?? product.availability;

        if (availability !== 'in-stock') {
            throw new CheckoutValidationError(
                400,
                'product-unavailable',
                `${product.name} is not currently available for checkout.`,
            );
        }

        const inventoryTracked = isInventoryTrackingEnabledForSelection(product, variant);

        if (inventoryTracked) {
            const inventorySku = getInventorySku(product, variant);

            if (!inventorySku) {
                throw new CheckoutValidationError(
                    503,
                    'inventory-not-configured',
                    `${product.name} inventory is temporarily unavailable.`,
                );
            }

            inventoryLines.push({
                productSlug: product.slug,

                ...(variant
                    ? {
                        variantId: variant.id,
                    }
                    : {}),

                sku: inventorySku,

                quantity: line.quantity,
            });
        }

        const price = getPrice(product, variant);

        const stripePriceId = variant?.stripePriceId ?? product.stripeDefaultPriceId;

        if (!stripePriceId || !stripePriceId.startsWith('price_')) {
            throw new CheckoutValidationError(
                400,
                'price-not-configured',
                `${product.name} does not have a valid Stripe Sandbox Price ID.`,
            );
        }

        merchandiseSubtotalAmount += price.amount * line.quantity;

        productWeightOz += getProductShippingWeightOz(product) * line.quantity;

        const existingQuantity = groupedLines.get(stripePriceId) ?? 0;

        const nextQuantity = existingQuantity + line.quantity;

        if (nextQuantity > MAXIMUM_QUANTITY) {
            throw new CheckoutValidationError(
                400,
                'invalid-cart',
                `A product quantity cannot exceed ${MAXIMUM_QUANTITY}.`,
            );
        }

        groupedLines.set(stripePriceId, nextQuantity);
    });

    const shippingWeightOz = Math.ceil(productWeightOz + shippingConfig.packagingWeightOz);

    if (shippingWeightOz > shippingConfig.maximumAutomaticWeightOz) {
        throw new CheckoutValidationError(
            400,
            'invalid-cart',
            'This cart is too heavy for automatic standard-shipping estimation.',
        );
    }

    return {
        merchandiseSubtotalAmount,

        shippingWeightOz,

        inventoryLines,

        lineItems: Array.from(groupedLines.entries()).map(([price, quantity]) => ({
            price,

            quantity,
        })),
    };
}
