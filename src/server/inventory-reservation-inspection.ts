import {
    getDatabase,
} from '@netlify/database';

import {
    products,
} from '../data/products';

import type {
    AdminInventoryReservation,
    AdminInventoryReservationItem,
    AdminInventoryReservationsData,
    AdminInventoryReservationSummary,
} from '../types/admin-inventory-reservation';

import type {
    InventoryReservationStatus,
} from '../types/inventory-reservation';

const RESERVATION_DISPLAY_LIMIT =
    200;

interface ReservationInspectionDatabaseRow {
    id: string;

    cart_reference: string;

    stripe_session_id:
        | string
        | null;

    status:
        InventoryReservationStatus;

    expires_at:
        | string
        | Date;

    release_reason:
        | string
        | null;

    created_at:
        | string
        | Date;

    updated_at:
        | string
        | Date;

    completed_at:
        | string
        | Date
        | null;

    released_at:
        | string
        | Date
        | null;

    expired_at:
        | string
        | Date
        | null;

    inventory_item_id:
        | string
        | number
        | null;

    item_product_slug:
        | string
        | null;

    item_variant_id:
        | string
        | null;

    item_sku:
        | string
        | null;

    item_quantity:
        | string
        | number
        | null;
}

interface ReservationSummaryDatabaseRow {
    total:
        | string
        | number;

    active:
        | string
        | number;

    payment_pending:
        | string
        | number;

    completed:
        | string
        | number;

    released:
        | string
        | number;

    expired:
        | string
        | number;

    expiration_past_due:
        | string
        | number;
}

interface HeldUnitsDatabaseRow {
    held_units:
        | string
        | number;
}

interface CatalogSelectionLabel {
    productName: string;

    variantLabel?: string;
}

function normalizeInteger(
    value:
        | string
        | number,
    fieldName: string,
): number {
    const normalized =
        typeof value ===
            'number'
            ? value
            : Number(
                value,
            );

    if (
        !Number.isSafeInteger(
            normalized,
        )
    ) {
        throw new Error(
            `Reservation inspection field "${fieldName}" contains an invalid integer.`,
        );
    }

    return normalized;
}

function normalizeTimestamp(
    value:
        | string
        | Date,
): string {
    const timestamp =
        value instanceof
            Date
            ? value
            : new Date(
                value,
            );

    if (
        Number.isNaN(
            timestamp.getTime(),
        )
    ) {
        throw new Error(
            'Reservation inspection contains an invalid timestamp.',
        );
    }

    return timestamp
        .toISOString();
}

function normalizeOptionalTimestamp(
    value:
        | string
        | Date
        | null,
): string | undefined {
    if (
        value ===
        null
    ) {
        return undefined;
    }

    return normalizeTimestamp(
        value,
    );
}

function selectionKey(
    productSlug: string,
    variantId?: string,
): string {
    return `${productSlug}\u0000${variantId ?? ''}`;
}

function buildCatalogLabelMap():
    Map<
        string,
        CatalogSelectionLabel
    > {
    const labels =
        new Map<
            string,
            CatalogSelectionLabel
        >();

    products.forEach(
        (
            product,
        ) => {
            if (
                product.variants
                    ?.length
            ) {
                product.variants.forEach(
                    (
                        variant,
                    ) => {
                        labels.set(
                            selectionKey(
                                product.slug,
                                variant.id,
                            ),
                            {
                                productName:
                                    product.name,

                                variantLabel:
                                    variant.label,
                            },
                        );
                    },
                );

                return;
            }

            labels.set(
                selectionKey(
                    product.slug,
                ),
                {
                    productName:
                        product.name,
                },
            );
        },
    );

    return labels;
}

