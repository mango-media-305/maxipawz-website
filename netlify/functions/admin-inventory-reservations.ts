import type { Config } from '@netlify/functions';

import { AdminAuthError, assertAdminAuthorized } from '../../src/server/admin-auth';

import { inspectInventoryReservations } from '../../src/server/inventory-reservation-inspection';

import type { AdminInventoryReservationsResponse } from '../../src/types/admin-inventory-reservation';

function jsonResponse(body: AdminInventoryReservationsResponse, status = 200): Response {
  return Response.json(body, {
    status,

    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse(
      {
        ok: false,

        message: 'This endpoint accepts GET requests only.',
      },
      405,
    );
  }

  try {
    assertAdminAuthorized(request);

    const data = await inspectInventoryReservations();

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

    console.error('Admin inventory reservation inspection failed.', error);

    return jsonResponse(
      {
        ok: false,

        message: 'Inventory reservations could not be loaded.',
      },
      500,
    );
  }
}

export const config: Config = {
  path: '/api/admin/inventory-reservations',
};
