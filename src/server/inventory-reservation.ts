import { randomUUID } from 'node:crypto';

import { getDatabase } from '@netlify/database';

import type {
    CreateInventoryReservationInput,
    InventoryReservation,
    InventoryReservationErrorCode,
    InventoryReservationItem,
    InventoryReservationReleaseReason,
    InventoryReservationReleaseResult,
    InventoryReservationRequestLine,
    InventoryReservationStatus,
} from '../types/inventory-reservation';

const MAXIMUM_RESERVATION_QUANTITY = 99;

interface InventoryReservationDatabaseRow {
    id: string;

    cart_reference: string;

    stripe_session_id: string | null;

    status: InventoryReservationStatus;

    expires_at: string | Date;

    release_reason: InventoryReservationReleaseReason | null;

    created_at: string | Date;

    updated_at: string | Date;

    completed_at: string | Date | null;

    released_at: string | Date | null;

    expired_at: string | Date | null;
}

interface InventoryReservationItemDatabaseRow {
    inventory_item_id: string | number;

    product_slug: string;

    variant_id: string | null;

    sku: string;

    quantity: string | number;
}

interface LockedInventoryDatabaseRow {
    id: string | number;

    product_slug: string;

    variant_id: string | null;

    sku: string;

    on_hand: string | number;

    reserved: string | number;
}

export class InventoryReservationError extends Error {
    readonly status: number;

    readonly code: InventoryReservationErrorCode;

    constructor(status: number, code: InventoryReservationErrorCode, message: string) {
        super(message);

        this.name = 'InventoryReservationError';

        this.status = status;

        this.code = code;
    }
}

function normalizeInteger(value: string | number, fieldName: string): number {
    const normalized = typeof value === 'number' ? value : Number(value);

    if (!Number.isSafeInteger(normalized)) {
        throw new InventoryReservationError(
            500,
            'inventory-state-invalid',
            `Inventory field "${fieldName}" contains an invalid integer.`,
        );
    }

    return normalized;
}

function normalizeTimestamp(value: string | Date): string {
    if (value instanceof Date) {
        return value.toISOString();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new InventoryReservationError(
            500,
            'inventory-state-invalid',
            'Inventory reservation contains an invalid timestamp.',
        );
    }

    return date.toISOString();
}

function normalizeOptionalTimestamp(value: string | Date | null): string | undefined {
    if (!value) {
        return undefined;
    }

    return normalizeTimestamp(value);
}

function normalizeReservationLine(
    line: InventoryReservationRequestLine,
): InventoryReservationRequestLine {
    const productSlug = line.productSlug.trim();

    const sku = line.sku.trim();

    const variantId = line.variantId?.trim() || undefined;

    if (!productSlug || !sku) {
        throw new InventoryReservationError(
            400,
            'invalid-reservation',
            'Inventory reservation lines require a product identifier and SKU.',
        );
    }

    if (
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > MAXIMUM_RESERVATION_QUANTITY
    ) {
        throw new InventoryReservationError(
            400,
            'invalid-reservation',
            `Inventory reservation quantities must be whole numbers between 1 and ${MAXIMUM_RESERVATION_QUANTITY}.`,
        );
    }

    return {
        productSlug,

        ...(variantId
            ? {
                variantId,
            }
            : {}),

        sku,

        quantity: line.quantity,
    };
}

function normalizeReservationLines(
    lines: InventoryReservationRequestLine[],
): InventoryReservationRequestLine[] {
    if (lines.length === 0) {
        throw new InventoryReservationError(
            400,
            'invalid-reservation',
            'At least one inventory line is required to create a reservation.',
        );
    }

    const groupedLines = new Map<string, InventoryReservationRequestLine>();

    lines.forEach((rawLine) => {
        const line = normalizeReservationLine(rawLine);

        const existing = groupedLines.get(line.sku);

        if (!existing) {
            groupedLines.set(line.sku, line);

            return;
        }

        if (existing.productSlug !== line.productSlug || existing.variantId !== line.variantId) {
            throw new InventoryReservationError(
                400,
                'invalid-reservation',
                'The same SKU cannot represent different products or variants in one reservation.',
            );
        }

        const quantity = existing.quantity + line.quantity;

        if (quantity > MAXIMUM_RESERVATION_QUANTITY) {
            throw new InventoryReservationError(
                400,
                'invalid-reservation',
                `An inventory reservation quantity cannot exceed ${MAXIMUM_RESERVATION_QUANTITY}.`,
            );
        }

        groupedLines.set(line.sku, {
            ...existing,

            quantity,
        });
    });

    return Array.from(groupedLines.values()).sort((first, second) =>
        first.sku.localeCompare(second.sku),
    );
}

