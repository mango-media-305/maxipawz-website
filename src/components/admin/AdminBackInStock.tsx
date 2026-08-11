import {
    useEffect,
    useMemo,
    useState,
} from 'preact/hooks';

import type {
    AdminBackInStockData,
    AdminBackInStockResponse,
    AdminBackInStockSubscription,
} from '../../types/admin-back-in-stock';

const ADMIN_TOKEN_KEY =
    'maxipawz-admin-token';

type SubscriptionFilter =
    | 'all'
    | 'active'
    | 'processing'
    | 'notified'
    | 'cancelled'
    | 'manual-review';

function formatStatusLabel(
    value:
        string,
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
                `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
        )
        .join(
            ' ',
        );
}

function formatDate(
    value:
        string,
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
    subscription:
        AdminBackInStockSubscription,
): string {
    if (
        subscription.manualReview
    ) {
        return 'bg-danger-50 text-danger-700';
    }

    switch (
    subscription.status
    ) {
        case 'active':
            return 'bg-brand-50 text-brand-700';

        case 'processing':
            return 'bg-accent-50 text-accent-700';

        case 'notified':
            return 'bg-success-50 text-success-700';

        case 'cancelled':
            return 'bg-cream-soft text-ink-600';
    }
}

function StatusBadge({
    subscription,
}: {
    subscription:
    AdminBackInStockSubscription;
}) {
    return (
        <span
            className={[
                'rounded-full px-3 py-1 text-xs font-extrabold',
                getStatusClass(
                    subscription,
                ),
            ].join(
                ' ',
            )}
        >
            {subscription.manualReview
                ? 'Manual Review'
                : formatStatusLabel(
                    subscription.status,
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
    label:
    string;

    value:
    number;

    emphasis?:
    boolean;
}) {
    return (
        <div className="rounded-2xl border border-sand bg-cream-soft p-4">
            <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                {label}
            </dt>

            <dd
                className={[
                    'mt-1 text-2xl font-black',
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
    subscription:
        AdminBackInStockSubscription,

    filter:
        SubscriptionFilter,
): boolean {
    if (
        filter ===
        'all'
    ) {
        return true;
    }

    if (
        filter ===
        'manual-review'
    ) {
        return subscription
            .manualReview;
    }

    return (
        subscription.status ===
        filter
    );
}

function matchesSearch(
    subscription:
        AdminBackInStockSubscription,

    query:
        string,
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

    const searchable = [
        subscription.id,
        subscription.productName,
        subscription.productSlug,
        subscription.variantLabel,
        subscription.variantId,
        subscription.sku,
        subscription.maskedEmail,
        subscription.emailHashSuffix,
        subscription.status,
        subscription.source,
        subscription.lastError,
    ]
        .filter(
            (
                value,
            ): value is
                string =>
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

function SubscriptionCard({
    subscription,
}: {
    subscription:
    AdminBackInStockSubscription;
}) {
    const readyForWorker =
        subscription.status ===
        'active' &&
        subscription.currentAvailable >
        0;

    return (
        <article className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                            subscription={
                                subscription
                            }
                        />

                        {readyForWorker && (
                            <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-extrabold text-success-700">
                                Stock Available
                            </span>
                        )}

                        {subscription.status ===
                            'active' &&
                            subscription.currentAvailable ===
                            0 && (
                                <span className="rounded-full bg-cream-soft px-3 py-1 text-xs font-extrabold text-ink-600">
                                    Waiting for Stock
                                </span>
                            )}
                    </div>

                    <h2 className="mt-4 text-xl font-black text-ink-900">
                        {
                            subscription.productName
                        }

                        {subscription.variantLabel
                            ? ` — ${subscription.variantLabel}`
                            : ''}
                    </h2>

                    <p className="mt-1 break-all font-mono text-xs font-bold text-ink-500">
                        {
                            subscription.sku
                        }
                    </p>
                </div>

                <div className="lg:text-right">
                    <p className="text-xs font-extrabold tracking-[0.07em] text-ink-500 uppercase">
                        Last Requested
                    </p>

                    <p className="mt-1 text-sm font-bold text-ink-700">
                        {formatDate(
                            subscription.lastRequestedAt,
                        )}
                    </p>
                </div>
            </div>

            {subscription.manualReview && (
                <div className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 p-4">
                    <p className="font-extrabold text-danger-700">
                        Delivery requires manual review
                    </p>

                    <p className="mt-1 text-sm leading-6 text-ink-700">
                        This processing claim has moved outside the automatic retry safety window.
                        Do not manually reset or resend it until the delivery history has been reviewed.
                    </p>
                </div>
            )}

            {readyForWorker && (
                <div className="mt-5 rounded-2xl border border-success-100 bg-success-50 p-4">
                    <p className="font-extrabold text-success-700">
                        Eligible for notification
                    </p>

                    <p className="mt-1 text-sm leading-6 text-ink-700">
                        Runtime inventory is currently available. The notification worker should claim this
                        subscription on its next eligible run.
                    </p>
                </div>
            )}

            {subscription.lastError && (
                <div className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 p-4">
                    <p className="text-xs font-extrabold tracking-[0.07em] text-danger-700 uppercase">
                        Last Delivery Error
                    </p>

                    <p className="mt-2 break-words text-sm font-bold leading-6 text-ink-700">
                        {
                            subscription.lastError
                        }
                    </p>
                </div>
            )}

            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Customer
                    </dt>

                    <dd className="mt-1 font-mono text-sm font-bold text-ink-900">
                        {
                            subscription.maskedEmail
                        }
                    </dd>

                    <dd className="mt-1 font-mono text-[11px] font-bold text-ink-500">
                        hash …{
                            subscription.emailHashSuffix
                        }
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Available Now
                    </dt>

                    <dd className="mt-1 text-xl font-black text-ink-900">
                        {
                            subscription.currentAvailable
                        }
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Requests
                    </dt>

                    <dd className="mt-1 text-xl font-black text-ink-900">
                        {
                            subscription.requestCount
                        }
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Notifications
                    </dt>

                    <dd className="mt-1 text-xl font-black text-ink-900">
                        {
                            subscription.notificationCount
                        }
                    </dd>
                </div>
            </dl>

            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        First Request
                    </dt>

                    <dd className="mt-1 text-sm font-bold text-ink-900">
                        {formatDate(
                            subscription.firstRequestedAt,
                        )}
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Last Attempt
                    </dt>

                    <dd className="mt-1 text-sm font-bold text-ink-900">
                        {subscription.lastAttemptAt
                            ? formatDate(
                                subscription.lastAttemptAt,
                            )
                            : 'Never'}
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Last Notification
                    </dt>

                    <dd className="mt-1 text-sm font-bold text-ink-900">
                        {subscription.lastNotifiedAt
                            ? formatDate(
                                subscription.lastNotifiedAt,
                            )
                            : 'Never'}
                    </dd>
                </div>

                <div className="rounded-2xl border border-sand bg-cream-soft p-3">
                    <dt className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Claim Expiry
                    </dt>

                    <dd className="mt-1 text-sm font-bold text-ink-900">
                        {subscription.claimExpiresAt
                            ? formatDate(
                                subscription.claimExpiresAt,
                            )
                            : 'No active claim'}
                    </dd>
                </div>
            </dl>

            <div className="mt-5 rounded-2xl border border-sand bg-cream-soft p-4">
                <p className="text-xs font-extrabold tracking-[0.07em] text-ink-500 uppercase">
                    Subscription ID
                </p>

                <p className="mt-1 break-all font-mono text-xs font-bold text-ink-900">
                    {
                        subscription.id
                    }
                </p>
            </div>
        </article>
    );
}

export default function AdminBackInStock() {
    const [
        token,
        setToken,
    ] =
        useState('');

    const [
        tokenInput,
        setTokenInput,
    ] =
        useState('');

    const [
        data,
        setData,
    ] =
        useState<
            AdminBackInStockData |
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
        useState('');

    const [
        query,
        setQuery,
    ] =
        useState('');

    const [
        filter,
        setFilter,
    ] =
        useState<SubscriptionFilter>(
            'active',
        );

    async function loadSubscriptions(
        adminToken:
            string,

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

        setError('');

        try {
            const response =
                await fetch(
                    '/api/admin/back-in-stock',
                    {
                        headers: {
                            Authorization:
                                `Bearer ${adminToken}`,

                            Accept:
                                'application/json',
                        },

                        cache:
                            'no-store',
                    },
                );

            const payload =
                (await response
                    .json()
                    .catch(
                        () =>
                            null,
                    )) as
                | AdminBackInStockResponse
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
                        : 'Back-in-stock subscriptions could not be loaded.',
                );
            }

            setData({
                subscriptions:
                    payload.subscriptions,

                summary:
                    payload.summary,

                displayLimit:
                    payload.displayLimit,

                truncated:
                    payload.truncated,
            });

            setToken(
                adminToken,
            );

            window.sessionStorage.setItem(
                ADMIN_TOKEN_KEY,
                adminToken,
            );
        } catch (
        loadError
        ) {
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
                    : 'Back-in-stock subscriptions could not be loaded.',
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
        window.sessionStorage.removeItem(
            ADMIN_TOKEN_KEY,
        );

        setToken('');

        setTokenInput('');

        setData(
            null,
        );

        setError('');
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

                void loadSubscriptions(
                    savedToken,
                ).catch(
                    () =>
                        undefined,
                );
            }
        },
        [],
    );

    const visibleSubscriptions =
        useMemo(
            () =>
                (
                    data?.subscriptions ??
                    []
                ).filter(
                    (
                        subscription,
                    ) =>
                        matchesFilter(
                            subscription,
                            filter,
                        ) &&
                        matchesSearch(
                            subscription,
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
                    Back-in-Stock Alerts
                </h1>

                <p className="mt-3 text-sm leading-6 text-ink-600">
                    Enter the private administrator token to inspect customer
                    availability alerts and notification lifecycle status.
                </p>

                <form
                    className="mt-6 grid gap-4"
                    onSubmit={(
                        event,
                    ) => {
                        event.preventDefault();

                        void loadSubscriptions(
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
                                    event.currentTarget.value,
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
                            : 'Open Back-in-Stock Alerts'}
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
                    Back-in-stock data is unavailable.
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
                        void loadSubscriptions(
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

    const filters: {
        value:
        SubscriptionFilter;

        label:
        string;

        count:
        number;
    }[] = [
            {
                value:
                    'active',

                label:
                    'Active',

                count:
                    data.summary.active,
            },

            {
                value:
                    'processing',

                label:
                    'Processing',

                count:
                    data.summary.processing,
            },

            {
                value:
                    'notified',

                label:
                    'Notified',

                count:
                    data.summary.notified,
            },

            {
                value:
                    'manual-review',

                label:
                    'Manual Review',

                count:
                    data.summary.manualReview,
            },

            {
                value:
                    'cancelled',

                label:
                    'Cancelled',

                count:
                    data.summary.cancelled,
            },

            {
                value:
                    'all',

                label:
                    'All',

                count:
                    data.summary.total,
            },
        ];

    return (
        <section>
            <div className="rounded-[2.5rem] border border-brand-200 bg-white-warm p-5 shadow-card sm:p-6 lg:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                            Maxi Pawz Admin
                        </p>

                        <h1 className="mt-3 text-3xl text-ink-900 sm:text-4xl">
                            Back-in-Stock Alerts
                        </h1>

                        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">
                            Read-only visibility into customer stock alerts, delivery
                            attempts, notification history, and subscriptions requiring
                            operational review.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={
                                refreshing
                            }
                            className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-extrabold text-brand-800 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => {
                                void loadSubscriptions(
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
                            className="rounded-full border border-sand bg-cream-soft px-4 py-2 text-sm font-extrabold text-ink-700 transition hover:bg-sand-light"
                            onClick={
                                logout
                            }
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Metric
                        label="Total"
                        value={
                            data.summary.total
                        }
                    />

                    <Metric
                        label="Active"
                        value={
                            data.summary.active
                        }
                        emphasis
                    />

                    <Metric
                        label="Processing"
                        value={
                            data.summary.processing
                        }
                    />

                    <Metric
                        label="Notified"
                        value={
                            data.summary.notified
                        }
                    />

                    <Metric
                        label="Manual Review"
                        value={
                            data.summary.manualReview
                        }
                    />
                </dl>

                {data.summary.manualReview >
                    0 && (
                        <div className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 p-4">
                            <p className="font-extrabold text-danger-700">
                                {
                                    data.summary.manualReview
                                }{' '}
                                subscription
                                {data.summary.manualReview ===
                                    1
                                    ? ''
                                    : 's'}{' '}
                                require manual review.
                            </p>

                            <p className="mt-1 text-sm leading-6 text-ink-700">
                                These records are outside the automatic retry safety window.
                                This dashboard is intentionally read-only.
                            </p>
                        </div>
                    )}

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <label className="grid gap-1.5">
                        <span className="form-label">
                            Search
                        </span>

                        <input
                            className="form-control"
                            type="search"
                            placeholder="Product, SKU, masked email, subscription ID…"
                            value={
                                query
                            }
                            onInput={(
                                event,
                            ) => {
                                setQuery(
                                    event.currentTarget.value,
                                );
                            }}
                        />
                    </label>

                    <div className="flex flex-wrap gap-2">
                        {filters.map(
                            (
                                option,
                            ) => {
                                const active =
                                    filter ===
                                    option.value;

                                return (
                                    <button
                                        key={
                                            option.value
                                        }
                                        type="button"
                                        className={[
                                            'rounded-full px-4 py-2 text-sm font-extrabold transition',
                                            active
                                                ? 'bg-brand-500 text-white'
                                                : 'border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100',
                                        ].join(
                                            ' ',
                                        )}
                                        onClick={() => {
                                            setFilter(
                                                option.value,
                                            );
                                        }}
                                    >
                                        {
                                            option.label
                                        }{' '}
                                        ({
                                            option.count
                                        })
                                    </button>
                                );
                            },
                        )}
                    </div>
                </div>

                {error && (
                    <p className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 p-3 text-sm font-bold text-danger-700">
                        {error}
                    </p>
                )}

                {data.truncated && (
                    <p className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-3 text-sm font-bold text-accent-800">
                        Showing the most recent {
                            data.displayLimit
                        } subscriptions.
                    </p>
                )}
            </div>

            <div className="mt-6 grid gap-5">
                {visibleSubscriptions.length >
                    0 ? (
                    visibleSubscriptions.map(
                        (
                            subscription,
                        ) => (
                            <SubscriptionCard
                                key={
                                    subscription.id
                                }
                                subscription={
                                    subscription
                                }
                            />
                        ),
                    )
                ) : (
                    <div className="rounded-4xl border border-sand bg-white-warm p-8 text-center shadow-card">
                        <p className="font-extrabold text-ink-900">
                            No subscriptions match this view.
                        </p>

                        <p className="mt-2 text-sm text-ink-600">
                            Try another status or search term.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}