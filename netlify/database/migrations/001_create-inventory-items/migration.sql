CREATE TABLE IF NOT EXISTS inventory_items (
    id BIGSERIAL PRIMARY KEY,

    product_slug TEXT NOT NULL,
    variant_id TEXT,

    sku TEXT NOT NULL UNIQUE,

    on_hand INTEGER NOT NULL DEFAULT 0,
    reserved INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT inventory_items_product_slug_not_blank
        CHECK (LENGTH(TRIM(product_slug)) > 0),

    CONSTRAINT inventory_items_variant_id_not_blank
        CHECK (
            variant_id IS NULL
            OR LENGTH(TRIM(variant_id)) > 0
        ),

    CONSTRAINT inventory_items_sku_not_blank
        CHECK (LENGTH(TRIM(sku)) > 0),

    CONSTRAINT inventory_items_on_hand_non_negative
        CHECK (on_hand >= 0),

    CONSTRAINT inventory_items_reserved_non_negative
        CHECK (reserved >= 0),

    CONSTRAINT inventory_items_reserved_not_above_on_hand
        CHECK (reserved <= on_hand),

    CONSTRAINT inventory_items_low_stock_threshold_non_negative
        CHECK (low_stock_threshold >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_product_variant_unique
    ON inventory_items (
        product_slug,
        COALESCE(variant_id, '')
    );

CREATE INDEX IF NOT EXISTS inventory_items_product_slug_index
    ON inventory_items (product_slug);

CREATE INDEX IF NOT EXISTS inventory_items_sku_index
    ON inventory_items (sku);

CREATE OR REPLACE FUNCTION maxipawz_set_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inventory_items_set_updated_at
    ON inventory_items;

CREATE TRIGGER inventory_items_set_updated_at
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION maxipawz_set_inventory_updated_at();