/*
 * TEMPORARY INVENTORY ACCEPTANCE DATA
 *
 * This migration is intended only for the isolated Netlify Deploy Preview
 * used during Inventory System Phase 1A acceptance testing.
 *
 * DO NOT MERGE THIS MIGRATION INTO dev OR main.
 *
 * The values intentionally exercise multiple inventory states:
 *
 * 12 available -> in-stock
 *  4 available -> low-stock
 *  1 available -> low-stock
 *  0 available -> sold-out
 *
 * Some rows also include reserved inventory so the acceptance test proves
 * that customer-facing availability is calculated as:
 *
 * available = on_hand - reserved
 */

INSERT INTO inventory_items (
    product_slug,
    variant_id,
    sku,
    on_hand,
    reserved,
    low_stock_threshold
)
VALUES
    (
        'tug-and-fetch-rope-ball',
        NULL,
        'DEMO-PLAY-001',
        14,
        2,
        5
    ),

    (
        'whisker-feather-wand',
        NULL,
        'DEMO-PLAY-002',
        6,
        2,
        5
    ),

    (
        'duo-ceramic-bowl-set',
        NULL,
        'DEMO-FEED-001',
        3,
        2,
        5
    ),

    (
        'adventure-fit-harness',
        'small',
        'DEMO-WALK-001-S',
        14,
        2,
        5
    ),

    (
        'adventure-fit-harness',
        'medium',
        'DEMO-WALK-001-M',
        6,
        2,
        5
    ),

    (
        'adventure-fit-harness',
        'large',
        'DEMO-WALK-001-L',
        3,
        3,
        5
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