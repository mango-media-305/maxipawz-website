import { getStore } from '@netlify/blobs';

import type { Config } from '@netlify/functions';

import { AdminAuthError, assertAdminAuthorized } from '../../src/server/admin-auth';

import { sendShippingConfirmationEmail } from '../../src/server/email/send-shipping-email';

import type {
  AdminFulfillOrderRequest,
  AdminFulfillOrderResponse,
  AdminOrder,
  AdminOrderAction,
} from '../../src/types/admin-order';

import type { OrderCarrier, OrderRecord } from '../../src/types/order';

import { getOrderBySessionId, saveManualFulfillment } from '../../src/utils/orders';

const carriers = new Set<OrderCarrier>(['USPS', 'UPS', 'FedEx', 'Other']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function parseSessionId(value: unknown): string {
  const sessionId = optionalString(value);

  if (!sessionId || !sessionId.startsWith('cs_test_')) {
    throw new Error('A valid Stripe Sandbox Checkout Session is required.');
  }

  return sessionId;
}

function parseTrackingUrl(value: unknown): string | undefined {
  const trackingUrl = optionalString(value);

  if (!trackingUrl) {
    return undefined;
  }

  let url: URL;

  try {
    url = new URL(trackingUrl);
  } catch {
    throw new Error('The tracking URL is invalid.');
  }

  if (url.protocol !== 'https:') {
    throw new Error('The tracking URL must use HTTPS.');
  }

  return trackingUrl;
}

function parseSaveFulfillmentRequest(
  value: Record<string, unknown>,

  sessionId: string,
): AdminFulfillOrderRequest {
  const carrier = optionalString(value.carrier) as OrderCarrier | undefined;

  if (!carrier || !carriers.has(carrier)) {
    throw new Error('Select a valid shipping carrier.');
  }

  const trackingNumber = optionalString(value.trackingNumber);

  if (!trackingNumber) {
    throw new Error('Enter the carrier tracking number.');
  }

  const postageAmount = value.postageAmount;

  if (typeof postageAmount !== 'number' || !Number.isInteger(postageAmount) || postageAmount < 0) {
    throw new Error('Enter the actual postage amount in cents.');
  }

  return {
    action: 'save-fulfillment',

    sessionId,

    carrier,

    service: optionalString(value.service),

    trackingNumber,

    trackingUrl: parseTrackingUrl(value.trackingUrl),

    postageAmount,

    /**
     * Defaults to true for compatibility with the first
     * dashboard version. Dashboard v2 explicitly sends false
     * when editing existing shipment information.
     */
    sendEmail: value.sendEmail !== false,
  };
}

function parseRequest(value: unknown): AdminFulfillOrderRequest {
  if (!isRecord(value)) {
    throw new Error('The fulfillment request is invalid.');
  }

  const sessionId = parseSessionId(value.sessionId);

  const action = optionalString(value.action) ?? 'save-fulfillment';

  if (action === 'save-fulfillment') {
    return parseSaveFulfillmentRequest(value, sessionId);
  }

  if (action === 'resend-shipping-email') {
    return {
      action,
      sessionId,
    };
  }

  if (action === 'mark-delivered') {
    return {
      action,
      sessionId,
    };
  }

  throw new Error('The requested fulfillment action is invalid.');
}

function getOrderReference(sessionId: string): string {
  const suffix = sessionId
    .replace(/^cs_(?:test|live)_/, '')
    .slice(-10)
    .toUpperCase();

  return `MPZ-${suffix}`;
}

function toAdminOrder(order: OrderRecord): AdminOrder {
  return {
    sessionId: order.sessionId,

    reference: getOrderReference(order.sessionId),

    livemode: order.livemode,

    paymentIntentId: order.paymentIntentId,

    paymentStatus: order.paymentStatus,

    orderStatus: order.orderStatus,

    fulfillmentStatus: order.fulfillmentStatus,

    refundStatus: order.refundStatus ?? 'none',

    amountRefunded: order.amountRefunded ?? 0,

    amountRefundPending: order.amountRefundPending ?? 0,

    amountRefundable: order.amountRefundable ?? Math.max(0, order.amountTotal),

    refunds: order.refunds ?? [],

    customer: order.customer,

    shippingAddress: order.shippingAddress,

    fulfillment: order.fulfillment,

    currency: order.currency,

    amountSubtotal: order.amountSubtotal,

    amountShipping: order.amountShipping,

    amountTax: order.amountTax,

    amountDiscount: order.amountDiscount,

    amountTotal: order.amountTotal,

    items: order.items,

    createdAt: order.createdAt,

    updatedAt: order.updatedAt,
  };
}

function jsonResponse(
  body: AdminFulfillOrderResponse,

  status = 200,
): Response {
  return Response.json(body, {
    status,

    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

async function requireSandboxOrder(sessionId: string): Promise<OrderRecord> {
  const order = await getOrderBySessionId(sessionId);

  if (!order || order.livemode) {
    throw new Error('The Sandbox order could not be found.');
  }

  return order;
}

async function markSandboxOrderDelivered(sessionId: string): Promise<{
  order: OrderRecord;

  changed: boolean;
}> {
  const existing = await requireSandboxOrder(sessionId);

  if (existing.paymentStatus !== 'paid') {
    throw new Error('Only paid orders can be marked delivered.');
  }

  if (existing.fulfillmentStatus === 'delivered') {
    return {
      order: existing,

      changed: false,
    };
  }

  if (existing.fulfillmentStatus !== 'shipped' || !existing.fulfillment) {
    throw new Error('Only shipped orders can be marked delivered.');
  }

  const now = new Date().toISOString();

  const nextOrder: OrderRecord = {
    ...existing,

    fulfillmentStatus: 'delivered',

    fulfillment: {
      ...existing.fulfillment,

      deliveredAt: now,

      updatedAt: now,
    },

    updatedAt: now,
  };

  const store = getStore('maxipawz-orders-test', {
    consistency: 'strong',
  });

  await store.setJSON(`session/${sessionId}`, nextOrder);

  return {
    order: nextOrder,

    changed: true,
  };
}

function getShippingEmailMessage(
  status: 'sent' | 'skipped' | 'failed',

  resend: boolean,
): string {
  if (status === 'sent') {
    return resend
      ? 'Shipping confirmation email resent.'
      : 'Order marked shipped and shipping confirmation email sent.';
  }

  if (status === 'failed') {
    return resend
      ? 'The shipping confirmation email could not be resent. Check Resend.'
      : 'Order marked shipped, but the shipping email failed. Check Resend.';
  }

  return resend
    ? 'The shipping email was skipped by the current email configuration.'
    : 'Order marked shipped. The shipping email was skipped by the current email configuration.';
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse(
      {
        ok: false,

        message: 'This endpoint accepts POST requests only.',
      },
      405,
    );
  }

  try {
    assertAdminAuthorized(request);

    const rawRequest = await request.json().catch(() => null);

    const payload = parseRequest(rawRequest);

    let order: OrderRecord;

    let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped';

    let message: string;

    const action: AdminOrderAction = payload.action;

    if (payload.action === 'save-fulfillment') {
      const existing = await requireSandboxOrder(payload.sessionId);

      if (existing.fulfillmentStatus === 'delivered') {
        throw new Error('Delivered orders cannot have their shipment information edited.');
      }

      if (existing.fulfillmentStatus === 'cancelled') {
        throw new Error('Cancelled orders cannot be fulfilled.');
      }

      order = await saveManualFulfillment({
        sessionId: payload.sessionId,

        livemode: false,

        carrier: payload.carrier,

        service: payload.service,

        trackingNumber: payload.trackingNumber,

        trackingUrl: payload.trackingUrl,

        postageAmount: payload.postageAmount,
      });

      if (payload.sendEmail) {
        emailStatus = await sendShippingConfirmationEmail(order);

        message = getShippingEmailMessage(emailStatus, false);
      } else {
        message = 'Shipment information updated. No customer email was sent.';
      }
    } else if (payload.action === 'resend-shipping-email') {
      order = await requireSandboxOrder(payload.sessionId);

      const canSendShippingEmail =
        (order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered') &&
        Boolean(order.fulfillment);

      if (!canSendShippingEmail) {
        throw new Error(
          'A shipping email can be sent only after shipment information has been saved.',
        );
      }

      emailStatus = await sendShippingConfirmationEmail(order, {
        force: true,
      });

      message = getShippingEmailMessage(emailStatus, true);
    } else {
      const result = await markSandboxOrderDelivered(payload.sessionId);

      order = result.order;

      message = result.changed ? 'Order marked delivered.' : 'Order was already marked delivered.';
    }

    return jsonResponse({
      ok: true,

      action,

      order: toAdminOrder(order),

      emailStatus,

      message,
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

    console.error('Admin fulfillment action failed.', error);

    return jsonResponse(
      {
        ok: false,

        message:
          error instanceof Error ? error.message : 'The fulfillment action could not be completed.',
      },
      400,
    );
  }
}

export const config: Config = {
  path: '/api/admin/fulfill-order',
};