function normalizeExpiration(value: string | Date): Date {
    const expiration = value instanceof Date ? new Date(value.getTime()) : new Date(value);

    if (Number.isNaN(expiration.getTime()) || expiration.getTime() <= Date.now()) {
        throw new InventoryReservationError(
            400,
            'invalid-reservation',
            'Inventory reservation expiration must be a valid future timestamp.',
        );
    }

    return expiration;
}

function mapReservationItem(row: InventoryReservationItemDatabaseRow): InventoryReservationItem {
    return {
        inventoryItemId: String(row.inventory_item_id),

        productSlug: row.product_slug,

        ...(row.variant_id
            ? {
                variantId: row.variant_id,
            }
            : {}),

        sku: row.sku,

        quantity: normalizeInteger(row.quantity, 'quantity'),
    };
}

function mapReservation(
    row: InventoryReservationDatabaseRow,
    items: InventoryReservationItem[],
): InventoryReservation {
    return {
        id: row.id,

        cartReference: row.cart_reference,

        ...(row.stripe_session_id
            ? {
                stripeSessionId: row.stripe_session_id,
            }
            : {}),

        status: row.status,

        expiresAt: normalizeTimestamp(row.expires_at),

        ...(row.release_reason
            ? {
                releaseReason: row.release_reason,
            }
            : {}),

        items,

        createdAt: normalizeTimestamp(row.created_at),

        updatedAt: normalizeTimestamp(row.updated_at),

        ...(normalizeOptionalTimestamp(row.completed_at)
            ? {
                completedAt: normalizeOptionalTimestamp(row.completed_at),
            }
            : {}),

        ...(normalizeOptionalTimestamp(row.released_at)
            ? {
                releasedAt: normalizeOptionalTimestamp(row.released_at),
            }
            : {}),

        ...(normalizeOptionalTimestamp(row.expired_at)
            ? {
                expiredAt: normalizeOptionalTimestamp(row.expired_at),
            }
            : {}),
    };
}

function variantsMatch(first: string | null, second?: string): boolean {
    return (first ?? undefined) === second;
}

