import {
    useEffect,
    useState,
} from 'preact/hooks';

import {
    commerceText,
} from '../../i18n/commerce';

import type {
    Locale,
} from '../../i18n/languages';

import type {
    BackInStockSubscribeResponse,
} from '../../types/back-in-stock';

interface Props {
    productSlug:
    string;

    variantId?:
    string;

    productName:
    string;

    variantLabel?:
    string;

    locale?:
    Locale;
}

type SubmissionStatus =
    | 'idle'
    | 'submitting'
    | 'success'
    | 'error';

function getRequestErrorMessage(
    payload:
        BackInStockSubscribeResponse |
        null,

    locale:
        Locale,
): string {
    const fallback =
        commerceText(
            locale,
            'The back-in-stock request could not be completed. Please try again.',
            'No se pudo completar la solicitud de disponibilidad. Inténtalo nuevamente.',
        );

    if (
        !payload ||
        payload.ok ===
        true
    ) {
        return fallback;
    }

    if (
        locale ===
        'en'
    ) {
        return payload.message;
    }

    switch (
    payload.code
    ) {
        case 'invalid-email':
            return 'Ingresa una dirección de correo electrónico válida.';

        case 'product-not-found':
            return 'Este producto ya no está disponible.';

        case 'variant-required':
            return 'Selecciona una opción del producto antes de solicitar la alerta.';

        case 'variant-not-found':
            return 'La opción seleccionada ya no está disponible.';

        case 'not-eligible':
            return 'Este producto no admite alertas de disponibilidad.';

        case 'already-in-stock':
            return 'Este producto ya está disponible.';

        case 'inventory-error':
            return 'Las alertas de disponibilidad no están disponibles temporalmente. Inténtalo nuevamente.';

        case 'invalid-request':
        default:
            return 'No se pudo completar la solicitud. Revisa la información e inténtalo nuevamente.';
    }
}

