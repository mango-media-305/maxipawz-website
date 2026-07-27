import {
    useId,
    useMemo,
    useState,
} from 'preact/hooks';

import {
    commerceConfig,
} from '../../config/commerce';

import type {
    ResolvedCartLine,
} from '../../types/cart';

import type {
    CheckoutSessionErrorResponse,
    CheckoutSessionResponse,
    CheckoutSessionSuccessResponse,
} from '../../types/checkout';

import {
    buildCheckoutRequest,
    getCheckoutReadiness,
} from '../../utils/checkout';

interface Props {
    lines: ResolvedCartLine[];
    compact?: boolean;
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isSuccessResponse(
    value: unknown,
): value is CheckoutSessionSuccessResponse {
    return (
        isRecord(value) &&
        value.ok === true &&
        typeof value.url === 'string' &&
        typeof value.sessionId === 'string'
    );
}

function isErrorResponse(
    value: unknown,
): value is CheckoutSessionErrorResponse {
    return (
        isRecord(value) &&
        value.ok === false &&
        typeof value.message === 'string' &&
        typeof value.code === 'string'
    );
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
            <circle cx="10" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
        </svg>
    );
}

export default function CheckoutButton({
    lines,
    compact = false,
}: Props) {
    const statusId = useId();

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState('');

    const readiness = useMemo(
        () => getCheckoutReadiness(lines),
        [lines],
    );

    async function beginCheckout(): Promise<void> {
        if (
            !readiness.ready ||
            loading
        ) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(
                commerceConfig.checkoutEndpoint,
                {
                    method: 'POST',

                    headers: {
                        Accept: 'application/json',
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify(
                        buildCheckoutRequest(lines),
                    ),
                },
            );

            const payload =
                (await response
                    .json()
                    .catch(
                        () => null,
                    )) as CheckoutSessionResponse | null;

            if (
                !response.ok ||
                !isSuccessResponse(payload)
            ) {
                const message =
                    isErrorResponse(payload)
                        ? payload.message
                        : 'Checkout could not be started. Please try again.';

                throw new Error(message);
            }

            window.location.assign(payload.url);
        } catch (checkoutError) {
            setError(
                checkoutError instanceof Error
                    ? checkoutError.message
                    : 'Checkout could not be started. Please try again.',
            );

            setLoading(false);
        }
    }

    const buttonLabel = loading
        ? 'Opening Stripe Checkout…'
        : readiness.ready
            ? 'Continue to Test Checkout'
            : 'Checkout Not Ready';

    return (
        <div>
            <button
                type="button"
                className={[
                    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 font-extrabold transition',
                    readiness.ready
                        ? 'border border-brand-600 bg-brand-500 text-white shadow-blue hover:-translate-y-0.5 hover:bg-brand-600'
                        : 'cursor-not-allowed border border-sand-dark bg-ink-200 text-ink-600',
                ].join(' ')}
                disabled={
                    !readiness.ready ||
                    loading
                }
                aria-describedby={statusId}
                onClick={() => {
                    void beginCheckout();
                }}
            >
                <CheckoutIcon />

                {buttonLabel}
            </button>

            <div
                id={statusId}
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
                                {readiness.reasons[0]}

                                {readiness.reasons.length >
                                    1 && (
                                        <span className="ml-1 text-ink-500">
                                            +
                                            {readiness.reasons.length -
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
                                {readiness.reasons.map(
                                    (reason) => (
                                        <li
                                            key={reason}
                                            className="flex items-start gap-2 text-xs font-bold leading-5 text-ink-600"
                                        >
                                            <span
                                                className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-500"
                                                aria-hidden="true"
                                            />

                                            {reason}
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                    )
                )}

                {error && (
                    <p className="rounded-2xl border border-danger-100 bg-danger-50 p-3 text-sm font-bold leading-6 text-danger-700">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}