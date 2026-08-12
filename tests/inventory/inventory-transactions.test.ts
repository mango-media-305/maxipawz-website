import assert from 'node:assert/strict';

import {
    after,
    before,
    beforeEach,
    test,
} from 'node:test';

import {
    getDatabase,
} from '@netlify/database';

import {
    NetlifyDB,
} from '@netlify/database-dev';

import {
    executeAdminInventoryMutation,
    InventoryManagementError,
} from '../../src/server/inventory-management';

import {
    createInventoryReservation,
    InventoryReservationError,
} from '../../src/server/inventory-reservation';

import {
    completeInventoryReservation,
    releaseInventoryReservationAfterPaymentFailure,
} from '../../src/server/inventory-reservation-lifecycle';

const TEST_PRODUCT_SLUG =
    'tug-and-fetch-rope-ball';

const TEST_SKU =
    'DEMO-PLAY-001';

interface InventoryStateRow {
    on_hand:
    | string
    | number;

    reserved:
    | string
    | number;
}

interface InventoryVersionRow {
    updated_at:
    | string
    | Date;
}

interface CountRow {
    count:
    | string
    | number;
}

let databaseEmulator:
    | NetlifyDB
    | undefined;

let testDatabase:
    | ReturnType<
        typeof getDatabase
    >
    | undefined;

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

function futureExpiration():
    Date {
    return new Date(
        Date.now() +
        60 *
        60 *
        1000,
    );
}

async function waitForVersionClock():
    Promise<void> {
    /*
     * Inventory versions are exposed through updatedAt as ISO timestamps.
     * Waiting briefly keeps timestamp-version assertions deterministic in
     * the local database emulator.
     */
    await new Promise<void>(
        (
            resolve,
        ) => {
            setTimeout(
                resolve,
                10,
            );
        },
    );
}

async function seedInventory(
    onHand:
        number,
): Promise<void> {
    const db =
        getTestDatabase();

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
      ${null},
      ${TEST_SKU},
      ${onHand},
      0,
      3,
      4
    )
  `;
}

async function readInventoryState():
    Promise<{
        onHand:
        number;

        reserved:
        number;

        available:
        number;
    }> {
    const db =
        getTestDatabase();

    const rows =
        await db.sql<InventoryStateRow>`
      SELECT
        on_hand,
        reserved
      FROM inventory_items
      WHERE sku =
        ${TEST_SKU}
    `;

    const row =
        rows[0];

    assert.ok(
        row,
        'Expected the test inventory row to exist.',
    );

    const onHand =
        Number(
            row.on_hand,
        );

    const reserved =
        Number(
            row.reserved,
        );

    assert.ok(
        Number.isSafeInteger(
            onHand,
        ),
    );

    assert.ok(
        Number.isSafeInteger(
            reserved,
        ),
    );

    return {
        onHand,

        reserved,

        available:
            onHand -
            reserved,
    };
}

async function readInventoryUpdatedAt():
    Promise<string> {
    const db =
        getTestDatabase();

    const rows =
        await db.sql<InventoryVersionRow>`
      SELECT
        updated_at
      FROM inventory_items
      WHERE sku =
        ${TEST_SKU}
    `;

    const row =
        rows[0];

    assert.ok(
        row,
        'Expected the test inventory version to exist.',
    );

    const timestamp =
        row.updated_at instanceof
            Date
            ? row.updated_at
            : new Date(
                row.updated_at,
            );

    assert.equal(
        Number.isNaN(
            timestamp.getTime(),
        ),
        false,
        'Expected inventory updated_at to contain a valid timestamp.',
    );

    return timestamp
        .toISOString();
}

async function countReservations():
    Promise<number> {
    const db =
        getTestDatabase();

    const rows =
        await db.sql<CountRow>`
      SELECT
        COUNT(*) AS count
      FROM inventory_reservations
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