export async function createInventoryReservation(
    input: CreateInventoryReservationInput,
): Promise<InventoryReservation> {
    const cartReference = input.cartReference.trim();

    if (!cartReference) {
        throw new InventoryReservationError(
            400,
            'invalid-reservation',
            'A cart reference is required to create an inventory reservation.',
        );
    }

    const expiresAt = normalizeExpiration(input.expiresAt);

    const lines = normalizeReservationLines(input.lines);

    const reservationId = randomUUID();

    const db = getDatabase();

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const reservationItems: InventoryReservationItem[] = [];

        /*
         * Lines are sorted by SKU before locking. Consistent lock ordering
         * reduces deadlock risk when two carts contain the same SKUs.
         */
        for (const line of lines) {
            const inventoryResult = await client.query(
                `
                        SELECT
                            id,
                            product_slug,
                            variant_id,
                            sku,
                            on_hand,
                            reserved
                        FROM inventory_items
                        WHERE sku = $1
                        FOR UPDATE
                    `,
                [line.sku],
            );

            const inventory = inventoryResult.rows[0] as LockedInventoryDatabaseRow | undefined;

            if (!inventory) {
                throw new InventoryReservationError(
                    409,
                    'inventory-not-configured',
                    'One of the selected products does not have inventory configured.',
                );
            }

            if (
                inventory.product_slug !== line.productSlug ||
                !variantsMatch(inventory.variant_id, line.variantId)
            ) {
                throw new InventoryReservationError(
                    409,
                    'inventory-not-configured',
                    'Inventory configuration does not match the selected product.',
                );
            }

            const onHand = normalizeInteger(inventory.on_hand, 'on_hand');

            const reserved = normalizeInteger(inventory.reserved, 'reserved');

            if (onHand < 0 || reserved < 0 || reserved > onHand) {
                throw new InventoryReservationError(
                    500,
                    'inventory-state-invalid',
                    'Inventory contains an invalid stock state.',
                );
            }

            const available = onHand - reserved;

            if (line.quantity > available) {
                throw new InventoryReservationError(
                    409,
                    'insufficient-stock',
                    available === 0
                        ? 'One of the selected products is sold out.'
                        : `Only ${available} unit${available === 1 ? '' : 's'} of one selected product remain available.`,
                );
            }

            reservationItems.push({
                inventoryItemId: String(inventory.id),

                productSlug: line.productSlug,

                ...(line.variantId
                    ? {
                        variantId: line.variantId,
                    }
                    : {}),

                sku: line.sku,

                quantity: line.quantity,
            });
        }

        const reservationResult = await client.query(
            `
                    INSERT INTO inventory_reservations (
                        id,
                        cart_reference,
                        status,
                        expires_at
                    )
                    VALUES (
                        $1,
                        $2,
                        'active',
                        $3
                    )
                    RETURNING
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
                `,
            [reservationId, cartReference, expiresAt],
        );

        const reservationRow = reservationResult.rows[0] as InventoryReservationDatabaseRow | undefined;

        if (!reservationRow) {
            throw new InventoryReservationError(
                500,
                'inventory-state-invalid',
                'The inventory reservation could not be created.',
            );
        }

        for (const item of reservationItems) {
            await client.query(
                `
                    UPDATE inventory_items
                    SET reserved =
                        reserved + $1
                    WHERE id = $2
                `,
                [item.quantity, item.inventoryItemId],
            );

            await client.query(
                `
                    INSERT INTO inventory_reservation_items (
                        reservation_id,
                        inventory_item_id,
                        product_slug,
                        variant_id,
                        sku,
                        quantity
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6
                    )
                `,
                [
                    reservationId,
                    item.inventoryItemId,
                    item.productSlug,
                    item.variantId ?? null,
                    item.sku,
                    item.quantity,
                ],
            );
        }

        await client.query('COMMIT');

        return mapReservation(reservationRow, reservationItems);
    } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);

        throw error;
    } finally {
        client.release();
    }
}

export async function attachStripeSessionToInventoryReservation(
    reservationId: string,
    stripeSessionId: string,
): Promise<void> {
    const normalizedReservationId = reservationId.trim();

    const normalizedSessionId = stripeSessionId.trim();

    if (!normalizedReservationId || !normalizedSessionId.startsWith('cs_')) {
        throw new InventoryReservationError(
            400,
            'invalid-reservation',
            'A valid reservation and Stripe Checkout Session are required.',
        );
    }

    const db = getDatabase();

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const reservationResult = await client.query(
            `
                    SELECT
                        id,
                        status,
                        stripe_session_id
                    FROM inventory_reservations
                    WHERE id = $1
                    FOR UPDATE
                `,
            [normalizedReservationId],
        );

        const reservation = reservationResult.rows[0] as
            | {
                id: string;

                status: InventoryReservationStatus;

                stripe_session_id: string | null;
            }
            | undefined;

        if (!reservation) {
            throw new InventoryReservationError(
                404,
                'reservation-not-found',
                'The inventory reservation could not be found.',
            );
        }

        if (reservation.status !== 'active') {
            throw new InventoryReservationError(
                409,
                'reservation-conflict',
                'The inventory reservation is no longer active.',
            );
        }

        if (reservation.stripe_session_id && reservation.stripe_session_id !== normalizedSessionId) {
            throw new InventoryReservationError(
                409,
                'reservation-conflict',
                'The inventory reservation is already linked to another Checkout Session.',
            );
        }

        if (!reservation.stripe_session_id) {
            await client.query(
                `
                    UPDATE inventory_reservations
                    SET stripe_session_id = $2
                    WHERE id = $1
                `,
                [normalizedReservationId, normalizedSessionId],
            );
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);

        throw error;
    } finally {
        client.release();
    }
}

