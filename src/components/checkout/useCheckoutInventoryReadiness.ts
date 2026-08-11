import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'preact/hooks';

import type {
    ResolvedCartLine,
} from '../../types/cart';

import type {
    ProductInventoryErrorResponse,
    ProductInventoryResponse,
} from '../../types/inventory';

import {
    isInventoryTrackingEnabledForSelection,
} from '../../utils/product-inventory';

export type CheckoutInventoryReadinessStatus =
    | 'idle'
    | 'checking'
    | 'ready'
    | 'blocked';

export interface CheckoutInventoryReadiness {
    status:
        CheckoutInventoryReadinessStatus;

    ready: boolean;

    reasons:
        string[];

    revalidate:
        () => Promise<boolean>;
}

interface TrackedCheckoutLine {
    productSlug: string;

    productName: string;

    variantId?: string;

    variantLabel?: string;

    quantity: number;
}

interface UseCheckoutInventoryReadinessOptions {
    lines:
        ResolvedCartLine[];

    enabled: boolean;
}

function getTrackedCheckoutLines(
    lines:
        ResolvedCartLine[],
): TrackedCheckoutLine[] {
    const grouped =
        new Map<
            string,
            TrackedCheckoutLine
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

function getLineLabel(
    line:
        TrackedCheckoutLine,
): string {
    if (
        line.variantLabel
    ) {
        return `${line.productName} — ${line.variantLabel}`;
    }

    return line.productName;
}

function getAvailabilityReason(
    line:
        TrackedCheckoutLine,
    response:
        ProductInventoryResponse,
): string | undefined {
    const inventory =
        response.inventory;

    const label =
        getLineLabel(
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

export function useCheckoutInventoryReadiness({
    lines,
    enabled,
}: UseCheckoutInventoryReadinessOptions):
    CheckoutInventoryReadiness {
    const trackedLines =
        useMemo(
            () =>
                getTrackedCheckoutLines(
                    lines,
                ),
            [
                lines,
            ],
        );

    const controllerRef =
        useRef<
            AbortController |
            null
        >(
            null,
        );

    const [
        status,
        setStatus,
    ] =
        useState<
            CheckoutInventoryReadinessStatus
        >(
            'idle',
        );

    const [
        reasons,
        setReasons,
    ] =
        useState<
            string[]
        >(
            [],
        );

    const revalidate =
        useCallback(
            async (): Promise<boolean> => {
                controllerRef
                    .current
                    ?.abort();

                if (
                    !enabled
                ) {
                    setStatus(
                        'idle',
                    );

                    setReasons(
                        [],
                    );

                    return false;
                }

                if (
                    trackedLines.length ===
                    0
                ) {
                    setStatus(
                        'ready',
                    );

                    setReasons(
                        [],
                    );

                    return true;
                }

                const controller =
                    new AbortController();

                controllerRef.current =
                    controller;

                setStatus(
                    'checking',
                );

                setReasons(
                    [],
                );

                try {
                    const results =
                        await Promise.all(
                            trackedLines.map(
                                async (
                                    line,
                                ): Promise<
                                    string |
                                    undefined
                                > => {
                                    const searchParams =
                                        new URLSearchParams({
                                            product:
                                                line.productSlug,
                                        });

                                    if (
                                        line.variantId
                                    ) {
                                        searchParams.set(
                                            'variant',
                                            line.variantId,
                                        );
                                    }

                                    try {
                                        const response =
                                            await fetch(
                                                `/api/product-inventory?${searchParams.toString()}`,
                                                {
                                                    method:
                                                        'GET',

                                                    headers: {
                                                        Accept:
                                                            'application/json',
                                                    },

                                                    cache:
                                                        'no-store',

                                                    signal:
                                                        controller.signal,
                                                },
                                            );

                                        let body:
                                            | ProductInventoryResponse
                                            | ProductInventoryErrorResponse
                                            | null =
                                            null;

                                        try {
                                            body =
                                                await response.json() as
                                                    | ProductInventoryResponse
                                                    | ProductInventoryErrorResponse;
                                        } catch {
                                            body =
                                                null;
                                        }

                                        if (
                                            !response.ok ||
                                            !body ||
                                            body.ok ===
                                                false
                                        ) {
                                            return `${getLineLabel(line)} stock could not be verified. Refresh or recheck stock before checkout.`;
                                        }

                                        return getAvailabilityReason(
                                            line,
                                            body,
                                        );
                                    } catch (
                                    error
                                    ) {
                                        if (
                                            error instanceof
                                                DOMException &&
                                            error.name ===
                                                'AbortError'
                                        ) {
                                            throw error;
                                        }

                                        return `${getLineLabel(line)} stock could not be verified. Refresh or recheck stock before checkout.`;
                                    }
                                },
                            ),
                        );

                    if (
                        controller.signal
                            .aborted
                    ) {
                        return false;
                    }

                    const nextReasons =
                        results.filter(
                            (
                                reason,
                            ): reason is string =>
                                Boolean(
                                    reason,
                                ),
                        );

                    if (
                        nextReasons.length >
                        0
                    ) {
                        setStatus(
                            'blocked',
                        );

                        setReasons(
                            nextReasons,
                        );

                        return false;
                    }

                    setStatus(
                        'ready',
                    );

                    setReasons(
                        [],
                    );

                    return true;
                } catch (
                error
                ) {
                    if (
                        error instanceof
                            DOMException &&
                        error.name ===
                            'AbortError'
                    ) {
                        return false;
                    }

                    setStatus(
                        'blocked',
                    );

                    setReasons([
                        'Live stock could not be verified. Recheck inventory before checkout.',
                    ]);

                    return false;
                }
            },
            [
                enabled,
                trackedLines,
            ],
        );

    useEffect(
        () => {
            if (
                !enabled
            ) {
                controllerRef
                    .current
                    ?.abort();

                setStatus(
                    'idle',
                );

                setReasons(
                    [],
                );

                return;
            }

            void revalidate();

            return () => {
                controllerRef
                    .current
                    ?.abort();
            };
        },
        [
            enabled,
            revalidate,
        ],
    );

    return {
        status,

        ready:
            status ===
            'ready',

        reasons,

        revalidate,
    };
}