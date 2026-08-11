import type {
    Config,
} from '@netlify/functions';

import {
    AdminAuthError,
    assertAdminAuthorized,
} from '../../src/server/admin-auth';

import {
    executeAdminInventoryMutation,
    InventoryManagementError,
    listAdminInventoryState,
    parseAdminInventoryMutationRequest,
} from '../../src/server/inventory-management';

import type {
    AdminInventoryResponse,
} from '../../src/types/admin-inventory';

function jsonResponse(
    body:
        AdminInventoryResponse,
    status =
        200,
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

function getSuccessMessage(
    action:
        | 'provision'
        | 'adjust-on-hand'
        | 'set-on-hand'
        | 'set-thresholds',
): string {
    switch (
    action
    ) {
        case 'provision':
            return 'Inventory provisioned.';

        case 'adjust-on-hand':
            return 'On-hand inventory adjusted.';

        case 'set-on-hand':
            return 'On-hand inventory updated.';

        case 'set-thresholds':
            return 'Inventory thresholds updated.';
    }
}

export default async function handler(
    request: Request,
): Promise<Response> {
    if (
        request.method !==
            'GET' &&
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
                    'This endpoint accepts GET and POST requests only.',
            },
            405,
        );
    }

    try {
        assertAdminAuthorized(
            request,
        );

        if (
            request.method ===
            'GET'
        ) {
            const inventory =
                await listAdminInventoryState();

            return jsonResponse({
                ok:
                    true,

                ...inventory,
            });
        }

        const rawRequest =
            await request
                .json()
                .catch(
                    () => null,
                );

        const payload =
            parseAdminInventoryMutationRequest(
                rawRequest,
            );

        const result =
            await executeAdminInventoryMutation(
                payload,
            );

        return jsonResponse({
            ok:
                true,

            ...result,

            message:
                getSuccessMessage(
                    result.action,
                ),
        });
    } catch (error) {
        if (
            error instanceof
            AdminAuthError
        ) {
            return jsonResponse(
                {
                    ok:
                        false,

                    code:
                        'admin-auth',

                    message:
                        error.message,
                },
                error.status,
            );
        }

        if (
            error instanceof
            InventoryManagementError
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
            'Admin inventory operation failed.',
            error,
        );

        return jsonResponse(
            {
                ok:
                    false,

                code:
                    'inventory-error',

                message:
                    'The inventory operation could not be completed.',
            },
            500,
        );
    }
}

export const config:
    Config = {
        path:
            '/api/admin/inventory',
    };