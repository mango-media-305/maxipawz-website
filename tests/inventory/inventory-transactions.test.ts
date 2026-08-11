import assert from 'node:assert/strict';

import { after, before, beforeEach, test } from 'node:test';

import { getDatabase } from '@netlify/database';

import { NetlifyDB } from '@netlify/database-dev';

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

const TEST_PRODUCT_SLUG = 'tug-and-fetch-rope-ball';

const TEST_SKU = 'DEMO-PLAY-001';

interface InventoryStateRow {
  on_hand: string | number;

  reserved: string | number;
}

interface CountRow {
  count: string | number;
}

let databaseEmulator: NetlifyDB | undefined;

let testDatabase: ReturnType<typeof getDatabase> | undefined;

function getTestDatabase(): ReturnType<typeof getDatabase> {
  assert.ok(testDatabase, 'The test database has not been initialized.');

  return testDatabase;
}

function futureExpiration(): Date {
  return new Date(Date.now() + 60 * 60 * 1000);
}

async function seedInventory(onHand: number): Promise<void> {
  const db = getTestDatabase();

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

async function readInventoryState(): Promise<{
  onHand: number;

  reserved: number;

  available: number;
}> {
  const db = getTestDatabase();

  const rows = await db.sql<InventoryStateRow>`
            SELECT
                on_hand,
                reserved
            FROM inventory_items
            WHERE sku = ${TEST_SKU}
        `;

  const row = rows[0];

  assert.ok(row, 'Expected the test inventory row to exist.');

  const onHand = Number(row.on_hand);

  const reserved = Number(row.reserved);

  assert.ok(Number.isSafeInteger(onHand));

  assert.ok(Number.isSafeInteger(reserved));

  return {
    onHand,

    reserved,

    available: onHand - reserved,
  };
}

async function countReservations(): Promise<number> {
  const db = getTestDatabase();

  const rows = await db.sql<CountRow>`
            SELECT
                COUNT(*) AS count
            FROM inventory_reservations
        `;

  const row = rows[0];

  assert.ok(row);

  return Number(row.count);
}

async function countAdjustments(): Promise<number> {
  const db = getTestDatabase();

  const rows = await db.sql<CountRow>`
            SELECT
                COUNT(*) AS count
            FROM inventory_adjustments
        `;

  const row = rows[0];

  assert.ok(row);

  return Number(row.count);
}

before(async () => {
  databaseEmulator = new NetlifyDB();

  const connectionString = await databaseEmulator.start();

  /*
   * Application services use getDatabase() without passing a
   * connection string. Point those calls at this isolated,
   * in-memory test database.
   */
  process.env.NETLIFY_DB_URL = connectionString;

  await databaseEmulator.applyMigrations('./netlify/database/migrations');

  testDatabase = getDatabase({
    connectionString,
  });
});

after(async () => {
  delete process.env.NETLIFY_DB_URL;

  await databaseEmulator?.stop();
});

beforeEach(async () => {
  const db = getTestDatabase();

  await db.sql`
            TRUNCATE TABLE
                inventory_adjustments,
                inventory_reservation_items,
                inventory_reservations,
                inventory_items
            RESTART IDENTITY
            CASCADE
        `;
});

test('concurrent reservations cannot oversell the final unit', async () => {
  await seedInventory(1);

  const attempts = await Promise.allSettled([
    createInventoryReservation({
      cartReference: 'automated-concurrency-a',

      expiresAt: futureExpiration(),

      lines: [
        {
          productSlug: TEST_PRODUCT_SLUG,

          sku: TEST_SKU,

          quantity: 1,
        },
      ],
    }),

    createInventoryReservation({
      cartReference: 'automated-concurrency-b',

      expiresAt: futureExpiration(),

      lines: [
        {
          productSlug: TEST_PRODUCT_SLUG,

          sku: TEST_SKU,

          quantity: 1,
        },
      ],
    }),
  ]);

  const fulfilled = attempts.filter((result) => result.status === 'fulfilled');

  const rejected = attempts.filter((result) => result.status === 'rejected');

  assert.equal(fulfilled.length, 1, 'Exactly one cart should reserve the final unit.');

  assert.equal(rejected.length, 1, 'Exactly one competing cart should be rejected.');

  const failure = rejected[0];

  assert.ok(failure && failure.status === 'rejected');

  assert.ok(failure.reason instanceof InventoryReservationError);

  assert.equal(failure.reason.code, 'insufficient-stock');

  const inventory = await readInventoryState();

  assert.deepEqual(inventory, {
    onHand: 1,

    reserved: 1,

    available: 0,
  });

  assert.equal(
    await countReservations(),
    1,
    'The rejected cart must not leave a reservation behind.',
  );
});

test('completion consumes reserved stock exactly once', async () => {
  await seedInventory(3);

  const reservation = await createInventoryReservation({
    cartReference: 'automated-completion',

    expiresAt: futureExpiration(),

    lines: [
      {
        productSlug: TEST_PRODUCT_SLUG,

        sku: TEST_SKU,

        quantity: 2,
      },
    ],
  });

  assert.deepEqual(await readInventoryState(), {
    onHand: 3,

    reserved: 2,

    available: 1,
  });

  const firstCompletion = await completeInventoryReservation(
    reservation.id,
    'cs_test_inventory_completion',
  );

  assert.equal(firstCompletion.status, 'completed');

  assert.equal(firstCompletion.changed, true);

  /*
   * Completing a reservation removes the sold physical units
   * from on_hand and simultaneously releases them from reserved.
   *
   * available remains 1:
   *
   * before: 3 - 2 = 1
   * after:  1 - 0 = 1
   */
  assert.deepEqual(await readInventoryState(), {
    onHand: 1,

    reserved: 0,

    available: 1,
  });

  const repeatedCompletion = await completeInventoryReservation(
    reservation.id,
    'cs_test_inventory_completion',
  );

  assert.equal(repeatedCompletion.status, 'completed');

  assert.equal(repeatedCompletion.changed, false);

  assert.deepEqual(
    await readInventoryState(),
    {
      onHand: 1,

      reserved: 0,

      available: 1,
    },
    'A repeated completion event must not consume inventory twice.',
  );
});

test('payment failure releases reserved stock exactly once', async () => {
  await seedInventory(3);

  const reservation = await createInventoryReservation({
    cartReference: 'automated-payment-failure',

    expiresAt: futureExpiration(),

    lines: [
      {
        productSlug: TEST_PRODUCT_SLUG,

        sku: TEST_SKU,

        quantity: 2,
      },
    ],
  });

  assert.deepEqual(await readInventoryState(), {
    onHand: 3,

    reserved: 2,

    available: 1,
  });

  const firstRelease = await releaseInventoryReservationAfterPaymentFailure(
    reservation.id,
    'cs_test_inventory_failure',
  );

  assert.equal(firstRelease.status, 'released');

  assert.equal(firstRelease.changed, true);

  assert.deepEqual(await readInventoryState(), {
    onHand: 3,

    reserved: 0,

    available: 3,
  });

  const repeatedRelease = await releaseInventoryReservationAfterPaymentFailure(
    reservation.id,
    'cs_test_inventory_failure',
  );

  assert.equal(repeatedRelease.status, 'released');

  assert.equal(repeatedRelease.changed, false);

  assert.deepEqual(
    await readInventoryState(),
    {
      onHand: 3,

      reserved: 0,

      available: 3,
    },
    'A repeated failure event must not restore stock twice.',
  );
});

test('admin inventory changes cannot cross the reserved floor', async () => {
  await seedInventory(3);

  await createInventoryReservation({
    cartReference: 'automated-admin-floor',

    expiresAt: futureExpiration(),

    lines: [
      {
        productSlug: TEST_PRODUCT_SLUG,

        sku: TEST_SKU,

        quantity: 2,
      },
    ],
  });

  assert.deepEqual(await readInventoryState(), {
    onHand: 3,

    reserved: 2,

    available: 1,
  });

  await assert.rejects(
    () =>
      executeAdminInventoryMutation({
        action: 'set-on-hand',

        productSlug: TEST_PRODUCT_SLUG,

        onHand: 1,

        reason: 'Automated reserved floor rejection test',
      }),
    (error: unknown) => {
      assert.ok(error instanceof InventoryManagementError);

      assert.equal(error.code, 'inventory-below-reserved');

      return true;
    },
  );

  assert.deepEqual(
    await readInventoryState(),
    {
      onHand: 3,

      reserved: 2,

      available: 1,
    },
    'Rejected admin changes must roll back completely.',
  );

  assert.equal(
    await countAdjustments(),
    0,
    'A rejected admin mutation must not create an audit record.',
  );

  const successfulAdjustment = await executeAdminInventoryMutation({
    action: 'adjust-on-hand',

    productSlug: TEST_PRODUCT_SLUG,

    quantityDelta: 1,

    reason: 'Automated reserved preservation test',
  });

  assert.equal(successfulAdjustment.inventory.onHand, 4);

  assert.equal(
    successfulAdjustment.inventory.reserved,
    2,
    'Admin stock changes must never modify reserved units.',
  );

  assert.equal(successfulAdjustment.adjustment.reservedAtChange, 2);

  assert.deepEqual(await readInventoryState(), {
    onHand: 4,

    reserved: 2,

    available: 2,
  });

  assert.equal(
    await countAdjustments(),
    1,
    'The successful admin mutation should have exactly one audit record.',
  );
});
