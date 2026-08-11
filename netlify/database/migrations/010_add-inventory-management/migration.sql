/*
 * Phase 1C — Inventory Management
 *
 * Adds:
 *
 * - an optional reorder threshold for operational stock planning
 * - an append-only audit trail for administrator inventory changes
 *
 * Existing migrations 001–009 remain immutable.
 */

ALTER TABLE inventory_items
ADD COLUMN reorder_threshold INTEGER;

ALTER TABLE inventory_items
ADD CONSTRAINT inventory_items_reorder_threshold_non_negative
CHECK (
    reorder_threshold IS NULL
    OR reorder_threshold >= 0
);

CREATE TABLE inventory_adjustments (
    id BIGSERIAL PRIMARY KEY,

    inventory_item_id BIGINT
        REFERENCES inventory_items(id)
        ON DELETE SET NULL,

    product_slug TEXT NOT NULL,

    variant_id TEXT,

    sku TEXT NOT NULL,

    action TEXT NOT NULL,

    quantity_delta INTEGER,

    previous_on_hand INTEGER,

    next_on_hand INTEGER,

    reserved_at_change INTEGER NOT NULL,

    previous_low_stock_threshold INTEGER,

    next_low_stock_threshold INTEGER,

    previous_reorder_threshold INTEGER,

    next_reorder_threshold INTEGER,

    reason TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    CONSTRAINT inventory_adjustments_product_slug_not_blank
        CHECK (
            LENGTH(
                TRIM(product_slug)
            ) > 0
        ),

    CONSTRAINT inventory_adjustments_variant_id_not_blank
        CHECK (
            variant_id IS NULL
            OR LENGTH(
                TRIM(variant_id)
            ) > 0
        ),

    CONSTRAINT inventory_adjustments_sku_not_blank
        CHECK (
            LENGTH(
                TRIM(sku)
            ) > 0
        ),

    CONSTRAINT inventory_adjustments_reason_not_blank
        CHECK (
            LENGTH(
                TRIM(reason)
            ) > 0
        ),

    CONSTRAINT inventory_adjustments_valid_action
        CHECK (
            action IN (
                'provision',
                'adjust-on-hand',
                'set-on-hand',
                'set-thresholds'
            )
        ),

    CONSTRAINT inventory_adjustments_reserved_non_negative
        CHECK (
            reserved_at_change >= 0
        ),

    CONSTRAINT inventory_adjustments_previous_on_hand_non_negative
        CHECK (
            previous_on_hand IS NULL
            OR previous_on_hand >= 0
        ),

    CONSTRAINT inventory_adjustments_next_on_hand_non_negative
        CHECK (
            next_on_hand IS NULL
            OR next_on_hand >= 0
        ),

    CONSTRAINT inventory_adjustments_previous_low_stock_threshold_non_negative
        CHECK (
            previous_low_stock_threshold IS NULL
            OR previous_low_stock_threshold >= 0
        ),

    CONSTRAINT inventory_adjustments_next_low_stock_threshold_non_negative
        CHECK (
            next_low_stock_threshold IS NULL
            OR next_low_stock_threshold >= 0
        ),

    CONSTRAINT inventory_adjustments_previous_reorder_threshold_non_negative
        CHECK (
            previous_reorder_threshold IS NULL
            OR previous_reorder_threshold >= 0
        ),

    CONSTRAINT inventory_adjustments_next_reorder_threshold_non_negative
        CHECK (
            next_reorder_threshold IS NULL
            OR next_reorder_threshold >= 0
        )
);

CREATE INDEX inventory_adjustments_inventory_item_created_index
    ON inventory_adjustments (
        inventory_item_id,
        created_at DESC
    );

CREATE INDEX inventory_adjustments_sku_created_index
    ON inventory_adjustments (
        sku,
        created_at DESC
    );

CREATE INDEX inventory_adjustments_created_at_index
    ON inventory_adjustments (
        created_at DESC
    );