import {
    loadStripe,
} from '@stripe/stripe-js';

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'preact/hooks';

import {
    commerceConfig,
} from '../../config/commerce';

import {
    resolveCartLines,
} from '../../utils/cart';

import {
    buildCheckoutRequest,
    getCheckoutReadiness,
} from '../../utils/checkout';

import type {
    CheckoutSessionResponse,
    CheckoutSessionSuccessResponse,
} from '../../types/checkout';

import type {
    ShippingOptionsUpdateResponse,
} from '../../types/shipping';

import {
    useCart,
} from '../cart/useCart';

import {
    useCheckoutInventoryReadiness,
} from './useCheckoutInventoryReadiness';

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !== null &&
        !Array.isArray(
            value,
        )
    );
}

function isCheckoutSuccess(
    value: unknown,
): value is CheckoutSessionSuccessResponse {
    return (
        isRecord(
            value,
        ) &&
        value.ok ===
        true &&
        typeof value.sessionId ===
        'string' &&
        typeof value.clientSecret ===
        'string'
    );
}

function getErrorMessage(
    value: unknown,
    fallback: string,
): string {
    if (
        isRecord(
            value,
        ) &&
        typeof value.message ===
        'string'
    ) {
        return value.message;
    }

    return fallback;
}

function parseShippingChangeEvent(
    value: unknown,
): {
    checkoutSessionId: string;

    shippingDetails: unknown;
} | null {
    if (
        !isRecord(
            value,
        ) ||
        typeof value.checkoutSessionId !==
        'string'
    ) {
        return null;
    }

    return {
        checkoutSessionId:
            value.checkoutSessionId,

        shippingDetails:
            value.shippingDetails,
    };
}

