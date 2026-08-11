import {
    useEffect,
    useMemo,
    useState,
} from 'preact/hooks';

import type {
    AdminInventoryReservation,
    AdminInventoryReservationsData,
    AdminInventoryReservationsResponse,
} from '../../types/admin-inventory-reservation';

const ADMIN_TOKEN_KEY =
    'maxipawz-admin-token';

type ReservationFilter =
    | 'all'
    | 'holding'
    | 'active'
    | 'payment-pending'
    | 'completed'
    | 'released'
    | 'expired'
    | 'past-due';

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

function getStatusClass(
    reservation:
        AdminInventoryReservation,
): string {
    if (
        reservation
            .expirationPastDue
    ) {
        return 'bg-danger-50 text-danger-700';
    }

    switch (
    reservation.status
    ) {
        case 'active':
            return 'bg-brand-50 text-brand-700';

        case 'payment-pending':
            return 'bg-accent-50 text-accent-700';

        case 'completed':
            return 'bg-success-50 text-success-700';

        case 'released':
        case 'expired':
            return 'bg-cream-soft text-ink-600';
    }
}

function StatusBadge({
    reservation,
}: {
    reservation:
        AdminInventoryReservation;
}) {
    return (
        <span
            className={[
                'rounded-full px-3 py-1 text-xs font-extrabold',
                getStatusClass(
                    reservation,
                ),
            ].join(
                ' ',
            )}
        >
            {reservation
                .expirationPastDue
                ? 'Past Expiry'
                : formatStatusLabel(
                    reservation.status,
                )}
        </span>
    );
}

function Metric({
    label,
    value,
    emphasis =
        false,
}: {
    label: string;

    value:
        number |
        string;

    emphasis?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-sand bg-cream-soft p-3">
            <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                {label}
            </dt>

            <dd
                className={[
                    'mt-1 text-xl font-black',
                    emphasis
                        ? 'text-brand-700'
                        : 'text-ink-900',
                ].join(
                    ' ',
                )}
            >
                {value}
            </dd>
        </div>
    );
}

function matchesFilter(
    reservation:
        AdminInventoryReservation,
    filter:
        ReservationFilter,
): boolean {
    switch (
    filter
    ) {
        case 'all':
            return true;

        case 'holding':
            return reservation
                .holdsInventory;

        case 'past-due':
            return reservation
                .expirationPastDue;

        case 'active':
        case 'payment-pending':
        case 'completed':
        case 'released':
        case 'expired':
            return (
                reservation.status ===
                filter
            );
    }
}

