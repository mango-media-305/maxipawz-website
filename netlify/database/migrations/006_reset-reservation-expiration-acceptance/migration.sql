/*
 * Resets the temporary Phase 1B acceptance inventory so the
 * Checkout Session expiration/release lifecycle can be tested.
 *
 * Migration 005 remains immutable because it has already been applied.
 * This migration creates a fresh one-unit state without rewriting history.
 */

UPDATE inventory_items
SET
    on_hand = 1,
    reserved = 0,
    low_stock_threshold = 1
WHERE
    product_slug = 'tug-and-fetch-rope-ball'
    AND variant_id IS NULL
    AND sku = 'DEMO-PLAY-001';