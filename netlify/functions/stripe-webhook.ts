import type {
  Config,
} from '@netlify/functions';

import Stripe from 'stripe';

import {
  queuePaidOrderEmailJob,
} from '../../src/server/email/order-email-jobs';

import {
  completeInventoryReservation,
  expireInventoryReservation,
  markInventoryReservationPaymentPending,
  releaseInventoryReservationAfterPaymentFailure,
} from '../../src/server/inventory-reservation-lifecycle';

import type {
  ProcessedStripeEvent,
  SupportedCheckoutEventType,
  SupportedCheckoutExpirationEventType,
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

const supportedCheckoutExpirationEventTypes =
  new Set<string>([
    'checkout.session.expired',
  ]);

const supportedRefundEventTypes =
  new Set<string>([
    'refund.created',
    'refund.updated',
    'refund.failed',
  ]);

class WebhookError extends Error {
  readonly status: number;

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

  livemode: boolean;
} {
  const stripeSecretKey =
    Netlify.env
      .get(
        'STRIPE_SECRET_KEY',
      )
      ?.trim();

  const webhookSecret =
    Netlify.env
      .get(
        'STRIPE_WEBHOOK_SECRET',
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
    throw new WebhookError(
      503,
      'A valid Stripe secret key has not been configured.',
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

    livemode:
      isLiveKey,
  };
}

function getInternalFunctionSecret():
  string {
  const secret =
    Netlify.env
      .get(
        'MAXIPAWZ_INTERNAL_FUNCTION_SECRET',
      )
      ?.trim();

  if (
    !secret ||
    secret.length <
      32
  ) {
    throw new WebhookError(
      503,
      'MAXIPAWZ_INTERNAL_FUNCTION_SECRET is missing or too short.',
    );
  }

  return secret;
}

function isSupportedCheckoutEventType(
  value: string,
): value is SupportedCheckoutEventType {
  return supportedCheckoutEventTypes
    .has(
      value,
    );
}

function isSupportedCheckoutExpirationEventType(
  value: string,
): value is SupportedCheckoutExpirationEventType {
  return supportedCheckoutExpirationEventTypes
    .has(
      value,
    );
}

function isSupportedRefundEventType(
  value: string,
): value is SupportedRefundEventType {
  return supportedRefundEventTypes
    .has(
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
    isSupportedCheckoutExpirationEventType(
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

function getInventoryReservationId(
  session:
    Stripe.Checkout.Session,
): string | undefined {
  const inventoryReserved =
    session.metadata
      ?.inventory_reserved ===
    'true';

  if (!inventoryReserved) {
    return undefined;
  }

  const reservationId =
    session.metadata
      ?.inventory_reservation_id
      ?.trim();

  if (!reservationId) {
    throw new WebhookError(
      500,
      'A Checkout Session marked as inventory-reserved does not contain an inventory reservation ID.',
    );
  }

  return reservationId;
}

async function transitionCheckoutInventory(
  session:
    Stripe.Checkout.Session,

  eventType:
    SupportedCheckoutEventType,
): Promise<string> {
  const reservationId =
    getInventoryReservationId(
      session,
    );

  if (!reservationId) {
    return 'not-tracked';
  }

  if (
    eventType ===
    'checkout.session.async_payment_succeeded'
  ) {
    const result =
      await completeInventoryReservation(
        reservationId,
        session.id,
      );

    return result.status;
  }

  if (
    eventType ===
    'checkout.session.async_payment_failed'
  ) {
    const result =
      await releaseInventoryReservationAfterPaymentFailure(
        reservationId,
        session.id,
      );

    return result.status;
  }

  if (
    session.payment_status ===
      'paid' ||
    session.payment_status ===
      'no_payment_required'
  ) {
    const result =
      await completeInventoryReservation(
        reservationId,
        session.id,
      );

    return result.status;
  }

  const result =
    await markInventoryReservationPaymentPending(
      reservationId,
      session.id,
    );

  return result.status;
}

async function getRefundPaymentIntentId(
  stripe: Stripe,
  refund:
    Stripe.Refund,
): Promise<string | undefined> {
  const directPaymentIntentId =
    normalizeStripeId(
      refund.payment_intent,
    );

  if (
    directPaymentIntentId
  ) {
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
    await stripe.charges
      .retrieve(
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
      version:
        1,

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

async function dispatchPaidOrderEmails(
  request: Request,
  sessionId: string,
  livemode: boolean,
): Promise<
  | 'queued'
  | 'already-completed'
> {
  const job =
    await queuePaidOrderEmailJob(
      sessionId,
      livemode,
    );

  if (
    job.status ===
    'completed'
  ) {
    return 'already-completed';
  }

  const internalSecret =
    getInternalFunctionSecret();

  /*
   * Using request.url preserves the current Netlify origin:
   * localhost, a branch deploy, a Deploy Preview, or production.
   */
  const endpoint =
    new URL(
      '/api/internal/send-paid-order-emails',
      request.url,
    );

  let response:
    Response;

  try {
    response =
      await fetch(
        endpoint,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            'X-MaxiPawz-Internal-Secret':
              internalSecret,
          },

          body:
            JSON.stringify({
              sessionId,
              livemode,
            }),
        },
      );
  } catch (error) {
    console.error(
      'The paid-order email background function could not be invoked.',
      {
        sessionId,
        livemode,
        error,
      },
    );

    throw new WebhookError(
      503,
      'The paid-order email background function could not be invoked.',
    );
  }

  if (
    !response.ok
  ) {
    const responseBody =
      (
        await response
          .text()
      ).slice(
        0,
        500,
      );

    console.error(
      'The paid-order email background function rejected the invocation.',
      {
        sessionId,
        livemode,
        status:
          response.status,
        responseBody,
      },
    );

    throw new WebhookError(
      503,
      'The paid-order email background function rejected the invocation.',
    );
  }

  return 'queued';
}

async function processRefundEvent(
  stripe: Stripe,
  event:
    Stripe.Event,

  eventType:
    SupportedRefundEventType,
): Promise<Response> {
  const refund =
    event.data
      .object as
      Stripe.Refund;

  const paymentIntentId =
    await getRefundPaymentIntentId(
      stripe,
      refund,
    );

  if (
    !paymentIntentId
  ) {
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

  /*
   * The Stripe account could contain payments unrelated to
   * Maxi Pawz. A refund for one of those payments must not
   * create a Maxi Pawz order or cause Stripe webhook retries.
   */
  if (
    !existingOrder
  ) {
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
    await stripe.refunds
      .list({
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
      savedOrder.amountRefundPending,

    amountRefundable:
      savedOrder.amountRefundable,
  });
}

async function processCheckoutExpirationEvent(
  event:
    Stripe.Event,

  eventType:
    SupportedCheckoutExpirationEventType,
): Promise<Response> {
  const session =
    event.data
      .object as
      Stripe.Checkout.Session;

  if (
    session.metadata
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

  const reservationId =
    getInventoryReservationId(
      session,
    );

  let inventoryStatus =
    'not-tracked';

  if (
    reservationId
  ) {
    const result =
      await expireInventoryReservation(
        reservationId,
        session.id,
      );

    inventoryStatus =
      result.status;
  }

  await saveProcessedEvent(
    event,
    eventType,
    session.id,
  );

  return jsonResponse({
    received:
      true,

    duplicate:
      false,

    eventType,

    sessionId:
      session.id,

    inventoryStatus,
  });
}

async function processCheckoutEvent(
  request: Request,

  stripe: Stripe,

  event:
    Stripe.Event,

  eventType:
    SupportedCheckoutEventType,
): Promise<Response> {
  const eventSession =
    event.data
      .object as
      Stripe.Checkout.Session;

  if (
    eventSession.metadata
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
    await stripe.checkout
      .sessions
      .retrieve(
        eventSession.id,
      );

  const lineItemsResponse =
    await stripe.checkout
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
    lineItemsResponse
      .has_more
  ) {
    throw new WebhookError(
      400,
      'The Checkout Session contains more line items than this integration currently supports.',
    );
  }

  /*
   * Inventory is transitioned before the order record/email side effects.
   *
   * If a later operation fails, Stripe retries the webhook. The database
   * transition is idempotent, so the retry can safely continue without
   * decrementing or releasing inventory twice.
   */
  const inventoryStatus =
    await transitionCheckoutInventory(
      session,
      eventType,
    );

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

  let emailJobStatus:
    | 'not-required'
    | 'queued'
    | 'already-completed' =
    'not-required';

  if (
    savedOrder
      .paymentStatus ===
    'paid'
  ) {
    emailJobStatus =
      await dispatchPaidOrderEmails(
        request,
        savedOrder.sessionId,
        savedOrder.livemode,
      );
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
      savedOrder.fulfillmentStatus,

    refundStatus:
      savedOrder.refundStatus,

    inventoryStatus,

    emailJobStatus,
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
      livemode:
        configuredLivemode,
    } =
      getStripeConfiguration();

    const signature =
      request.headers
        .get(
          'stripe-signature',
        );

    if (
      !signature
    ) {
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

    /*
     * Prevent a live Stripe event from being processed with a
     * Sandbox key, or a Sandbox event with a live key.
     */
    if (
      event.livemode !==
      configuredLivemode
    ) {
      throw new WebhookError(
        400,
        'The Stripe event mode does not match the configured Stripe secret key.',
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

    if (
      isSupportedCheckoutExpirationEventType(
        event.type,
      )
    ) {
      return await processCheckoutExpirationEvent(
        event,
        event.type,
      );
    }

    return await processCheckoutEvent(
      request,
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