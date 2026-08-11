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
    getCheckoutInventoryAvailabilityReason,
    getCheckoutInventoryLineLabel,
    getTrackedCheckoutInventoryLines,
} from '../../utils/checkout-inventory-readiness';

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

interface UseCheckoutInventoryReadinessOptions {
    lines:
    ResolvedCartLine[];

    enabled: boolean;
}

export function useCheckoutInventoryReadiness({
    lines,
    enabled,
}: UseCheckoutInventoryReadinessOptions):
    CheckoutInventoryReadiness {
    const trackedLines =
        useMemo(
            () =>
                getTrackedCheckoutInventoryLines(
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
                                            return `${getCheckoutInventoryLineLabel(line)} stock could not be verified. Refresh or recheck stock before checkout.`;
                                        }

                                        return getCheckoutInventoryAvailabilityReason(
                                            line,
                                            body.inventory,
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

                                        return `${getCheckoutInventoryLineLabel(line)} stock could not be verified. Refresh or recheck stock before checkout.`;
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