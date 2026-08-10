/**
 * TEMPORARY INVENTORY ACCEPTANCE CONFIGURATION
 *
 * This file exists only while Inventory System Phase 1A is being
 * acceptance-tested in an isolated Netlify Deploy Preview database.
 *
 * DO NOT MERGE THIS FILE INTO dev OR main.
 *
 * After the inventory acceptance tests pass, this file must be deleted
 * and the temporary acceptance hooks removed from product-inventory.ts.
 */

interface InventoryAcceptanceSelection {
    productSlug: string;

    variantIds?:
        readonly string[];
}

const inventoryAcceptanceSelections:
    readonly InventoryAcceptanceSelection[] = [
        {
            productSlug:
                'tug-and-fetch-rope-ball',
        },

        {
            productSlug:
                'whisker-feather-wand',
        },

        {
            productSlug:
                'duo-ceramic-bowl-set',
        },

        {
            productSlug:
                'adventure-fit-harness',

            variantIds: [
                'small',
                'medium',
                'large',
            ],
        },
    ];

export function isInventoryAcceptanceSelection(
    productSlug: string,
    variantId?: string,
): boolean {
    const selection =
        inventoryAcceptanceSelections.find(
            (candidate) =>
                candidate.productSlug ===
                productSlug,
        );

    if (!selection) {
        return false;
    }

    if (
        !selection.variantIds
    ) {
        return (
            variantId ===
            undefined
        );
    }

    if (!variantId) {
        return false;
    }

    return selection.variantIds.includes(
        variantId,
    );
}

export function productHasInventoryAcceptanceSelection(
    productSlug: string,
): boolean {
    return inventoryAcceptanceSelections.some(
        (candidate) =>
            candidate.productSlug ===
            productSlug,
    );
}