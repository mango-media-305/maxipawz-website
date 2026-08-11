import type {
    Config,
} from '@netlify/functions';

import {
    BackInStockError,
    subscribeToBackInStock,
} from '../../src/server/back-in-stock';

import type {
    BackInStockSubscribeRequest,
    BackInStockSubscribeResponse,
} from '../../src/types/back-in-stock';

function isRecord(
    value:
        unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !==
        null &&
        !Array.isArray(
            value,
        )
    );
}

function optionalString(
    value:
        unknown,
): string | undefined {
    if (
        typeof value !==
        'string'
    ) {
        return undefined;
    }

    const normalized =
        value.trim();

    return normalized ||
        undefined;
}

function requiredString(
    value:
        unknown,

    message:
        string,
): string {
    const normalized =
        optionalString(
            value,
        );

    if (
        !normalized
    ) {
        throw new BackInStockError(
            'invalid-request',
            400,
            message,
        );
    }

    return normalized;
}

function parseRequest(
    value:
        unknown,
): BackInStockSubscribeRequest {
    if (
        !isRecord(
            value,
        )
    ) {
        throw new BackInStockError(
            'invalid-request',
            400,
            'The back-in-stock request is invalid.',
        );
    }

    const productSlug =
        requiredString(
            value.productSlug,
            'A product is required.',
        );

    const variantId =
        optionalString(
            value.variantId,
        );

    const email =
        requiredString(
            value.email,
            'Please enter your email address.',
        );

    const botField =
        optionalString(
            value.botField,
        );

    return {
        productSlug,

        ...(variantId
            ? {
                variantId,
            }
            : {}),

        email,

        ...(botField
            ? {
                botField,
            }
            : {}),
    };
}

function jsonResponse(
    body:
        BackInStockSubscribeResponse,

    status:
        number,
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

export default async function handler(
    request:
        Request,
): Promise<Response> {
    if (
        request.method !==
        'POST'
    ) {
        return jsonResponse(
            {
                ok:
                    false,

                code:
                    'invalid-request',

                message:
                    'This endpoint accepts POST requests only.',
            },
            405,
        );
    }

    try {
        const rawRequest =
            await request
                .json()
                .catch(
                    () =>
                        null,
                );

        const payload =
            parseRequest(
                rawRequest,
            );

        /*
         * Honeypot.
         *
         * Bots receive an apparent successful response, but no database
         * write occurs.
         */
        if (
            payload.botField
        ) {
            return jsonResponse(
                {
                    ok:
                        true,

                    accepted:
                        true,

                    message:
                        "We'll email you when this item is back in stock.",
                },
                202,
            );
        }

        await subscribeToBackInStock({
            productSlug:
                payload.productSlug,

            ...(payload.variantId
                ? {
                    variantId:
                        payload.variantId,
                }
                : {}),

            email:
                payload.email,

            source:
                'product-detail-sold-out',
        });

        return jsonResponse(
            {
                ok:
                    true,

                accepted:
                    true,

                message:
                    "We'll email you when this item is back in stock.",
            },
            201,
        );
    } catch (
    error
    ) {
        if (
            error instanceof
            BackInStockError
        ) {
            return jsonResponse(
                {
                    ok:
                        false,

                    code:
                        error.code,

                    message:
                        error.message,
                },
                error.status,
            );
        }

        console.error(
            'Back-in-stock subscription failed.',
            error,
        );

        return jsonResponse(
            {
                ok:
                    false,

                code:
                    'inventory-error',

                message:
                    'Back-in-stock alerts are temporarily unavailable. Please try again.',
            },
            500,
        );
    }
}

export const config:
    Config = {
    path:
        '/api/back-in-stock/subscribe',

    method:
        'POST',

    /*
     * Public endpoint protection.
     *
     * Five attempts per minute per IP/domain is sufficient for normal
     * product browsing while limiting automated database writes.
     */
    rateLimit: {
        windowLimit:
            5,

        windowSize:
            60,

        aggregateBy: [
            'ip',
            'domain',
        ],
    },
};