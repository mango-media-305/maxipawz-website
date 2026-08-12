import {
    useEffect,
    useMemo,
    useState,
} from 'preact/hooks';

import type {
    AdminInventoryCatalogSelection,
    AdminInventoryErrorResponse,
    AdminInventoryListData,
    AdminInventoryListResponse,
    AdminInventoryMutationRequest,
    AdminInventoryMutationResponse,
} from '../../types/admin-inventory';

const ADMIN_TOKEN_KEY =
    'maxipawz-admin-token';

type InventoryFilter =
    | 'all'
    | 'configured'
    | 'needs-setup'
    | 'low-stock'
    | 'sold-out'
    | 'reorder'
    | 'issues';

type ManagementMode =
    | 'provision'
    | 'add'
    | 'remove'
    | 'set'
    | 'thresholds';

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

function formatSignedNumber(
    value: number,
): string {
    if (
        value >
        0
    ) {
        return `+${value}`;
    }

    return String(
        value,
    );
}

function selectionKey(
    selection:
        Pick<
            AdminInventoryCatalogSelection,
            | 'productSlug'
            | 'variantId'
        >,
): string {
    return `${selection.productSlug}\u0000${selection.variantId ?? ''}`;
}

function parseNonNegativeWholeNumber(
    value: string,
    fieldName: string,
): number {
    const normalized =
        value.trim();

    if (
        !normalized
    ) {
        throw new Error(
            `Enter ${fieldName.toLowerCase()}.`,
        );
    }

    const number =
        Number(
            normalized,
        );

    if (
        !Number.isSafeInteger(
            number,
        ) ||
        number <
        0
    ) {
        throw new Error(
            `${fieldName} must be a whole number of 0 or greater.`,
        );
    }

    return number;
}

function parsePositiveWholeNumber(
    value: string,
    fieldName: string,
): number {
    const number =
        parseNonNegativeWholeNumber(
            value,
            fieldName,
        );

    if (
        number <
        1
    ) {
        throw new Error(
            `${fieldName} must be at least 1.`,
        );
    }

    return number;
}

function parseOptionalThreshold(
    value: string,
): number | null {
    if (
        !value.trim()
    ) {
        return null;
    }

    return parseNonNegativeWholeNumber(
        value,
        'Reorder threshold',
    );
}

function requireReason(
    value: string,
): string {
    const normalized =
        value.trim();

    if (
        !normalized
    ) {
        throw new Error(
            'Enter a reason for this inventory change.',
        );
    }

    return normalized;
}

function requireInventoryVersion(
    updatedAt?: string,
): string {
    if (
        !updatedAt
    ) {
        throw new Error(
            'Refresh inventory before making this change.',
        );
    }

    return updatedAt;
}

function getConfigurationBadgeClass(
    state:
        AdminInventoryCatalogSelection[
        'configurationState'
        ],
): string {
    switch (
    state
    ) {
        case 'configured':
            return 'bg-success-50 text-success-700';

        case 'not-configured':
            return 'bg-accent-50 text-accent-700';

        case 'sku-mismatch':
        case 'catalog-sku-missing':
            return 'bg-danger-50 text-danger-700';
    }
}

function getStockBadgeClass(
    status:
        | 'in-stock'
        | 'low-stock'
        | 'sold-out',
): string {
    switch (
    status
    ) {
        case 'in-stock':
            return 'bg-success-50 text-success-700';

        case 'low-stock':
            return 'bg-accent-50 text-accent-700';

        case 'sold-out':
            return 'bg-danger-50 text-danger-700';
    }
}

function ConfigurationBadge({
    selection,
}: {
    selection:
    AdminInventoryCatalogSelection;
}) {
    return (
        <span
            className={[
                'rounded-full px-3 py-1 text-xs font-extrabold',
                getConfigurationBadgeClass(
                    selection
                        .configurationState,
                ),
            ].join(
                ' ',
            )}
        >
            {formatStatusLabel(
                selection
                    .configurationState,
            )}
        </span>
    );
}

function StockBadge({
    selection,
}: {
    selection:
    AdminInventoryCatalogSelection;
}) {
    if (
        !selection.inventory
    ) {
        return null;
    }

    return (
        <span
            className={[
                'rounded-full px-3 py-1 text-xs font-extrabold',
                getStockBadgeClass(
                    selection
                        .inventory
                        .status,
                ),
            ].join(
                ' ',
            )}
        >
            {formatStatusLabel(
                selection
                    .inventory
                    .status,
            )}
        </span>
    );
}

function TrackingBadge({
    enabled,
}: {
    enabled: boolean;
}) {
    return (
        <span
            className={[
                'rounded-full px-3 py-1 text-xs font-extrabold',
                enabled
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-cream-soft text-ink-600',
            ].join(
                ' ',
            )}
        >
            {enabled
                ? 'Runtime Tracking On'
                : 'Runtime Tracking Off'}
        </span>
    );
}

