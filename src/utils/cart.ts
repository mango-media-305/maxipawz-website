import { products } from '../data/products';

import type {
    CartLine,
    CartState,
    CartTotals,
    ResolvedCartLine,
} from '../types/cart';

import type {
    Product,
    ProductAvailability,
    ProductImage,
    ProductPrice,
    ProductVariant,
} from '../types/product';

import {
    getCartLineKey,
} from '../stores/cart';

function getProductFromCatalog(
    slug: string,
): Product | undefined {
    return products.find(
        (product) =>
            product.slug === slug,
    );
}

function getProductVariant(
    product: Product,
    variantId?: string,
): ProductVariant | undefined {
    if (!variantId) {
        return undefined;
    }

    return product.variants?.find(
        (variant) =>
            variant.id === variantId,
    );
}

function getEffectiveAvailability(
    product: Product,
    variant?: ProductVariant,
): ProductAvailability {
    return (
        variant?.availability ??
        product.availability
    );
}

function getEffectivePrice(
    product: Product,
    variant?: ProductVariant,
): ProductPrice | undefined {
    return (
        variant?.price ??
        product.price
    );
}

export function resolveCartLine(
    line: CartLine,
): ResolvedCartLine {
    const key = getCartLineKey(
        line.productSlug,
        line.variantId,
    );

    const product =
        getProductFromCatalog(
            line.productSlug,
        );

    if (!product) {
        return {
            key,
            line,
            available: false,
            lineTotalAmount: 0,
            compareAtLineTotalAmount: 0,

            issue:
                'This product is no longer available in the catalog.',
        };
    }

    const variant =
        getProductVariant(
            product,
            line.variantId,
        );

    const requiresVariant =
        Boolean(
            product.variants?.length,
        );

    if (
        requiresVariant &&
        !variant
    ) {
        return {
            key,
            line,
            product,

            image:
                product.images[0],

            available: false,
            lineTotalAmount: 0,
            compareAtLineTotalAmount: 0,

            issue:
                'The selected product option is no longer available.',
        };
    }

    const unitPrice =
        getEffectivePrice(
            product,
            variant,
        );

    const availability =
        getEffectiveAvailability(
            product,
            variant,
        );

    const available =
        product.status === 'active' &&
        availability === 'in-stock' &&
        Boolean(unitPrice);

    const lineTotalAmount =
        unitPrice
            ? unitPrice.amount *
            line.quantity
            : 0;

    const compareAtUnitPrice =
        product.compareAtPrice &&
            unitPrice &&
            product.compareAtPrice.amount >
            unitPrice.amount
            ? product.compareAtPrice
            : undefined;

    const compareAtLineTotalAmount =
        compareAtUnitPrice
            ? compareAtUnitPrice.amount *
            line.quantity
            : lineTotalAmount;

    let issue: string | undefined;

    if (
        product.status !== 'active'
    ) {
        issue =
            'This product is no longer active.';
    } else if (
        availability ===
        'coming-soon'
    ) {
        issue =
            'This product is coming soon.';
    } else if (
        availability ===
        'out-of-stock'
    ) {
        issue =
            'This product is currently out of stock.';
    } else if (
        availability ===
        'discontinued'
    ) {
        issue =
            'This product has been discontinued.';
    } else if (!unitPrice) {
        issue =
            'Pricing is not currently available.';
    }

    return {
        key,
        line,
        product,
        variant,

        image:
            product.images[0],

        unitPrice,
        compareAtUnitPrice,

        lineTotalAmount,
        compareAtLineTotalAmount,

        available,
        issue,
    };
}

export function resolveCartLines(
    state: CartState,
): ResolvedCartLine[] {
    return state.lines.map(
        resolveCartLine,
    );
}

export function getCartTotals(
    lines: ResolvedCartLine[],
): CartTotals {
    return lines.reduce<CartTotals>(
        (totals, line) => {
            totals.itemCount +=
                line.line.quantity;

            if (line.available) {
                totals.validItemCount +=
                    line.line.quantity;

                totals.subtotalAmount +=
                    line.lineTotalAmount;

                totals.compareAtSubtotalAmount +=
                    line.compareAtLineTotalAmount;
            } else {
                totals.unavailableLineCount += 1;
            }

            if (line.product?.isDemo) {
                totals.hasDemoItems = true;
            }

            totals.savingsAmount =
                Math.max(
                    0,

                    totals.compareAtSubtotalAmount -
                    totals.subtotalAmount,
                );

            return totals;
        },
        {
            itemCount: 0,
            validItemCount: 0,

            subtotalAmount: 0,
            compareAtSubtotalAmount: 0,
            savingsAmount: 0,

            unavailableLineCount: 0,
            hasDemoItems: false,
        },
    );
}

export function formatCartAmount(
    amount: number,
    currency = 'USD',
): string {
    return new Intl.NumberFormat(
        'en-US',
        {
            style: 'currency',
            currency,
        },
    ).format(amount / 100);
}

export function getProductImageSource(
    image?: ProductImage,
): string | undefined {
    if (!image) {
        return undefined;
    }

    return typeof image.src === 'string'
        ? image.src
        : image.src.src;
}