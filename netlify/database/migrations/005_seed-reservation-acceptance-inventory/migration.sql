/*
 * TEMPORARY PHASE 1B ACCEPTANCE INVENTORY
 *
 * This migration creates a one-unit inventory scenario used to verify
 * atomic checkout reservations and overselling protection.
 *
 * IMPORTANT:
 * Once this migration has been applied to a Netlify Database branch,
 * DO NOT DELETE OR MODIFY IT.
 *
 * A later compensating migration will remove the acceptance data.
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
    'tug-and-fetch-rope-ball',
    NULL,
    'DEMO-PLAY-001',
    1,
    0,
    1
)
ON CONFLICT (sku)
DO UPDATE SET
    product_slug =
        EXCLUDED.product_slug,

    variant_id =
        EXCLUDED.variant_id,

    on_hand =
        EXCLUDED.on_hand,

    reserved =
        EXCLUDED.reserved,

    low_stock_threshold =
        EXCLUDED.low_stock_threshold;