export default function BackInStockForm({
    productSlug,
    variantId,
    productName,
    variantLabel,
    locale = 'en',
}: Props) {
    const [
        email,
        setEmail,
    ] =
        useState('');

    const [
        botField,
        setBotField,
    ] =
        useState('');

    const [
        status,
        setStatus,
    ] =
        useState<SubmissionStatus>(
            'idle',
        );

    const [
        message,
        setMessage,
    ] =
        useState('');

    const selectionName =
        variantLabel
            ? `${productName} — ${variantLabel}`
            : productName;

    const emailInputId =
        `back-in-stock-email-${productSlug}-${variantId ?? 'product'}`;

    useEffect(
        () => {
            setEmail('');

            setBotField('');

            setStatus(
                'idle',
            );

            setMessage('');
        },
        [
            productSlug,
            variantId,
        ],
    );

    async function handleSubmit(
        event:
            Event,
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
            setStatus(
                'error',
            );

            setMessage(
                commerceText(
                    locale,
                    'Please enter your email address.',
                    'Ingresa tu dirección de correo electrónico.',
                ),
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
                    getRequestErrorMessage(
                        payload,
                        locale,
                    ),
                );
            }

            setStatus(
                'success',
            );

            (
                window as Window & {
                    posthog?: {
                        capture: (
                            event:
                                string,

                            properties?:
                                Record<
                                    string,
                                    string |
                                    number |
                                    boolean
                                >,
                        ) => void;
                    };
                }
            ).posthog?.capture(
                'back_in_stock_subscription_completed',
                {
                    product_slug:
                        productSlug,

                    variant_id:
                        variantId ??
                        'default',
                },
            );

            setMessage(
                commerceText(
                    locale,
                    payload.message,
                    'Te enviaremos un correo electrónico cuando este producto vuelva a estar disponible.',
                ),
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
                    : commerceText(
                        locale,
                        'The back-in-stock request could not be completed. Please try again.',
                        'No se pudo completar la solicitud de disponibilidad. Inténtalo nuevamente.',
                    ),
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
                            {
                                commerceText(
                                    locale,
                                    "You're on the list.",
                                    'Ya estás en la lista.',
                                )
                            }
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-700">
                            {message}
                        </p>

                        <p className="mt-2 text-xs font-bold leading-5 text-ink-500">
                            {
                                locale ===
                                    'es'
                                    ? `Esta es una alerta única de disponibilidad para ${selectionName}. No te suscribe a los correos de marketing de Maxi Pawz.`
                                    : `This is a one-time availability alert for ${selectionName}. It does not subscribe you to Maxi Pawz marketing emails.`
                            }
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mt-4 rounded-3xl border border-danger-100 bg-danger-50 p-5 sm:p-6">
            <p className="text-xs font-black tracking-[0.1em] text-danger-700 uppercase">
                {
                    commerceText(
                        locale,
                        'Sold Out',
                        'Agotado',
                    )
                }
            </p>

            <h3 className="mt-2 text-xl font-black text-ink-900">
                {
                    commerceText(
                        locale,
                        'This product is temporarily unavailable.',
                        'Este producto no está disponible temporalmente.',
                    )
                }
            </h3>

            <p className="mt-2 text-sm leading-6 text-ink-600">
                {
                    locale ===
                        'es'
                        ? (
                            <>
                                Ingresa tu correo electrónico y te avisaremos cuando{' '}
                                <strong>
                                    {selectionName}
                                </strong>{' '}
                                vuelva a estar disponible.
                            </>
                        )
                        : (
                            <>
                                Enter your email and we'll let you know when{' '}
                                <strong>
                                    {selectionName}
                                </strong>{' '}
                                becomes available again.
                            </>
                        )
                }
            </p>

            <form
                className="mt-5"
                onSubmit={handleSubmit}
            >
                <label
                    htmlFor={emailInputId}
                    className="form-label"
                >
                    {
                        commerceText(
                            locale,
                            'Email address',
                            'Correo electrónico',
                        )
                    }
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <input
                        id={emailInputId}
                        className="form-control min-w-0 flex-1 bg-white-warm"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={254}
                        required
                        placeholder="you@example.com"
                        value={email}
                        onInput={(
                            event,
                        ) => {
                            setEmail(
                                event.currentTarget
                                    .value,
                            );

                            if (
                                status ===
                                'error'
                            ) {
                                setStatus(
                                    'idle',
                                );

                                setMessage('');
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
                        {
                            status ===
                                'submitting'
                                ? commerceText(
                                    locale,
                                    'Submitting…',
                                    'Enviando…',
                                )
                                : commerceText(
                                    locale,
                                    "Notify Me When It's Back",
                                    'Avísame cuando vuelva',
                                )
                        }
                    </button>
                </div>

                <div
                    className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                    aria-hidden="true"
                >
                    <label>
                        {
                            commerceText(
                                locale,
                                'Leave this field empty',
                                'Deja este campo vacío',
                            )
                        }

                        <input
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            value={botField}
                            onInput={(
                                event,
                            ) => {
                                setBotField(
                                    event.currentTarget
                                        .value,
                                );
                            }}
                        />
                    </label>
                </div>

                <p className="mt-3 text-xs font-bold leading-5 text-ink-500">
                    {
                        commerceText(
                            locale,
                            "We'll email you when this product becomes available again. This is a one-time stock alert and does not sign you up for marketing emails.",
                            'Te enviaremos un correo cuando este producto vuelva a estar disponible. Esta es una alerta única de inventario y no te suscribe a correos de marketing.',
                        )
                    }
                </p>

                {
                    status ===
                    'error' &&
                    message && (
                        <p
                            className="mt-3 rounded-2xl border border-danger-100 bg-white-warm px-4 py-3 text-sm font-bold leading-6 text-danger-700"
                            role="alert"
                        >
                            {message}
                        </p>
                    )
                }
            </form>
        </section>
    );
}