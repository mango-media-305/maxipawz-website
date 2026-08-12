import { randomUUID } from 'node:crypto';

import type { Config } from '@netlify/functions';

import Stripe from 'stripe';

import { businessConfig } from '../../src/config/business';

import { shippingConfig } from '../../src/config/shipping';

import { taxConfig } from '../../src/config/tax';

import {
  CheckoutValidationError,
  parseCheckoutRequest,
  validateCheckoutCart,
} from '../../src/server/checkout-cart';

import {
  attachStripeSessionToInventoryReservation,
  createInventoryReservation,
  InventoryReservationError,
  releaseInventoryReservationById,
} from '../../src/server/inventory-reservation';

import type { InventoryReservation } from '../../src/types/inventory-reservation';

import type {
  CheckoutErrorCode,
  CheckoutSessionErrorResponse,
  CheckoutSessionSuccessResponse,
} from '../../src/types/checkout';

const CHECKOUT_SESSION_LIFETIME_SECONDS = 35 * 60;

class CheckoutConfigurationError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);

    this.name = 'CheckoutConfigurationError';

    this.status = status;
  }
}

function jsonResponse(
  body: CheckoutSessionSuccessResponse | CheckoutSessionErrorResponse,

  status = 200,
): Response {
  return Response.json(body, {
    status,

    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

function getStripeSecretKey(): string {
  if (process.env.PUBLIC_CHECKOUT_MODE !== 'test') {
    throw new CheckoutConfigurationError(503, 'Stripe test checkout is currently disabled.');
  }

  if (process.env.PUBLIC_STOREFRONT_MODE !== 'live') {
    throw new CheckoutConfigurationError(
      503,
      'The storefront must be in live mode before checkout can begin.',
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!stripeSecretKey || !stripeSecretKey.startsWith('sk_test_')) {
    throw new CheckoutConfigurationError(
      503,
      'A Stripe Sandbox secret key has not been configured.',
    );
  }

  return stripeSecretKey;
}

function getSiteOrigin(): string {
  const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim() || process.env.URL?.trim();

  if (!configuredSiteUrl) {
    throw new CheckoutConfigurationError(503, 'The website URL is not configured for checkout.');
  }

  const url = new URL(configuredSiteUrl);

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new CheckoutConfigurationError(503, 'The configured website URL is invalid.');
  }

  return url.origin;
}

function getCheckoutExpiration(): {
  expiresAt: Date;

  stripeExpiresAt: number;
} {
  const stripeExpiresAt = Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_LIFETIME_SECONDS;

  return {
    stripeExpiresAt,

    expiresAt: new Date(stripeExpiresAt * 1000),
  };
}

function isIndeterminateStripeCreationError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeConnectionError ||
    error instanceof Stripe.errors.StripeAPIError
  );
}

function getInventoryErrorResponse(error: InventoryReservationError): {
  status: number;

  code: CheckoutErrorCode;

  message: string;
} {
  switch (error.code) {
    case 'insufficient-stock':
      return {
        status: 409,

        code: 'product-unavailable',

        message: error.message,
      };

    case 'inventory-not-configured':
    case 'inventory-state-invalid':
      return {
        status: 503,

        code: 'inventory-not-configured',

        message: 'Inventory for one or more products is temporarily unavailable.',
      };

    case 'invalid-reservation':
      return {
        status: 400,

        code: 'invalid-cart',

        message: error.message,
      };

    case 'reservation-not-found':
    case 'reservation-conflict':
      return {
        status: 503,

        code: 'session-creation-failed',

        message: 'Checkout inventory could not be prepared. Please try again.',
      };
  }
}

async function releaseReservationAfterFailedStripeCreation(
  reservationId: string,
): Promise<boolean> {
  try {
    await releaseInventoryReservationById(reservationId, 'checkout-session-creation-failed');

    return true;
  } catch (error) {
    console.error(
      'Inventory reservation could not be released after Stripe Session creation failed.',
      {
        reservationId,

        error,
      },
    );

    return false;
  }
}

async function expireStripeSession(stripe: Stripe, sessionId: string): Promise<boolean> {
  try {
    const session = await stripe.checkout.sessions.expire(sessionId);

    return session.status === 'expired';
  } catch (error) {
    console.error('An unusable Stripe Checkout Session could not be expired.', {
      sessionId,

      error,
    });

    return false;
  }
}

async function expireSessionAndReleaseReservation(
  stripe: Stripe,
  sessionId: string,
  reservationId: string,
): Promise<boolean> {
  const sessionExpired = await expireStripeSession(stripe, sessionId);

  if (!sessionExpired) {
    /*
     * Never release the inventory while a Stripe Checkout Session might
     * still be payable. Keeping stock reserved is safer than allowing
     * two customers to purchase the same physical unit.
     */
    return false;
  }

  return await releaseReservationAfterFailedStripeCreation(reservationId);
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse(
      {
        ok: false,

        code: 'invalid-method',

        message: 'This endpoint accepts POST requests only.',
      },
      405,
    );
  }

  let inventoryReservation: InventoryReservation | undefined;

  let createdStripeSessionId: string | undefined;

  try {
    /*
     * Resolve every deterministic checkout configuration value before
     * reserving physical inventory. Configuration errors must never
     * create temporary stock holds.
     */
    const stripeSecretKey = getStripeSecretKey();

    const allowDemoProducts = process.env.PUBLIC_SANDBOX_CATALOG_CHECKOUT === 'true';

    if (!businessConfig.commercePoliciesFinalized && !allowDemoProducts) {
      return jsonResponse(
        {
          ok: false,

          code: 'policies-incomplete',

          message: 'Commerce policies must be finalized before checkout can begin.',
        },
        503,
      );
    }

    const rawRequest = await request.json().catch(() => null);

    const checkoutRequest = parseCheckoutRequest(rawRequest);

    const cart = validateCheckoutCart(
      checkoutRequest,

      allowDemoProducts,
    );

    const siteOrigin = getSiteOrigin();

    const cartReference = randomUUID();

    const stripe = new Stripe(stripeSecretKey, {
      /*
       * Stripe's SDK automatically retries retryable network
       * failures. We explicitly allow two retries because
       * Checkout Session creation is protected by an
       * idempotency key below.
       */
      maxNetworkRetries: 2,
    });

    const checkoutExpiration = getCheckoutExpiration();

    if (cart.inventoryLines.length > 0) {
      inventoryReservation = await createInventoryReservation({
        cartReference,

        expiresAt: checkoutExpiration.expiresAt,

        lines: cart.inventoryLines,
      });
    }

    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',

          ui_mode: 'embedded_page',

          permissions: {
            update_shipping_details: 'server_only',
          },

          line_items: cart.lineItems,

          automatic_tax: {
            enabled: true,
          },

          shipping_address_collection: {
            allowed_countries: [taxConfig.salesCountry],
          },

          shipping_options: [
            {
              shipping_rate_data: {
                type: 'fixed_amount',

                fixed_amount: {
                  amount: 0,

                  currency: taxConfig.stripeCurrency,
                },

                display_name: 'Shipping calculated after address',

                tax_behavior: taxConfig.taxBehavior,

                tax_code: taxConfig.shippingTaxCode,

                metadata: {
                  storefront: 'maxipawz',

                  shipping_placeholder: 'true',
                },
              },
            },
          ],

          customer_creation: 'always',

          billing_address_collection: 'auto',

          phone_number_collection: {
            enabled: true,
          },

          allow_promotion_codes: false,

          client_reference_id: cartReference,

          ...(inventoryReservation
            ? {
                expires_at: checkoutExpiration.stripeExpiresAt,
              }
            : {}),

          metadata: {
            cart_reference: cartReference,

            cart_source: 'storefront-cart',

            storefront: 'maxipawz',

            checkout_mode: 'test',

            sandbox_catalog_checkout: allowDemoProducts ? 'true' : 'false',

            sales_country: taxConfig.salesCountry,

            automatic_tax_enabled: 'true',

            shipping_provider: 'maxipawz',

            shipping_model: 'weight-destination-table',

            shipping_weight_oz: String(cart.shippingWeightOz),

            free_shipping_threshold_cents: String(shippingConfig.freeShippingThresholdAmount),

            merchandise_subtotal_cents: String(cart.merchandiseSubtotalAmount),

            inventory_reserved: inventoryReservation ? 'true' : 'false',

            ...(inventoryReservation
              ? {
                  inventory_reservation_id: inventoryReservation.id,

                  inventory_reservation_expires_at: String(checkoutExpiration.stripeExpiresAt),
                }
              : {}),
          },

          return_url: `${siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        },
        {
          idempotencyKey: `maxipawz-checkout-${cartReference}`,
        },
      );
    } catch (error) {
      if (inventoryReservation) {
        if (isIndeterminateStripeCreationError(error)) {
          /*
           * Stripe documents connection errors and API/server
           * errors as potentially indeterminate. The Session may
           * have been created even though this invocation did not
           * receive the response.
           *
           * Do not release physical inventory here. The
           * reservation remains fail-closed until webhook or
           * expiration reconciliation can determine the outcome.
           */
          console.error(
            'Stripe Checkout Session creation ended in an indeterminate state. Inventory remains reserved.',
            {
              reservationId: inventoryReservation.id,

              cartReference,

              error,
            },
          );
        } else {
          await releaseReservationAfterFailedStripeCreation(inventoryReservation.id);
        }
      }

      throw error;
    }

    createdStripeSessionId = session.id;

    if (inventoryReservation) {
      try {
        await attachStripeSessionToInventoryReservation(
          inventoryReservation.id,

          session.id,
        );
      } catch (error) {
        const cleanedUp = await expireSessionAndReleaseReservation(
          stripe,
          session.id,
          inventoryReservation.id,
        );

        if (!cleanedUp) {
          console.error(
            'Stripe Checkout Session and inventory reservation require reconciliation after reservation attachment failed.',
            {
              reservationId: inventoryReservation.id,

              stripeSessionId: session.id,

              cartReference,
            },
          );
        }

        throw error;
      }
    }

    if (!session.client_secret) {
      if (inventoryReservation) {
        const cleanedUp = await expireSessionAndReleaseReservation(
          stripe,
          session.id,
          inventoryReservation.id,
        );

        if (!cleanedUp) {
          console.error(
            'The Checkout Session has no client secret and requires inventory reconciliation.',
            {
              reservationId: inventoryReservation.id,

              stripeSessionId: session.id,

              cartReference,
            },
          );
        }
      } else {
        await expireStripeSession(stripe, session.id);
      }

      throw new Error('Stripe did not return an Embedded Checkout client secret.');
    }

    return jsonResponse({
      ok: true,

      sessionId: session.id,

      clientSecret: session.client_secret,
    });
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return jsonResponse(
        {
          ok: false,

          code: error.code,

          message: error.message,
        },
        error.status,
      );
    }

    if (error instanceof InventoryReservationError) {
      const inventoryError = getInventoryErrorResponse(error);

      return jsonResponse(
        {
          ok: false,

          code: inventoryError.code,

          message: inventoryError.message,
        },
        inventoryError.status,
      );
    }

    if (error instanceof CheckoutConfigurationError) {
      return jsonResponse(
        {
          ok: false,

          code: 'stripe-not-configured',

          message: error.message,
        },
        error.status,
      );
    }

    const errorReference = randomUUID();

    console.error('Embedded Stripe Checkout Session creation failed.', {
      errorReference,

      reservationId: inventoryReservation?.id,

      stripeSessionId: createdStripeSessionId,

      error,
    });

    return jsonResponse(
      {
        ok: false,

        code: 'session-creation-failed',

        message: `Checkout could not be started. Reference: ${errorReference}`,
      },
      500,
    );
  }
}

export const config: Config = {
  path: '/api/create-embedded-checkout-session',
};
