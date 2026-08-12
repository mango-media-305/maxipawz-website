/*
 * Removes the temporary demo inventory rows that were introduced by
 * 002_seed-inventory-acceptance-data during Inventory System Phase 1A
 * acceptance testing.
 *
 * Migration 002 must remain in the repository because it has already been
 * applied to a Netlify Database branch. This migration compensates for it
 * without rewriting migration history.
 *
 * The DELETE conditions intentionally include the product slug, variant,
 * and SKU so only the exact temporary acceptance rows are removed.
 */

DELETE FROM inventory_items
WHERE
    (
        product_slug = 'tug-and-fetch-rope-ball'
        AND variant_id IS NULL
        AND sku = 'DEMO-PLAY-001'
    )
    OR
    (
        product_slug = 'whisker-feather-wand'
        AND variant_id IS NULL
        AND sku = 'DEMO-PLAY-002'
    )
    OR
    (
        product_slug = 'duo-ceramic-bowl-set'
        AND variant_id IS NULL
        AND sku = 'DEMO-FEED-001'
    )
    OR
    (
        product_slug = 'adventure-fit-harness'
        AND variant_id = 'small'
        AND sku = 'DEMO-WALK-001-S'
    )
    OR
    (
        product_slug = 'adventure-fit-harness'
        AND variant_id = 'medium'
        AND sku = 'DEMO-WALK-001-M'
    )
    OR
    (
        product_slug = 'adventure-fit-harness'
        AND variant_id = 'large'
        AND sku = 'DEMO-WALK-001-L'
    );