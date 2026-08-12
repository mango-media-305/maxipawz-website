/*
 * Removes the temporary Phase 1B orphan-reconciliation acceptance data.
 *
 * Migration 008 is intentionally preserved as immutable history.
 *
 * The reservation is removed first because its reservation-item rows
 * reference inventory_items with ON DELETE RESTRICT. Deleting the parent
 * reservation cascades to its reservation-item row, after which the
 * temporary inventory item can be safely removed.
 *
 * No reservation-status condition is used here intentionally. On a fresh
 * database, migrations 008 and 009 run consecutively before the scheduled
 * reconciler has an opportunity to execute, so this cleanup must work
 * whether the acceptance reservation is still active or already expired.
 */

DELETE FROM inventory_reservations
WHERE
    id = '00000000-0000-4000-8000-000000000008'
    AND cart_reference =
        'phase-1b-orphan-reconciliation-acceptance';

DELETE FROM inventory_items
WHERE
    product_slug =
        'inventory-reconciliation-acceptance'
    AND variant_id IS NULL
    AND sku =
        'DEMO-RECONCILE-001';