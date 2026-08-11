import {
    getDatabase,
} from '@netlify/database';

import {
    InventoryReservationError,
} from './inventory-reservation';

import type {
    InventoryReservationStatus,
} from '../types/inventory-reservation';

export interface InventoryReservationTransitionResult {
    reservationId: string;

    status:
        InventoryReservationStatus;

    changed: boolean;
}

interface LockedReservationRow {
    id: string;

    stripe_session_id:
        | string
        | null;

    status:
        InventoryReservationStatus;
}

interface ReservationItemRow {
    inventory_item_id:
        | string
        | number;

    sku: string;

    quantity:
        | string
        | number;
}

interface LockedInventoryRow {
    id:
        | string
        | number;

    on_hand:
        | string
        | number;

    reserved:
        | string
        | number;
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
        throw new InventoryReservationError(
            500,
            'inventory-state-invalid',
            `Inventory field "${fieldName}" contains an invalid integer.`,
        );
    }

    return normalized;
}

function validateReservationIdentifiers(
    reservationId: string,
    stripeSessionId: string,
): {
    reservationId: string;

    stripeSessionId: string;
} {
    const normalizedReservationId =
        reservationId.trim();

    const normalizedStripeSessionId =
        stripeSessionId.trim();

    if (
        !normalizedReservationId ||
        !normalizedStripeSessionId.startsWith(
            'cs_',
        )
    ) {
        throw new InventoryReservationError(
            400,
            'invalid-reservation',
            'A valid inventory reservation and Stripe Checkout Session are required.',
        );
    }

    return {
        reservationId:
            normalizedReservationId,

        stripeSessionId:
            normalizedStripeSessionId,
    };
}

async function lockReservation(
    client: Awaited<
        ReturnType<
            ReturnType<
                typeof getDatabase
            >['pool']['connect']
        >
    >,
    reservationId: string,
    stripeSessionId: string,
): Promise<LockedReservationRow> {
    const result =
        await client.query(
            `
                SELECT
                    id,
                    stripe_session_id,
                    status
                FROM inventory_reservations
                WHERE id = $1
                FOR UPDATE
            `,
            [
                reservationId,
            ],
        );

    const reservation =
        result.rows[0] as
            | LockedReservationRow
            | undefined;

    if (!reservation) {
        throw new InventoryReservationError(
            404,
            'reservation-not-found',
            'The inventory reservation could not be found.',
        );
    }

    if (
        reservation.stripe_session_id &&
        reservation.stripe_session_id !==
            stripeSessionId
    ) {
        throw new InventoryReservationError(
            409,
            'reservation-conflict',
            'The inventory reservation belongs to another Stripe Checkout Session.',
        );
    }

    /*
     * This also reconciles the safe-but-indeterminate case where Stripe
     * successfully created the Checkout Session but the original function
     * never received the response needed to persist the Session ID.
     *
     * The reservation ID stored in signed Stripe metadata lets the webhook
     * reconnect the two records later.
     */
    if (
        !reservation.stripe_session_id
    ) {
        await client.query(
            `
                UPDATE inventory_reservations
                SET stripe_session_id = $2
                WHERE id = $1
            `,
            [
                reservationId,
                stripeSessionId,
            ],
        );

        reservation.stripe_session_id =
            stripeSessionId;
    }

    return reservation;
}

async function getReservationItems(
    client: Awaited<
        ReturnType<
            ReturnType<
                typeof getDatabase
            >['pool']['connect']
        >
    >,
    reservationId: string,
): Promise<ReservationItemRow[]> {
    const result =
        await client.query(
            `
                SELECT
                    inventory_item_id,
                    sku,
                    quantity
                FROM inventory_reservation_items
                WHERE reservation_id = $1
                ORDER BY sku ASC
            `,
            [
                reservationId,
            ],
        );

    const items =
        result.rows as
            ReservationItemRow[];

    if (
        items.length ===
        0
    ) {
        throw new InventoryReservationError(
            500,
            'inventory-state-invalid',
            'The inventory reservation does not contain any reserved items.',
        );
    }

    return items;
}

async function releaseReservedItems(
    client: Awaited<
        ReturnType<
            ReturnType<
                typeof getDatabase
            >['pool']['connect']
        >
    >,
    reservationId: string,
): Promise<void> {
    const items =
        await getReservationItems(
            client,
            reservationId,
        );

    /*
     * Reservation items were originally stored and are now retrieved in
     * SKU order. Consistent row-lock ordering reduces deadlock risk.
     */
    for (
        const item of
        items
    ) {
        const inventoryResult =
            await client.query(
                `
                    SELECT
                        id,
                        on_hand,
                        reserved
                    FROM inventory_items
                    WHERE id = $1
                    FOR UPDATE
                `,
                [
                    item.inventory_item_id,
                ],
            );

        const inventory =
            inventoryResult
                .rows[0] as
                | LockedInventoryRow
                | undefined;

        if (!inventory) {
            throw new InventoryReservationError(
                500,
                'inventory-state-invalid',
                'Reserved inventory could not be found.',
            );
        }

        const quantity =
            normalizeInteger(
                item.quantity,
                'quantity',
            );

        const reserved =
            normalizeInteger(
                inventory.reserved,
                'reserved',
            );

        if (
            quantity < 1 ||
            reserved <
                quantity
        ) {
            throw new InventoryReservationError(
                500,
                'inventory-state-invalid',
                'Reserved inventory is lower than the reservation quantity.',
            );
        }

        await client.query(
            `
                UPDATE inventory_items
                SET reserved =
                    reserved - $1
                WHERE id = $2
            `,
            [
                quantity,
                item.inventory_item_id,
            ],
        );
    }
}