async function countAdjustments():
    Promise<number> {
    const db =
        getTestDatabase();

    const rows =
        await db.sql<CountRow>`
      SELECT
        COUNT(*) AS count
      FROM inventory_adjustments
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

        /*
         * Application inventory services call getDatabase() without an
         * explicit connection string.
         *
         * Point that default driver at the isolated emulator and use the
         * same default driver for test helper queries. This avoids creating
         * a second independent pool solely for the test harness.
         */
        process.env.NETLIFY_DB_URL =
            connectionString;

        await databaseEmulator
            .applyMigrations(
                './netlify/database/migrations',
            );

        testDatabase =
            getDatabase();
    },
);

after(
    async () => {
        /*
         * Close the database pool before stopping the emulator.
         *
         * Stopping NetlifyDB first can terminate idle pg connections while
         * node:test is still listening for asynchronous socket errors,
         * causing otherwise successful tests to be reported as failed.
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

        delete process.env
            .NETLIFY_DB_URL;

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
    'a second reservation cannot oversell the final unit',
    async () => {
        await seedInventory(
            1,
        );

        const firstReservation =
            await createInventoryReservation({
                cartReference:
                    'automated-final-unit-first',

                expiresAt:
                    futureExpiration(),

                lines: [
                    {
                        productSlug:
                            TEST_PRODUCT_SLUG,

                        sku:
                            TEST_SKU,

                        quantity:
                            1,
                    },
                ],
            });

        assert.equal(
            firstReservation.status,
            'active',
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    1,

                reserved:
                    1,

                available:
                    0,
            },
        );

        await assert.rejects(
            () =>
                createInventoryReservation({
                    cartReference:
                        'automated-final-unit-second',

                    expiresAt:
                        futureExpiration(),

                    lines: [
                        {
                            productSlug:
                                TEST_PRODUCT_SLUG,

                            sku:
                                TEST_SKU,

                            quantity:
                                1,
                        },
                    ],
                }),
            (
                error:
                    unknown,
            ) => {
                assert.ok(
                    error instanceof
                    InventoryReservationError,
                );

                assert.equal(
                    error.code,
                    'insufficient-stock',
                );

                return true;
            },
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    1,

                reserved:
                    1,

                available:
                    0,
            },
            'The rejected second reservation must not oversell the final unit.',
        );

        assert.equal(
            await countReservations(),
            1,
            'Only the successful reservation should remain.',
        );
    },
);

test(
    'completion consumes reserved stock exactly once',
    async () => {
        await seedInventory(
            3,
        );

        const reservation =
            await createInventoryReservation({
                cartReference:
                    'automated-completion',

                expiresAt:
                    futureExpiration(),

                lines: [
                    {
                        productSlug:
                            TEST_PRODUCT_SLUG,

                        sku:
                            TEST_SKU,

                        quantity:
                            2,
                    },
                ],
            });

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    3,

                reserved:
                    2,

                available:
                    1,
            },
        );

        const firstCompletion =
            await completeInventoryReservation(
                reservation.id,
                'cs_test_inventory_completion',
            );

        assert.equal(
            firstCompletion.status,
            'completed',
        );

        assert.equal(
            firstCompletion.changed,
            true,
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    1,

                reserved:
                    0,

                available:
                    1,
            },
        );

        const repeatedCompletion =
            await completeInventoryReservation(
                reservation.id,
                'cs_test_inventory_completion',
            );

        assert.equal(
            repeatedCompletion.status,
            'completed',
        );

        assert.equal(
            repeatedCompletion.changed,
            false,
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    1,

                reserved:
                    0,

                available:
                    1,
            },
            'A repeated completion event must not consume inventory twice.',
        );
    },
);

test(
    'payment failure releases reserved stock exactly once',
    async () => {
        await seedInventory(
            3,
        );

        const reservation =
            await createInventoryReservation({
                cartReference:
                    'automated-payment-failure',

                expiresAt:
                    futureExpiration(),

                lines: [
                    {
                        productSlug:
                            TEST_PRODUCT_SLUG,

                        sku:
                            TEST_SKU,

                        quantity:
                            2,
                    },
                ],
            });

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    3,

                reserved:
                    2,

                available:
                    1,
            },
        );

        const firstRelease =
            await releaseInventoryReservationAfterPaymentFailure(
                reservation.id,
                'cs_test_inventory_failure',
            );

        assert.equal(
            firstRelease.status,
            'released',
        );

        assert.equal(
            firstRelease.changed,
            true,
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    3,

                reserved:
                    0,

                available:
                    3,
            },
        );

        const repeatedRelease =
            await releaseInventoryReservationAfterPaymentFailure(
                reservation.id,
                'cs_test_inventory_failure',
            );

        assert.equal(
            repeatedRelease.status,
            'released',
        );

        assert.equal(
            repeatedRelease.changed,
            false,
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    3,

                reserved:
                    0,

                available:
                    3,
            },
            'A repeated failure event must not restore stock twice.',
        );
    },
);

test(
    'admin inventory changes cannot cross the reserved floor',
    async () => {
        await seedInventory(
            3,
        );

        await createInventoryReservation({
            cartReference:
                'automated-admin-floor',

            expiresAt:
                futureExpiration(),

            lines: [
                {
                    productSlug:
                        TEST_PRODUCT_SLUG,

                    sku:
                        TEST_SKU,

                    quantity:
                        2,
                },
            ],
        });

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    3,

                reserved:
                    2,

                available:
                    1,
            },
        );

        const expectedUpdatedAt =
            await readInventoryUpdatedAt();

        await waitForVersionClock();

        await assert.rejects(
            () =>
                executeAdminInventoryMutation({
                    action:
                        'set-on-hand',

                    productSlug:
                        TEST_PRODUCT_SLUG,

                    expectedUpdatedAt,

                    onHand:
                        1,

                    reason:
                        'Automated reserved floor rejection test',
                }),
            (
                error:
                    unknown,
            ) => {
                assert.ok(
                    error instanceof
                    InventoryManagementError,
                );

                assert.equal(
                    error.code,
                    'inventory-below-reserved',
                );

                return true;
            },
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    3,

                reserved:
                    2,

                available:
                    1,
            },
            'Rejected admin changes must roll back completely.',
        );

        assert.equal(
            await countAdjustments(),
            0,
            'A rejected admin mutation must not create an audit record.',
        );

        const successfulAdjustment =
            await executeAdminInventoryMutation({
                action:
                    'adjust-on-hand',

                productSlug:
                    TEST_PRODUCT_SLUG,

                expectedUpdatedAt,

                quantityDelta:
                    1,

                reason:
                    'Automated reserved preservation test',
            });

        assert.equal(
            successfulAdjustment
                .inventory
                .onHand,
            4,
        );

        assert.equal(
            successfulAdjustment
                .inventory
                .reserved,
            2,
            'Admin stock changes must never modify reserved units.',
        );

        assert.equal(
            successfulAdjustment
                .adjustment
                .reservedAtChange,
            2,
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    4,

                reserved:
                    2,

                available:
                    2,
            },
        );

        assert.equal(
            await countAdjustments(),
            1,
            'The successful admin mutation should have exactly one audit record.',
        );
    },
);

test(
    'replaying an admin mutation from a stale inventory version is rejected',
    async () => {
        await seedInventory(
            3,
        );

        const expectedUpdatedAt =
            await readInventoryUpdatedAt();

        await waitForVersionClock();

        const firstMutation =
            await executeAdminInventoryMutation({
                action:
                    'adjust-on-hand',

                productSlug:
                    TEST_PRODUCT_SLUG,

                expectedUpdatedAt,

                quantityDelta:
                    1,

                reason:
                    'Automated stale retry first mutation',
            });

        assert.equal(
            firstMutation
                .inventory
                .onHand,
            4,
        );

        await assert.rejects(
            () =>
                executeAdminInventoryMutation({
                    action:
                        'adjust-on-hand',

                    productSlug:
                        TEST_PRODUCT_SLUG,

                    expectedUpdatedAt,

                    quantityDelta:
                        1,

                    reason:
                        'Automated stale retry duplicate',
                }),
            (
                error:
                    unknown,
            ) => {
                assert.ok(
                    error instanceof
                    InventoryManagementError,
                );

                assert.equal(
                    error.code,
                    'inventory-stale',
                );

                return true;
            },
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    4,

                reserved:
                    0,

                available:
                    4,
            },
            'A stale retry must not apply the same quantity adjustment twice.',
        );

        assert.equal(
            await countAdjustments(),
            1,
            'The stale retry must not create a second audit record.',
        );
    },
);

test(
    'a stale inventory version also blocks threshold changes',
    async () => {
        await seedInventory(
            3,
        );

        const staleUpdatedAt =
            await readInventoryUpdatedAt();

        await waitForVersionClock();

        const stockMutation =
            await executeAdminInventoryMutation({
                action:
                    'adjust-on-hand',

                productSlug:
                    TEST_PRODUCT_SLUG,

                expectedUpdatedAt:
                    staleUpdatedAt,

                quantityDelta:
                    1,

                reason:
                    'Automated version advance before threshold test',
            });

        assert.equal(
            stockMutation
                .inventory
                .onHand,
            4,
        );

        await assert.rejects(
            () =>
                executeAdminInventoryMutation({
                    action:
                        'set-thresholds',

                    productSlug:
                        TEST_PRODUCT_SLUG,

                    expectedUpdatedAt:
                        staleUpdatedAt,

                    lowStockThreshold:
                        1,

                    reorderThreshold:
                        2,

                    reason:
                        'Automated stale threshold rejection',
                }),
            (
                error:
                    unknown,
            ) => {
                assert.ok(
                    error instanceof
                    InventoryManagementError,
                );

                assert.equal(
                    error.code,
                    'inventory-stale',
                );

                return true;
            },
        );

        assert.deepEqual(
            await readInventoryState(),
            {
                onHand:
                    4,

                reserved:
                    0,

                available:
                    4,
            },
        );

        assert.equal(
            await countAdjustments(),
            1,
            'The stale threshold mutation must not create an audit record.',
        );
    },
);