function InventoryMetric({
    label,
    value,
    emphasis =
    false,
}: {
    label: string;

    value:
    string |
    number;

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

interface InventoryCardProps {
    selection:
    AdminInventoryCatalogSelection;

    onMutation:
    (
        request:
            AdminInventoryMutationRequest,
    ) => Promise<string>;
}

function InventoryCard({
    selection,
    onMutation,
}: InventoryCardProps) {
    const inventory =
        selection.inventory;

    const [
        mode,
        setMode,
    ] =
        useState<
            ManagementMode |
            null
        >(
            null,
        );

    const [
        quantity,
        setQuantity,
    ] =
        useState(
            '',
        );

    const [
        exactOnHand,
        setExactOnHand,
    ] =
        useState(
            inventory
                ? String(
                    inventory.onHand,
                )
                : '0',
        );

    const [
        lowStockThreshold,
        setLowStockThreshold,
    ] =
        useState(
            inventory
                ? String(
                    inventory
                        .lowStockThreshold,
                )
                : '5',
        );

    const [
        reorderThreshold,
        setReorderThreshold,
    ] =
        useState(
            inventory
                ?.reorderThreshold !==
                undefined
                ? String(
                    inventory
                        .reorderThreshold,
                )
                : '',
        );

    const [
        reason,
        setReason,
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

    function openMode(
        nextMode:
            ManagementMode,
    ) {
        setMode(
            nextMode,
        );

        setMessage(
            '',
        );

        setReason(
            '',
        );

        if (
            nextMode ===
            'provision'
        ) {
            setExactOnHand(
                '0',
            );

            setLowStockThreshold(
                '5',
            );

            setReorderThreshold(
                '',
            );
        }

        if (
            nextMode ===
            'add' ||
            nextMode ===
            'remove'
        ) {
            setQuantity(
                '',
            );
        }

        if (
            nextMode ===
            'set' &&
            inventory
        ) {
            setExactOnHand(
                String(
                    inventory.onHand,
                ),
            );
        }

        if (
            nextMode ===
            'thresholds' &&
            inventory
        ) {
            setLowStockThreshold(
                String(
                    inventory
                        .lowStockThreshold,
                ),
            );

            setReorderThreshold(
                inventory
                    .reorderThreshold !==
                    undefined
                    ? String(
                        inventory
                            .reorderThreshold,
                    )
                    : '',
            );
        }
    }

    async function submitAction(
        event:
            Event,
    ) {
        event.preventDefault();

        if (
            !mode
        ) {
            return;
        }

        setBusy(
            true,
        );

        setMessage(
            '',
        );

        try {
            const normalizedReason =
                requireReason(
                    reason,
                );

            const selectionFields = {
                productSlug:
                    selection
                        .productSlug,

                ...(selection
                    .variantId
                    ? {
                        variantId:
                            selection
                                .variantId,
                    }
                    : {}),

                reason:
                    normalizedReason,
            };

            let request:
                AdminInventoryMutationRequest;

            if (
                mode ===
                'provision'
            ) {
                request = {
                    action:
                        'provision',

                    ...selectionFields,

                    onHand:
                        parseNonNegativeWholeNumber(
                            exactOnHand,
                            'On-hand quantity',
                        ),

                    lowStockThreshold:
                        parseNonNegativeWholeNumber(
                            lowStockThreshold,
                            'Low-stock threshold',
                        ),

                    reorderThreshold:
                        parseOptionalThreshold(
                            reorderThreshold,
                        ),
                };
            } else if (
                mode ===
                'add' ||
                mode ===
                'remove'
            ) {
                const adjustment =
                    parsePositiveWholeNumber(
                        quantity,
                        'Quantity',
                    );

                request = {
                    action:
                        'adjust-on-hand',

                    ...selectionFields,

                    expectedUpdatedAt:
                        requireInventoryVersion(
                            inventory
                                ?.updatedAt,
                        ),

                    quantityDelta:
                        mode ===
                            'add'
                            ? adjustment
                            : -adjustment,
                };
            } else if (
                mode ===
                'set'
            ) {
                request = {
                    action:
                        'set-on-hand',

                    ...selectionFields,

                    expectedUpdatedAt:
                        requireInventoryVersion(
                            inventory
                                ?.updatedAt,
                        ),

                    onHand:
                        parseNonNegativeWholeNumber(
                            exactOnHand,
                            'On-hand quantity',
                        ),
                };
            } else {
                request = {
                    action:
                        'set-thresholds',

                    ...selectionFields,

                    expectedUpdatedAt:
                        requireInventoryVersion(
                            inventory
                                ?.updatedAt,
                        ),

                    lowStockThreshold:
                        parseNonNegativeWholeNumber(
                            lowStockThreshold,
                            'Low-stock threshold',
                        ),

                    reorderThreshold:
                        parseOptionalThreshold(
                            reorderThreshold,
                        ),
                };
            }

            const successMessage =
                await onMutation(
                    request,
                );

            setMessage(
                successMessage,
            );

            setReason(
                '',
            );

            if (
                mode ===
                'provision'
            ) {
                setMode(
                    null,
                );
            }

            if (
                mode ===
                'add' ||
                mode ===
                'remove'
            ) {
                setQuantity(
                    '',
                );
            }
        } catch (error) {
            setMessage(
                error instanceof
                    Error
                    ? error.message
                    : 'The inventory change could not be completed.',
            );
        } finally {
            setBusy(
                false,
            );
        }
    }

    const isConfigurationIssue =
        selection
            .configurationState ===
        'sku-mismatch' ||
        selection
            .configurationState ===
        'catalog-sku-missing';

    return (
        <article className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                        {
                            selection
                                .productSlug
                        }
                    </p>

                    <h2 className="mt-2 text-2xl text-ink-900">
                        {
                            selection
                                .productName
                        }

                        {selection
                            .variantLabel
                            ? ` — ${selection.variantLabel}`
                            : ''}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <ConfigurationBadge
                            selection={
                                selection
                            }
                        />

                        <StockBadge
                            selection={
                                selection
                            }
                        />

                        <TrackingBadge
                            enabled={
                                selection
                                    .trackInventory
                            }
                        />

                        <span className="rounded-full bg-cream-soft px-3 py-1 text-xs font-extrabold text-ink-600">
                            Catalog:{' '}
                            {formatStatusLabel(
                                selection
                                    .availability,
                            )}
                        </span>
                    </div>
                </div>

                <div className="shrink-0 lg:text-right">
                    <p className="text-xs font-extrabold tracking-[0.06em] text-ink-500 uppercase">
                        Catalog SKU
                    </p>

                    <p className="mt-1 break-all font-mono text-sm font-bold text-ink-800">
                        {
                            selection.sku ??
                            'Not configured'
                        }
                    </p>

                    {inventory &&
                        inventory.sku !==
                        selection.sku && (
                            <>
                                <p className="mt-3 text-xs font-extrabold tracking-[0.06em] text-danger-700 uppercase">
                                    Database SKU
                                </p>

                                <p className="mt-1 break-all font-mono text-sm font-bold text-danger-700">
                                    {
                                        inventory.sku
                                    }
                                </p>
                            </>
                        )}
                </div>
            </div>

            {inventory && (
                <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <InventoryMetric
                        label="On Hand"
                        value={
                            inventory
                                .onHand
                        }
                    />

                    <InventoryMetric
                        label="Reserved"
                        value={
                            inventory
                                .reserved
                        }
                    />

                    <InventoryMetric
                        label="Available"
                        value={
                            inventory
                                .available
                        }
                        emphasis
                    />

                    <InventoryMetric
                        label="Low Stock"
                        value={
                            inventory
                                .lowStockThreshold
                        }
                    />

                    <InventoryMetric
                        label="Reorder"
                        value={
                            inventory
                                .reorderThreshold ??
                            'Off'
                        }
                    />
                </dl>
            )}

            {inventory
                ?.reorderRecommended && (
                    <div className="mt-4 rounded-2xl border border-accent-200 bg-accent-50 p-4">
                        <p className="font-extrabold text-accent-700">
                            Reorder recommended
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-700">
                            Available stock is at or below the configured reorder threshold.
                        </p>
                    </div>
                )}

            {!selection
                .trackInventory &&
                selection
                    .configurationState ===
                'configured' && (
                    <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-ink-700">
                        This SKU is provisioned in the database, but runtime inventory tracking is still disabled in the catalog. The storefront will not use this stock level until <strong>trackInventory</strong> is explicitly enabled.
                    </div>
                )}

            {selection
                .configurationState ===
                'catalog-sku-missing' && (
                    <div className="mt-4 rounded-2xl border border-danger-100 bg-danger-50 p-4">
                        <p className="font-extrabold text-danger-700">
                            Catalog SKU required
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-700">
                            Add a SKU to this product or variant in the static catalog before inventory can be provisioned.
                        </p>
                    </div>
                )}

            {selection
                .configurationState ===
                'sku-mismatch' && (
                    <div className="mt-4 rounded-2xl border border-danger-100 bg-danger-50 p-4">
                        <p className="font-extrabold text-danger-700">
                            SKU mismatch
                        </p>

                        <p className="mt-1 text-sm leading-6 text-ink-700">
                            The database row and catalog selection disagree about the SKU. Inventory management is disabled for this selection until the configuration is reconciled.
                        </p>
                    </div>
                )}

            {!isConfigurationIssue && (
                <div className="mt-5 flex flex-wrap gap-2">
                    {selection
                        .configurationState ===
                        'not-configured' && (
                            <button
                                type="button"
                                className="min-h-10 rounded-full bg-brand-500 px-5 text-sm font-extrabold text-white shadow-blue transition hover:bg-brand-600"
                                onClick={() => {
                                    openMode(
                                        'provision',
                                    );
                                }}
                            >
                                Provision Inventory
                            </button>
                        )}

                    {selection
                        .configurationState ===
                        'configured' && (
                            <>
                                <button
                                    type="button"
                                    className="min-h-10 rounded-full bg-brand-500 px-4 text-sm font-extrabold text-white transition hover:bg-brand-600"
                                    onClick={() => {
                                        openMode(
                                            'add',
                                        );
                                    }}
                                >
                                    Add Stock
                                </button>

                                <button
                                    type="button"
                                    className="min-h-10 rounded-full border border-danger-100 bg-danger-50 px-4 text-sm font-extrabold text-danger-700 transition hover:bg-danger-100"
                                    onClick={() => {
                                        openMode(
                                            'remove',
                                        );
                                    }}
                                >
                                    Remove Stock
                                </button>

                                <button
                                    type="button"
                                    className="min-h-10 rounded-full border border-brand-200 bg-brand-50 px-4 text-sm font-extrabold text-brand-800 transition hover:bg-brand-100"
                                    onClick={() => {
                                        openMode(
                                            'set',
                                        );
                                    }}
                                >
                                    Set Exact Count
                                </button>

                                <button
                                    type="button"
                                    className="min-h-10 rounded-full border border-sand bg-cream-soft px-4 text-sm font-extrabold text-ink-700 transition hover:bg-white-warm"
                                    onClick={() => {
                                        openMode(
                                            'thresholds',
                                        );
                                    }}
                                >
                                    Thresholds
                                </button>
                            </>
                        )}

                    {mode && (
                        <button
                            type="button"
                            className="min-h-10 rounded-full border border-sand bg-white-warm px-4 text-sm font-extrabold text-ink-600 transition hover:bg-cream-soft"
                            onClick={() => {
                                setMode(
                                    null,
                                );

                                setMessage(
                                    '',
                                );
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            )}

            {mode && (
                <form
                    className="mt-5 grid gap-4 rounded-3xl border border-brand-200 bg-brand-50 p-4 sm:p-5"
                    onSubmit={
                        submitAction
                    }
                >
                    <div>
                        <p className="text-xs font-extrabold tracking-[0.07em] text-brand-700 uppercase">
                            Inventory Action
                        </p>

                        <h3 className="mt-1 text-xl text-ink-900">
                            {mode ===
                                'provision'
                                ? 'Provision inventory'
                                : mode ===
                                    'add'
                                    ? 'Add physical stock'
                                    : mode ===
                                        'remove'
                                        ? 'Remove physical stock'
                                        : mode ===
                                            'set'
                                            ? 'Set exact physical count'
                                            : 'Update inventory thresholds'}
                        </h3>
                    </div>

                    {mode ===
                        'provision' && (
                            <div className="grid gap-4 sm:grid-cols-3">
                                <label className="grid gap-1.5">
                                    <span className="form-label">
                                        Initial on hand
                                    </span>

                                    <input
                                        className="form-control"
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        value={
                                            exactOnHand
                                        }
                                        onInput={(
                                            event,
                                        ) => {
                                            setExactOnHand(
                                                event
                                                    .currentTarget
                                                    .value,
                                            );
                                        }}
                                    />
                                </label>

                                <label className="grid gap-1.5">
                                    <span className="form-label">
                                        Low-stock threshold
                                    </span>

                                    <input
                                        className="form-control"
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        value={
                                            lowStockThreshold
                                        }
                                        onInput={(
                                            event,
                                        ) => {
                                            setLowStockThreshold(
                                                event
                                                    .currentTarget
                                                    .value,
                                            );
                                        }}
                                    />
                                </label>

                                <label className="grid gap-1.5">
                                    <span className="form-label">
                                        Reorder threshold
                                    </span>

                                    <input
                                        className="form-control"
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="Optional"
                                        value={
                                            reorderThreshold
                                        }
                                        onInput={(
                                            event,
                                        ) => {
                                            setReorderThreshold(
                                                event
                                                    .currentTarget
                                                    .value,
                                            );
                                        }}
                                    />

                                    <span className="text-xs text-ink-500">
                                        Leave blank to disable reorder recommendations.
                                    </span>
                                </label>
                            </div>
                        )}

                    {(mode ===
                        'add' ||
                        mode ===
                        'remove') && (
                            <label className="grid gap-1.5 sm:max-w-xs">
                                <span className="form-label">
                                    Quantity
                                </span>

                                <input
                                    className="form-control"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    placeholder="1"
                                    value={
                                        quantity
                                    }
                                    onInput={(
                                        event,
                                    ) => {
                                        setQuantity(
                                            event
                                                .currentTarget
                                                .value,
                                        );
                                    }}
                                />
                            </label>
                        )}

                    {mode ===
                        'set' && (
                            <>
                                {inventory &&
                                    inventory
                                        .reserved >
                                    0 && (
                                        <div className="rounded-2xl border border-accent-200 bg-accent-50 p-3 text-sm font-bold leading-6 text-ink-700">
                                            There are currently {
                                                inventory
                                                    .reserved
                                            } reserved unit{
                                                inventory
                                                    .reserved ===
                                                    1
                                                    ? ''
                                                    : 's'
                                            }. The exact count cannot be set below that number.
                                        </div>
                                    )}

                                <label className="grid gap-1.5 sm:max-w-xs">
                                    <span className="form-label">
                                        Exact on-hand quantity
                                    </span>

                                    <input
                                        className="form-control"
                                        type="number"
                                        min={
                                            inventory
                                                ?.reserved ??
                                            0
                                        }
                                        step="1"
                                        required
                                        value={
                                            exactOnHand
                                        }
                                        onInput={(
                                            event,
                                        ) => {
                                            setExactOnHand(
                                                event
                                                    .currentTarget
                                                    .value,
                                            );
                                        }}
                                    />
                                </label>
                            </>
                        )}

                    {mode ===
                        'thresholds' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="grid gap-1.5">
                                    <span className="form-label">
                                        Low-stock threshold
                                    </span>

                                    <input
                                        className="form-control"
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                        value={
                                            lowStockThreshold
                                        }
                                        onInput={(
                                            event,
                                        ) => {
                                            setLowStockThreshold(
                                                event
                                                    .currentTarget
                                                    .value,
                                            );
                                        }}
                                    />
                                </label>

                                <label className="grid gap-1.5">
                                    <span className="form-label">
                                        Reorder threshold
                                    </span>

                                    <input
                                        className="form-control"
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="Off"
                                        value={
                                            reorderThreshold
                                        }
                                        onInput={(
                                            event,
                                        ) => {
                                            setReorderThreshold(
                                                event
                                                    .currentTarget
                                                    .value,
                                            );
                                        }}
                                    />

                                    <span className="text-xs text-ink-500">
                                        Leave blank to turn reorder recommendations off.
                                    </span>
                                </label>
                            </div>
                        )}

                    <label className="grid gap-1.5">
                        <span className="form-label">
                            Reason
                        </span>

                        <input
                            className="form-control"
                            type="text"
                            maxLength={
                                500
                            }
                            required
                            placeholder={
                                mode ===
                                    'add'
                                    ? 'Vendor shipment received'
                                    : mode ===
                                        'remove'
                                        ? 'Damaged units removed'
                                        : mode ===
                                            'set'
                                            ? 'Physical cycle count'
                                            : mode ===
                                                'thresholds'
                                                ? 'Updated inventory planning'
                                                : 'Initial inventory count'
                            }
                            value={
                                reason
                            }
                            onInput={(
                                event,
                            ) => {
                                setReason(
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
                            busy
                        }
                        className="min-h-12 rounded-full bg-brand-500 px-5 font-extrabold text-white shadow-blue transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:justify-self-start"
                    >
                        {busy
                            ? 'Saving…'
                            : mode ===
                                'provision'
                                ? 'Provision Inventory'
                                : mode ===
                                    'add'
                                    ? 'Add Stock'
                                    : mode ===
                                        'remove'
                                        ? 'Remove Stock'
                                        : mode ===
                                            'set'
                                            ? 'Save Exact Count'
                                            : 'Save Thresholds'}
                    </button>
                </form>
            )}

            {message && (
                <p className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-3 text-sm font-bold leading-6 text-ink-700">
                    {message}
                </p>
            )}
        </article>
    );
}

function matchesSearch(
    selection:
        AdminInventoryCatalogSelection,
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

    const searchable =
        [
            selection
                .productName,
            selection
                .productSlug,
            selection
                .variantLabel,
            selection.sku,
            selection
                .inventory
                ?.sku,
            selection
                .availability,
            selection
                .configurationState,
        ]
            .filter(
                (
                    value,
                ): value is string =>
                    Boolean(
                        value,
                    ),
            )
            .join(
                ' ',
            )
            .toLowerCase();

    return searchable.includes(
        normalized,
    );
}

function matchesFilter(
    selection:
        AdminInventoryCatalogSelection,
    filter:
        InventoryFilter,
): boolean {
    switch (
    filter
    ) {
        case 'all':
            return true;

        case 'configured':
            return (
                selection
                    .configurationState ===
                'configured'
            );

        case 'needs-setup':
            return (
                selection
                    .configurationState ===
                'not-configured'
            );

        case 'low-stock':
            return (
                selection
                    .inventory
                    ?.status ===
                'low-stock'
            );

        case 'sold-out':
            return (
                selection
                    .inventory
                    ?.status ===
                'sold-out'
            );

        case 'reorder':
            return (
                selection
                    .inventory
                    ?.reorderRecommended ===
                true
            );

        case 'issues':
            return (
                selection
                    .configurationState ===
                'sku-mismatch' ||
                selection
                    .configurationState ===
                'catalog-sku-missing'
            );
    }
}

function AdjustmentHistory({
    inventory,
}: {
    inventory:
    AdminInventoryListData;
}) {
    const selectionLabels =
        useMemo(
            () => {
                const map =
                    new Map<
                        string,
                        string
                    >();

                inventory
                    .selections
                    .forEach(
                        (
                            selection,
                        ) => {
                            map.set(
                                selectionKey(
                                    selection,
                                ),
                                selection
                                    .variantLabel
                                    ? `${selection.productName} — ${selection.variantLabel}`
                                    : selection
                                        .productName,
                            );
                        },
                    );

                return map;
            },
            [
                inventory
                    .selections,
            ],
        );

    if (
        inventory
            .recentAdjustments
            .length ===
        0
    ) {
        return (
            <section className="rounded-4xl border border-sand bg-white-warm p-6 shadow-card">
                <h2 className="text-2xl text-ink-900">
                    Adjustment History
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink-600">
                    No administrative inventory adjustments have been recorded yet.
                </p>
            </section>
        );
    }

    return (
        <section className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
            <div>
                <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                    Audit Trail
                </p>

                <h2 className="mt-2 text-2xl text-ink-900">
                    Recent Adjustments
                </h2>

                <p className="mt-2 text-sm leading-6 text-ink-600">
                    Every successful manual stock or threshold change is recorded here.
                </p>
            </div>

            <div className="mt-5 grid gap-3">
                {inventory
                    .recentAdjustments
                    .map(
                        (
                            adjustment,
                        ) => {
                            const key =
                                `${adjustment.productSlug}\u0000${adjustment.variantId ?? ''}`;

                            const label =
                                selectionLabels.get(
                                    key,
                                ) ??
                                adjustment
                                    .productSlug;

                            return (
                                <article
                                    key={
                                        adjustment.id
                                    }
                                    className="rounded-2xl border border-sand bg-cream-soft p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="font-extrabold text-ink-900">
                                                {
                                                    label
                                                }
                                            </p>

                                            <p className="mt-1 break-all font-mono text-xs font-bold text-ink-500">
                                                {
                                                    adjustment
                                                        .sku
                                                }
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
                                                {formatStatusLabel(
                                                    adjustment
                                                        .action,
                                                )}
                                            </span>

                                            <p className="mt-2 text-xs font-bold text-ink-500">
                                                {formatDate(
                                                    adjustment
                                                        .createdAt,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        {adjustment
                                            .quantityDelta !==
                                            undefined && (
                                                <InventoryMetric
                                                    label="Change"
                                                    value={
                                                        formatSignedNumber(
                                                            adjustment
                                                                .quantityDelta,
                                                        )
                                                    }
                                                />
                                            )}

                                        {adjustment
                                            .previousOnHand !==
                                            undefined && (
                                                <InventoryMetric
                                                    label="Previous"
                                                    value={
                                                        adjustment
                                                            .previousOnHand
                                                    }
                                                />
                                            )}

                                        {adjustment
                                            .nextOnHand !==
                                            undefined && (
                                                <InventoryMetric
                                                    label="Next"
                                                    value={
                                                        adjustment
                                                            .nextOnHand
                                                    }
                                                />
                                            )}

                                        <InventoryMetric
                                            label="Reserved"
                                            value={
                                                adjustment
                                                    .reservedAtChange
                                            }
                                        />
                                    </div>

                                    {adjustment
                                        .action ===
                                        'set-thresholds' && (
                                            <div className="mt-4 rounded-2xl border border-sand bg-white-warm p-3 text-sm leading-6 text-ink-700">
                                                Low stock:{' '}
                                                <strong>
                                                    {
                                                        adjustment
                                                            .previousLowStockThreshold ??
                                                        '—'
                                                    }
                                                </strong>
                                                {' → '}
                                                <strong>
                                                    {
                                                        adjustment
                                                            .nextLowStockThreshold ??
                                                        '—'
                                                    }
                                                </strong>

                                                {' · '}

                                                Reorder:{' '}
                                                <strong>
                                                    {
                                                        adjustment
                                                            .previousReorderThreshold ??
                                                        'Off'
                                                    }
                                                </strong>
                                                {' → '}
                                                <strong>
                                                    {
                                                        adjustment
                                                            .nextReorderThreshold ??
                                                        'Off'
                                                    }
                                                </strong>
                                            </div>
                                        )}

                                    <p className="mt-4 text-sm leading-6 text-ink-700">
                                        <strong>
                                            Reason:
                                        </strong>{' '}
                                        {
                                            adjustment
                                                .reason
                                        }
                                    </p>
                                </article>
                            );
                        },
                    )}
            </div>
        </section>
    );
}

function UnmappedInventoryWarning({
    inventory,
}: {
    inventory:
    AdminInventoryListData;
}) {
    if (
        inventory
            .unmappedInventory
            .length ===
        0
    ) {
        return null;
    }

    return (
        <section className="rounded-4xl border border-danger-100 bg-danger-50 p-5 sm:p-6">
            <p className="text-xs font-extrabold tracking-[0.08em] text-danger-700 uppercase">
                Configuration Warning
            </p>

            <h2 className="mt-2 text-2xl text-ink-900">
                Unmapped Inventory Records
            </h2>

            <p className="mt-2 text-sm leading-6 text-ink-700">
                These database records do not correspond to a current product or variant in the static catalog. They are intentionally not editable from this dashboard.
            </p>

            <div className="mt-4 grid gap-3">
                {inventory
                    .unmappedInventory
                    .map(
                        (
                            item,
                        ) => (
                            <article
                                key={
                                    item.id
                                }
                                className="rounded-2xl border border-danger-100 bg-white-warm p-4"
                            >
                                <p className="font-extrabold text-ink-900">
                                    {
                                        item
                                            .productSlug
                                    }

                                    {item
                                        .variantId
                                        ? ` — ${item.variantId}`
                                        : ''}
                                </p>

                                <p className="mt-1 break-all font-mono text-xs font-bold text-danger-700">
                                    {
                                        item.sku
                                    }
                                </p>

                                <p className="mt-2 text-sm text-ink-700">
                                    On hand:{' '}
                                    <strong>
                                        {
                                            item
                                                .onHand
                                        }
                                    </strong>
                                    {' · '}
                                    Reserved:{' '}
                                    <strong>
                                        {
                                            item
                                                .reserved
                                        }
                                    </strong>
                                    {' · '}
                                    Available:{' '}
                                    <strong>
                                        {
                                            item
                                                .available
                                        }
                                    </strong>
                                </p>
                            </article>
                        ),
                    )}
            </div>
        </section>
    );
}

export default function AdminInventory() {
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
        inventory,
        setInventory,
    ] =
        useState<
            AdminInventoryListData |
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
            InventoryFilter
        >(
            'all',
        );

    async function loadInventory(
        adminToken: string,
        options?: {
            quiet?: boolean;
        },
    ) {
        const quiet =
            options
                ?.quiet ??
            false;

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
                    '/api/admin/inventory',
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
                | AdminInventoryListResponse
                | AdminInventoryErrorResponse
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
                        : 'Inventory could not be loaded.',
                );
            }

            setInventory({
                selections:
                    payload.selections,

                unmappedInventory:
                    payload
                        .unmappedInventory,

                recentAdjustments:
                    payload
                        .recentAdjustments,
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
                setInventory(
                    null,
                );
            }

            setError(
                loadError instanceof
                    Error
                    ? loadError.message
                    : 'Inventory could not be loaded.',
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

    async function runMutation(
        request:
            AdminInventoryMutationRequest,
    ): Promise<string> {
        if (
            !token
        ) {
            throw new Error(
                'Administrator authentication is required.',
            );
        }

        const response =
            await fetch(
                '/api/admin/inventory',
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
                            request,
                        ),
                },
            );

        const payload =
            (await response
                .json()
                .catch(
                    () => null,
                )) as
            | AdminInventoryMutationResponse
            | AdminInventoryErrorResponse
            | null;

        if (
            !response.ok ||
            !payload ||
            payload.ok !==
            true
        ) {
            const message =
                payload &&
                    payload.ok ===
                    false
                    ? payload.message
                    : 'The inventory operation could not be completed.';

            if (
                payload &&
                payload.ok ===
                false &&
                payload.code ===
                'inventory-stale'
            ) {
                await loadInventory(
                    token,
                    {
                        quiet:
                            true,
                    },
                ).catch(
                    () =>
                        undefined,
                );
            }

            throw new Error(
                message,
            );
        }

        /*
         * The mutation has already committed at this point. A follow-up GET
         * failure must not make the UI report the write itself as failed.
         *
         * If this refresh does fail, the old updatedAt remains in the card.
         * Any subsequent mutation is therefore rejected as inventory-stale
         * until the administrator successfully refreshes.
         */
        await loadInventory(
            token,
            {
                quiet:
                    true,
            },
        ).catch(
            () =>
                undefined,
        );

        return payload.message;
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

        setInventory(
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

                void loadInventory(
                    savedToken,
                ).catch(
                    () =>
                        undefined,
                );
            }
        },
        [],
    );

    const counts =
        useMemo(
            () => {
                const selections =
                    inventory
                        ?.selections ??
                    [];

                return {
                    all:
                        selections
                            .length,

                    configured:
                        selections.filter(
                            (
                                selection,
                            ) =>
                                selection
                                    .configurationState ===
                                'configured',
                        ).length,

                    needsSetup:
                        selections.filter(
                            (
                                selection,
                            ) =>
                                selection
                                    .configurationState ===
                                'not-configured',
                        ).length,

                    lowStock:
                        selections.filter(
                            (
                                selection,
                            ) =>
                                selection
                                    .inventory
                                    ?.status ===
                                'low-stock',
                        ).length,

                    soldOut:
                        selections.filter(
                            (
                                selection,
                            ) =>
                                selection
                                    .inventory
                                    ?.status ===
                                'sold-out',
                        ).length,

                    reorder:
                        selections.filter(
                            (
                                selection,
                            ) =>
                                selection
                                    .inventory
                                    ?.reorderRecommended ===
                                true,
                        ).length,

                    issues:
                        selections.filter(
                            (
                                selection,
                            ) =>
                                selection
                                    .configurationState ===
                                'sku-mismatch' ||
                                selection
                                    .configurationState ===
                                'catalog-sku-missing',
                        ).length,

                    onHand:
                        selections.reduce(
                            (
                                total,
                                selection,
                            ) =>
                                total +
                                (
                                    selection
                                        .inventory
                                        ?.onHand ??
                                    0
                                ),
                            0,
                        ),

                    reserved:
                        selections.reduce(
                            (
                                total,
                                selection,
                            ) =>
                                total +
                                (
                                    selection
                                        .inventory
                                        ?.reserved ??
                                    0
                                ),
                            0,
                        ),

                    available:
                        selections.reduce(
                            (
                                total,
                                selection,
                            ) =>
                                total +
                                (
                                    selection
                                        .inventory
                                        ?.available ??
                                    0
                                ),
                            0,
                        ),
                };
            },
            [
                inventory,
            ],
        );

    const visibleSelections =
        useMemo(
            () =>
                (
                    inventory
                        ?.selections ??
                    []
                ).filter(
                    (
                        selection,
                    ) =>
                        matchesFilter(
                            selection,
                            filter,
                        ) &&
                        matchesSearch(
                            selection,
                            query,
                        ),
                ),
            [
                inventory,
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
                    Inventory Management
                </h1>

                <p className="mt-3 text-sm leading-6 text-ink-600">
                    Enter the private administrator token to manage physical inventory and stock thresholds.
                </p>

                <form
                    className="mt-6 grid gap-4"
                    onSubmit={(
                        event,
                    ) => {
                        event.preventDefault();

                        void loadInventory(
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
                            : 'Open Inventory'}
                    </button>
                </form>

                {error && (
                    <p className="mt-4 rounded-2xl border border-danger-100 bg-danger-50 p-3 text-sm font-bold text-danger-700">
                        {error}
                    </p>
                )}

                <a
                    href="/admin/orders"
                    className="mt-5 inline-flex text-sm font-extrabold text-brand-700 hover:text-brand-900"
                >
                    Go to Order Fulfillment →
                </a>
            </section>
        );
    }

    if (
        !inventory
    ) {
        return (
            <section className="rounded-4xl border border-sand bg-white-warm p-6 shadow-card">
                <p className="font-bold text-ink-700">
                    Inventory data is unavailable.
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
                        void loadInventory(
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
            InventoryFilter;

            label:
            string;

            count:
            number;
        }[] = [
            {
                value:
                    'all',

                label:
                    'All',

                count:
                    counts.all,
            },

            {
                value:
                    'configured',

                label:
                    'Configured',

                count:
                    counts
                        .configured,
            },

            {
                value:
                    'needs-setup',

                label:
                    'Needs Setup',

                count:
                    counts
                        .needsSetup,
            },

            {
                value:
                    'low-stock',

                label:
                    'Low Stock',

                count:
                    counts
                        .lowStock,
            },

            {
                value:
                    'sold-out',

                label:
                    'Sold Out',

                count:
                    counts
                        .soldOut,
            },

            {
                value:
                    'reorder',

                label:
                    'Reorder',

                count:
                    counts
                        .reorder,
            },

            {
                value:
                    'issues',

                label:
                    'Issues',

                count:
                    counts
                        .issues,
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
                            Inventory Management
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-600">
                            Manage physical stock, reserved quantities, operational thresholds, and the inventory audit trail.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/admin/orders"
                            className="inline-flex min-h-10 items-center rounded-full border border-brand-200 bg-brand-50 px-4 text-sm font-extrabold text-brand-800 transition hover:bg-brand-100"
                        >
                            Order Fulfillment
                        </a>

                        <button
                            type="button"
                            disabled={
                                refreshing
                            }
                            className="min-h-10 rounded-full border border-brand-200 bg-white-warm px-4 text-sm font-extrabold text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => {
                                void loadInventory(
                                    token,
                                    {
                                        quiet:
                                            true,
                                    },
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

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <InventoryMetric
                    label="Configured"
                    value={`${counts.configured}/${counts.all}`}
                    emphasis
                />

                <InventoryMetric
                    label="On Hand"
                    value={
                        counts.onHand
                    }
                />

                <InventoryMetric
                    label="Reserved"
                    value={
                        counts.reserved
                    }
                />

                <InventoryMetric
                    label="Available"
                    value={
                        counts.available
                    }
                    emphasis
                />

                <InventoryMetric
                    label="Reorder"
                    value={
                        counts.reorder
                    }
                />
            </section>

            <UnmappedInventoryWarning
                inventory={
                    inventory
                }
            />

            <section>
                <div className="rounded-4xl border border-sand bg-white-warm p-5 shadow-card sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                                Catalog Inventory
                            </p>

                            <h2 className="mt-2 text-2xl text-ink-900">
                                Products & Variants
                            </h2>
                        </div>

                        <label className="grid gap-1.5 lg:w-80">
                            <span className="form-label">
                                Search inventory
                            </span>

                            <input
                                className="form-control"
                                type="search"
                                placeholder="Product, variant, SKU…"
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
                                        item
                                            .value
                                    }
                                    type="button"
                                    className={[
                                        'rounded-full px-4 py-2 text-sm font-extrabold transition',
                                        filter ===
                                            item
                                                .value
                                            ? 'bg-brand-500 text-white'
                                            : 'border border-sand bg-cream-soft text-ink-700 hover:bg-white-warm',
                                    ].join(
                                        ' ',
                                    )}
                                    onClick={() => {
                                        setFilter(
                                            item
                                                .value,
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
                </div>

                <div className="mt-5 grid gap-5">
                    {visibleSelections
                        .length >
                        0
                        ? visibleSelections.map(
                            (
                                selection,
                            ) => (
                                <InventoryCard
                                    key={
                                        selectionKey(
                                            selection,
                                        )
                                    }
                                    selection={
                                        selection
                                    }
                                    onMutation={
                                        runMutation
                                    }
                                />
                            ),
                        )
                        : (
                            <div className="rounded-4xl border border-sand bg-white-warm p-8 text-center shadow-card">
                                <p className="font-extrabold text-ink-900">
                                    No inventory selections match this view.
                                </p>

                                <p className="mt-2 text-sm text-ink-600">
                                    Try another filter or search term.
                                </p>
                            </div>
                        )}
                </div>
            </section>

            <AdjustmentHistory
                inventory={
                    inventory
                }
            />
        </div>
    );
}