async function consumeReservedItems(
    client: Awaited<
        ReturnType<
            ReturnType<
                typeof getDatabase
            >['pool']['connect']
        >
    >,
    reservationId: string,
): Promise<void> {
    const items =
        await getReservationItems(
            client,
            reservationId,
        );

    for (
        const item of
        items
    ) {
        const inventoryResult =
            await client.query(
                `
                    SELECT
                        id,
                        on_hand,
                        reserved
                    FROM inventory_items
                    WHERE id = $1
                    FOR UPDATE
                `,
                [
                    item.inventory_item_id,
                ],
            );

        const inventory =
            inventoryResult
                .rows[0] as
                | LockedInventoryRow
                | undefined;

        if (!inventory) {
            throw new InventoryReservationError(
                500,
                'inventory-state-invalid',
                'Reserved inventory could not be found.',
            );
        }

        const quantity =
            normalizeInteger(
                item.quantity,
                'quantity',
            );

        const onHand =
            normalizeInteger(
                inventory.on_hand,
                'on_hand',
            );

        const reserved =
            normalizeInteger(
                inventory.reserved,
                'reserved',
            );

        if (
            quantity < 1 ||
            onHand <
                quantity ||
            reserved <
                quantity
        ) {
            throw new InventoryReservationError(
                500,
                'inventory-state-invalid',
                'Inventory can no longer satisfy the completed reservation.',
            );
        }

        /*
         * The physical units leave on_hand and simultaneously stop being
         * reserved. Therefore available inventory does not change merely
         * because the payment completed:
         *
         * before:
         *   available = on_hand - reserved
         *
         * after:
         *   available = (on_hand - quantity) -
         *               (reserved - quantity)
         */
        await client.query(
            `
                UPDATE inventory_items
                SET
                    on_hand =
                        on_hand - $1,
                    reserved =
                        reserved - $1
                WHERE id = $2
            `,
            [
                quantity,
                item.inventory_item_id,
            ],
        );
    }
}

export async function markInventoryReservationPaymentPending(
    reservationId: string,
    stripeSessionId: string,
): Promise<InventoryReservationTransitionResult> {
    const identifiers =
        validateReservationIdentifiers(
            reservationId,
            stripeSessionId,
        );

    const db =
        getDatabase();

    const client =
        await db.pool.connect();

    try {
        await client.query(
            'BEGIN',
        );

        const reservation =
            await lockReservation(
                client,
                identifiers
                    .reservationId,
                identifiers
                    .stripeSessionId,
            );

        switch (
        reservation.status
        ) {
            case 'active':
                await client.query(
                    `
                        UPDATE inventory_reservations
                        SET status =
                            'payment-pending'
                        WHERE id = $1
                    `,
                    [
                        identifiers
                            .reservationId,
                    ],
                );

                await client.query(
                    'COMMIT',
                );

                return {
                    reservationId:
                        identifiers
                            .reservationId,

                    status:
                        'payment-pending',

                    changed:
                        true,
                };

            case 'payment-pending':
            case 'completed':
                await client.query(
                    'COMMIT',
                );

                return {
                    reservationId:
                        identifiers
                            .reservationId,

                    status:
                        reservation.status,

                    changed:
                        false,
                };

            case 'released':
            case 'expired':
                throw new InventoryReservationError(
                    409,
                    'reservation-conflict',
                    'A released inventory reservation cannot return to payment-pending.',
                );
        }
    } catch (error) {
        await client
            .query(
                'ROLLBACK',
            )
            .catch(
                () => undefined,
            );

        throw error;
    } finally {
        client.release();
    }
}

