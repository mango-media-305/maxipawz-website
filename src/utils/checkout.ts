import {
  commerceConfig,
  isTestCheckoutEnabled,
} from '../config/commerce';

import type {
  CheckoutCampaignAttribution,
  CheckoutReadiness,
  CheckoutSessionRequest,
} from '../types/checkout';

import type {
  ResolvedCartLine,
} from '../types/cart';

function getStripePriceId(
  item: ResolvedCartLine,
):
  | string
  | undefined {
  if (item.variant) {
    return item.variant.stripePriceId;
  }

  return item.product
    ?.stripeDefaultPriceId;
}

function addReason(
  reasons: string[],

  reason: string,
): void {
  if (
    !reasons.includes(
      reason,
    )
  ) {
    reasons.push(
      reason,
    );
  }
}

function normalizeOptionalText(
  value:
    | string
    | undefined,
):
  | string
  | undefined {
  const normalized =
    value?.trim();

  return normalized ||
    undefined;
}

/**
 * Minimize the browser attribution object before sending
 * it to the checkout endpoint.
 *
 * featured-campaign.ts contains additional browser-only
 * lifecycle fields such as version and expiresAt.
 *
 * Those fields are intentionally not sent to Stripe.
 */
function buildCheckoutAttribution(
  attribution:
    | CheckoutCampaignAttribution
    | null
    | undefined,
):
  | CheckoutCampaignAttribution
  | undefined {
  if (
    !attribution
  ) {
    return undefined;
  }

  const landingPageSlug =
    attribution
      .landingPageSlug
      ?.trim();

  const campaignId =
    attribution
      .campaignId
      ?.trim();

  const productSlug =
    attribution
      .productSlug
      ?.trim();

  if (
    !landingPageSlug ||
    !campaignId ||
    !productSlug
  ) {
    return undefined;
  }

  return {
    landingPageSlug,

    campaignId,

    productSlug,

    channel:
      normalizeOptionalText(
        attribution.channel,
      ),

    audience:
      normalizeOptionalText(
        attribution.audience,
      ),

    utmSource:
      normalizeOptionalText(
        attribution.utmSource,
      ),

    utmMedium:
      normalizeOptionalText(
        attribution.utmMedium,
      ),

    utmCampaign:
      normalizeOptionalText(
        attribution.utmCampaign,
      ),

    utmContent:
      normalizeOptionalText(
        attribution.utmContent,
      ),

    utmTerm:
      normalizeOptionalText(
        attribution.utmTerm,
      ),

    referrerHost:
      normalizeOptionalText(
        attribution.referrerHost,
      ),

    ...(typeof attribution.capturedAt ===
      'number' &&
      Number.isFinite(
        attribution.capturedAt,
      )
      ? {
        capturedAt:
          Math.floor(
            attribution.capturedAt,
          ),
      }
      : {}),
  };
}

export function getCheckoutReadiness(
  items: ResolvedCartLine[],
): CheckoutReadiness {
  const reasons:
    string[] = [];

  const sandboxDemoCheckout =
    commerceConfig
      .sandboxCatalogCheckoutEnabled;

  if (
    items.length ===
    0
  ) {
    addReason(
      reasons,

      'Your cart is empty.',
    );
  }

  if (
    !commerceConfig.storefrontLive
  ) {
    addReason(
      reasons,

      'The storefront must be in live mode.',
    );
  }

  if (
    !commerceConfig.policiesFinalized &&
    !sandboxDemoCheckout
  ) {
    addReason(
      reasons,

      'Shipping, return, refund, and cancellation policies must be finalized.',
    );
  }

  if (
    !isTestCheckoutEnabled
  ) {
    addReason(
      reasons,

      'Stripe test checkout is currently disabled.',
    );
  }

  if (
    !commerceConfig
      .stripePublishableKey
      .startsWith(
        'pk_test_',
      )
  ) {
    addReason(
      reasons,

      'The Stripe Sandbox publishable key is not configured.',
    );
  }

  const containsDemoItems =
    items.some(
      (
        item,
      ) =>
        item.product
          ?.isDemo,
    );

  if (
    containsDemoItems &&
    !sandboxDemoCheckout
  ) {
    addReason(
      reasons,

      'Demo products require the Stripe Sandbox catalog checkout setting.',
    );
  }

  if (
    items.some(
      (
        item,
      ) =>
        !item.available,
    )
  ) {
    addReason(
      reasons,

      'Every cart item must be active, priced, and in stock.',
    );
  }

  if (
    items.some(
      (
        item,
      ) =>
        item.available &&
        !getStripePriceId(
          item,
        ),
    )
  ) {
    addReason(
      reasons,

      'Every purchasable product or variant needs a Stripe Price ID.',
    );
  }

  return {
    ready:
      reasons.length ===
      0,

    reasons,
  };
}

export function buildCheckoutRequest(
  items:
    ResolvedCartLine[],

  attribution?:
    | CheckoutCampaignAttribution
    | null,
): CheckoutSessionRequest {
  const checkoutAttribution =
    buildCheckoutAttribution(
      attribution,
    );

  return {
    lines:
      items
        .filter(
          (
            item,
          ) =>
            Boolean(
              item.product,
            ),
        )
        .map(
          (
            item,
          ) => ({
            productSlug:
              item.line
                .productSlug,

            variantId:
              item.line
                .variantId,

            quantity:
              item.line
                .quantity,
          }),
        ),

    ...(checkoutAttribution
      ? {
        attribution:
          checkoutAttribution,
      }
      : {}),
  };
}