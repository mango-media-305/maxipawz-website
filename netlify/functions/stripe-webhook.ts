import type {
  Config,
} from '@netlify/functions';

import Stripe from 'stripe';

import {
  sendPaidOrderEmails,
} from '../../src/server/email/send-order-emails';

import {
  fulfillPaidSandboxOrder,
} from '../../src/server/fulfillment';

import type {
  ProcessedStripeEvent,
  SupportedCheckoutEventType,
} from '../../src/types/order';

import {
  buildOrderRecord,
  hasProcessedStripeEvent,
  recordProcessedStripeEvent,
  saveOrderRecord,
} from '../../src/utils/orders';

const supportedEventTypes =
  new Set<string>([
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
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

function isSupportedEventType(
  value: string,
): value is SupportedCheckoutEventType {
  return supportedEventTypes.has(
    value,
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
      !isSupportedEventType(
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
          'The Checkout Session does not belong to the MaxiPawz integration.',
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

    /**
     * Retrieve the current Session instead of relying only
     * on the webhook snapshot.
     *
     * We specifically expand the selected ShippingRate so
     * fulfillment can read the EasyPost metadata attached
     * when the customer selected the carrier service.
     */
    const session =
      await stripe
        .checkout
        .sessions
        .retrieve(
          eventSession.id,
          {
            expand: [
              'shipping_cost.shipping_rate',
            ],
          },
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
      lineItemsResponse
        .has_more
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
          lineItemsResponse
            .data,

        eventId:
          event.id,

        eventType:
          event.type,

        eventCreated:
          event.created,
      });

    const savedOrder =
      await saveOrderRecord(
        incomingOrder,
      );

    const fulfilledOrder =
      await fulfillPaidSandboxOrder({
        session,

        order:
          savedOrder,
      });

    if (
      fulfilledOrder
        .paymentStatus ===
      'paid'
    ) {
      await sendPaidOrderEmails({
        session,

        order:
          fulfilledOrder,
      });
    }

    const processedEvent:
      ProcessedStripeEvent = {
      version: 1,

      eventId:
        event.id,

      eventType:
        event.type,

      sessionId:
        session.id,

      livemode:
        event.livemode,

      processedAt:
        new Date()
          .toISOString(),
    };

    await recordProcessedStripeEvent(
      processedEvent,
    );

    return jsonResponse({
      received:
        true,

      duplicate:
        false,

      sessionId:
        fulfilledOrder
          .sessionId,

      paymentStatus:
        fulfilledOrder
          .paymentStatus,

      orderStatus:
        fulfilledOrder
          .orderStatus,

      fulfillmentStatus:
        fulfilledOrder
          .fulfillmentStatus,
    });
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