export async function completeInventoryReservation(
    reservationId: string,
    stripeSessionId: string,
): Promise<InventoryReservationTransitionResult> {
    const identifiers =
        validateReservationIdentifiers(
            reservationId,
            stripeSessionId,
        );

    const db =
        getDatabase();

    const client =
        await db.pool.connect();

    try {
        await client.query(
            'BEGIN',
        );

        const reservation =
            await lockReservation(
                client,
                identifiers
                    .reservationId,
                identifiers
                    .stripeSessionId,
            );

        if (
            reservation.status ===
            'completed'
        ) {
            await client.query(
                'COMMIT',
            );

            return {
                reservationId:
                    identifiers
                        .reservationId,

                status:
                    'completed',

                changed:
                    false,
            };
        }

        if (
            reservation.status ===
                'released' ||
            reservation.status ===
                'expired'
        ) {
            throw new InventoryReservationError(
                409,
                'reservation-conflict',
                'A released inventory reservation cannot be completed.',
            );
        }

        await consumeReservedItems(
            client,
            identifiers
                .reservationId,
        );

        await client.query(
            `
                UPDATE inventory_reservations
                SET
                    status =
                        'completed',
                    completed_at =
                        COALESCE(
                            completed_at,
                            NOW()
                        )
                WHERE id = $1
            `,
            [
                identifiers
                    .reservationId,
            ],
        );

        await client.query(
            'COMMIT',
        );

        return {
            reservationId:
                identifiers
                    .reservationId,

            status:
                'completed',

            changed:
                true,
        };
    } catch (error) {
        await client
            .query(
                'ROLLBACK',
            )
            .catch(
                () => undefined,
            );

        throw error;
    } finally {
        client.release();
    }
}

export async function releaseInventoryReservationAfterPaymentFailure(
    reservationId: string,
    stripeSessionId: string,
): Promise<InventoryReservationTransitionResult> {
    const identifiers =
        validateReservationIdentifiers(
            reservationId,
            stripeSessionId,
        );

    const db =
        getDatabase();

    const client =
        await db.pool.connect();

    try {
        await client.query(
            'BEGIN',
        );

        const reservation =
            await lockReservation(
                client,
                identifiers
                    .reservationId,
                identifiers
                    .stripeSessionId,
            );

        /*
         * A paid/completed state has higher authority than a later-delivered
         * failure event. Stripe does not guarantee webhook ordering, so we
         * must never restore already-sold units because an older event was
         * delivered later.
         */
        if (
            reservation.status ===
            'completed'
        ) {
            await client.query(
                'COMMIT',
            );

            return {
                reservationId:
                    identifiers
                        .reservationId,

                status:
                    'completed',

                changed:
                    false,
            };
        }

        if (
            reservation.status ===
                'released' ||
            reservation.status ===
                'expired'
        ) {
            await client.query(
                'COMMIT',
            );

            return {
                reservationId:
                    identifiers
                        .reservationId,

                status:
                    reservation.status,

                changed:
                    false,
            };
        }

        await releaseReservedItems(
            client,
            identifiers
                .reservationId,
        );

        await client.query(
            `
                UPDATE inventory_reservations
                SET
                    status =
                        'released',
                    release_reason =
                        'async-payment-failed',
                    released_at =
                        COALESCE(
                            released_at,
                            NOW()
                        )
                WHERE id = $1
            `,
            [
                identifiers
                    .reservationId,
            ],
        );

        await client.query(
            'COMMIT',
        );

        return {
            reservationId:
                identifiers
                    .reservationId,

            status:
                'released',

            changed:
                true,
        };
    } catch (error) {
        await client
            .query(
                'ROLLBACK',
            )
            .catch(
                () => undefined,
            );

        throw error;
    } finally {
        client.release();
    }
}

export async function expireInventoryReservation(
    reservationId: string,
    stripeSessionId: string,
): Promise<InventoryReservationTransitionResult> {
    const identifiers =
        validateReservationIdentifiers(
            reservationId,
            stripeSessionId,
        );

    const db =
        getDatabase();

    const client =
        await db.pool.connect();

    try {
        await client.query(
            'BEGIN',
        );

        const reservation =
            await lockReservation(
                client,
                identifiers
                    .reservationId,
                identifiers
                    .stripeSessionId,
            );

        if (
            reservation.status ===
                'expired' ||
            reservation.status ===
                'released'
        ) {
            await client.query(
                'COMMIT',
            );

            return {
                reservationId:
                    identifiers
                        .reservationId,

                status:
                    reservation.status,

                changed:
                    false,
            };
        }

        /*
         * A completed Session should never expire. Likewise, once Checkout
         * has completed with a delayed payment still pending, the reservation
         * must remain held for the async success/failure event.
         *
         * In either case, preserving inventory is safer than releasing it.
         */
        if (
            reservation.status ===
                'completed' ||
            reservation.status ===
                'payment-pending'
        ) {
            await client.query(
                'COMMIT',
            );

            return {
                reservationId:
                    identifiers
                        .reservationId,

                status:
                    reservation.status,

                changed:
                    false,
            };
        }

        await releaseReservedItems(
            client,
            identifiers
                .reservationId,
        );

        await client.query(
            `
                UPDATE inventory_reservations
                SET
                    status =
                        'expired',
                    release_reason =
                        'checkout-session-expired',
                    expired_at =
                        COALESCE(
                            expired_at,
                            NOW()
                        )
                WHERE id = $1
            `,
            [
                identifiers
                    .reservationId,
            ],
        );

        await client.query(
            'COMMIT',
        );

        return {
            reservationId:
                identifiers
                    .reservationId,

            status:
                'expired',

            changed:
                true,
        };
    } catch (error) {
        await client
            .query(
                'ROLLBACK',
            )
            .catch(
                () => undefined,
            );

        throw error;
    } finally {
        client.release();
    }
}