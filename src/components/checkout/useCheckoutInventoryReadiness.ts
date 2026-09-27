import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'preact/hooks';

import {
    commerceText,
} from '../../i18n/commerce';

import type {
    Locale,
} from '../../i18n/languages';

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

    ready:
        boolean;

    reasons:
        string[];

    revalidate:
        () => Promise<boolean>;
}

interface UseCheckoutInventoryReadinessOptions {
    lines:
        ResolvedCartLine[];

    enabled:
        boolean;

    locale?:
        Locale;
}

export function useCheckoutInventoryReadiness({
    lines,
    enabled,
    locale = 'en',
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
                                            const label =
                                                getCheckoutInventoryLineLabel(
                                                    line,
                                                );

                                            return locale ===
                                                'es'
                                                ? `No pudimos verificar el inventario de ${label}. Actualiza la página o vuelve a comprobar el inventario antes de continuar con el pago.`
                                                : `${label} stock could not be verified. Refresh or recheck stock before checkout.`;
                                        }

                                        return getCheckoutInventoryAvailabilityReason(
                                            line,
                                            body.inventory,
                                            locale,
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

                                        const label =
                                            getCheckoutInventoryLineLabel(
                                                line,
                                            );

                                        return locale ===
                                            'es'
                                            ? `No pudimos verificar el inventario de ${label}. Actualiza la página o vuelve a comprobar el inventario antes de continuar con el pago.`
                                            : `${label} stock could not be verified. Refresh or recheck stock before checkout.`;
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
                        commerceText(
                            locale,
                            'Live stock could not be verified. Recheck inventory before checkout.',
                            'No pudimos verificar el inventario en tiempo real. Vuelve a comprobarlo antes de continuar con el pago.',
                        ),
                    ]);

                    return false;
                }
            },
            [
                enabled,
                locale,
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