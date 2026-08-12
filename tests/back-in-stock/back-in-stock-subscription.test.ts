import assert from 'node:assert/strict';

import {
    after,
    before,
    beforeEach,
    test,
} from 'node:test';

import {
    createHash,
} from 'node:crypto';

import {
    getDatabase,
} from '@netlify/database';

import {
    NetlifyDB,
} from '@netlify/database-dev';

import {
    BackInStockError,
    subscribeToBackInStock,
} from '../../src/server/back-in-stock';

import type {
    BackInStockSubscriptionInput,
} from '../../src/types/back-in-stock';

const TEST_PRODUCT_SLUG =
    'adventure-fit-harness';

const TEST_VARIANT_ID =
    'large';

const TEST_SKU =
    'DEMO-WALK-001-L';

const TEST_EMAIL =
    'alerts@example.com';

interface SubscriptionRow {
    id: string;

    product_slug: string;

    variant_id:
    | string
    | null;

    sku: string;

    email: string;

    email_hash: string;

    status: string;

    request_count:
    | string
    | number;

    notification_count:
    | string
    | number;

    last_notified_at:
    | string
    | Date
    | null;
}

interface CountRow {
    count:
    | string
    | number;
}

let databaseEmulator:
    NetlifyDB |
    undefined;

let testDatabase:
    ReturnType<
        typeof getDatabase
    > |
    undefined;

function getTestDatabase():
    ReturnType<
        typeof getDatabase
    > {
    assert.ok(
        testDatabase,
        'The test database has not been initialized.',
    );

    return testDatabase;
}

function hashEmail(
    email:
        string,
): string {
    return createHash(
        'sha256',
    )
        .update(
            email,
            'utf8',
        )
        .digest(
            'hex',
        );
}

async function subscribe(
    input:
        BackInStockSubscriptionInput,
): Promise<void> {
    await subscribeToBackInStock(
        input,
        getTestDatabase(),
    );
}

async function seedLargeHarnessInventory(
    options?: {
        onHand?:
        number;

        reserved?:
        number;
    },
): Promise<void> {
    const db =
        getTestDatabase();

    const onHand =
        options
            ?.onHand ??
        0;

    const reserved =
        options
            ?.reserved ??
        0;

    await db.sql`
    INSERT INTO inventory_items (
      product_slug,
      variant_id,
      sku,
      on_hand,
      reserved,
      low_stock_threshold,
      reorder_threshold
    )
    VALUES (
      ${TEST_PRODUCT_SLUG},
      ${TEST_VARIANT_ID},
      ${TEST_SKU},
      ${onHand},
      ${reserved},
      2,
      3
    )
  `;
}

async function readSubscriptions():
    Promise<
        SubscriptionRow[]
    > {
    const db =
        getTestDatabase();

    const rows =
        await db.sql`
      SELECT
        id,
        product_slug,
        variant_id,
        sku,
        email,
        email_hash,
        status,
        request_count,
        notification_count,
        last_notified_at
      FROM back_in_stock_subscriptions
      ORDER BY created_at ASC
    `;

    return rows as
        SubscriptionRow[];
}

async function countSubscriptions():
    Promise<number> {
    const db =
        getTestDatabase();

    const rows =
        await db.sql<CountRow>`
      SELECT
        COUNT(*) AS count
      FROM back_in_stock_subscriptions
    `;

    const row =
        rows[0];

    assert.ok(
        row,
    );

    return Number(
        row.count,
    );
}

before(
    async () => {
        databaseEmulator =
            new NetlifyDB();

        const connectionString =
            await databaseEmulator
                .start();

        await databaseEmulator
            .applyMigrations(
                './netlify/database/migrations',
            );

        /*
         * Every query in this suite uses this exact driver.
         *
         * Unlike the previous version, the service does not create an
         * additional hidden pool through getDatabase().
         */
        testDatabase =
            getDatabase({
                connectionString,
            });
    },
);

after(
    async () => {
        /*
         * Close the Postgres pool before stopping the in-memory server.
         *
         * Otherwise the emulator can terminate an idle connection while
         * node:test is still listening for pool/socket errors, producing
         * asynchronous "Connection terminated unexpectedly" failures after
         * otherwise successful tests.
         */
        const database =
            testDatabase;

        testDatabase =
            undefined;

        if (
            database
        ) {
            await database
                .pool
                .end();
        }

        await databaseEmulator
            ?.stop();

        databaseEmulator =
            undefined;
    },
);

beforeEach(
    async () => {
        const db =
            getTestDatabase();

        await db.sql`
      TRUNCATE TABLE
        back_in_stock_subscriptions,
        inventory_adjustments,
        inventory_reservation_items,
        inventory_reservations,
        inventory_items
      RESTART IDENTITY
      CASCADE
    `;
    },
);