export default function EmbeddedCheckout() {
    const {
        state,
        hydrated,
    } =
        useCart();

    const containerRef =
        useRef<
            HTMLDivElement |
            null
        >(
            null,
        );

    const [
        error,
        setError,
    ] =
        useState(
            '',
        );

    const resolvedLines =
        useMemo(
            () =>
                resolveCartLines(
                    state,
                ),
            [
                state,
            ],
        );

    const catalogReadiness =
        useMemo(
            () =>
                getCheckoutReadiness(
                    resolvedLines,
                ),
            [
                resolvedLines,
            ],
        );

    const inventoryReadiness =
        useCheckoutInventoryReadiness({
            lines:
                resolvedLines,

            enabled:
                hydrated &&
                catalogReadiness
                    .ready,
        });

    const checkoutReady =
        hydrated &&
        catalogReadiness.ready &&
        inventoryReadiness.ready;

    const checkoutRequest =
        useMemo(
            () =>
                buildCheckoutRequest(
                    resolvedLines,
                ),
            [
                resolvedLines,
            ],
        );

    const requestFingerprint =
        useMemo(
            () =>
                JSON.stringify(
                    checkoutRequest,
                ),
            [
                checkoutRequest,
            ],
        );

    useEffect(
        () => {
            if (
                !checkoutReady ||
                !containerRef.current
            ) {
                return;
            }

            let cancelled =
                false;

            let checkout:
                {
                    mount:
                        (
                            selector:
                                string,
                        ) => void;

                    destroy:
                        () => void;
                } | null =
                null;

            let clientSecretPromise:
                Promise<string> |
                null =
                null;

            async function fetchClientSecret():
                Promise<string> {
                if (
                    clientSecretPromise
                ) {
                    return clientSecretPromise;
                }

                clientSecretPromise =
                    (
                        async () => {
                            const response =
                                await fetch(
                                    commerceConfig
                                        .checkoutEndpoint,
                                    {
                                        method:
                                            'POST',

                                        headers: {
                                            Accept:
                                                'application/json',

                                            'Content-Type':
                                                'application/json',
                                        },

                                        body:
                                            requestFingerprint,
                                    },
                                );

                            const payload =
                                (
                                    await response
                                        .json()
                                        .catch(
                                            () =>
                                                null,
                                        )
                                ) as
                                    | CheckoutSessionResponse
                                    | null;

                            if (
                                !response.ok ||
                                !isCheckoutSuccess(
                                    payload,
                                )
                            ) {
                                throw new Error(
                                    getErrorMessage(
                                        payload,
                                        'Checkout could not be started.',
                                    ),
                                );
                            }

                            return payload
                                .clientSecret;
                        }
                    )();

                return clientSecretPromise;
            }

            async function onShippingDetailsChange(
                event: unknown,
            ): Promise<
                | {
                    type:
                        'accept';
                }
                | {
                    type:
                        'reject';

                    errorMessage:
                        string;
                }
            > {
                const parsedEvent =
                    parseShippingChangeEvent(
                        event,
                    );

                if (
                    !parsedEvent
                ) {
                    return {
                        type:
                            'reject',

                        errorMessage:
                            'The shipping address could not be read.',
                    };
                }

                const response =
                    await fetch(
                        commerceConfig
                            .shippingOptionsEndpoint,
                        {
                            method:
                                'POST',

                            headers: {
                                Accept:
                                    'application/json',

                                'Content-Type':
                                    'application/json',
                            },

                            body:
                                JSON.stringify({
                                    checkout_session_id:
                                        parsedEvent
                                            .checkoutSessionId,

                                    shipping_details:
                                        parsedEvent
                                            .shippingDetails,
                                }),
                        },
                    );

                const payload =
                    (
                        await response
                            .json()
                            .catch(
                                () =>
                                    null,
                            )
                    ) as
                        | ShippingOptionsUpdateResponse
                        | null;

                if (
                    !response.ok ||
                    !payload ||
                    payload.ok !==
                    true
                ) {
                    return {
                        type:
                            'reject',

                        errorMessage:
                            getErrorMessage(
                                payload,
                                'Shipping rates could not be calculated for this address.',
                            ),
                    };
                }

                return {
                    type:
                        'accept',
                };
            }

            async function mountCheckout():
                Promise<void> {
                try {
                    setError(
                        '',
                    );

                    const stripe =
                        await loadStripe(
                            commerceConfig
                                .stripePublishableKey,
                        );

                    if (
                        !stripe
                    ) {
                        throw new Error(
                            'Stripe.js could not be loaded.',
                        );
                    }

                    const instance =
                        await stripe
                            .createEmbeddedCheckoutPage({
                                fetchClientSecret,

                                onShippingDetailsChange,
                            });

                    if (
                        cancelled
                    ) {
                        instance.destroy();

                        return;
                    }

                    checkout =
                        instance;

                    instance.mount(
                        '#maxipawz-embedded-checkout',
                    );
                } catch (
                checkoutError
                ) {
                    if (
                        cancelled
                    ) {
                        return;
                    }

                    console.error(
                        'Embedded Checkout failed to initialize.',
                        checkoutError,
                    );

                    setError(
                        checkoutError instanceof
                            Error
                            ? checkoutError.message
                            : 'Checkout could not be initialized.',
                    );
                }
            }

            void mountCheckout();

            return () => {
                cancelled =
                    true;

                checkout
                    ?.destroy();
            };
        },
        [
            checkoutReady,
            requestFingerprint,
        ],
    );

    if (
        !hydrated
    ) {
        return (
            <div className="rounded-[2.5rem] border border-sand bg-white-warm p-8 text-center shadow-card">
                <p className="font-bold text-ink-600">
                    Preparing secure checkout…
                </p>
            </div>
        );
    }

    if (
        !catalogReadiness.ready
    ) {
        return (
            <div className="rounded-[2.5rem] border border-accent-200 bg-accent-50 p-6 shadow-card">
                <h2 className="text-2xl text-ink-900">
                    Checkout isn't ready yet.
                </h2>

                <ul className="mt-4 grid gap-2">
                    {catalogReadiness
                        .reasons
                        .map(
                            (
                                reason,
                            ) => (
                                <li
                                    key={
                                        reason
                                    }
                                    className="text-sm font-bold leading-6 text-ink-700"
                                >
                                    • {
                                        reason
                                    }
                                </li>
                            ),
                        )}
                </ul>

                <a
                    href="/cart"
                    className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-500 px-6 font-extrabold text-white shadow-blue"
                >
                    Return to Cart
                </a>
            </div>
        );
    }

    if (
        inventoryReadiness
            .status ===
            'idle' ||
        inventoryReadiness
            .status ===
            'checking'
    ) {
        return (
            <div className="rounded-[2.5rem] border border-brand-200 bg-brand-50 p-8 text-center shadow-card">
                <p className="font-extrabold text-ink-900">
                    Checking live stock…
                </p>

                <p className="mt-2 text-sm leading-6 text-ink-600">
                    We're confirming that everything in your cart is still available before starting secure checkout.
                </p>
            </div>
        );
    }

    if (
        inventoryReadiness
            .status ===
        'blocked'
    ) {
        return (
            <div className="rounded-[2.5rem] border border-accent-200 bg-accent-50 p-6 shadow-card">
                <h2 className="text-2xl text-ink-900">
                    Checkout isn't ready yet.
                </h2>

                <ul className="mt-4 grid gap-2">
                    {inventoryReadiness
                        .reasons
                        .map(
                            (
                                reason,
                            ) => (
                                <li
                                    key={
                                        reason
                                    }
                                    className="text-sm font-bold leading-6 text-ink-700"
                                >
                                    • {
                                        reason
                                    }
                                </li>
                            ),
                        )}
                </ul>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-500 px-6 font-extrabold text-white shadow-blue"
                        onClick={() => {
                            void inventoryReadiness
                                .revalidate();
                        }}
                    >
                        Recheck Stock
                    </button>

                    <a
                        href="/cart"
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-300 bg-white-warm px-6 font-extrabold text-brand-800"
                    >
                        Return to Cart
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div
                id="maxipawz-embedded-checkout"
                ref={
                    containerRef
                }
                className="min-h-128"
            />

            {error && (
                <div className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm font-bold leading-6 text-danger-700">
                    {error}
                </div>
            )}
        </div>
    );
}