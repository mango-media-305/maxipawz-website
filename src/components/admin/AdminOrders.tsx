import {
    useEffect,
    useMemo,
    useState,
} from 'preact/hooks';

import type {
    AdminFulfillOrderRequest,
    AdminFulfillOrderResponse,
    AdminOrder,
    AdminOrdersResponse,
} from '../../types/admin-order';

import type {
    OrderCarrier,
} from '../../types/order';

const ADMIN_TOKEN_KEY =
    'maxipawz-admin-token';

type OrderFilter =
    | 'all'
    | 'needs-fulfillment'
    | 'shipped'
    | 'delivered'
    | 'refund-attention'
    | 'partially-refunded'
    | 'refunded';

function RefreshIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
        >
            <path d="M20 6v5h-5" />

            <path d="M4 18v-5h5" />

            <path d="M6.1 8a8 8 0 0 1 13.2-2L20 11" />

            <path d="M17.9 16a8 8 0 0 1-13.2 2L4 13" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
        >
            <path d="M10 17l5-5-5-5" />

            <path d="M15 12H3" />

            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
            aria-hidden="true"
        >
            <circle
                cx="11"
                cy="11"
                r="7"
            />

            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

function ChevronIcon({
    expanded,
}: {
    expanded: boolean;
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={[
                'size-4 transition-transform',
                expanded
                    ? 'rotate-180'
                    : '',
            ].join(' ')}
            aria-hidden="true"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
        >
            <path d="M12 20h9" />

            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
            />

            <path d="m3 7 9 6 9-6" />
        </svg>
    );
}

function DeliveredIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
            aria-hidden="true"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}

function formatMoney(
    amount: number,
    currency: string,
): string {
    return new Intl.NumberFormat(
        'en-US',
        {
            style:
                'currency',

            currency:
                currency.toUpperCase(),
        },
    ).format(
        amount /
        100,
    );
}

function formatDate(
    value: string,
): string {
    const date =
        new Date(
            value,
        );

    const datePart =
        new Intl.DateTimeFormat(
            'en-US',
            {
                month:
                    'short',

                day:
                    'numeric',

                year:
                    'numeric',
            },
        ).format(
            date,
        );

    const timePart =
        new Intl.DateTimeFormat(
            'en-US',
            {
                hour:
                    'numeric',

                minute:
                    '2-digit',
            },
        ).format(
            date,
        );

    return `${datePart} at ${timePart}`;
}

function formatAddress(
    order:
        AdminOrder,
): string {
    const address =
        order.shippingAddress;

    if (
        !address
    ) {
        return 'Shipping address unavailable';
    }

    const cityLine =
        [
            address.city,
            address.state,
            address.postalCode,
        ]
            .filter(
                Boolean,
            )
            .join(
                ' ',
            );

    return [
        address.name,
        address.line1,
        address.line2,
        cityLine,
        address.country,
    ]
        .filter(
            Boolean,
        )
        .join(
            '\n',
        );
}

function formatStatusLabel(
    value: string,
): string {
    return value
        .split(
            /[-_]/,
        )
        .filter(
            Boolean,
        )
        .map(
            (
                part,
            ) =>
                `${part
                    .charAt(
                        0,
                    )
                    .toUpperCase()}${part.slice(
                        1,
                    )}`,
        )
        .join(
            ' ',
        );
}

function PaymentBadge({
    status,
}: {
    status:
    AdminOrder[
    'paymentStatus'
    ];
}) {
    const className =
        status ===
            'paid'
            ? 'bg-success-50 text-success-700'
            : status ===
                'failed'
                ? 'bg-danger-50 text-danger-700'
                : 'bg-accent-50 text-accent-700';

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-extrabold ${className}`}
        >
            {formatStatusLabel(
                status,
            )}
        </span>
    );
}

function FulfillmentBadge({
    status,
}: {
    status:
    AdminOrder[
    'fulfillmentStatus'
    ];
}) {
    const className =
        status ===
            'delivered'
            ? 'bg-success-50 text-success-700'
            : status ===
                'shipped'
                ? 'bg-brand-50 text-brand-700'
                : status ===
                    'cancelled'
                    ? 'bg-danger-50 text-danger-700'
                    : 'bg-accent-50 text-accent-700';

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-extrabold ${className}`}
        >
            {formatStatusLabel(
                status,
            )}
        </span>
    );
}

