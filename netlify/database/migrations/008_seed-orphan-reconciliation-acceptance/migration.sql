/*
 * TEMPORARY PHASE 1B ORPHAN-RECONCILIATION ACCEPTANCE DATA
 *
 * Creates an intentionally stale inventory reservation with:
 *
 * - one physical unit
 * - one reserved unit
 * - no Stripe Checkout Session ID
 * - an expiration timestamp safely in the past
 *
 * This reproduces the crash window where the database reservation commits
 * but the process exits before a Stripe Checkout Session can be attached.
 *
 * IMPORTANT:
 * Once applied, DO NOT MODIFY OR DELETE THIS MIGRATION.
 * A later compensating migration will remove the test records.
 */

INSERT INTO inventory_items (
    product_slug,
    variant_id,
    sku,
    on_hand,
    reserved,
    low_stock_threshold
)
VALUES (
    'inventory-reconciliation-acceptance',
    NULL,
    'DEMO-RECONCILE-001',
    1,
    1,
    0
);

INSERT INTO inventory_reservations (
    id,
    cart_reference,
    stripe_session_id,
    status,
    expires_at
)
VALUES (
    '00000000-0000-4000-8000-000000000008',
    'phase-1b-orphan-reconciliation-acceptance',
    NULL,
    'active',
    NOW() - INTERVAL '2 hours'
);

INSERT INTO inventory_reservation_items (
    reservation_id,
    inventory_item_id,
    product_slug,
    variant_id,
    sku,
    quantity
)
SELECT
    '00000000-0000-4000-8000-000000000008',
    inventory.id,
    'inventory-reconciliation-acceptance',
    NULL,
    'DEMO-RECONCILE-001',
    1
FROM inventory_items AS inventory
WHERE
    inventory.sku =
        'DEMO-RECONCILE-001';