function matchesSearch(
    reservation:
        AdminInventoryReservation,
    query: string,
): boolean {
    const normalized =
        query
            .trim()
            .toLowerCase();

    if (
        !normalized
    ) {
        return true;
    }

    const itemValues =
        reservation
            .items
            .flatMap(
                (
                    item,
                ) => [
                    item.productName,
                    item.productSlug,
                    item.variantLabel,
                    item.variantId,
                    item.sku,
                ],
            );

    const searchable =
        [
            reservation.id,
            reservation
                .cartReference,
            reservation
                .stripeSessionId,
            reservation.status,
            reservation
                .releaseReason,
            ...itemValues,
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

    return searchable.includes(
        normalized,
    );
}

function ReservationCard({
    reservation,
}: {
    reservation:
        AdminInventoryReservation;
}) {
    const terminalTimestamp =
        reservation
            .completedAt ??
        reservation
            .releasedAt ??
        reservation
            .expiredAt;

    return (
        <article className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                            reservation={
                                reservation
                            }
                        />

                        {reservation
                            .holdsInventory && (
                            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
                                Holding {
                                    reservation
                                        .heldUnits
                                } unit{
                                    reservation
                                        .heldUnits ===
                                        1
                                        ? ''
                                        : 's'
                                }
                            </span>
                        )}
                    </div>

                    <p className="mt-4 text-xs font-extrabold tracking-[0.07em] text-ink-500 uppercase">
                        Reservation ID
                    </p>

                    <p className="mt-1 break-all font-mono text-sm font-bold text-ink-900">
                        {
                            reservation.id
                        }
                    </p>
                </div>

                <div className="lg:text-right">
                    <p className="text-xs font-extrabold tracking-[0.07em] text-ink-500 uppercase">
                        Created
                    </p>

                    <p className="mt-1 text-sm font-bold text-ink-700">
                        {formatDate(
                            reservation
                                .createdAt,
                        )}
                    </p>
                </div>
            </div>

            {reservation
                .expirationPastDue && (
                <div className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 p-4">
                    <p className="font-extrabold text-danger-700">
                        Active reservation is past its Checkout expiration
                    </p>

                    <p className="mt-1 text-sm leading-6 text-ink-700">
                        The reservation remains read-only here. The Stripe lifecycle/reconciliation system is responsible for resolving it safely.
                    </p>
                </div>
            )}

            {reservation.status ===
                'payment-pending' && (
                <div className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-4">
                    <p className="font-extrabold text-accent-700">
                        Payment still pending
                    </p>

                    <p className="mt-1 text-sm leading-6 text-ink-700">
                        Inventory remains reserved while the payment method is unresolved. This dashboard intentionally cannot release it manually.
                    </p>
                </div>
            )}

            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Cart Reference
                    </dt>

                    <dd className="mt-1 break-all font-mono text-xs font-bold text-ink-900">
                        {
                            reservation
                                .cartReference
                        }
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Stripe Session
                    </dt>

                    <dd className="mt-1 break-all font-mono text-xs font-bold text-ink-900">
                        {
                            reservation
                                .stripeSessionId ??
                            'Not attached'
                        }
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Checkout Expiry
                    </dt>

                    <dd className="mt-1 text-sm font-bold text-ink-900">
                        {formatDate(
                            reservation
                                .expiresAt,
                        )}
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Last Updated
                    </dt>

                    <dd className="mt-1 text-sm font-bold text-ink-900">
                        {formatDate(
                            reservation
                                .updatedAt,
                        )}
                    </dd>
                </div>
            </dl>

            <section className="mt-5">
                <h3 className="text-sm font-extrabold text-ink-900">
                    Reserved Items
                </h3>

                <div className="mt-3 grid gap-3">
                    {reservation
                        .items
                        .map(
                            (
                                item,
                            ) => (
                                <div
                                    key={`${reservation.id}-${item.sku}`}
                                    className="flex flex-col gap-3 rounded-2xl border border-sand bg-cream-soft p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-extrabold text-ink-900">
                                            {
                                                item
                                                    .productName
                                            }

                                            {item
                                                .variantLabel
                                                ? ` — ${item.variantLabel}`
                                                : ''}
                                        </p>

                                        <p className="mt-1 break-all font-mono text-xs font-bold text-ink-500">
                                            {
                                                item.sku
                                            }
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-sm font-black text-brand-700">
                                        {
                                            item.quantity
                                        } unit{
                                            item
                                                .quantity ===
                                                1
                                                ? ''
                                                : 's'
                                        }
                                    </div>
                                </div>
                            ),
                        )}
                </div>
            </section>

            {reservation
                .releaseReason && (
                <div className="mt-5 rounded-2xl border border-sand bg-cream-soft p-4 text-sm leading-6 text-ink-700">
                    <strong>
                        Release reason:
                    </strong>{' '}
                    {formatStatusLabel(
                        reservation
                            .releaseReason,
                    )}
                </div>
            )}

            {terminalTimestamp && (
                <p className="mt-5 text-xs font-bold text-ink-500">
                    Lifecycle completed:{' '}
                    {formatDate(
                        terminalTimestamp,
                    )}
                </p>
            )}
        </article>
    );
}

export default function AdminReservations() {
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
        data,
        setData,
    ] =
        useState<
            AdminInventoryReservationsData |
            null
        >(
            null,
        );

    const [
        loading,
        setLoading,
    ] =
        useState(
            false,
        );

    const [
        refreshing,
        setRefreshing,
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
            ReservationFilter
        >(
            'holding',
        );

    async function loadReservations(
        adminToken: string,
        quiet =
            false,
    ) {
        if (
            quiet
        ) {
            setRefreshing(
                true,
            );
        } else {
            setLoading(
                true,
            );
        }

        setError(
            '',
        );

        try {
            const response =
                await fetch(
                    '/api/admin/inventory-reservations',
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
                | AdminInventoryReservationsResponse
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
                        : 'Inventory reservations could not be loaded.',
                );
            }

            setData({
                reservations:
                    payload
                        .reservations,

                summary:
                    payload.summary,

                displayLimit:
                    payload
                        .displayLimit,

                truncated:
                    payload
                        .truncated,
            });

            setToken(
                adminToken,
            );

            window
                .sessionStorage
                .setItem(
                    ADMIN_TOKEN_KEY,
                    adminToken,
                );
        } catch (loadError) {
            if (
                !quiet
            ) {
                setData(
                    null,
                );
            }

            setError(
                loadError instanceof
                    Error
                    ? loadError.message
                    : 'Inventory reservations could not be loaded.',
            );

            throw loadError;
        } finally {
            if (
                quiet
            ) {
                setRefreshing(
                    false,
                );
            } else {
                setLoading(
                    false,
                );
            }
        }
    }

    function logout() {
        window
            .sessionStorage
            .removeItem(
                ADMIN_TOKEN_KEY,
            );

        setToken(
            '',
        );

        setTokenInput(
            '',
        );

        setData(
            null,
        );

        setError(
            '',
        );
    }

    useEffect(
        () => {
            const savedToken =
                window
                    .sessionStorage
                    .getItem(
                        ADMIN_TOKEN_KEY,
                    );

            if (
                savedToken
            ) {
                setTokenInput(
                    savedToken,
                );

                void loadReservations(
                    savedToken,
                ).catch(
                    () =>
                        undefined,
                );
            }
        },
        [],
    );

    const visibleReservations =
        useMemo(
            () =>
                (
                    data
                        ?.reservations ??
                    []
                ).filter(
                    (
                        reservation,
                    ) =>
                        matchesFilter(
                            reservation,
                            filter,
                        ) &&
                        matchesSearch(
                            reservation,
                            query,
                        ),
                ),
            [
                data,
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
                    Maxi Pawz Admin
                </p>

                <h1 className="mt-3 text-3xl text-ink-900">
                    Inventory Reservations
                </h1>

                <p className="mt-3 text-sm leading-6 text-ink-600">
                    Enter the private administrator token to inspect Checkout inventory holds and reservation history.
                </p>

                <form
                    className="mt-6 grid gap-4"
                    onSubmit={(
                        event,
                    ) => {
                        event.preventDefault();

                        void loadReservations(
                            tokenInput,
                        ).catch(
                            () =>
                                undefined,
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
                            : 'Open Reservations'}
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

    if (
        !data
    ) {
        return (
            <section className="rounded-4xl border border-sand bg-white-warm p-6 shadow-card">
                <p className="font-bold text-ink-700">
                    Reservation data is unavailable.
                </p>

                {error && (
                    <p className="mt-3 text-sm font-bold text-danger-700">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    className="mt-4 rounded-full bg-brand-500 px-5 py-3 font-extrabold text-white"
                    onClick={() => {
                        void loadReservations(
                            token,
                        ).catch(
                            () =>
                                undefined,
                        );
                    }}
                >
                    Try Again
                </button>
            </section>
        );
    }

    const filters:
        {
            value:
                ReservationFilter;

            label:
                string;

            count:
                number;
        }[] = [
            {
                value:
                    'holding',

                label:
                    'Holding Stock',

                count:
                    data
                        .summary
                        .active +
                    data
                        .summary
                        .paymentPending,
            },

            {
                value:
                    'active',

                label:
                    'Active',

                count:
                    data
                        .summary
                        .active,
            },

            {
                value:
                    'payment-pending',

                label:
                    'Payment Pending',

                count:
                    data
                        .summary
                        .paymentPending,
            },

            {
                value:
                    'completed',

                label:
                    'Completed',

                count:
                    data
                        .summary
                        .completed,
            },

            {
                value:
                    'released',

                label:
                    'Released',

                count:
                    data
                        .summary
                        .released,
            },

            {
                value:
                    'expired',

                label:
                    'Expired',

                count:
                    data
                        .summary
                        .expired,
            },

            {
                value:
                    'past-due',

                label:
                    'Past Expiry',

                count:
                    data
                        .summary
                        .expirationPastDue,
            },

            {
                value:
                    'all',

                label:
                    'All',

                count:
                    data
                        .summary
                        .total,
            },
        ];

    return (
        <div className="grid gap-8">
            <header className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                            Maxi Pawz Admin
                        </p>

                        <h1 className="mt-2 text-3xl text-ink-900 sm:text-4xl">
                            Inventory Reservations
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
                            Read-only visibility into Checkout stock holds and their Stripe lifecycle.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={
                                refreshing
                            }
                            className="min-h-10 rounded-full border border-brand-200 bg-white-warm px-4 text-sm font-extrabold text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => {
                                void loadReservations(
                                    token,
                                    true,
                                ).catch(
                                    () =>
                                        undefined,
                                );
                            }}
                        >
                            {refreshing
                                ? 'Refreshing…'
                                : 'Refresh'}
                        </button>

                        <button
                            type="button"
                            className="min-h-10 rounded-full border border-sand bg-cream-soft px-4 text-sm font-extrabold text-ink-700 transition hover:bg-white-warm"
                            onClick={
                                logout
                            }
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 p-3 text-sm font-bold text-danger-700">
                        {error}
                    </p>
                )}
            </header>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                    label="Total"
                    value={
                        data
                            .summary
                            .total
                    }
                />

                <Metric
                    label="Holding Stock"
                    value={
                        data
                            .summary
                            .active +
                        data
                            .summary
                            .paymentPending
                    }
                    emphasis
                />

                <Metric
                    label="Held Units"
                    value={
                        data
                            .summary
                            .heldUnits
                    }
                    emphasis
                />

                <Metric
                    label="Past Expiry"
                    value={
                        data
                            .summary
                            .expirationPastDue
                    }
                />
            </section>

            {data
                .summary
                .expirationPastDue >
                0 && (
                <section className="rounded-4xl border border-danger-100 bg-danger-50 p-5 sm:p-6">
                    <p className="font-extrabold text-danger-700">
                        Reservation reconciliation needs attention
                    </p>

                    <p className="mt-2 text-sm leading-6 text-ink-700">
                        At least one active reservation is beyond its Checkout expiration timestamp. The automated reconciler should normally clear these safely. This page does not bypass that lifecycle.
                    </p>
                </section>
            )}

            <section>
                <div className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                                Reservation History
                            </p>

                            <h2 className="mt-2 text-2xl text-ink-900">
                                Checkout Holds
                            </h2>
                        </div>

                        <label className="grid gap-1.5 lg:w-80">
                            <span className="form-label">
                                Search reservations
                            </span>

                            <input
                                className="form-control"
                                type="search"
                                placeholder="Reservation, Stripe Session, SKU…"
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
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {filters.map(
                            (
                                item,
                            ) => (
                                <button
                                    key={
                                        item.value
                                    }
                                    type="button"
                                    className={[
                                        'rounded-full px-4 py-2 text-sm font-extrabold transition',
                                        filter ===
                                            item.value
                                            ? 'bg-brand-500 text-white'
                                            : 'border border-sand bg-cream-soft text-ink-700 hover:bg-white-warm',
                                    ].join(
                                        ' ',
                                    )}
                                    onClick={() => {
                                        setFilter(
                                            item.value,
                                        );
                                    }}
                                >
                                    {
                                        item.label
                                    }{' '}
                                    <span className="opacity-75">
                                        ({
                                            item.count
                                        })
                                    </span>
                                </button>
                            ),
                        )}
                    </div>

                    {data.truncated && (
                        <p className="mt-4 text-xs font-bold text-ink-500">
                            Showing the latest {
                                data
                                    .displayLimit
                            } reservations of {
                                data
                                    .summary
                                    .total
                            } total.
                        </p>
                    )}
                </div>

                <div className="mt-5 grid gap-5">
                    {visibleReservations
                        .length >
                        0
                        ? visibleReservations.map(
                            (
                                reservation,
                            ) => (
                                <ReservationCard
                                    key={
                                        reservation.id
                                    }
                                    reservation={
                                        reservation
                                    }
                                />
                            ),
                        )
                        : (
                            <div className="rounded-4xl border border-sand bg-white-warm p-8 text-center shadow-card">
                                <p className="font-extrabold text-ink-900">
                                    No reservations match this view.
                                </p>

                                <p className="mt-2 text-sm text-ink-600">
                                    Try another filter or search term.
                                </p>
                            </div>
                        )}
                </div>
            </section>
        </div>
    );
}