function RefundBadge({
    status,
}: {
    status:
    AdminOrder[
    'refundStatus'
    ];
}) {
    if (
        status ===
        'none'
    ) {
        return null;
    }

    const className =
        status ===
            'refunded'
            ? 'bg-success-50 text-success-700'
            : status ===
                'partially-refunded'
                ? 'bg-brand-50 text-brand-700'
                : status ===
                    'failed'
                    ? 'bg-danger-50 text-danger-700'
                    : status ===
                        'canceled'
                        ? 'bg-danger-50 text-danger-700'
                        : 'bg-accent-50 text-accent-700';

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-extrabold ${className}`}
        >
            {formatStatusLabel(
                status,
            )}
        </span>
    );
}

function OrderIdentity({
    order,
}: {
    order:
    AdminOrder;
}) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                {
                    order.reference
                }
            </p>

            <h2 className="mt-2 text-2xl text-ink-900">
                {
                    order.customer
                        ?.name ??
                    'Customer'
                }
            </h2>

            <p className="mt-1 break-all text-sm text-ink-600">
                {
                    order.customer
                        ?.email ??
                    'Email unavailable'
                }
            </p>

            <p className="mt-3 text-xs font-bold text-ink-500">
                {formatDate(
                    order.createdAt,
                )}
            </p>
        </div>
    );
}

function OrderDetails({
    order,
}: {
    order:
    AdminOrder;
}) {
    const itemCount =
        order.items.reduce(
            (
                total,
                item,
            ) =>
                total +
                item.quantity,
            0,
        );

    return (
        <>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <div>
                    <h3 className="text-sm font-extrabold text-ink-900">
                        Items ({itemCount})
                    </h3>

                    <div className="mt-3 grid gap-2">
                        {order.items.map(
                            (
                                item,
                            ) => (
                                <div
                                    key={`${item.productSlug}-${item.variantId ?? 'default'}`}
                                    className="flex justify-between gap-4 text-sm"
                                >
                                    <span className="text-ink-700">
                                        {
                                            item.quantity
                                        }
                                        {' × '}
                                        {
                                            item.productName
                                        }
                                        {item.variantLabel
                                            ? ` — ${item.variantLabel}`
                                            : ''}
                                    </span>

                                    <strong className="shrink-0 text-ink-900">
                                        {formatMoney(
                                            item.lineTotalAmount,
                                            item.currency,
                                        )}
                                    </strong>
                                </div>
                            ),
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-extrabold text-ink-900">
                        Shipping address
                    </h3>

                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-600">
                        {formatAddress(
                            order,
                        )}
                    </p>
                </div>
            </div>

            <dl className="mt-6 grid gap-2 rounded-2xl bg-cream-soft p-4 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="font-bold text-ink-600">
                        Merchandise
                    </dt>

                    <dd className="font-black text-ink-900">
                        {formatMoney(
                            order.amountSubtotal,
                            order.currency,
                        )}
                    </dd>
                </div>

                {order.amountDiscount >
                    0 && (
                        <div className="flex justify-between gap-4">
                            <dt className="font-bold text-ink-600">
                                Discount
                            </dt>

                            <dd className="font-black text-ink-900">
                                −
                                {formatMoney(
                                    order.amountDiscount,
                                    order.currency,
                                )}
                            </dd>
                        </div>
                    )}

                <div className="flex justify-between gap-4">
                    <dt className="font-bold text-ink-600">
                        Shipping collected
                    </dt>

                    <dd className="font-black text-ink-900">
                        {formatMoney(
                            order.amountShipping,
                            order.currency,
                        )}
                    </dd>
                </div>

                {order.fulfillment && (
                    <div className="flex justify-between gap-4">
                        <dt className="font-bold text-ink-600">
                            Actual postage
                        </dt>

                        <dd className="font-black text-ink-900">
                            {formatMoney(
                                order
                                    .fulfillment
                                    .postageAmount,
                                order.currency,
                            )}
                        </dd>
                    </div>
                )}

                <div className="flex justify-between gap-4">
                    <dt className="font-bold text-ink-600">
                        Tax
                    </dt>

                    <dd className="font-black text-ink-900">
                        {formatMoney(
                            order.amountTax,
                            order.currency,
                        )}
                    </dd>
                </div>

                {order.amountRefunded >
                    0 && (
                        <div className="flex justify-between gap-4">
                            <dt className="font-bold text-ink-600">
                                Refunded
                            </dt>

                            <dd className="font-black text-success-700">
                                −
                                {formatMoney(
                                    order.amountRefunded,
                                    order.currency,
                                )}
                            </dd>
                        </div>
                    )}

                <div className="flex justify-between gap-4 border-t border-sand pt-2">
                    <dt className="font-black text-ink-900">
                        Total
                    </dt>

                    <dd className="text-lg font-black text-ink-900">
                        {formatMoney(
                            order.amountTotal,
                            order.currency,
                        )}
                    </dd>
                </div>
            </dl>
        </>
    );
}

function FulfillmentDetails({
    order,
}: {
    order:
    AdminOrder;
}) {
    const fulfillment =
        order.fulfillment;

    if (
        !fulfillment
    ) {
        return null;
    }

    return (
        <section className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold tracking-[0.07em] text-brand-700 uppercase">
                        Shipment information
                    </p>

                    <p className="mt-2 font-extrabold text-ink-900">
                        {
                            fulfillment.carrier
                        }
                        {fulfillment.service
                            ? ` — ${fulfillment.service}`
                            : ''}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-ink-700">
                        Tracking:{' '}
                        <strong>
                            {
                                fulfillment
                                    .trackingNumber
                            }
                        </strong>
                    </p>

                    {fulfillment
                        .trackingUrl && (
                            <a
                                href={
                                    fulfillment
                                        .trackingUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-sm font-extrabold text-brand-700 underline decoration-brand-300 underline-offset-4"
                            >
                                Open carrier tracking
                            </a>
                        )}
                </div>

                <dl className="grid shrink-0 gap-1 text-sm">
                    <div className="flex gap-3 sm:justify-between">
                        <dt className="font-bold text-ink-600">
                            Postage:
                        </dt>

                        <dd className="font-black text-ink-900">
                            {formatMoney(
                                fulfillment
                                    .postageAmount,
                                order.currency,
                            )}
                        </dd>
                    </div>

                    <div className="flex gap-3 sm:justify-between">
                        <dt className="font-bold text-ink-600">
                            Shipped:
                        </dt>

                        <dd className="font-black text-ink-900">
                            {formatDate(
                                fulfillment
                                    .shippedAt,
                            )}
                        </dd>
                    </div>

                    {fulfillment
                        .deliveredAt && (
                            <div className="flex gap-3 sm:justify-between">
                                <dt className="font-bold text-ink-600">
                                    Delivered:
                                </dt>

                                <dd className="font-black text-ink-900">
                                    {formatDate(
                                        fulfillment
                                            .deliveredAt,
                                    )}
                                </dd>
                            </div>
                        )}
                </dl>
            </div>
        </section>
    );
}

function RefundDetails({
    order,
}: {
    order:
    AdminOrder;
}) {
    const [
        copied,
        setCopied,
    ] =
        useState(
            false,
        );

    const [
        copyError,
        setCopyError,
    ] =
        useState(
            '',
        );

    if (
        !order.paymentIntentId &&
        order.refundStatus ===
        'none'
    ) {
        return null;
    }

    const stripePaymentUrl =
        order.paymentIntentId
            ? order.livemode
                ? `https://dashboard.stripe.com/payments/${encodeURIComponent(
                    order.paymentIntentId,
                )}`
                : `https://dashboard.stripe.com/test/payments/${encodeURIComponent(
                    order.paymentIntentId,
                )}`
            : undefined;

    async function copyPaymentIntent() {
        if (
            !order.paymentIntentId
        ) {
            return;
        }

        setCopyError(
            '',
        );

        try {
            await navigator.clipboard.writeText(
                order.paymentIntentId,
            );

            setCopied(
                true,
            );

            window.setTimeout(
                () => {
                    setCopied(
                        false,
                    );
                },
                1800,
            );
        } catch {
            setCopyError(
                'The PaymentIntent could not be copied automatically.',
            );
        }
    }

    return (
        <section className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold tracking-[0.07em] text-accent-700 uppercase">
                        Stripe payment and refunds
                    </p>

                    <p className="mt-2 text-sm font-bold leading-6 text-ink-700">
                        Refunds are issued only inside Stripe. This dashboard displays Stripe&apos;s synchronized financial status.
                    </p>
                </div>

                <RefundBadge
                    status={
                        order.refundStatus
                    }
                />
            </div>

            {order.paymentIntentId && (
                <div className="mt-4 rounded-2xl border border-accent-200 bg-white-warm p-4">
                    <p className="text-xs font-extrabold text-ink-600 uppercase">
                        PaymentIntent
                    </p>

                    <p className="mt-2 break-all font-mono text-sm font-bold text-ink-900">
                        {
                            order.paymentIntentId
                        }
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="rounded-full border border-accent-300 bg-white-warm px-4 py-2 text-sm font-extrabold text-accent-800 transition hover:bg-accent-50"
                            onClick={() => {
                                void copyPaymentIntent();
                            }}
                        >
                            {copied
                                ? 'Copied'
                                : 'Copy Payment ID'}
                        </button>

                        {stripePaymentUrl && (
                            <a
                                href={
                                    stripePaymentUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-full bg-accent-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-accent-700"
                            >
                                Open in Stripe
                            </a>
                        )}
                    </div>

                    {copyError && (
                        <p className="mt-3 text-xs font-bold text-danger-700">
                            {copyError}
                        </p>
                    )}
                </div>
            )}

            <dl className="mt-4 grid gap-2 rounded-2xl bg-white-warm p-4 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="font-bold text-ink-600">
                        Order total
                    </dt>

                    <dd className="font-black text-ink-900">
                        {formatMoney(
                            order.amountTotal,
                            order.currency,
                        )}
                    </dd>
                </div>

                <div className="flex justify-between gap-4">
                    <dt className="font-bold text-ink-600">
                        Refunded
                    </dt>

                    <dd className="font-black text-success-700">
                        {formatMoney(
                            order.amountRefunded,
                            order.currency,
                        )}
                    </dd>
                </div>

                {order.amountRefundPending >
                    0 && (
                        <div className="flex justify-between gap-4">
                            <dt className="font-bold text-ink-600">
                                Pending
                            </dt>

                            <dd className="font-black text-accent-700">
                                {formatMoney(
                                    order.amountRefundPending,
                                    order.currency,
                                )}
                            </dd>
                        </div>
                    )}

                <div className="flex justify-between gap-4 border-t border-accent-200 pt-2">
                    <dt className="font-black text-ink-900">
                        Remaining refundable
                    </dt>

                    <dd className="font-black text-ink-900">
                        {formatMoney(
                            order.amountRefundable,
                            order.currency,
                        )}
                    </dd>
                </div>
            </dl>

            {order.refunds.length >
                0 && (
                    <div className="mt-4 grid gap-3">
                        <h3 className="text-sm font-extrabold text-ink-900">
                            Stripe refund history
                        </h3>

                        {order.refunds.map(
                            (
                                refund,
                            ) => (
                                <article
                                    key={
                                        refund.stripeRefundId
                                    }
                                    className="rounded-2xl border border-accent-200 bg-white-warm p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="break-all font-mono text-xs font-bold text-ink-700">
                                                {
                                                    refund.stripeRefundId
                                                }
                                            </p>

                                            <p className="mt-2 text-lg font-black text-ink-900">
                                                {formatMoney(
                                                    refund.amount,
                                                    refund.currency,
                                                )}
                                            </p>

                                            <p className="mt-1 text-xs font-bold text-ink-500">
                                                {formatDate(
                                                    refund.createdAt,
                                                )}
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-extrabold text-accent-700">
                                            {formatStatusLabel(
                                                refund.status,
                                            )}
                                        </span>
                                    </div>

                                    {refund.reason && (
                                        <p className="mt-3 text-sm text-ink-700">
                                            <strong>
                                                Reason:
                                            </strong>{' '}
                                            {formatStatusLabel(
                                                refund.reason,
                                            )}
                                        </p>
                                    )}

                                    {refund.pendingReason && (
                                        <p className="mt-2 text-sm font-bold text-accent-700">
                                            Pending reason:{' '}
                                            {formatStatusLabel(
                                                refund.pendingReason,
                                            )}
                                        </p>
                                    )}

                                    {refund.failureReason && (
                                        <p className="mt-2 text-sm font-bold text-danger-700">
                                            Failure reason:{' '}
                                            {formatStatusLabel(
                                                refund.failureReason,
                                            )}
                                        </p>
                                    )}

                                    {refund.reference && (
                                        <p className="mt-2 break-all text-sm text-ink-700">
                                            <strong>
                                                Bank reference:
                                            </strong>{' '}
                                            {
                                                refund.reference
                                            }
                                        </p>
                                    )}

                                    {refund.referenceType && (
                                        <p className="mt-1 text-xs font-bold text-ink-500">
                                            Reference type:{' '}
                                            {formatStatusLabel(
                                                refund.referenceType,
                                            )}
                                        </p>
                                    )}

                                    {refund.receiptNumber && (
                                        <p className="mt-1 break-all text-xs font-bold text-ink-500">
                                            Receipt number:{' '}
                                            {
                                                refund.receiptNumber
                                            }
                                        </p>
                                    )}
                                </article>
                            ),
                        )}
                    </div>
                )}
        </section>
    );
}

interface FulfillmentFormProps {
    order:
    AdminOrder;

    token: string;

    mode:
    | 'create'
    | 'edit';

    onUpdated:
    (
        order:
            AdminOrder,
    ) => void;

    onSaved?:
    () => void;
}

function FulfillmentForm({
    order,
    token,
    mode,
    onUpdated,
    onSaved,
}: FulfillmentFormProps) {
    const fulfillment =
        order.fulfillment;

    const [
        carrier,
        setCarrier,
    ] =
        useState<
            OrderCarrier
        >(
            fulfillment
                ?.carrier ??
            'USPS',
        );

    const [
        service,
        setService,
    ] =
        useState(
            fulfillment
                ?.service ??
            '',
        );

    const [
        trackingNumber,
        setTrackingNumber,
    ] =
        useState(
            fulfillment
                ?.trackingNumber ??
            '',
        );

    const [
        trackingUrl,
        setTrackingUrl,
    ] =
        useState(
            fulfillment
                ?.trackingUrl ??
            '',
        );

    const [
        postage,
        setPostage,
    ] =
        useState(
            typeof fulfillment
                ?.postageAmount ===
                'number'
                ? (
                    fulfillment
                        .postageAmount /
                    100
                ).toFixed(
                    2,
                )
                : '',
        );

    const [
        busy,
        setBusy,
    ] =
        useState(
            false,
        );

    const [
        message,
        setMessage,
    ] =
        useState(
            '',
        );

    async function submit(
        event:
            Event,
    ) {
        event.preventDefault();

        const postageNumber =
            Number(
                postage,
            );

        if (
            !Number.isFinite(
                postageNumber,
            ) ||
            postageNumber < 0
        ) {
            setMessage(
                'Enter the postage amount you actually paid.',
            );

            return;
        }

        setBusy(
            true,
        );

        setMessage(
            '',
        );

        const payload:
            AdminFulfillOrderRequest = {
            action:
                'save-fulfillment',

            sessionId:
                order.sessionId,

            carrier,

            service,

            trackingNumber,

            trackingUrl,

            postageAmount:
                Math.round(
                    postageNumber *
                    100,
                ),

            sendEmail:
                mode ===
                'create',
        };

        try {
            const response =
                await fetch(
                    '/api/admin/fulfill-order',
                    {
                        method:
                            'POST',

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                'application/json',

                            'Content-Type':
                                'application/json',
                        },

                        body:
                            JSON.stringify(
                                payload,
                            ),
                    },
                );

            const result =
                (await response
                    .json()
                    .catch(
                        () => null,
                    )) as
                | AdminFulfillOrderResponse
                | null;

            if (
                !response.ok ||
                !result ||
                result.ok !==
                true
            ) {
                throw new Error(
                    result &&
                        result.ok ===
                        false
                        ? result.message
                        : 'The order could not be updated.',
                );
            }

            setMessage(
                result.message,
            );

            onUpdated(
                result.order,
            );

            onSaved?.();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : 'The fulfillment update failed.',
            );
        } finally {
            setBusy(
                false,
            );
        }
    }

    return (
        <form
            className="mt-5 grid gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-4"
            onSubmit={
                submit
            }
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                    <span className="text-xs font-extrabold tracking-[0.06em] text-ink-600 uppercase">
                        Carrier
                    </span>

                    <select
                        className="form-control"
                        value={
                            carrier
                        }
                        onChange={(
                            event,
                        ) => {
                            setCarrier(
                                event
                                    .currentTarget
                                    .value as
                                OrderCarrier,
                            );
                        }}
                    >
                        <option value="USPS">
                            USPS
                        </option>

                        <option value="UPS">
                            UPS
                        </option>

                        <option value="FedEx">
                            FedEx
                        </option>

                        <option value="Other">
                            Other
                        </option>
                    </select>
                </label>

                <label className="grid gap-1.5">
                    <span className="text-xs font-extrabold tracking-[0.06em] text-ink-600 uppercase">
                        Service
                    </span>

                    <input
                        className="form-control"
                        type="text"
                        placeholder="Ground Advantage"
                        value={
                            service
                        }
                        onInput={(
                            event,
                        ) => {
                            setService(
                                event
                                    .currentTarget
                                    .value,
                            );
                        }}
                    />
                </label>
            </div>

            <label className="grid gap-1.5">
                <span className="text-xs font-extrabold tracking-[0.06em] text-ink-600 uppercase">
                    Tracking number
                </span>

                <input
                    className="form-control"
                    type="text"
                    required
                    value={
                        trackingNumber
                    }
                    onInput={(
                        event,
                    ) => {
                        setTrackingNumber(
                            event
                                .currentTarget
                                .value,
                        );
                    }}
                />
            </label>

            <label className="grid gap-1.5">
                <span className="text-xs font-extrabold tracking-[0.06em] text-ink-600 uppercase">
                    Tracking URL
                </span>

                <input
                    className="form-control"
                    type="url"
                    placeholder="https://..."
                    value={
                        trackingUrl
                    }
                    onInput={(
                        event,
                    ) => {
                        setTrackingUrl(
                            event
                                .currentTarget
                                .value,
                        );
                    }}
                />

                <span className="text-xs text-ink-500">
                    Optional. Paste the tracking link provided by the carrier or shipping-label website.
                </span>
            </label>

            <label className="grid gap-1.5">
                <span className="text-xs font-extrabold tracking-[0.06em] text-ink-600 uppercase">
                    Actual postage paid
                </span>

                <div className="relative">
                    <span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-ink-500">
                        $
                    </span>

                    <input
                        className="form-control pl-8"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="8.47"
                        value={
                            postage
                        }
                        onInput={(
                            event,
                        ) => {
                            setPostage(
                                event
                                    .currentTarget
                                    .value,
                            );
                        }}
                    />
                </div>
            </label>

            <button
                type="submit"
                disabled={
                    busy
                }
                className="min-h-12 rounded-full bg-brand-500 px-5 font-extrabold text-white shadow-blue transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {busy
                    ? 'Saving…'
                    : mode ===
                        'create'
                        ? 'Mark Shipped & Email Customer'
                        : 'Save Shipment Changes'}
            </button>

            {mode ===
                'edit' && (
                    <p className="text-xs font-bold leading-5 text-ink-600">
                        Saving changes does not send another email. Use the separate Resend Shipping Email action after reviewing the updated information.
                    </p>
                )}

            {message && (
                <p className="text-sm font-bold leading-6 text-ink-700">
                    {message}
                </p>
            )}
        </form>
    );
}

interface FulfilledOrderCardProps {
    order:
    AdminOrder;

    token: string;

    onUpdated:
    (
        order:
            AdminOrder,
    ) => void;
}

function FulfilledOrderCard({
    order,
    token,
    onUpdated,
}: FulfilledOrderCardProps) {
    const [
        expanded,
        setExpanded,
    ] =
        useState(
            false,
        );

    const [
        editing,
        setEditing,
    ] =
        useState(
            false,
        );

    const [
        busyAction,
        setBusyAction,
    ] =
        useState<
            | 'resend'
            | 'delivered'
            | null
        >(
            null,
        );

    const [
        actionMessage,
        setActionMessage,
    ] =
        useState(
            '',
        );

    async function runAction(
        action:
            | 'resend-shipping-email'
            | 'mark-delivered',
    ) {
        setBusyAction(
            action ===
                'resend-shipping-email'
                ? 'resend'
                : 'delivered',
        );

        setActionMessage(
            '',
        );

        const payload:
            AdminFulfillOrderRequest = {
            action,

            sessionId:
                order.sessionId,
        };

        try {
            const response =
                await fetch(
                    '/api/admin/fulfill-order',
                    {
                        method:
                            'POST',

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            Accept:
                                'application/json',

                            'Content-Type':
                                'application/json',
                        },

                        body:
                            JSON.stringify(
                                payload,
                            ),
                    },
                );

            const result =
                (await response
                    .json()
                    .catch(
                        () => null,
                    )) as
                | AdminFulfillOrderResponse
                | null;

            if (
                !response.ok ||
                !result ||
                result.ok !==
                true
            ) {
                throw new Error(
                    result &&
                        result.ok ===
                        false
                        ? result.message
                        : 'The order action could not be completed.',
                );
            }

            onUpdated(
                result.order,
            );

            setActionMessage(
                result.message,
            );
        } catch (error) {
            setActionMessage(
                error instanceof Error
                    ? error.message
                    : 'The order action failed.',
            );
        } finally {
            setBusyAction(
                null,
            );
        }
    }

    const canEdit =
        order.fulfillmentStatus ===
        'shipped' &&
        order.refundStatus !==
        'refunded';

    const canMarkDelivered =
        order.fulfillmentStatus ===
        'shipped' &&
        order.refundStatus !==
        'refunded';

    return (
        <article className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <OrderIdentity
                    order={
                        order
                    }
                />

                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <div className="flex flex-wrap gap-2">
                        <PaymentBadge
                            status={
                                order.paymentStatus
                            }
                        />

                        <FulfillmentBadge
                            status={
                                order
                                    .fulfillmentStatus
                            }
                        />

                        <RefundBadge
                            status={
                                order.refundStatus
                            }
                        />
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-extrabold text-brand-800 transition hover:border-brand-400 hover:bg-brand-100"
                        onClick={() => {
                            setExpanded(
                                (
                                    current,
                                ) =>
                                    !current,
                            );

                            if (
                                expanded
                            ) {
                                setEditing(
                                    false,
                                );
                            }
                        }}
                        aria-expanded={
                            expanded
                        }
                    >
                        {expanded
                            ? 'Hide Details'
                            : 'View Details'}

                        <ChevronIcon
                            expanded={
                                expanded
                            }
                        />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="mt-5 border-t border-sand pt-5">
                    <OrderDetails
                        order={
                            order
                        }
                    />

                    <FulfillmentDetails
                        order={
                            order
                        }
                    />

                    <RefundDetails
                        order={
                            order
                        }
                    />

                    <div className="mt-5 flex flex-wrap gap-2">
                        {canEdit && (
                            <button
                                type="button"
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-300 bg-white-warm px-4 text-sm font-extrabold text-brand-800 transition hover:bg-brand-50"
                                onClick={() => {
                                    setEditing(
                                        (
                                            current,
                                        ) =>
                                            !current,
                                    );
                                }}
                            >
                                <EditIcon />

                                {editing
                                    ? 'Cancel Editing'
                                    : 'Edit Shipment'}
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={
                                busyAction !==
                                null
                            }
                            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-300 bg-white-warm px-4 text-sm font-extrabold text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => {
                                void runAction(
                                    'resend-shipping-email',
                                );
                            }}
                        >
                            <MailIcon />

                            {busyAction ===
                                'resend'
                                ? 'Sending…'
                                : 'Resend Shipping Email'}
                        </button>

                        {canMarkDelivered && (
                            <button
                                type="button"
                                disabled={
                                    busyAction !==
                                    null
                                }
                                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-success-100 bg-success-50 px-4 text-sm font-extrabold text-success-700 transition hover:bg-success-100 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => {
                                    void runAction(
                                        'mark-delivered',
                                    );
                                }}
                            >
                                <DeliveredIcon />

                                {busyAction ===
                                    'delivered'
                                    ? 'Updating…'
                                    : 'Mark Delivered'}
                            </button>
                        )}
                    </div>

                    {editing && (
                        <FulfillmentForm
                            order={
                                order
                            }
                            token={
                                token
                            }
                            mode="edit"
                            onUpdated={
                                onUpdated
                            }
                            onSaved={() => {
                                setEditing(
                                    false,
                                );

                                setActionMessage(
                                    'Shipment information updated.',
                                );
                            }}
                        />
                    )}

                    {actionMessage && (
                        <p className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm font-bold leading-6 text-ink-700">
                            {actionMessage}
                        </p>
                    )}
                </div>
            )}
        </article>
    );
}

interface OrderCardProps {
    order:
    AdminOrder;

    token: string;

    onUpdated:
    (
        order:
            AdminOrder,
    ) => void;
}

function OrderCard({
    order,
    token,
    onUpdated,
}: OrderCardProps) {
    const isFulfilled =
        order.fulfillmentStatus ===
        'shipped' ||
        order.fulfillmentStatus ===
        'delivered';

    if (
        isFulfilled
    ) {
        return (
            <FulfilledOrderCard
                order={
                    order
                }
                token={
                    token
                }
                onUpdated={
                    onUpdated
                }
            />
        );
    }

    return (
        <article className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-4 border-b border-sand pb-5 sm:flex-row sm:items-start sm:justify-between">
                <OrderIdentity
                    order={
                        order
                    }
                />

                <div className="flex flex-wrap gap-2">
                    <PaymentBadge
                        status={
                            order.paymentStatus
                        }
                    />

                    <FulfillmentBadge
                        status={
                            order
                                .fulfillmentStatus
                        }
                    />

                    <RefundBadge
                        status={
                            order.refundStatus
                        }
                    />
                </div>
            </div>

            <OrderDetails
                order={
                    order
                }
            />

            <RefundDetails
                order={
                    order
                }
            />

            {order.paymentStatus ===
                'paid' &&
                order.fulfillmentStatus !==
                'cancelled' &&
                order.refundStatus !==
                'refunded' && (
                    <FulfillmentForm
                        order={
                            order
                        }
                        token={
                            token
                        }
                        mode="create"
                        onUpdated={
                            onUpdated
                        }
                    />
                )}
        </article>
    );
}

function matchesFilter(
    order:
        AdminOrder,

    filter:
        OrderFilter,
): boolean {
    if (
        filter ===
        'all'
    ) {
        return true;
    }

    if (
        filter ===
        'needs-fulfillment'
    ) {
        return (
            order.paymentStatus ===
            'paid' &&
            order.refundStatus !==
            'refunded' &&
            (
                order
                    .fulfillmentStatus ===
                'unfulfilled' ||
                order
                    .fulfillmentStatus ===
                'processing'
            )
        );
    }

    if (
        filter ===
        'refund-attention'
    ) {
        return (
            order.refundStatus ===
            'pending' ||
            order.refundStatus ===
            'failed' ||
            order.refundStatus ===
            'canceled'
        );
    }

    if (
        filter ===
        'partially-refunded'
    ) {
        return (
            order.refundStatus ===
            'partially-refunded'
        );
    }

    if (
        filter ===
        'refunded'
    ) {
        return (
            order.refundStatus ===
            'refunded'
        );
    }

    return (
        order
            .fulfillmentStatus ===
        filter
    );
}

function matchesSearch(
    order:
        AdminOrder,

    query:
        string,
): boolean {
    const normalizedQuery =
        query
            .trim()
            .toLowerCase();

    if (
        !normalizedQuery
    ) {
        return true;
    }

    const refundSearchValues =
        order.refunds.flatMap(
            (
                refund,
            ) => [
                    refund.stripeRefundId,
                    refund.reason,
                    refund.failureReason,
                    refund.pendingReason,
                    refund.reference,
                    refund.referenceType,
                    refund.receiptNumber,
                ],
        );

    const searchableText =
        [
            order.reference,
            order.sessionId,
            order.paymentIntentId,
            order.refundStatus,
            order.customer
                ?.name,
            order.customer
                ?.email,
            order.customer
                ?.phone,
            order.fulfillment
                ?.trackingNumber,
            order.fulfillment
                ?.carrier,
            order.shippingAddress
                ?.city,
            order.shippingAddress
                ?.state,
            order.shippingAddress
                ?.postalCode,
            ...refundSearchValues,
        ]
            .filter(
                (
                    value,
                ): value is string =>
                    typeof value ===
                    'string' &&
                    value.length >
                    0,
            )
            .join(
                ' ',
            )
            .toLowerCase();

    return searchableText.includes(
        normalizedQuery,
    );
}

export default function AdminOrders() {
    const [
        token,
        setToken,
    ] =
        useState(
            '',
        );

    const [
        tokenInput,
        setTokenInput,
    ] =
        useState(
            '',
        );

    const [
        orders,
        setOrders,
    ] =
        useState<
            AdminOrder[]
        >(
            [],
        );

    const [
        loading,
        setLoading,
    ] =
        useState(
            false,
        );

    const [
        error,
        setError,
    ] =
        useState(
            '',
        );

    const [
        query,
        setQuery,
    ] =
        useState(
            '',
        );

    const [
        filter,
        setFilter,
    ] =
        useState<
            OrderFilter
        >(
            'needs-fulfillment',
        );

    async function loadOrders(
        adminToken: string,
    ) {
        setLoading(
            true,
        );

        setError(
            '',
        );

        try {
            const response =
                await fetch(
                    '/api/admin/orders',
                    {
                        headers: {
                            Authorization:
                                `Bearer ${adminToken}`,

                            Accept:
                                'application/json',
                        },
                    },
                );

            const payload =
                (await response
                    .json()
                    .catch(
                        () => null,
                    )) as
                | AdminOrdersResponse
                | null;

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
                        : 'Orders could not be loaded.',
                );
            }

            setOrders(
                payload.orders,
            );

            setToken(
                adminToken,
            );

            window.sessionStorage.setItem(
                ADMIN_TOKEN_KEY,
                adminToken,
            );
        } catch (loadError) {
            setOrders(
                [],
            );

            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Orders could not be loaded.',
            );
        } finally {
            setLoading(
                false,
            );
        }
    }

    function updateOrder(
        updatedOrder:
            AdminOrder,
    ) {
        setOrders(
            (
                current,
            ) =>
                current.map(
                    (
                        currentOrder,
                    ) =>
                        currentOrder
                            .sessionId ===
                            updatedOrder
                                .sessionId
                            ? updatedOrder
                            : currentOrder,
                ),
        );
    }

    useEffect(
        () => {
            const savedToken =
                window.sessionStorage.getItem(
                    ADMIN_TOKEN_KEY,
                );

            if (
                savedToken
            ) {
                setTokenInput(
                    savedToken,
                );

                void loadOrders(
                    savedToken,
                );
            }
        },
        [],
    );

    const counts =
        useMemo(
            () => ({
                all:
                    orders.length,

                needsFulfillment:
                    orders.filter(
                        (
                            order,
                        ) =>
                            matchesFilter(
                                order,
                                'needs-fulfillment',
                            ),
                    ).length,

                shipped:
                    orders.filter(
                        (
                            order,
                        ) =>
                            order
                                .fulfillmentStatus ===
                            'shipped',
                    ).length,

                delivered:
                    orders.filter(
                        (
                            order,
                        ) =>
                            order
                                .fulfillmentStatus ===
                            'delivered',
                    ).length,

                refundAttention:
                    orders.filter(
                        (
                            order,
                        ) =>
                            matchesFilter(
                                order,
                                'refund-attention',
                            ),
                    ).length,

                partiallyRefunded:
                    orders.filter(
                        (
                            order,
                        ) =>
                            order.refundStatus ===
                            'partially-refunded',
                    ).length,

                refunded:
                    orders.filter(
                        (
                            order,
                        ) =>
                            order.refundStatus ===
                            'refunded',
                    ).length,
            }),
            [
                orders,
            ],
        );

    const visibleOrders =
        useMemo(
            () =>
                orders.filter(
                    (
                        order,
                    ) =>
                        matchesFilter(
                            order,
                            filter,
                        ) &&
                        matchesSearch(
                            order,
                            query,
                        ),
                ),
            [
                orders,
                filter,
                query,
            ],
        );

    if (
        !token
    ) {
        return (
            <section className="mx-auto max-w-xl rounded-[2.5rem] border border-brand-200 bg-white-warm p-6 shadow-card sm:p-8">
                <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                    MaxiPawz Admin
                </p>

                <h1 className="mt-3 text-3xl text-ink-900">
                    Order fulfillment
                </h1>

                <p className="mt-3 text-sm leading-6 text-ink-600">
                    Enter the private administrator token to access Sandbox orders.
                </p>

                <form
                    className="mt-6 grid gap-4"
                    onSubmit={(
                        event,
                    ) => {
                        event.preventDefault();

                        void loadOrders(
                            tokenInput,
                        );
                    }}
                >
                    <label className="grid gap-1.5">
                        <span className="form-label">
                            Administrator token
                        </span>

                        <input
                            className="form-control"
                            type="password"
                            autoComplete="off"
                            required
                            value={
                                tokenInput
                            }
                            onInput={(
                                event,
                            ) => {
                                setTokenInput(
                                    event
                                        .currentTarget
                                        .value,
                                );
                            }}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={
                            loading
                        }
                        className="min-h-12 rounded-full bg-brand-500 px-5 font-extrabold text-white shadow-blue disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading
                            ? 'Loading…'
                            : 'Open Orders'}
                    </button>
                </form>

                {error && (
                    <p className="mt-4 rounded-2xl border border-danger-100 bg-danger-50 p-3 text-sm font-bold text-danger-700">
                        {error}
                    </p>
                )}
            </section>
        );
    }

    const filters:
        Array<{
            value:
            OrderFilter;

            label:
            string;

            count:
            number;
        }> = [
            {
                value:
                    'needs-fulfillment',

                label:
                    'Needs Fulfillment',

                count:
                    counts
                        .needsFulfillment,
            },

            {
                value:
                    'shipped',

                label:
                    'Shipped',

                count:
                    counts.shipped,
            },

            {
                value:
                    'delivered',

                label:
                    'Delivered',

                count:
                    counts.delivered,
            },

            {
                value:
                    'refund-attention',

                label:
                    'Refund Attention',

                count:
                    counts
                        .refundAttention,
            },

            {
                value:
                    'partially-refunded',

                label:
                    'Partial Refunds',

                count:
                    counts
                        .partiallyRefunded,
            },

            {
                value:
                    'refunded',

                label:
                    'Refunded',

                count:
                    counts.refunded,
            },

            {
                value:
                    'all',

                label:
                    'All Orders',

                count:
                    counts.all,
            },
        ];

    return (
        <section>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                        MaxiPawz Admin
                    </p>

                    <h1 className="mt-2 text-4xl text-ink-900">
                        Sandbox Orders
                    </h1>

                    <p className="mt-2 text-sm text-ink-600">
                        {
                            orders.length
                        }{' '}
                        {
                            orders.length ===
                                1
                                ? 'order'
                                : 'orders'
                        }
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={
                            loading
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-white-warm px-4 py-2 text-sm font-extrabold text-brand-800 transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => {
                            void loadOrders(
                                token,
                            );
                        }}
                    >
                        <RefreshIcon />

                        {loading
                            ? 'Refreshing…'
                            : 'Refresh'}
                    </button>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-sand-dark bg-white-warm px-4 py-2 text-sm font-extrabold text-ink-700 transition hover:bg-cream-soft"
                        onClick={() => {
                            window.sessionStorage.removeItem(
                                ADMIN_TOKEN_KEY,
                            );

                            setToken(
                                '',
                            );

                            setTokenInput(
                                '',
                            );

                            setOrders(
                                [],
                            );

                            setQuery(
                                '',
                            );

                            setFilter(
                                'needs-fulfillment',
                            );
                        }}
                    >
                        <LogoutIcon />

                        Lock
                    </button>
                </div>
            </div>

            <div className="mb-6 rounded-3xl border border-sand bg-white-warm p-4 shadow-soft">
                <label className="relative block">
                    <span className="sr-only">
                        Search orders
                    </span>

                    <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-500">
                        <SearchIcon />
                    </span>

                    <input
                        type="search"
                        className="form-control pl-12"
                        placeholder="Search order, customer, tracking, payment, or refund…"
                        value={
                            query
                        }
                        onInput={(
                            event,
                        ) => {
                            setQuery(
                                event
                                    .currentTarget
                                    .value,
                            );
                        }}
                    />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                    {filters.map(
                        (
                            option,
                        ) => {
                            const selected =
                                filter ===
                                option.value;

                            return (
                                <button
                                    key={
                                        option.value
                                    }
                                    type="button"
                                    aria-pressed={
                                        selected
                                    }
                                    className={[
                                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition',
                                        selected
                                            ? 'border-brand-500 bg-brand-500 text-white shadow-blue'
                                            : 'border-brand-200 bg-brand-50 text-brand-800 hover:border-brand-400',
                                    ].join(' ')}
                                    onClick={() => {
                                        setFilter(
                                            option.value,
                                        );
                                    }}
                                >
                                    {
                                        option.label
                                    }

                                    <span
                                        className={[
                                            'rounded-full px-2 py-0.5 text-xs',
                                            selected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-white-warm text-brand-700',
                                        ].join(' ')}
                                    >
                                        {
                                            option.count
                                        }
                                    </span>
                                </button>
                            );
                        },
                    )}
                </div>
            </div>

            {error && (
                <p className="mb-5 rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm font-bold text-danger-700">
                    {error}
                </p>
            )}

            {visibleOrders.length ===
                0 ? (
                <div className="rounded-[2.5rem] border border-sand bg-white-warm p-8 text-center shadow-card">
                    <h2 className="text-2xl text-ink-900">
                        No matching orders.
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-ink-600">
                        Try another search or order-status filter.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {visibleOrders.map(
                        (
                            order,
                        ) => (
                            <OrderCard
                                key={
                                    order.sessionId
                                }
                                order={
                                    order
                                }
                                token={
                                    token
                                }
                                onUpdated={
                                    updateOrder
                                }
                            />
                        ),
                    )}
                </div>
            )}
        </section>
    );
}