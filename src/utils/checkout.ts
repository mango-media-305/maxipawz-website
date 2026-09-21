import {
  commerceConfig,
  isTestCheckoutEnabled,
} from '../config/commerce';

import {
  commerceText,
} from '../i18n/commerce';

import type {
  Locale,
} from '../i18n/languages';

import type {
  CheckoutCampaignAttribution,
  CheckoutReadiness,
  CheckoutSessionRequest,
} from '../types/checkout';

import type {
  ResolvedCartLine,
} from '../types/cart';

function getStripePriceId(
  item:
    ResolvedCartLine,
): string | undefined {
  if (item.variant) {
    return item.variant
      .stripePriceId;
  }

  return item.product
    ?.stripeDefaultPriceId;
}

function addReason(
  reasons:
    string[],

  reason:
    string,
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
    string |
    undefined,
): string | undefined {
  return (
    value?.trim() ||
    undefined
  );
}

/**
 * Keep browser-only lifecycle fields out of the checkout request.
 */
function buildCheckoutAttribution(
  attribution:
    CheckoutCampaignAttribution |
    null |
    undefined,
): CheckoutCampaignAttribution | undefined {
  if (!attribution) {
    return undefined;
  }

  const landingPageSlug =
    attribution.landingPageSlug
      ?.trim();

  const campaignId =
    attribution.campaignId
      ?.trim();

  const productSlug =
    attribution.productSlug
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

    ...(
      typeof attribution.capturedAt ===
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
        : {}
    ),
  };
}

export function getCheckoutReadiness(
  items:
    ResolvedCartLine[],

  locale:
    Locale = 'en',
): CheckoutReadiness {
  if (
    items.length ===
    0
  ) {
    return {
      ready:
        false,

      reasons: [
        commerceText(
          locale,
          'Your cart is empty. Add an available product before continuing.',
          'Tu carrito está vacío. Agrega un producto disponible antes de continuar.',
        ),
      ],
    };
  }

  const reasons:
    string[] =
    [];

  const sandboxDemoCheckout =
    commerceConfig
      .sandboxCatalogCheckoutEnabled;

  /*
   * Preserve the existing checkout gates. Store configuration
   * problems are presented as store availability, rather than
   * setup tasks for customers.
   */
  const storeCheckoutAvailable =
    commerceConfig
      .storefrontLive &&
    (
      commerceConfig
        .policiesFinalized ||
      sandboxDemoCheckout
    ) &&
    isTestCheckoutEnabled &&
    commerceConfig
      .stripePublishableKey
      .startsWith(
        'pk_test_',
      );

  if (
    !storeCheckoutAvailable
  ) {
    addReason(
      reasons,

      commerceText(
        locale,
        'Online checkout is currently unavailable. Please check back later.',
        'El proceso de pago en línea no está disponible actualmente. Vuelve a intentarlo más adelante.',
      ),
    );
  }

  if (
    items.some(
      (
        item,
      ) =>
        item.product
          ?.isDemo,
    ) &&
    !sandboxDemoCheckout
  ) {
    addReason(
      reasons,

      commerceText(
        locale,
        'Your cart contains demo items that cannot be purchased. Remove them from your cart to continue.',
        'Tu carrito contiene productos de demostración que no pueden comprarse. Elimínalos del carrito para continuar.',
      ),
    );
  }

  for (
    const item of
    items
  ) {
    const productName =
      item.product
        ?.name ??
      commerceText(
        locale,
        'An item in your cart',
        'Un producto de tu carrito',
      );

    const itemLabel =
      item.variant
        ?.label
        ? `${productName} (${item.variant.label})`
        : productName;

    if (
      !item.available
    ) {
      addReason(
        reasons,

        locale ===
          'es'
          ? `${itemLabel} no está disponible. Elimínalo o actualiza tu selección en el carrito.`
          : `${itemLabel} is unavailable. Remove it or update your selection in the cart.`,
      );
    } else if (
      !getStripePriceId(
        item,
      )
    ) {
      addReason(
        reasons,

        locale ===
          'es'
          ? `${itemLabel} no puede procesarse en el pago en este momento. Inténtalo nuevamente más adelante.`
          : `${itemLabel} cannot be checked out right now. Please try again later.`,
      );
    }
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
    CheckoutCampaignAttribution |
    null,
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

    ...(
      checkoutAttribution
        ? {
            attribution:
              checkoutAttribution,
          }
        : {}
    ),
  };
}