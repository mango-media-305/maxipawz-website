import type {
    ResolvedCartLine,
} from '../types/cart';

import type {
    PublicInventorySnapshot,
} from '../types/inventory';

import {
    isInventoryTrackingEnabledForSelection,
} from './product-inventory';

export interface TrackedCheckoutInventoryLine {
    productSlug: string;

    productName: string;

    variantId?: string;

    variantLabel?: string;

    quantity: number;
}

export interface CheckoutInventoryEvaluation {
    line:
        TrackedCheckoutInventoryLine;

    inventory:
        PublicInventorySnapshot;
}

export function getTrackedCheckoutInventoryLines(
    lines:
        ResolvedCartLine[],
): TrackedCheckoutInventoryLine[] {
    const grouped =
        new Map<
            string,
            TrackedCheckoutInventoryLine
        >();

    lines.forEach(
        (
            item,
        ) => {
            if (
                !item.available ||
                !item.product ||
                !isInventoryTrackingEnabledForSelection(
                    item.product,
                    item.variant,
                )
            ) {
                return;
            }

            const key =
                `${item.product.slug}\u0000${item.variant?.id ?? ''}`;

            const existing =
                grouped.get(
                    key,
                );

            if (
                existing
            ) {
                existing.quantity +=
                    item.line.quantity;

                return;
            }

            grouped.set(
                key,
                {
                    productSlug:
                        item.product.slug,

                    productName:
                        item.product.name,

                    ...(item.variant
                        ? {
                            variantId:
                                item.variant.id,

                            variantLabel:
                                item.variant.label,
                        }
                        : {}),

                    quantity:
                        item.line.quantity,
                },
            );
        },
    );

    return Array.from(
        grouped.values(),
    );
}

export function getCheckoutInventoryLineLabel(
    line:
        TrackedCheckoutInventoryLine,
): string {
    if (
        line.variantLabel
    ) {
        return `${line.productName} — ${line.variantLabel}`;
    }

    return line.productName;
}

export function getCheckoutInventoryAvailabilityReason(
    line:
        TrackedCheckoutInventoryLine,

    inventory:
        PublicInventorySnapshot,
): string | undefined {
    const label =
        getCheckoutInventoryLineLabel(
            line,
        );

    if (
        !inventory.tracked ||
        inventory.available ===
            null
    ) {
        return `${label} live stock could not be verified.`;
    }

    if (
        inventory.status ===
            'sold-out' ||
        inventory.available <=
            0
    ) {
        return `${label} is currently sold out. Remove it from your cart before checkout.`;
    }

    if (
        line.quantity >
        inventory.available
    ) {
        if (
            inventory.available ===
            1
        ) {
            return `Only 1 unit of ${label} is currently available. Reduce the cart quantity before checkout.`;
        }

        return `Only ${inventory.available} units of ${label} are currently available. Reduce the cart quantity before checkout.`;
    }

    return undefined;
}

export function getCheckoutInventoryReadinessReasons(
    evaluations:
        CheckoutInventoryEvaluation[],
): string[] {
    return evaluations
        .map(
            (
                evaluation,
            ) =>
                getCheckoutInventoryAvailabilityReason(
                    evaluation.line,
                    evaluation.inventory,
                ),
        )
        .filter(
            (
                reason,
            ): reason is string =>
                Boolean(
                    reason,
                ),
        );
}