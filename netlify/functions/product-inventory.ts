import type {
    Config,
} from '@netlify/functions';

import {
    products,
} from '../../src/data/products';

import {
    getPublicInventorySnapshot,
} from '../../src/server/inventory';

import type {
    ProductInventoryErrorResponse,
    ProductInventoryResponse,
} from '../../src/types/inventory';

import {
    getInventorySku,
    isInventoryTrackingEnabledForSelection,
} from '../../src/utils/product-inventory';

function jsonResponse(
    body:
        | ProductInventoryResponse
        | ProductInventoryErrorResponse,
    status = 200,
): Response {
    return Response.json(
        body,
        {
            status,

            headers: {
                'Cache-Control':
                    'no-store, max-age=0',
            },
        },
    );
}

function isValidProductSlug(
    value: string,
): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        value,
    );
}

function isValidVariantId(
    value: string,
): boolean {
    return /^[A-Za-z0-9_-]+$/.test(
        value,
    );
}

function inventoryUnavailableResponse():
    Response {
    return jsonResponse(
        {
            ok: false,

            code:
                'inventory-error',

            message:
                'Inventory information is temporarily unavailable.',
        },
        503,
    );
}

export default async function handler(
    request: Request,
): Promise<Response> {
    if (
        request.method !==
        'GET'
    ) {
        return jsonResponse(
            {
                ok: false,

                code:
                    'invalid-request',

                message:
                    'This endpoint accepts GET requests only.',
            },
            405,
        );
    }

    const requestUrl =
        new URL(
            request.url,
        );

    const productSlug =
        requestUrl.searchParams
            .get(
                'product',
            )
            ?.trim() ??
        '';

    const rawVariantId =
        requestUrl.searchParams
            .get(
                'variant',
            )
            ?.trim();

    const variantId =
        rawVariantId ||
        undefined;

    if (
        !productSlug ||
        !isValidProductSlug(
            productSlug,
        )
    ) {
        return jsonResponse(
            {
                ok: false,

                code:
                    'invalid-request',

                message:
                    'A valid product identifier is required.',
            },
            400,
        );
    }

    if (
        variantId &&
        !isValidVariantId(
            variantId,
        )
    ) {
        return jsonResponse(
            {
                ok: false,

                code:
                    'invalid-request',

                message:
                    'The product option identifier is invalid.',
            },
            400,
        );
    }

    const product =
        products.find(
            (candidate) =>
                candidate.slug ===
                    productSlug &&
                candidate.status ===
                    'active',
        );

    if (!product) {
        return jsonResponse(
            {
                ok: false,

                code:
                    'product-not-found',

                message:
                    'The requested product could not be found.',
            },
            404,
        );
    }

    const variant =
        variantId
            ? product.variants?.find(
                (candidate) =>
                    candidate.id ===
                    variantId,
            )
            : undefined;

    if (
        variantId &&
        !variant
    ) {
        return jsonResponse(
            {
                ok: false,

                code:
                    'variant-not-found',

                message:
                    'The requested product option could not be found.',
            },
            404,
        );
    }

    if (
        !variantId &&
        product.variants?.length
    ) {
        return jsonResponse(
            {
                ok: false,

                code:
                    'invalid-request',

                message:
                    'Select a product option before requesting inventory.',
            },
            400,
        );
    }

    const inventoryTracked =
        isInventoryTrackingEnabledForSelection(
            product,
            variant,
        );

    if (!inventoryTracked) {
        return jsonResponse({
            ok: true,

            inventory: {
                tracked: false,

                productSlug,

                ...(variantId
                    ? {
                        variantId,
                    }
                    : {}),

                status:
                    'not-tracked',

                available:
                    null,

                canPurchase:
                    false,
            },
        });
    }

    const expectedSku =
        getInventorySku(
            product,
            variant,
        );

    if (!expectedSku) {
        console.error(
            'Inventory tracking is enabled without a catalog SKU.',
            {
                productSlug,

                variantId,
            },
        );

        return inventoryUnavailableResponse();
    }

    try {
        const inventory =
            await getPublicInventorySnapshot(
                productSlug,
                variantId,
            );

        if (
            !inventory.tracked
        ) {
            console.error(
                'Inventory tracking is enabled but no inventory row exists.',
                {
                    productSlug,

                    variantId,

                    expectedSku,
                },
            );

            return inventoryUnavailableResponse();
        }

        if (
            inventory.sku !==
            expectedSku
        ) {
            console.error(
                'Inventory SKU does not match the product catalog.',
                {
                    productSlug,

                    variantId,

                    expectedSku,

                    inventorySku:
                        inventory.sku,
                },
            );

            return inventoryUnavailableResponse();
        }

        return jsonResponse({
            ok: true,

            inventory,
        });
    } catch (error) {
        console.error(
            'Product inventory lookup failed.',
            {
                productSlug,

                variantId,

                error,
            },
        );

        return inventoryUnavailableResponse();
    }
}

export const config:
    Config = {
    path:
        '/api/product-inventory',
};