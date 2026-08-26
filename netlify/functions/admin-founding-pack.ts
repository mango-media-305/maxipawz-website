import type { Config } from '@netlify/functions';

import {
    AdminAuthError,
    assertAdminAuthorized,
} from '../../src/server/admin-auth';

import { inspectFoundingPackInsights } from '../../src/server/founding-pack/insights-storage';

import type { AdminFoundingPackInsightsResponse } from '../../src/types/founding-pack-insights';

function jsonResponse(
    body: AdminFoundingPackInsightsResponse,

    status = 200,
): Response {
    return Response.json(body, {
        status,

        headers: {
            'Cache-Control': 'no-store, max-age=0',
        },
    });
}

export default async function handler(
    request: Request,
): Promise<Response> {
    if (request.method !== 'GET') {
        return jsonResponse(
            {
                ok: false,

                message:
                    'This endpoint accepts GET requests only.',
            },
            405,
        );
    }

    try {
        /*
         * Keep Founding Pack insights behind the same admin
         * authorization boundary as inventory, orders and
         * back-in-stock inspection.
         *
         * The browser never receives raw newsletter records.
         */
        assertAdminAuthorized(request);

        const data =
            await inspectFoundingPackInsights();

        return jsonResponse({
            ok: true,

            ...data,
        });
    } catch (error) {
        if (error instanceof AdminAuthError) {
            return jsonResponse(
                {
                    ok: false,

                    message: error.message,
                },
                error.status,
            );
        }

        console.error(
            'Admin Founding Pack insights inspection failed.',
            error,
        );

        return jsonResponse(
            {
                ok: false,

                message:
                    'Founding Pack insights could not be loaded.',
            },
            500,
        );
    }
}

export const config: Config = {
    path: '/api/admin/founding-pack',
};