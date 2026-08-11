/*
 * Phase 2A — Back-in-Stock Notifications
 *
 * Stores one reusable subscription record per:
 *
 * inventory item + normalized customer email.
 *
 * A subscription can cycle:
 *
 * active -> processing -> notified
 * notified -> active        (customer requests a future alert again)
 * cancelled -> active       (customer explicitly requests another alert)
 *
 * The email hash is used for deduplication and safe operational logging.
 * The normalized email itself is retained because it is required to
 * deliver the future transactional notification.
 *
 * Existing migrations 001–010 remain immutable.
 */

CREATE TABLE back_in_stock_subscriptions (
    id UUID PRIMARY KEY,

    inventory_item_id BIGINT NOT NULL
        REFERENCES inventory_items(id)
        ON DELETE RESTRICT,

    product_slug TEXT NOT NULL,

    variant_id TEXT,

    sku TEXT NOT NULL,

    email TEXT NOT NULL,

    email_hash TEXT NOT NULL,

    status TEXT NOT NULL
        DEFAULT 'active',

    source TEXT NOT NULL,

    request_count INTEGER NOT NULL
        DEFAULT 1,

    notification_count INTEGER NOT NULL
        DEFAULT 0,

    first_requested_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    last_requested_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    last_attempt_at TIMESTAMPTZ,

    last_notified_at TIMESTAMPTZ,

    cancelled_at TIMESTAMPTZ,

    claim_token UUID,

    claim_expires_at TIMESTAMPTZ,

    last_error TEXT,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

    CONSTRAINT back_in_stock_product_slug_not_blank
        CHECK (
            LENGTH(
                TRIM(product_slug)
            ) > 0
        ),

    CONSTRAINT back_in_stock_variant_id_not_blank
        CHECK (
            variant_id IS NULL
            OR LENGTH(
                TRIM(variant_id)
            ) > 0
        ),

    CONSTRAINT back_in_stock_sku_not_blank
        CHECK (
            LENGTH(
                TRIM(sku)
            ) > 0
        ),

    CONSTRAINT back_in_stock_email_valid_length
        CHECK (
            LENGTH(
                TRIM(email)
            ) > 0
            AND LENGTH(email) <= 254
        ),

    CONSTRAINT back_in_stock_email_hash_valid
        CHECK (
            email_hash ~ '^[0-9a-f]{64}$'
        ),

    CONSTRAINT back_in_stock_source_not_blank
        CHECK (
            LENGTH(
                TRIM(source)
            ) > 0
        ),

    CONSTRAINT back_in_stock_source_length
        CHECK (
            LENGTH(source) <= 100
        ),

    CONSTRAINT back_in_stock_valid_status
        CHECK (
            status IN (
                'active',
                'processing',
                'notified',
                'cancelled'
            )
        ),

    CONSTRAINT back_in_stock_request_count_positive
        CHECK (
            request_count >= 1
        ),

    CONSTRAINT back_in_stock_notification_count_non_negative
        CHECK (
            notification_count >= 0
        ),

    CONSTRAINT back_in_stock_request_dates_valid
        CHECK (
            first_requested_at <= last_requested_at
        ),

    /*
     * A worker may claim a subscription only while status is
     * "processing". All other states must have no active claim.
     */
    CONSTRAINT back_in_stock_claim_state_valid
        CHECK (
            (
                status = 'processing'
                AND claim_token IS NOT NULL
                AND claim_expires_at IS NOT NULL
            )
            OR
            (
                status <> 'processing'
                AND claim_token IS NULL
                AND claim_expires_at IS NULL
            )
        ),

    CONSTRAINT back_in_stock_notified_state_valid
        CHECK (
            status <> 'notified'
            OR (
                last_notified_at IS NOT NULL
                AND notification_count >= 1
            )
        ),

    CONSTRAINT back_in_stock_cancelled_state_valid
        CHECK (
            status <> 'cancelled'
            OR cancelled_at IS NOT NULL
        ),

    CONSTRAINT back_in_stock_inventory_email_unique
        UNIQUE (
            inventory_item_id,
            email_hash
        )
);

CREATE INDEX back_in_stock_status_requested_index
    ON back_in_stock_subscriptions (
        status,
        last_requested_at
    );

CREATE INDEX back_in_stock_inventory_status_index
    ON back_in_stock_subscriptions (
        inventory_item_id,
        status
    );

CREATE INDEX back_in_stock_email_hash_index
    ON back_in_stock_subscriptions (
        email_hash
    );

CREATE INDEX back_in_stock_processing_claim_index
    ON back_in_stock_subscriptions (
        claim_expires_at
    )
    WHERE status = 'processing';

CREATE OR REPLACE FUNCTION maxipawz_set_back_in_stock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER back_in_stock_subscriptions_set_updated_at
BEFORE UPDATE ON back_in_stock_subscriptions
FOR EACH ROW
EXECUTE FUNCTION maxipawz_set_back_in_stock_updated_at();