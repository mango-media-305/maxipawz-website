import assert from 'node:assert/strict';

import {
    test,
} from 'node:test';

import type {
    PublicInventorySnapshot,
} from '../../src/types/inventory';

import {
    resolveCartLine,
} from '../../src/utils/cart';

import {
    getCheckoutInventoryAvailabilityReason,
    getCheckoutInventoryReadinessReasons,
    getTrackedCheckoutInventoryLines,
} from '../../src/utils/checkout-inventory-readiness';

function getMediumHarnessLine(
    quantity: number,
) {
    return resolveCartLine({
        productSlug:
            'adventure-fit-harness',

        variantId:
            'medium',

        quantity,
    });
}

function createMediumInventory(
    available: number,
): PublicInventorySnapshot {
    return {
        tracked:
            true,

        productSlug:
            'adventure-fit-harness',

        variantId:
            'medium',

        sku:
            'DEMO-WALK-001-M',

        status:
            available ===
                0
                ? 'sold-out'
                : available <=
                    2
                    ? 'low-stock'
                    : 'in-stock',

        available,

        canPurchase:
            available >
            0,
    };
}

test(
    'sold-out tracked inventory blocks checkout',
    () => {
        const trackedLines =
            getTrackedCheckoutInventoryLines([
                getMediumHarnessLine(
                    1,
                ),
            ]);

        assert.equal(
            trackedLines.length,
            1,
        );

        const line =
            trackedLines[0];

        assert.ok(
            line,
        );

        const reason =
            getCheckoutInventoryAvailabilityReason(
                line,
                createMediumInventory(
                    0,
                ),
            );

        assert.equal(
            reason,
            'Adventure Fit Harness — Medium is currently sold out. Remove it from your cart before checkout.',
        );
    },
);

test(
    'cart quantity above current live stock blocks checkout',
    () => {
        const trackedLines =
            getTrackedCheckoutInventoryLines([
                getMediumHarnessLine(
                    2,
                ),
            ]);

        const line =
            trackedLines[0];

        assert.ok(
            line,
        );

        const reason =
            getCheckoutInventoryAvailabilityReason(
                line,
                createMediumInventory(
                    1,
                ),
            );

        assert.equal(
            reason,
            'Only 1 unit of Adventure Fit Harness — Medium is currently available. Reduce the cart quantity before checkout.',
        );
    },
);

test(
    'duplicate cart selections are grouped before stock validation',
    () => {
        const trackedLines =
            getTrackedCheckoutInventoryLines([
                getMediumHarnessLine(
                    1,
                ),

                getMediumHarnessLine(
                    1,
                ),
            ]);

        assert.equal(
            trackedLines.length,
            1,
            'The same product and variant should be evaluated as one inventory selection.',
        );

        const line =
            trackedLines[0];

        assert.ok(
            line,
        );

        assert.equal(
            line.productSlug,
            'adventure-fit-harness',
        );

        assert.equal(
            line.variantId,
            'medium',
        );

        assert.equal(
            line.quantity,
            2,
            'Grouped checkout quantity must equal the total requested quantity.',
        );

        const reason =
            getCheckoutInventoryAvailabilityReason(
                line,
                createMediumInventory(
                    1,
                ),
            );

        assert.equal(
            reason,
            'Only 1 unit of Adventure Fit Harness — Medium is currently available. Reduce the cart quantity before checkout.',
        );
    },
);

test(
    'sufficient live stock produces checkout-ready inventory',
    () => {
        const trackedLines =
            getTrackedCheckoutInventoryLines([
                getMediumHarnessLine(
                    2,
                ),
            ]);

        const line =
            trackedLines[0];

        assert.ok(
            line,
        );

        const reasons =
            getCheckoutInventoryReadinessReasons([
                {
                    line,

                    inventory:
                        createMediumInventory(
                            2,
                        ),
                },
            ]);

        assert.deepEqual(
            reasons,
            [],
        );
    },
);