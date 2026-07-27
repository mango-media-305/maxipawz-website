import type { Config } from '@netlify/functions';

import type { OrderStatusErrorResponse } from '../../src/types/order';

import { getOrderBySessionId, toPublicOrderStatus } from '../../src/utils/orders';

const checkoutSessionPattern = /^cs_(?:test|live)_[A-Za-z0-9]+$/;

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,

    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

function errorResponse(status: number, body: OrderStatusErrorResponse): Response {
  return jsonResponse(body, status);
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET') {
    return errorResponse(405, {
      ok: false,

      status: 'invalid-request',

      message: 'This endpoint accepts GET requests only.',
    });
  }

  const requestUrl = new URL(request.url);

  const sessionId = requestUrl.searchParams.get('session_id')?.trim();

  if (!sessionId || sessionId.length > 255 || !checkoutSessionPattern.test(sessionId)) {
    return errorResponse(400, {
      ok: false,

      status: 'invalid-request',

      message: 'A valid Checkout Session ID is required.',
    });
  }

  try {
    const order = await getOrderBySessionId(sessionId);

    if (!order) {
      return errorResponse(404, {
        ok: false,

        status: 'not-found',

        message: 'Payment confirmation has not reached the order system yet.',
      });
    }

    return jsonResponse(toPublicOrderStatus(order));
  } catch (error) {
    console.error('Order status lookup failed.', error);

    return errorResponse(503, {
      ok: false,

      status: 'service-unavailable',

      message: 'Order status is temporarily unavailable.',
    });
  }
}

export const config: Config = {
  path: '/api/get-order-status',
};