export async function releaseInventoryReservationById(
    reservationId: string,
    releaseReason: InventoryReservationReleaseReason,
): Promise<InventoryReservationReleaseResult> {
    const normalizedReservationId = reservationId.trim();

    if (!normalizedReservationId) {
        throw new InventoryReservationError(
            400,
            'invalid-reservation',
            'A reservation identifier is required.',
        );
    }

    const db = getDatabase();

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        const reservationResult = await client.query(
            `
                    SELECT
                        id,
                        status
                    FROM inventory_reservations
                    WHERE id = $1
                    FOR UPDATE
                `,
            [normalizedReservationId],
        );

        const reservation = reservationResult.rows[0] as
            | {
                id: string;

                status: InventoryReservationStatus;
            }
            | undefined;

        if (!reservation) {
            throw new InventoryReservationError(
                404,
                'reservation-not-found',
                'The inventory reservation could not be found.',
            );
        }

        if (reservation.status !== 'active') {
            await client.query('COMMIT');

            return {
                reservationId: normalizedReservationId,

                status: reservation.status,

                changed: false,
            };
        }

        const itemResult = await client.query(
            `
                    SELECT
                        inventory_item_id,
                        product_slug,
                        variant_id,
                        sku,
                        quantity
                    FROM inventory_reservation_items
                    WHERE reservation_id = $1
                    ORDER BY sku ASC
                `,
            [normalizedReservationId],
        );

        const items = itemResult.rows.map((row) =>
            mapReservationItem(row as InventoryReservationItemDatabaseRow),
        );

        for (const item of items) {
            const inventoryResult = await client.query(
                `
                        SELECT
                            id,
                            reserved
                        FROM inventory_items
                        WHERE id = $1
                        FOR UPDATE
                    `,
                [item.inventoryItemId],
            );

            const inventory = inventoryResult.rows[0] as
                | {
                    id: string | number;

                    reserved: string | number;
                }
                | undefined;

            if (!inventory) {
                throw new InventoryReservationError(
                    500,
                    'inventory-state-invalid',
                    'Reserved inventory could not be found.',
                );
            }

            const reserved = normalizeInteger(inventory.reserved, 'reserved');

            if (reserved < item.quantity) {
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
                [item.quantity, item.inventoryItemId],
            );
        }

        await client.query(
            `
                UPDATE inventory_reservations
                SET
                    status = 'released',
                    release_reason = $2,
                    released_at = NOW()
                WHERE id = $1
            `,
            [normalizedReservationId, releaseReason],
        );

        await client.query('COMMIT');

        return {
            reservationId: normalizedReservationId,

            status: 'released',

            changed: true,
        };
    } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);

        throw error;
    } finally {
        client.release();
    }
}

export async function getInventoryReservationByStripeSessionId(
    stripeSessionId: string,
): Promise<InventoryReservation | undefined> {
    const normalizedSessionId = stripeSessionId.trim();

    if (!normalizedSessionId) {
        return undefined;
    }

    const db = getDatabase();

    const reservationRows = await db.sql`
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
            WHERE stripe_session_id = ${normalizedSessionId}
            LIMIT 1
        `;

    const reservationRow = reservationRows[0] as InventoryReservationDatabaseRow | undefined;

    if (!reservationRow) {
        return undefined;
    }

    const itemRows = await db.sql`
            SELECT
                inventory_item_id,
                product_slug,
                variant_id,
                sku,
                quantity
            FROM inventory_reservation_items
            WHERE reservation_id = ${reservationRow.id}
            ORDER BY sku ASC
        `;

    const items = itemRows.map((row) =>
        mapReservationItem(row as InventoryReservationItemDatabaseRow),
    );

    return mapReservation(reservationRow, items);
}
