/*
 * Removes the temporary Phase 1B reservation acceptance data.
 *
 * Migrations 005 and 006 are intentionally preserved as immutable history.
 *
 * The temporary acceptance SKU exists solely for the isolated Phase 1B
 * reservation tests. Any reservation containing only that exact acceptance
 * selection can therefore be removed regardless of lifecycle status.
 *
 * Mixed reservations are intentionally preserved. If one unexpectedly
 * references the acceptance SKU, the final inventory delete will fail
 * closed rather than deleting unrelated reservation data.
 */

DELETE FROM inventory_reservations AS reservation
WHERE
    EXISTS (
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