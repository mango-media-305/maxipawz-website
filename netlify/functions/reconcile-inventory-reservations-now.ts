import {
    timingSafeEqual,
} from 'node:crypto';

import type {
    Config,
} from '@netlify/functions';

import Stripe from 'stripe';

import {
    reconcileInventoryReservations,
} from '../../src/server/inventory-reservation-reconciliation';

function jsonResponse(
    value: unknown,
    status = 200,
): Response {
    return Response.json(
        value,
        {
            status,

            headers: {
                'Cache-Control':
                    'no-store, max-age=0',
            },
        },
    );
}

function safeSecretEquals(
    left: string,
    right: string,
): boolean {
    const leftBuffer =
        Buffer.from(
            left,
            'utf8',
        );

    const rightBuffer =
        Buffer.from(
            right,
            'utf8',
        );

    if (
        leftBuffer.length !==
        rightBuffer.length
    ) {
        return false;
    }

    return timingSafeEqual(
        leftBuffer,
        rightBuffer,
    );
}

function authorizeRequest(
    request: Request,
): boolean {
    const expectedSecret =
        Netlify.env
            .get(
                'MAXIPAWZ_INTERNAL_FUNCTION_SECRET',
            )
            ?.trim();

    const providedSecret =
        request.headers
            .get(
                'X-MaxiPawz-Internal-Secret',
            )
            ?.trim();

    if (
        !expectedSecret ||
        expectedSecret.length <
            32 ||
        !providedSecret
    ) {
        return false;
    }

    return safeSecretEquals(
        expectedSecret,
        providedSecret,
    );
}

function getStripeClient():
    Stripe {
    const stripeSecretKey =
        Netlify.env
            .get(
                'STRIPE_SECRET_KEY',
            )
            ?.trim();

    const isTestKey =
        stripeSecretKey
            ?.startsWith(
                'sk_test_',
            ) ??
        false;

    const isLiveKey =
        stripeSecretKey
            ?.startsWith(
                'sk_live_',
            ) ??
        false;

    if (
        !stripeSecretKey ||
        (
            !isTestKey &&
            !isLiveKey
        )
    ) {
        throw new Error(
            'A valid Stripe secret key has not been configured.',
        );
    }

    return new Stripe(
        stripeSecretKey,
        {
            maxNetworkRetries:
                2,
        },
    );
}

export default async function handler(
    request: Request,
): Promise<Response> {
    if (
        request.method !==
        'POST'
    ) {
        return jsonResponse(
            {
                ok:
                    false,

                error:
                    'Method not allowed.',
            },
            405,
        );
    }

    if (
        !authorizeRequest(
            request,
        )
    ) {
        return jsonResponse(
            {
                ok:
                    false,

                error:
                    'Unauthorized.',
            },
            401,
        );
    }

    try {
        const stripe =
            getStripeClient();

        const summary =
            await reconcileInventoryReservations(
                stripe,
            );

        return jsonResponse({
            ok:
                true,

            reconciliation:
                summary,
        });
    } catch (error) {
        console.error(
            'Manual inventory reservation reconciliation failed.',
            error,
        );

        return jsonResponse(
            {
                ok:
                    false,

                error:
                    'Inventory reservation reconciliation failed.',
            },
            500,
        );
    }
}

export const config:
    Config = {
        path:
            '/api/internal/reconcile-inventory-reservations',
    };