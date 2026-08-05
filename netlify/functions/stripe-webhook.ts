import type {
  Config,
} from '@netlify/functions';

import Stripe from 'stripe';

import {
  sendPaidOrderEmails,
} from '../../src/server/email/send-order-emails';

import type {
  ProcessedStripeEvent,
  SupportedCheckoutEventType,
  SupportedRefundEventType,
  SupportedStripeEventType,
} from '../../src/types/order';

import {
  buildOrderRecord,
  getOrderByPaymentIntentId,
  hasProcessedStripeEvent,
  recordProcessedStripeEvent,
  saveOrderRecord,
  saveStripeRefundSnapshot,
} from '../../src/utils/orders';

const supportedCheckoutEventTypes =
  new Set<string>([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
  ]);

const supportedRefundEventTypes =
  new Set<string>([
    'refund.created',
    'refund.updated',
    'refund.failed',
  ]);

class WebhookError
  extends Error {
  readonly status:
    number;

  constructor(
    status: number,
    message: string,
  ) {
    super(
      message,
    );

    this.name =
      'WebhookError';

    this.status =
      status;
  }
}

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

function getStripeConfiguration(): {
  stripe: Stripe;

  webhookSecret: string;
} {
  const stripeSecretKey =
    process.env
      .STRIPE_SECRET_KEY
      ?.trim();

  const webhookSecret =
    process.env
      .STRIPE_WEBHOOK_SECRET
      ?.trim();

  if (
    !stripeSecretKey ||
    !stripeSecretKey.startsWith(
      'sk_test_',
    )
  ) {
    throw new WebhookError(
      503,
      'A Stripe test secret key has not been configured.',
    );
  }

  if (
    !webhookSecret ||
    !webhookSecret.startsWith(
      'whsec_',
    )
  ) {
    throw new WebhookError(
      503,
      'A Stripe webhook signing secret has not been configured.',
    );
  }

  return {
    stripe:
      new Stripe(
        stripeSecretKey,
      ),

    webhookSecret,
  };
}

function isSupportedCheckoutEventType(
  value: string,
): value is SupportedCheckoutEventType {
  return supportedCheckoutEventTypes.has(
    value,
  );
}

function isSupportedRefundEventType(
  value: string,
): value is SupportedRefundEventType {
  return supportedRefundEventTypes.has(
    value,
  );
}

function isSupportedStripeEventType(
  value: string,
): value is SupportedStripeEventType {
  return (
    isSupportedCheckoutEventType(
      value,
    ) ||
    isSupportedRefundEventType(
      value,
    )
  );
}

function normalizeStripeId(
  value:
    | string
    | {
      id: string;
    }
    | null
    | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  return typeof value ===
    'string'
    ? value
    : value.id;
}

async function getRefundPaymentIntentId(
  stripe:
    Stripe,

  refund:
    Stripe.Refund,
): Promise<string | undefined> {
  const directPaymentIntentId =
    normalizeStripeId(
      refund.payment_intent,
    );

  if (directPaymentIntentId) {
    return directPaymentIntentId;
  }

  const chargeId =
    normalizeStripeId(
      refund.charge,
    );

  if (!chargeId) {
    return undefined;
  }

  const charge =
    await stripe.charges.retrieve(
      chargeId,
    );

  return normalizeStripeId(
    charge.payment_intent,
  );
}

async function saveProcessedEvent(
  event:
    Stripe.Event,

  eventType:
    SupportedStripeEventType,

  sessionId: string,
): Promise<void> {
  const processedEvent:
    ProcessedStripeEvent = {
    version: 1,

    eventId:
      event.id,

    eventType,

    sessionId,

    livemode:
      event.livemode,

    processedAt:
      new Date()
        .toISOString(),
  };

  await recordProcessedStripeEvent(
    processedEvent,
  );
}

async function processRefundEvent(
  stripe:
    Stripe,

  event:
    Stripe.Event,

  eventType:
    SupportedRefundEventType,
): Promise<Response> {
  const refund =
    event.data
      .object as Stripe.Refund;

  const paymentIntentId =
    await getRefundPaymentIntentId(
      stripe,
      refund,
    );

  if (!paymentIntentId) {
    return jsonResponse({
      received:
        true,

      ignored:
        true,

      reason:
        'The Stripe Refund does not contain a PaymentIntent.',
    });
  }

  const existingOrder =
    await getOrderByPaymentIntentId(
      paymentIntentId,
      event.livemode,
    );

  /**
   * The Stripe account could contain payments unrelated to
   * Maxi Pawz. A refund for one of those payments must not
   * create a Maxi Pawz order or cause Stripe webhook retries.
   */
  if (!existingOrder) {
    return jsonResponse({
      received:
        true,

      ignored:
        true,

      reason:
        'No Maxi Pawz order matches this Stripe PaymentIntent.',
    });
  }

  const refundList =
    await stripe.refunds.list({
      payment_intent:
        paymentIntentId,

      limit:
        100,
    });

  if (
    refundList.has_more
  ) {
    throw new WebhookError(
      400,
      'The PaymentIntent contains more refunds than this integration currently supports.',
    );
  }

  const refunds =
    refundList.data.some(
      (
        candidate,
      ) =>
        candidate.id ===
        refund.id,
    )
      ? refundList.data
      : [
        refund,
        ...refundList.data,
      ];

  const savedOrder =
    await saveStripeRefundSnapshot({
      paymentIntentId,

      livemode:
        event.livemode,

      refunds,

      currentRefundId:
        refund.id,

      eventId:
        event.id,

      eventType,

      eventCreated:
        event.created,
    });

  await saveProcessedEvent(
    event,
    eventType,
    savedOrder.sessionId,
  );

  return jsonResponse({
    received:
      true,

    duplicate:
      false,

    eventType,

    sessionId:
      savedOrder.sessionId,

    paymentIntentId,

    refundStatus:
      savedOrder.refundStatus,

    amountRefunded:
      savedOrder.amountRefunded,

    amountRefundPending:
      savedOrder
        .amountRefundPending,

    amountRefundable:
      savedOrder
        .amountRefundable,
  });
}

