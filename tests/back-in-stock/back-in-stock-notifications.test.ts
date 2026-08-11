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
    subscribeToBackInStock,
} from '../../src/server/back-in-stock';

import {
    processBackInStockNotifications,
    type BackInStockNotificationEmailRequest,
    type BackInStockNotificationEmailSender,
    type BackInStockNotificationRuntimeConfig,
} from '../../src/server/back-in-stock-notifications';

const TEST_PRODUCT_SLUG =
    'adventure-fit-harness';

const TEST_VARIANT_ID =
    'large';

const TEST_SKU =
    'DEMO-WALK-001-L';

const TEST_EMAIL =
    'worker-alerts@example.com';

const SANDBOX_EMAIL =
    'sandbox@example.com';

const RUNTIME_CONFIG:
    BackInStockNotificationRuntimeConfig =
{
    enabled:
        true,

    mode:
        'test',

    /*
     * No real request is made in these tests.
     * The worker still validates that configured API keys have the expected
     * production shape before execution begins.
     */
    apiKey:
        're_test_automated_worker',

    fromName:
        'Maxi Pawz Store',

    fromEmail:
        'orders@updates.maxipawz.com',

    replyToEmail:
        'support@maxipawz.com',

    sandboxRecipientEmail:
        SANDBOX_EMAIL,

    siteUrl:
        'https://maxipawz.com',
};

interface SubscriptionStateRow {
    id:
    string;

    status:
    string;

    request_count:
    | string
    | number;

    notification_count:
    | string
    | number;

    last_attempt_at:
    | string
    | Date
    | null;

    last_notified_at:
    | string
    | Date
    | null;

    claim_token:
    | string
    | null;

    claim_expires_at:
    | string
    | Date
    | null;

    last_error:
    | string
    | null;
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

async function seedInventory(
    onHand =
        0,
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
      ${TEST_VARIANT_ID},
      ${TEST_SKU},
      ${onHand},
      0,
      2,
      3
    )
  `;
}

async function setOnHand(
    onHand:
        number,
): Promise<void> {
    const db =
        getTestDatabase();

    await db.sql`
    UPDATE inventory_items
    SET
      on_hand =
        ${onHand}
    WHERE
      product_slug =
        ${TEST_PRODUCT_SLUG}

      AND variant_id =
        ${TEST_VARIANT_ID}
  `;
}

async function subscribe():
    Promise<void> {
    await subscribeToBackInStock(
        {
            productSlug:
                TEST_PRODUCT_SLUG,

            variantId:
                TEST_VARIANT_ID,

            email:
                TEST_EMAIL,

            source:
                'product-detail-sold-out',
        },
        getTestDatabase(),
    );
}

async function readSubscription():
    Promise<SubscriptionStateRow> {
    const db =
        getTestDatabase();

    const rows =
        await db.sql<SubscriptionStateRow>`
      SELECT
        id,
        status,
        request_count,
        notification_count,
        last_attempt_at,
        last_notified_at,
        claim_token,
        claim_expires_at,
        last_error
      FROM back_in_stock_subscriptions
      WHERE
        product_slug =
          ${TEST_PRODUCT_SLUG}

        AND variant_id =
          ${TEST_VARIANT_ID}