test(
    'sold-out inventory creates one normalized active subscription',
    async () => {
        await seedLargeHarnessInventory();

        await subscribe({
            productSlug:
                TEST_PRODUCT_SLUG,

            variantId:
                TEST_VARIANT_ID,

            email:
                '  Alerts@Example.COM  ',

            source:
                'product-detail-sold-out',
        });

        const rows =
            await readSubscriptions();

        assert.equal(
            rows.length,
            1,
        );

        const row =
            rows[0];

        assert.ok(
            row,
        );

        assert.equal(
            row.product_slug,
            TEST_PRODUCT_SLUG,
        );

        assert.equal(
            row.variant_id,
            TEST_VARIANT_ID,
        );

        assert.equal(
            row.sku,
            TEST_SKU,
        );

        assert.equal(
            row.email,
            TEST_EMAIL,
        );

        assert.equal(
            row.email_hash,
            hashEmail(
                TEST_EMAIL,
            ),
        );

        assert.equal(
            row.status,
            'active',
        );

        assert.equal(
            Number(
                row.request_count,
            ),
            1,
        );

        assert.equal(
            Number(
                row.notification_count,
            ),
            0,
        );
    },
);

test(
    'repeated requests for the same normalized email reuse one subscription',
    async () => {
        await seedLargeHarnessInventory();

        await subscribe({
            productSlug:
                TEST_PRODUCT_SLUG,

            variantId:
                TEST_VARIANT_ID,

            email:
                'alerts@example.com',

            source:
                'product-detail-sold-out',
        });

        const firstRows =
            await readSubscriptions();

        const first =
            firstRows[0];

        assert.ok(
            first,
        );

        await subscribe({
            productSlug:
                TEST_PRODUCT_SLUG,

            variantId:
                TEST_VARIANT_ID,

            email:
                ' ALERTS@EXAMPLE.COM ',

            source:
                'product-detail-sold-out',
        });

        const secondRows =
            await readSubscriptions();

        assert.equal(
            secondRows.length,
            1,
            'Duplicate requests must not create another subscription row.',
        );

        const second =
            secondRows[0];

        assert.ok(
            second,
        );

        assert.equal(
            second.id,
            first.id,
            'The existing subscription row should be reused.',
        );

        assert.equal(
            second.email,
            TEST_EMAIL,
        );

        assert.equal(
            Number(
                second.request_count,
            ),
            2,
        );

        assert.equal(
            second.status,
            'active',
        );
    },
);

test(
    'currently available inventory rejects a back-in-stock request',
    async () => {
        await seedLargeHarnessInventory({
            onHand:
                1,

            reserved:
                0,
        });

        await assert.rejects(
            () =>
                subscribe({
                    productSlug:
                        TEST_PRODUCT_SLUG,

                    variantId:
                        TEST_VARIANT_ID,

                    email:
                        TEST_EMAIL,

                    source:
                        'product-detail-sold-out',
                }),
            (
                error:
                    unknown,
            ) => {
                assert.ok(
                    error instanceof
                    BackInStockError,
                );

                assert.equal(
                    error.code,
                    'already-in-stock',
                );

                assert.equal(
                    error.status,
                    409,
                );

                return true;
            },
        );

        assert.equal(
            await countSubscriptions(),
            0,
            'An in-stock request must not leave a subscription behind.',
        );
    },
);

test(
    'fully reserved physical stock is eligible because available inventory is zero',
    async () => {
        await seedLargeHarnessInventory({
            onHand:
                1,

            reserved:
                1,
        });

        await subscribe({
            productSlug:
                TEST_PRODUCT_SLUG,

            variantId:
                TEST_VARIANT_ID,

            email:
                TEST_EMAIL,

            source:
                'product-detail-sold-out',
        });

        const rows =
            await readSubscriptions();

        assert.equal(
            rows.length,
            1,
        );

        const row =
            rows[0];

        assert.ok(
            row,
        );

        assert.equal(
            row.status,
            'active',
        );

        assert.equal(
            Number(
                row.request_count,
            ),
            1,
        );
    },
);

test(
    'a previously notified subscription can be reactivated for a later stock cycle',
    async () => {
        await seedLargeHarnessInventory();

        await subscribe({
            productSlug:
                TEST_PRODUCT_SLUG,

            variantId:
                TEST_VARIANT_ID,

            email:
                TEST_EMAIL,

            source:
                'product-detail-sold-out',
        });

        const initialRows =
            await readSubscriptions();

        const initial =
            initialRows[0];

        assert.ok(
            initial,
        );

        const db =
            getTestDatabase();

        await db.sql`
      UPDATE back_in_stock_subscriptions
      SET
        status =
          'notified',

        notification_count =
          1,

        last_notified_at =
          NOW(),

        claim_token =
          NULL,

        claim_expires_at =
          NULL
      WHERE id =
        ${initial.id}
    `;

        await subscribe({
            productSlug:
                TEST_PRODUCT_SLUG,

            variantId:
                TEST_VARIANT_ID,

            email:
                TEST_EMAIL,

            source:
                'product-detail-sold-out',
        });

        const reactivatedRows =
            await readSubscriptions();

        assert.equal(
            reactivatedRows.length,
            1,
        );

        const reactivated =
            reactivatedRows[0];

        assert.ok(
            reactivated,
        );

        assert.equal(
            reactivated.id,
            initial.id,
            'A later alert cycle must reuse the existing subscription row.',
        );

        assert.equal(
            reactivated.status,
            'active',
        );

        assert.equal(
            Number(
                reactivated.request_count,
            ),
            2,
        );

        assert.equal(
            Number(
                reactivated.notification_count,
            ),
            1,
            'Reactivation must preserve the number of notifications already delivered.',
        );

        assert.ok(
            reactivated.last_notified_at,
            'Historical notification information should remain available after reactivation.',
        );
    },
);