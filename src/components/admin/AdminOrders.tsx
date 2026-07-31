import {
    useEffect,
    useState,
} from 'preact/hooks';

import type {
    AdminFulfillOrderResponse,
    AdminOrder,
    AdminOrdersResponse,
} from '../../types/admin-order';

import type {
    OrderCarrier,
} from '../../types/order';

const ADMIN_TOKEN_KEY =
    'maxipawz-admin-token';

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
    return new Intl.DateTimeFormat(
        'en-US',
        {
            dateStyle:
                'medium',

            timeStyle:
                'short',
        },
    ).format(
        new Date(
            value,
        ),
    );
}

function formatAddress(
    order:
        AdminOrder,
): string {
    const address =
        order.shippingAddress;

    if (!address) {
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

interface FulfillmentFormProps {
    order:
    AdminOrder;

    token: string;

    onUpdated:
    (
        order:
            AdminOrder,
    ) => void;
}

function FulfillmentForm({
    order,
    token,
    onUpdated,
}: FulfillmentFormProps) {
    const [
        carrier,
        setCarrier,
    ] =
        useState<
            OrderCarrier
        >(
            'USPS',
        );

    const [
        service,
        setService,
    ] =
        useState(
            '',
        );

    const [
        trackingNumber,
        setTrackingNumber,
    ] =
        useState(
            '',
        );

    const [
        trackingUrl,
        setTrackingUrl,
    ] =
        useState(
            '',
        );

    const [
        postage,
        setPostage,
    ] =
        useState(
            '',
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
                            JSON.stringify({
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
                            }),
                    },
                );

            const payload =
                (await response
                    .json()
                    .catch(
                        () => null,
                    )) as
                | AdminFulfillOrderResponse
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
                        : 'The order could not be updated.',
                );
            }

            onUpdated(
                payload.order,
            );

            if (
                payload.emailStatus ===
                'sent'
            ) {
                setMessage(
                    'Order marked shipped and shipping email sent.',
                );
            } else if (
                payload.emailStatus ===
                'failed'
            ) {
                setMessage(
                    'Order marked shipped, but the shipping email failed. Check Resend.',
                );
            } else {
                setMessage(
                    'Order marked shipped. Shipping email was skipped by the current email configuration.',
                );
            }
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
                    : 'Mark Shipped & Email Customer'}
            </button>

            {message && (
                <p className="text-sm font-bold leading-6 text-ink-700">
                    {message}
                </p>
            )}
        </form>
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

    const actualPostage =
        order.fulfillment
            ?.postageAmount;

    return (
        <article className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-4 border-b border-sand pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
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

                    <p className="mt-1 text-sm text-ink-600">
                        {
                            order.customer
                                ?.email ??
                            'Email unavailable'
                        }
                    </p>

                    <p className="mt-2 text-xs font-bold text-ink-500">
                        {formatDate(
                            order.createdAt,
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-extrabold text-success-700">
                        {
                            order.paymentStatus
                        }
                    </span>

                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
                        {
                            order.fulfillmentStatus
                        }
                    </span>
                </div>
            </div>

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

                {typeof actualPostage ===
                    'number' && (
                        <div className="flex justify-between gap-4">
                            <dt className="font-bold text-ink-600">
                                Actual postage
                            </dt>

                            <dd className="font-black text-ink-900">
                                {formatMoney(
                                    actualPostage,
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

            {order.fulfillmentStatus ===
                'shipped' &&
                order.fulfillment ? (
                <div className="mt-5 rounded-2xl border border-success-100 bg-success-50 p-4">
                    <p className="font-extrabold text-success-700">
                        Shipped
                    </p>

                    <p className="mt-2 text-sm leading-6 text-ink-700">
                        {
                            order.fulfillment
                                .carrier
                        }
                        {order.fulfillment
                            .service
                            ? ` — ${order.fulfillment.service}`
                            : ''}
                        <br />

                        Tracking:{' '}
                        <strong>
                            {
                                order.fulfillment
                                    .trackingNumber
                            }
                        </strong>
                    </p>

                    {order.fulfillment
                        .trackingUrl && (
                            <a
                                href={
                                    order.fulfillment
                                        .trackingUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex font-extrabold text-brand-700 underline"
                            >
                                Open tracking
                            </a>
                        )}
                </div>
            ) : (
                order.paymentStatus ===
                'paid' && (
                    <FulfillmentForm
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
                )
            )}
        </article>
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

    useEffect(
        () => {
            const savedToken =
                window.sessionStorage.getItem(
                    ADMIN_TOKEN_KEY,
                );

            if (savedToken) {
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

    if (!token) {
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
                        className="min-h-12 rounded-full bg-brand-500 px-5 font-extrabold text-white shadow-blue"
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
                        className="rounded-full border border-brand-300 bg-white-warm px-4 py-2 text-sm font-extrabold text-brand-800"
                        onClick={() => {
                            void loadOrders(
                                token,
                            );
                        }}
                    >
                        Refresh
                    </button>

                    <button
                        type="button"
                        className="rounded-full border border-sand-dark bg-white-warm px-4 py-2 text-sm font-extrabold text-ink-700"
                        onClick={() => {
                            window.sessionStorage.removeItem(
                                ADMIN_TOKEN_KEY,
                            );

                            setToken(
                                '',
                            );

                            setOrders(
                                [],
                            );
                        }}
                    >
                        Lock
                    </button>
                </div>
            </div>

            {error && (
                <p className="mb-5 rounded-2xl border border-danger-100 bg-danger-50 p-4 text-sm font-bold text-danger-700">
                    {error}
                </p>
            )}

            {orders.length ===
                0 ? (
                <div className="rounded-[2.5rem] border border-sand bg-white-warm p-8 text-center shadow-card">
                    <h2 className="text-2xl text-ink-900">
                        No Sandbox orders yet.
                    </h2>
                </div>
            ) : (
                <div className="grid gap-5">
                    {orders.map(
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
                                onUpdated={(
                                    updatedOrder,
                                ) => {
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
                                }}
                            />
                        ),
                    )}
                </div>
            )}
        </section>
    );
}