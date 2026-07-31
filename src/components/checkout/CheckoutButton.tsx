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
            [lines],
        );

    const readiness =
        useMemo(
            () =>
                getCheckoutReadiness(
                    lines,
                ),
            [lines],
        );

    const buttonLabel =
        readiness.ready
            ? 'Continue to Test Checkout'
            : 'Checkout Not Ready';

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
                    readiness.ready
                        ? 'border border-brand-600 bg-brand-500 text-white shadow-blue hover:-translate-y-0.5 hover:bg-brand-600'
                        : 'cursor-not-allowed border border-sand-dark bg-ink-200 text-ink-600',
                ].join(' ')}
                disabled={
                    !readiness.ready
                }
                aria-describedby={
                    statusId
                }
                onClick={() => {
                    window.location.assign(
                        '/checkout',
                    );
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
                {!readiness.ready && (
                    compact ? (
                        <div className="rounded-2xl border border-accent-200 bg-accent-50 p-3">
                            <p className="text-xs font-bold leading-5 text-ink-700">
                                {
                                    readiness
                                        .reasons[0]
                                }

                                {readiness
                                    .reasons
                                    .length >
                                    1 && (
                                        <span className="ml-1 text-ink-500">
                                            +
                                            {readiness
                                                .reasons
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
                                {readiness
                                    .reasons
                                    .map(
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