function mapReservationItem(
    row:
        ReservationInspectionDatabaseRow,
    labels:
        Map<
            string,
            CatalogSelectionLabel
        >,
): AdminInventoryReservationItem | undefined {
    if (
        row.inventory_item_id ===
            null ||
        row.item_product_slug ===
            null ||
        row.item_sku ===
            null ||
        row.item_quantity ===
            null
    ) {
        return undefined;
    }

    const variantId =
        row.item_variant_id ??
        undefined;

    const catalogLabel =
        labels.get(
            selectionKey(
                row.item_product_slug,
                variantId,
            ),
        );

    return {
        inventoryItemId:
            String(
                row.inventory_item_id,
            ),

        productSlug:
            row.item_product_slug,

        productName:
            catalogLabel
                ?.productName ??
            row.item_product_slug,

        ...(variantId
            ? {
                variantId,
            }
            : {}),

        ...(catalogLabel
            ?.variantLabel
            ? {
                variantLabel:
                    catalogLabel
                        .variantLabel,
            }
            : {}),

        sku:
            row.item_sku,

        quantity:
            normalizeInteger(
                row.item_quantity,
                'item_quantity',
            ),
    };
}

function createReservation(
    row:
        ReservationInspectionDatabaseRow,
): AdminInventoryReservation {
    const expiresAt =
        normalizeTimestamp(
            row.expires_at,
        );

    const holdsInventory =
        row.status ===
            'active' ||
        row.status ===
            'payment-pending';

    const expirationPastDue =
        row.status ===
            'active' &&
        new Date(
            expiresAt,
        ).getTime() <=
            Date.now();

    const completedAt =
        normalizeOptionalTimestamp(
            row.completed_at,
        );

    const releasedAt =
        normalizeOptionalTimestamp(
            row.released_at,
        );

    const expiredAt =
        normalizeOptionalTimestamp(
            row.expired_at,
        );

    return {
        id:
            row.id,

        cartReference:
            row.cart_reference,

        ...(row.stripe_session_id
            ? {
                stripeSessionId:
                    row.stripe_session_id,
            }
            : {}),

        status:
            row.status,

        ...(row.release_reason
            ? {
                releaseReason:
                    row.release_reason,
            }
            : {}),

        expiresAt,

        createdAt:
            normalizeTimestamp(
                row.created_at,
            ),

        updatedAt:
            normalizeTimestamp(
                row.updated_at,
            ),

        ...(completedAt
            ? {
                completedAt,
            }
            : {}),

        ...(releasedAt
            ? {
                releasedAt,
            }
            : {}),

        ...(expiredAt
            ? {
                expiredAt,
            }
            : {}),

        holdsInventory,

        heldUnits:
            0,

        expirationPastDue,

        items: [],
    };
}

function mapSummary(
    row:
        ReservationSummaryDatabaseRow,
    heldUnits:
        HeldUnitsDatabaseRow,
): AdminInventoryReservationSummary {
    return {
        total:
            normalizeInteger(
                row.total,
                'total',
            ),

        active:
            normalizeInteger(
                row.active,
                'active',
            ),

        paymentPending:
            normalizeInteger(
                row.payment_pending,
                'payment_pending',
            ),

        completed:
            normalizeInteger(
                row.completed,
                'completed',
            ),

        released:
            normalizeInteger(
                row.released,
                'released',
            ),

        expired:
            normalizeInteger(
                row.expired,
                'expired',
            ),

        heldUnits:
            normalizeInteger(
                heldUnits
                    .held_units,
                'held_units',
            ),

        expirationPastDue:
            normalizeInteger(
                row.expiration_past_due,
                'expiration_past_due',
            ),
    };
}

