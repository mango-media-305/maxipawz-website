/*
 * Removes the temporary Phase 1B reservation acceptance data.
 *
 * Migrations 005 and 006 are intentionally preserved as immutable history.
 *
 * The acceptance reservations must be removed before the temporary
 * inventory item because inventory_reservation_items references
 * inventory_items with ON DELETE RESTRICT.
 *
 * Only single-item, terminal-state reservations containing the exact
 * acceptance SKU are eligible for deletion. If an active, payment-pending,
 * or mixed-item reservation unexpectedly references this SKU, the later
 * inventory delete will fail rather than silently deleting unrelated data.
 */

DELETE FROM inventory_reservations AS reservation
WHERE
    reservation.status IN (
        'completed',
        'released',
        'expired'
    )
    AND EXISTS (
        SELECT 1
        FROM inventory_reservation_items AS item
        WHERE
            item.reservation_id = reservation.id
            AND item.product_slug = 'tug-and-fetch-rope-ball'
            AND item.variant_id IS NULL
            AND item.sku = 'DEMO-PLAY-001'
    )
    AND NOT EXISTS (
        SELECT 1
        FROM inventory_reservation_items AS item
        WHERE
            item.reservation_id = reservation.id
            AND NOT (
                item.product_slug = 'tug-and-fetch-rope-ball'
                AND item.variant_id IS NULL
                AND item.sku = 'DEMO-PLAY-001'
            )
    );

DELETE FROM inventory_items
WHERE
    product_slug = 'tug-and-fetch-rope-ball'
    AND variant_id IS NULL
    AND sku = 'DEMO-PLAY-001';