        AND email =
          ${TEST_EMAIL}
    `;

    const row =
        rows[0];

    assert.ok(
        row,
        'Expected a back-in-stock subscription row to exist.',
    );

    return row;
}

function createSuccessfulSender(
    requests:
        BackInStockNotificationEmailRequest[],
): BackInStockNotificationEmailSender {
    return async (
        request,
    ) => {
        requests.push(
            request,
        );

        return {
            id:
                `mock-email-${requests.length}`,
        };
    };
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

        testDatabase =
            getDatabase({
                connectionString,
            });
    },
);

after(
    async () => {
        const database =
            testDatabase;

        testDatabase =
            undefined;

        if (database) {
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
    'one stock cycle sends exactly one notification',
    async () => {
        await seedInventory(
            0,
        );

        await subscribe();

        const subscriptionBeforeDelivery =
            await readSubscription();

        await setOnHand(
            1,
        );

        const requests:
            BackInStockNotificationEmailRequest[] =
            [];

        const sendEmail =
            createSuccessfulSender(
                requests,
            );

        const firstSummary =
            await processBackInStockNotifications(
                RUNTIME_CONFIG,
                1,
                {
                    database:
                        getTestDatabase(),

                    sendEmail,
                },
            );

        assert.deepEqual(
            firstSummary,
            {
                enabled:
                    true,

                claimed:
                    1,

                sent:
                    1,

                failed:
                    0,

                cancelled:
                    0,

                manualReview:
                    0,
            },
        );

        assert.equal(
            requests.length,
            1,
            'The eligible subscription should result in one email provider request.',
        );

        const firstRequest =
            requests[0];

        assert.ok(
            firstRequest,
        );

        assert.equal(
            firstRequest.to,
            SANDBOX_EMAIL,
            'Test mode must deliver only to the controlled sandbox recipient.',
        );

        assert.equal(
            firstRequest.idempotencyKey,
            `back-in-stock/${subscriptionBeforeDelivery.id}/1`,
        );

        assert.match(
            firstRequest.subject,
            /Adventure Fit Harness/,
        );

        assert.match(
            firstRequest.subject,
            /Large/,
        );

        const notified =
            await readSubscription();

        assert.equal(
            notified.status,
            'notified',
        );

        assert.equal(
            Number(
                notified.notification_count,
            ),
            1,
        );

        assert.ok(
            notified.last_attempt_at,
        );

        assert.ok(
            notified.last_notified_at,
        );

        assert.equal(
            notified.claim_token,
            null,
        );

        assert.equal(
            notified.claim_expires_at,
            null,
        );

        assert.equal(
            notified.last_error,
            null,
        );

        /*
         * Running the worker again while the subscription remains "notified"
         * must not send another message for the same stock cycle.
         */
        const secondSummary =
            await processBackInStockNotifications(
                RUNTIME_CONFIG,
                1,
                {
                    database:
                        getTestDatabase(),

                    sendEmail,
                },
            );

        assert.deepEqual(
            secondSummary,
            {
                enabled:
                    true,

                claimed:
                    0,

                sent:
                    0,

                failed:
                    0,

                cancelled:
                    0,

                manualReview:
                    0,
            },
        );

        assert.equal(
            requests.length,
            1,
            'A repeated worker run must not duplicate a completed notification cycle.',
        );
    },
);

test(
    'a later sold-out cycle advances to notification sequence two',
    async () => {
        await seedInventory(
            0,
        );

        await subscribe();

        const initial =
            await readSubscription();

        const requests:
            BackInStockNotificationEmailRequest[] =
            [];

        const sendEmail =
            createSuccessfulSender(
                requests,
            );

        await setOnHand(
            1,
        );

        const firstSummary =
            await processBackInStockNotifications(
                RUNTIME_CONFIG,
                1,
                {
                    database:
                        getTestDatabase(),

                    sendEmail,
                },
            );

        assert.equal(
            firstSummary.sent,
            1,
        );

        let state =
            await readSubscription();

        assert.equal(
            state.status,
            'notified',
        );

        assert.equal(
            Number(
                state.notification_count,
            ),
            1,
        );

        /*
         * The item sells out again.
         *
         * A customer explicitly asks for another alert, which reactivates the
         * same subscription row while preserving notification history.
         */
        await setOnHand(
            0,
        );

        await subscribe();

        state =
            await readSubscription();

        assert.equal(
            state.id,
            initial.id,
            'A later stock cycle must reuse the existing subscription row.',
        );

        assert.equal(
            state.status,
            'active',
        );

        assert.equal(
            Number(
                state.request_count,
            ),
            2,
        );

        assert.equal(
            Number(
                state.notification_count,
            ),
            1,
        );

        await setOnHand(
            1,
        );

        const secondSummary =
            await processBackInStockNotifications(
                RUNTIME_CONFIG,
                1,
                {
                    database:
                        getTestDatabase(),

                    sendEmail,
                },
            );

        assert.equal(
            secondSummary.sent,
            1,
        );

        assert.equal(
            requests.length,
            2,
        );

        assert.equal(
            requests[0]?.idempotencyKey,
            `back-in-stock/${initial.id}/1`,
        );

        assert.equal(
            requests[1]?.idempotencyKey,
            `back-in-stock/${initial.id}/2`,
            'A legitimate later stock cycle must advance the delivery sequence.',
        );

        const finalState =
            await readSubscription();

        assert.equal(
            finalState.status,
            'notified',
        );

        assert.equal(
            Number(
                finalState.notification_count,
            ),
            2,
        );

        assert.ok(
            finalState.last_notified_at,
        );
    },
);

test(
    'a failed delivery retries with the same idempotency key',
    async () => {
        await seedInventory(
            0,
        );

        await subscribe();

        const initial =
            await readSubscription();

        await setOnHand(
            1,
        );

        const requests:
            BackInStockNotificationEmailRequest[] =
            [];

        const failingSender:
            BackInStockNotificationEmailSender =
            async (
                request,
            ) => {
                requests.push(
                    request,
                );

                return {
                    errorMessage:
                        'Temporary provider failure',
                };
            };

        const failedSummary =
            await processBackInStockNotifications(
                RUNTIME_CONFIG,
                1,
                {
                    database:
                        getTestDatabase(),

                    sendEmail:
                        failingSender,
                },
            );

        assert.equal(
            failedSummary.claimed,
            1,
        );

        assert.equal(
            failedSummary.sent,
            0,
        );

        assert.equal(
            failedSummary.failed,
            1,
        );

        assert.equal(
            requests.length,
            1,
        );

        assert.equal(
            requests[0]?.idempotencyKey,
            `back-in-stock/${initial.id}/1`,
        );

        let failedState =
            await readSubscription();

        assert.equal(
            failedState.status,
            'processing',
        );

        assert.equal(
            Number(
                failedState.notification_count,
            ),
            0,
        );

        assert.ok(
            failedState.last_attempt_at,
        );

        assert.ok(
            failedState.claim_token,
        );

        assert.ok(
            failedState.claim_expires_at,
        );

        assert.equal(
            failedState.last_error,
            'Temporary provider failure',
        );

        /*
         * Simulate the five-minute claim lease expiring.
         *
         * last_attempt_at stays recent, so this remains inside the automatic
         * retry safety window.
         */
        const db =
            getTestDatabase();

        await db.sql`
      UPDATE back_in_stock_subscriptions
      SET
        claim_expires_at =
          NOW() - INTERVAL '1 minute'
      WHERE id =
        ${initial.id}
    `;

        const successfulSender:
            BackInStockNotificationEmailSender =
            async (
                request,
            ) => {
                requests.push(
                    request,
                );

                return {
                    id:
                        'mock-retry-success',
                };
            };

        const retrySummary =
            await processBackInStockNotifications(
                RUNTIME_CONFIG,
                1,
                {
                    database:
                        db,

                    sendEmail:
                        successfulSender,
                },
            );

        assert.equal(
            retrySummary.claimed,
            1,
        );

        assert.equal(
            retrySummary.sent,
            1,
        );

        assert.equal(
            retrySummary.failed,
            0,
        );

        assert.equal(
            requests.length,
            2,
        );

        assert.equal(
            requests[0]?.idempotencyKey,
            requests[1]?.idempotencyKey,
            'A retry of the same delivery cycle must reuse the same provider idempotency key.',
        );

        assert.equal(
            requests[1]?.idempotencyKey,
            `back-in-stock/${initial.id}/1`,
        );

        failedState =
            await readSubscription();

        assert.equal(
            failedState.status,
            'notified',
        );

        assert.equal(
            Number(
                failedState.notification_count,
            ),
            1,
        );

        assert.ok(
            failedState.last_notified_at,
        );

        assert.equal(
            failedState.claim_token,
            null,
        );

        assert.equal(
            failedState.claim_expires_at,
            null,
        );

        assert.equal(
            failedState.last_error,
            null,
        );
    },
);