export async function inspectInventoryReservations():
    Promise<
        AdminInventoryReservationsData
    > {
    const db =
        getDatabase();

    const [
        reservationRows,
        summaryRows,
        heldUnitRows,
    ] =
        await Promise.all([
            db.sql`
                WITH recent_reservations AS (
                    SELECT
                        id,
                        cart_reference,
                        stripe_session_id,
                        status,
                        expires_at,
                        release_reason,
                        created_at,
                        updated_at,
                        completed_at,
                        released_at,
                        expired_at
                    FROM inventory_reservations
                    ORDER BY
                        created_at DESC,
                        id DESC
                    LIMIT ${RESERVATION_DISPLAY_LIMIT}
                )
                SELECT
                    reservation.id,
                    reservation.cart_reference,
                    reservation.stripe_session_id,
                    reservation.status,
                    reservation.expires_at,
                    reservation.release_reason,
                    reservation.created_at,
                    reservation.updated_at,
                    reservation.completed_at,
                    reservation.released_at,
                    reservation.expired_at,

                    item.inventory_item_id,

                    item.product_slug
                        AS item_product_slug,

                    item.variant_id
                        AS item_variant_id,

                    item.sku
                        AS item_sku,

                    item.quantity
                        AS item_quantity

                FROM recent_reservations
                    AS reservation

                LEFT JOIN inventory_reservation_items
                    AS item
                    ON item.reservation_id =
                        reservation.id

                ORDER BY
                    reservation.created_at DESC,
                    reservation.id DESC,
                    item.sku ASC
            `,

            db.sql`
                SELECT
                    COUNT(*) AS total,

                    COUNT(*) FILTER (
                        WHERE status =
                            'active'
                    ) AS active,

                    COUNT(*) FILTER (
                        WHERE status =
                            'payment-pending'
                    ) AS payment_pending,

                    COUNT(*) FILTER (
                        WHERE status =
                            'completed'
                    ) AS completed,

                    COUNT(*) FILTER (
                        WHERE status =
                            'released'
                    ) AS released,

                    COUNT(*) FILTER (
                        WHERE status =
                            'expired'
                    ) AS expired,

                    COUNT(*) FILTER (
                        WHERE
                            status =
                                'active'
                            AND expires_at <=
                                NOW()
                    ) AS expiration_past_due

                FROM inventory_reservations
            `,

            db.sql`
                SELECT
                    COALESCE(
                        SUM(
                            item.quantity
                        ),
                        0
                    ) AS held_units

                FROM inventory_reservation_items
                    AS item

                INNER JOIN inventory_reservations
                    AS reservation
                    ON reservation.id =
                        item.reservation_id

                WHERE reservation.status
                    IN (
                        'active',
                        'payment-pending'
                    )
            `,
        ]);

    const summaryRow =
        summaryRows[0] as
            | ReservationSummaryDatabaseRow
            | undefined;

    const heldUnitsRow =
        heldUnitRows[0] as
            | HeldUnitsDatabaseRow
            | undefined;

    if (
        !summaryRow ||
        !heldUnitsRow
    ) {
        throw new Error(
            'Reservation summary could not be loaded.',
        );
    }

    const labels =
        buildCatalogLabelMap();

    const reservationMap =
        new Map<
            string,
            AdminInventoryReservation
        >();

    reservationRows.forEach(
        (
            rawRow,
        ) => {
            const row =
                rawRow as
                    ReservationInspectionDatabaseRow;

            let reservation =
                reservationMap.get(
                    row.id,
                );

            if (
                !reservation
            ) {
                reservation =
                    createReservation(
                        row,
                    );

                reservationMap.set(
                    row.id,
                    reservation,
                );
            }

            const item =
                mapReservationItem(
                    row,
                    labels,
                );

            if (
                item
            ) {
                reservation
                    .items
                    .push(
                        item,
                    );
            }
        },
    );

    const reservations =
        Array.from(
            reservationMap
                .values(),
        );

    reservations.forEach(
        (
            reservation,
        ) => {
            if (
                !reservation
                    .holdsInventory
            ) {
                return;
            }

            reservation.heldUnits =
                reservation
                    .items
                    .reduce(
                        (
                            total,
                            item,
                        ) =>
                            total +
                            item.quantity,
                        0,
                    );
        },
    );

    const summary =
        mapSummary(
            summaryRow,
            heldUnitsRow,
        );

    return {
        reservations,

        summary,

        displayLimit:
            RESERVATION_DISPLAY_LIMIT,

        truncated:
            summary.total >
            reservations.length,
    };
}