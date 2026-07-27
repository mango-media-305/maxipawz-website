import {
    commerceConfig,
} from '../../config/commerce';

import {
    formatCartAmount,
} from '../../utils/cart';

import {
    getFreeShippingProgress,
    getShippingQuote,
} from '../../utils/shipping';

interface Props {
    subtotalAmount: number;
    compact?: boolean;
}

export default function ShippingSummary({
    subtotalAmount,
    compact = false,
}: Props) {
    const shippingQuote =
        getShippingQuote(
            subtotalAmount,

            commerceConfig
                .shipping
                .standardShippingRateAmount,
        );

    const progress =
        getFreeShippingProgress(
            subtotalAmount,
        );

    const shippingLabel =
        shippingQuote
            .qualifiesForFreeShipping
            ? 'Free'
            : shippingQuote
                .shippingAmount === null
                ? 'Not configured'
                : formatCartAmount(
                    shippingQuote
                        .shippingAmount,
                );

    const totalLabel =
        shippingQuote
            .estimatedTotalBeforeTaxAmount ===
            null
            ? 'Pending'
            : formatCartAmount(
                shippingQuote
                    .estimatedTotalBeforeTaxAmount,
            );

    return (
        <section
            className={[
                'rounded-2xl border border-brand-200 bg-brand-50',
                compact
                    ? 'mb-4 p-3'
                    : 'mb-5 p-4',
            ].join(' ')}
            aria-label="Shipping estimate"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                        Shipping
                    </p>

                    <p className="mt-1 text-sm font-black text-ink-900">
                        {shippingQuote
                            .qualifiesForFreeShipping
                            ? 'Free standard shipping unlocked'
                            : `Add ${formatCartAmount(
                                shippingQuote
                                    .amountUntilFreeShipping,
                            )} for free shipping`}
                    </p>
                </div>

                <span className="shrink-0 rounded-full border border-brand-200 bg-white-warm px-3 py-1 text-xs font-extrabold text-brand-800">
                    {progress}%
                </span>
            </div>

            <div
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand-100"
                role="progressbar"
                aria-label="Progress toward free shipping"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
            >
                <div
                    className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
                    style={{
                        width:
                            `${progress}%`,
                    }}
                />
            </div>

            <dl className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                    <dt className="font-bold text-ink-600">
                        Standard shipping
                    </dt>

                    <dd className="font-black text-ink-900">
                        {shippingLabel}
                    </dd>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-brand-200 pt-2">
                    <dt className="font-bold text-ink-700">
                        Estimated total before tax
                    </dt>

                    <dd className="font-black text-ink-900">
                        {totalLabel}
                    </dd>
                </div>
            </dl>

            {!shippingQuote.configured && (
                <p className="mt-3 text-xs font-bold leading-5 text-accent-800">
                    A standard shipping rate must be configured before orders below the free-shipping threshold can be checked out.
                </p>
            )}

            <a
                href={
                    commerceConfig
                        .shipping
                        .policyHref
                }
                className="mt-3 inline-flex text-xs font-extrabold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-900"
            >
                Review shipping policy
            </a>
        </section>
    );
}