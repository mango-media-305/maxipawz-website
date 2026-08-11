import {
    useId,
    useMemo,
} from 'preact/hooks';

import type {
    ResolvedCartLine,
} from '../../types/cart';

import {
    getCartTotals,
} from '../../utils/cart';

import {
    getCheckoutReadiness,
} from '../../utils/checkout';

import ShippingSummary from './ShippingSummary';

import {
    useCheckoutInventoryReadiness,
} from './useCheckoutInventoryReadiness';

interface Props {
    lines:
        ResolvedCartLine[];

    compact?: boolean;
}

function CheckoutIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
        >
            <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H7" />

            <circle
                cx="10"
                cy="20"
                r="1.5"
            />

            <circle
                cx="18"
                cy="20"
                r="1.5"
            />
        </svg>
    );
}

export default function CheckoutButton({
    lines,
    compact = false,
}: Props) {
    const statusId =
        useId();

    const totals =
        useMemo(
            () =>
                getCartTotals(
                    lines,
                ),
            [
                lines,
            ],
        );

    const catalogReadiness =
        useMemo(
            () =>
                getCheckoutReadiness(
                    lines,
                ),
            [
                lines,
            ],
        );

    const inventoryReadiness =
        useCheckoutInventoryReadiness({
            lines,

            enabled:
                catalogReadiness.ready,
        });

    const checkoutReady =
        catalogReadiness.ready &&
        inventoryReadiness.ready;

    const inventoryChecking =
        catalogReadiness.ready &&
        (
            inventoryReadiness.status ===
                'idle' ||
            inventoryReadiness.status ===
                'checking'
        );

    const inventoryBlocked =
        catalogReadiness.ready &&
        inventoryReadiness.status ===
            'blocked';

    let buttonLabel =
        'Checkout Not Ready';

    if (
        inventoryChecking
    ) {
        buttonLabel =
            'Checking Stock…';
    } else if (
        inventoryBlocked
    ) {
        buttonLabel =
            'Recheck Stock';
    } else if (
        checkoutReady
    ) {
        buttonLabel =
            'Continue to Test Checkout';
    }

    const displayedReasons =
        !catalogReadiness.ready
            ? catalogReadiness
                .reasons
            : inventoryChecking
                ? [
                    'Checking live stock before checkout.',
                ]
                : inventoryReadiness
                    .reasons;

    const canInteract =
        catalogReadiness.ready &&
        !inventoryChecking;

    async function handleCheckout():
        Promise<void> {
        if (
            !catalogReadiness.ready
        ) {
            return;
        }

        const wasReady =
            inventoryReadiness.ready;

        const stillReady =
            await inventoryReadiness
                .revalidate();

        if (
            wasReady &&
            stillReady
        ) {
            window.location.assign(
                '/checkout',
            );
        }
    }

    return (
        <div>
            <ShippingSummary
                subtotalAmount={
                    totals
                        .subtotalAmount
                }
                compact={
                    compact
                }
            />

            <button
                type="button"
                className={[
                    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 font-extrabold transition',

                    checkoutReady
                        ? 'border border-brand-600 bg-brand-500 text-white shadow-blue hover:-translate-y-0.5 hover:bg-brand-600'
                        : inventoryBlocked
                            ? 'border border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-100'
                            : 'cursor-not-allowed border border-sand-dark bg-ink-200 text-ink-600',
                ].join(
                    ' ',
                )}
                disabled={
                    !canInteract
                }
                aria-describedby={
                    statusId
                }
                onClick={() => {
                    void handleCheckout();
                }}
            >
                <CheckoutIcon />

                {buttonLabel}
            </button>

            <div
                id={
                    statusId
                }
                className={
                    compact
                        ? 'mt-3'
                        : 'mt-4'
                }
                aria-live="polite"
            >
                {!checkoutReady &&
                    displayedReasons
                        .length >
                        0 && (
                        compact ? (
                            <div className="rounded-2xl border border-accent-200 bg-accent-50 p-3">
                                <p className="text-xs font-bold leading-5 text-ink-700">
                                    {
                                        displayedReasons[
                                            0
                                        ]
                                    }

                                    {displayedReasons
                                        .length >
                                        1 && (
                                        <span className="ml-1 text-ink-500">
                                            +
                                            {displayedReasons
                                                .length -
                                                1}{' '}
                                            more requirements.
                                        </span>
                                    )}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-accent-200 bg-accent-50 p-4">
                                <p className="text-sm font-extrabold text-ink-800">
                                    Checkout requirements
                                </p>

                                <ul className="mt-2 grid gap-1.5">
                                    {displayedReasons.map(
                                        (
                                            reason,
                                        ) => (
                                            <li
                                                key={
                                                    reason
                                                }
                                                className="flex items-start gap-2 text-xs font-bold leading-5 text-ink-600"
                                            >
                                                <span
                                                    className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-500"
                                                    aria-hidden="true"
                                                />

                                                {
                                                    reason
                                                }
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </div>
                        )
                    )}
            </div>
        </div>
    );
}