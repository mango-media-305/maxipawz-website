import { useEffect, useState } from 'preact/hooks';

import type {
    BackInStockSubscribeResponse,
} from '../../types/back-in-stock';

interface Props {
    productSlug: string;

    variantId?: string;

    productName: string;

    variantLabel?: string;
}

type SubmissionStatus =
    | 'idle'
    | 'submitting'
    | 'success'
    | 'error';

export default function BackInStockForm({
    productSlug,
    variantId,
    productName,
    variantLabel,
}: Props) {
    const [email, setEmail] =
        useState('');

    const [botField, setBotField] =
        useState('');

    const [status, setStatus] =
        useState<SubmissionStatus>(
            'idle',
        );

    const [message, setMessage] =
        useState('');

    const selectionName =
        variantLabel
            ? `${productName} — ${variantLabel}`
            : productName;

    const emailInputId =
        `back-in-stock-email-${productSlug}-${variantId ?? 'product'}`;

    useEffect(() => {
        /*
         * A variant change represents a different inventory subscription.
         * Never carry a success/error state from one selection into another.
         */
        setEmail('');
        setBotField('');
        setStatus('idle');
        setMessage('');
    }, [
        productSlug,
        variantId,
    ]);

    async function handleSubmit(
        event: Event,
    ): Promise<void> {
        event.preventDefault();

        if (
            status ===
            'submitting'
        ) {
            return;
        }

        const normalizedEmail =
            email.trim();

        if (
            !normalizedEmail
        ) {
            setStatus('error');

            setMessage(
                'Please enter your email address.',
            );

            return;
        }

        setStatus(
            'submitting',
        );

        setMessage('');

        try {
            const response =
                await fetch(
                    '/api/back-in-stock/subscribe',
                    {
                        method:
                            'POST',

                        headers: {
                            Accept:
                                'application/json',

                            'Content-Type':
                                'application/json',
                        },

                        cache:
                            'no-store',

                        body:
                            JSON.stringify({
                                productSlug,

                                ...(variantId
                                    ? {
                                        variantId,
                                    }
                                    : {}),

                                email:
                                    normalizedEmail,

                                botField,
                            }),
                    },
                );

            let payload:
                | BackInStockSubscribeResponse
                | null =
                null;

            try {
                payload =
                    (await response.json()) as
                    BackInStockSubscribeResponse;
            } catch {
                payload =
                    null;
            }

            if (
                !response.ok ||
                !payload ||
                payload.ok !==
                true
            ) {
                throw new Error(
                    payload &&
                        payload.ok ===
                        false
                        ? payload.message
                        : 'The back-in-stock request could not be completed. Please try again.',
                );
            }

            setStatus(
                'success',
            );

            setMessage(
                payload.message,
            );
        } catch (
        error
        ) {
            setStatus(
                'error',
            );

            setMessage(
                error instanceof
                    Error
                    ? error.message
                    : 'The back-in-stock request could not be completed. Please try again.',
            );
        }
    }

    if (
        status ===
        'success'
    ) {
        return (
            <section
                className="mt-4 rounded-3xl border border-success-100 bg-success-50 p-5"
                aria-live="polite"
            >
                <div className="flex items-start gap-3">
                    <div
                        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700"
                        aria-hidden="true"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                        >
                            <path
                                d="m5 12 4 4L19 6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <div>
                        <p className="font-extrabold text-success-700">
                            You're on the list.
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-700">
                            {message}
                        </p>

                        <p className="mt-2 text-xs font-bold leading-5 text-ink-500">
                            This is a one-time availability alert for{' '}
                            {selectionName}. It does not subscribe you to
                            Maxi Pawz marketing emails.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mt-4 rounded-3xl border border-danger-100 bg-danger-50 p-5 sm:p-6">
            <p className="text-xs font-black tracking-[0.1em] text-danger-700 uppercase">
                Sold Out
            </p>

            <h3 className="mt-2 text-xl font-black text-ink-900">
                This product is temporarily unavailable.
            </h3>

            <p className="mt-2 text-sm leading-6 text-ink-600">
                Enter your email and we'll let you know when{' '}
                <strong>
                    {selectionName}
                </strong>{' '}
                becomes available again.
            </p>

            <form
                className="mt-5"
                onSubmit={
                    handleSubmit
                }
            >
                <label
                    htmlFor={
                        emailInputId
                    }
                    className="form-label"
                >
                    Email address
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <input
                        id={
                            emailInputId
                        }
                        className="form-control min-w-0 flex-1 bg-white-warm"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={
                            254
                        }
                        required
                        placeholder="you@example.com"
                        value={
                            email
                        }
                        onInput={(
                            event,
                        ) => {
                            setEmail(
                                event
                                    .currentTarget
                                    .value,
                            );

                            if (
                                status ===
                                'error'
                            ) {
                                setStatus(
                                    'idle',
                                );

                                setMessage(
                                    '',
                                );
                            }
                        }}
                    />

                    <button
                        type="submit"
                        disabled={
                            status ===
                            'submitting'
                        }
                        className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-brand-600 bg-brand-500 px-5 font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                    >
                        {status ===
                            'submitting'
                            ? 'Submitting…'
                            : "Notify Me When It's Back"}
                    </button>
                </div>

                {/*
         * Honeypot field.
         *
         * It is visually inaccessible to normal customers but remains
         * present in the form for simple automated-form bot detection.
         */}
                <div
                    className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                    aria-hidden="true"
                >
                    <label>
                        Leave this field empty

                        <input
                            type="text"
                            tabIndex={
                                -1
                            }
                            autoComplete="off"
                            value={
                                botField
                            }
                            onInput={(
                                event,
                            ) => {
                                setBotField(
                                    event
                                        .currentTarget
                                        .value,
                                );
                            }}
                        />
                    </label>
                </div>

                <p className="mt-3 text-xs font-bold leading-5 text-ink-500">
                    We'll email you when this product becomes available
                    again. This is a one-time stock alert and does not
                    sign you up for marketing emails.
                </p>

                {status ===
                    'error' &&
                    message && (
                        <p
                            className="mt-3 rounded-2xl border border-danger-100 bg-white-warm px-4 py-3 text-sm font-bold leading-6 text-danger-700"
                            role="alert"
                        >
                            {message}
                        </p>
                    )}
            </form>
        </section>
    );
}