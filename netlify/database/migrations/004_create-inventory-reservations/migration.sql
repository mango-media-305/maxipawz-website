CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY,

    cart_reference TEXT NOT NULL UNIQUE,

    stripe_session_id TEXT UNIQUE,

    status TEXT NOT NULL DEFAULT 'active',

    expires_at TIMESTAMPTZ NOT NULL,

    release_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,

    CONSTRAINT inventory_reservations_cart_reference_not_blank
        CHECK (LENGTH(TRIM(cart_reference)) > 0),

    CONSTRAINT inventory_reservations_stripe_session_id_not_blank
        CHECK (
            stripe_session_id IS NULL
            OR LENGTH(TRIM(stripe_session_id)) > 0
        ),

    CONSTRAINT inventory_reservations_release_reason_not_blank
        CHECK (
            release_reason IS NULL
            OR LENGTH(TRIM(release_reason)) > 0
        ),

    CONSTRAINT inventory_reservations_valid_status
        CHECK (
            status IN (
                'active',
                'payment-pending',
                'completed',
                'released',
                'expired'
            )
        )
);

CREATE TABLE inventory_reservation_items (
    reservation_id UUID NOT NULL
        REFERENCES inventory_reservations(id)
        ON DELETE CASCADE,

    inventory_item_id BIGINT NOT NULL
        REFERENCES inventory_items(id)
        ON DELETE RESTRICT,

    product_slug TEXT NOT NULL,

    variant_id TEXT,

    sku TEXT NOT NULL,

    quantity INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        reservation_id,
        sku
    ),

    CONSTRAINT inventory_reservation_items_inventory_item_unique
        UNIQUE (
            reservation_id,
            inventory_item_id
        ),

    CONSTRAINT inventory_reservation_items_product_slug_not_blank
        CHECK (
            LENGTH(TRIM(product_slug)) > 0
        ),

    CONSTRAINT inventory_reservation_items_variant_id_not_blank
        CHECK (
            variant_id IS NULL
            OR LENGTH(TRIM(variant_id)) > 0
        ),

    CONSTRAINT inventory_reservation_items_sku_not_blank
        CHECK (
            LENGTH(TRIM(sku)) > 0
        ),

    CONSTRAINT inventory_reservation_items_quantity_positive
        CHECK (
            quantity > 0
        )
);

CREATE INDEX inventory_reservations_status_expires_at_index
    ON inventory_reservations (
        status,
        expires_at
    );

CREATE INDEX inventory_reservations_active_expiration_index
    ON inventory_reservations (
        expires_at
    )
    WHERE status = 'active';

CREATE INDEX inventory_reservation_items_inventory_item_index
    ON inventory_reservation_items (
        inventory_item_id
    );

CREATE INDEX inventory_reservation_items_sku_index
    ON inventory_reservation_items (
        sku
    );

CREATE TRIGGER inventory_reservations_set_updated_at
BEFORE UPDATE ON inventory_reservations
FOR EACH ROW
EXECUTE FUNCTION maxipawz_set_inventory_updated_at();