async function processCheckoutEvent(
  stripe:
    Stripe,

  event:
    Stripe.Event,

  eventType:
    SupportedCheckoutEventType,
): Promise<Response> {
  const eventSession =
    event.data
      .object as Stripe.Checkout.Session;

  if (
    eventSession
      .metadata
      ?.storefront !==
    'maxipawz'
  ) {
    return jsonResponse({
      received:
        true,

      ignored:
        true,

      reason:
        'The Checkout Session does not belong to the Maxi Pawz integration.',
    });
  }

  const session =
    await stripe
      .checkout
      .sessions
      .retrieve(
        eventSession.id,
      );

  const lineItemsResponse =
    await stripe
      .checkout
      .sessions
      .listLineItems(
        session.id,
        {
          limit:
            100,

          expand: [
            'data.price.product',
          ],
        },
      );

  if (
    lineItemsResponse.has_more
  ) {
    throw new WebhookError(
      400,
      'The Checkout Session contains more line items than this integration currently supports.',
    );
  }

  const incomingOrder =
    buildOrderRecord({
      session,

      lineItems:
        lineItemsResponse.data,

      eventId:
        event.id,

      eventType,

      eventCreated:
        event.created,
    });

  const savedOrder =
    await saveOrderRecord(
      incomingOrder,
    );

  if (
    savedOrder.paymentStatus ===
    'paid'
  ) {
    await sendPaidOrderEmails({
      session,

      order:
        savedOrder,
    });
  }

  await saveProcessedEvent(
    event,
    eventType,
    savedOrder.sessionId,
  );

  return jsonResponse({
    received:
      true,

    duplicate:
      false,

    sessionId:
      savedOrder.sessionId,

    paymentStatus:
      savedOrder.paymentStatus,

    orderStatus:
      savedOrder.orderStatus,

    fulfillmentStatus:
      savedOrder
        .fulfillmentStatus,

    refundStatus:
      savedOrder.refundStatus,
  });
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
        received:
          false,

        message:
          'This endpoint accepts POST requests only.',
      },
      405,
    );
  }

  try {
    const {
      stripe,
      webhookSecret,
    } =
      getStripeConfiguration();

    const signature =
      request.headers.get(
        'stripe-signature',
      );

    if (!signature) {
      throw new WebhookError(
        400,
        'The Stripe-Signature header is missing.',
      );
    }

    const rawBody =
      await request.text();

    let event:
      Stripe.Event;

    try {
      event =
        stripe.webhooks
          .constructEvent(
            rawBody,
            signature,
            webhookSecret,
          );
    } catch {
      throw new WebhookError(
        400,
        'The webhook signature could not be verified.',
      );
    }

    if (
      event.livemode
    ) {
      throw new WebhookError(
        400,
        'Live Stripe events are not accepted by this test endpoint.',
      );
    }

    if (
      !isSupportedStripeEventType(
        event.type,
      )
    ) {
      return jsonResponse({
        received:
          true,

        ignored:
          true,

        eventType:
          event.type,
      });
    }

    const alreadyProcessed =
      await hasProcessedStripeEvent(
        event.id,
        event.livemode,
      );

    if (
      alreadyProcessed
    ) {
      return jsonResponse({
        received:
          true,

        duplicate:
          true,

        eventId:
          event.id,
      });
    }

    if (
      isSupportedRefundEventType(
        event.type,
      )
    ) {
      return await processRefundEvent(
        stripe,
        event,
        event.type,
      );
    }

    return await processCheckoutEvent(
      stripe,
      event,
      event.type,
    );
  } catch (error) {
    if (
      error instanceof
      WebhookError
    ) {
      return jsonResponse(
        {
          received:
            false,

          message:
            error.message,
        },
        error.status,
      );
    }

    console.error(
      'Stripe webhook processing failed.',
      error,
    );

    return jsonResponse(
      {
        received:
          false,

        message:
          'The webhook could not be processed.',
      },
      500,
    );
  }
}

export const config:
  Config = {
  path:
    '/api/stripe-webhook',
};