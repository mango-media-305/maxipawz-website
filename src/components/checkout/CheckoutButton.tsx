import { useId, useMemo } from 'preact/hooks';

import { isTestCheckoutEnabled } from '../../config/commerce';

import { commerceText } from '../../i18n/commerce';

import type { Locale } from '../../i18n/languages';

import { localizeHref } from '../../i18n/routes';

import type { ResolvedCartLine } from '../../types/cart';

import { getCartTotals } from '../../utils/cart';

import { getCheckoutReadiness } from '../../utils/checkout';

import ShippingSummary from './ShippingSummary';

import { useCheckoutInventoryReadiness } from './useCheckoutInventoryReadiness';

interface Props {
  lines: ResolvedCartLine[];

  compact?: boolean;

  locale?: Locale;
}

function CheckoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H7" />

      <circle cx="10" cy="20" r="1.5" />

      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

export default function CheckoutButton({
  lines,
  compact = false,
  locale = 'en',
}: Props) {
  const statusId = useId();

  const testNoticeId = useId();

  const totals = useMemo(
    () => getCartTotals(lines),
    [lines],
  );

  const catalogReadiness = useMemo(
    () => getCheckoutReadiness(lines, locale),
    [lines, locale],
  );

  const inventoryReadiness = useCheckoutInventoryReadiness({
    lines,

    enabled: catalogReadiness.ready,

    locale,
  });

  const checkoutReady =
    catalogReadiness.ready &&
    inventoryReadiness.ready;

  const inventoryChecking =
    catalogReadiness.ready &&
    (
      inventoryReadiness.status === 'idle' ||
      inventoryReadiness.status === 'checking'
    );

  const inventoryBlocked =
    catalogReadiness.ready &&
    inventoryReadiness.status === 'blocked';

  let buttonLabel = commerceText(
    locale,
    'Checkout Unavailable',
    'Pago no disponible',
  );

  if (inventoryChecking) {
    buttonLabel = commerceText(
      locale,
      'Checking Stock…',
      'Verificando inventario…',
    );
  } else if (inventoryBlocked) {
    buttonLabel = commerceText(
      locale,
      'Recheck Stock',
      'Comprobar inventario',
    );
  } else if (checkoutReady) {
    buttonLabel = commerceText(
      locale,
      'Continue to Test Checkout',
      'Continuar al pago de prueba',
    );
  }

  const displayedReasons =
    !catalogReadiness.ready
      ? catalogReadiness.reasons
      : inventoryChecking
        ? [
            commerceText(
              locale,
              'Checking that your items are still available.',
              'Estamos comprobando que tus productos continúen disponibles.',
            ),
          ]
        : inventoryReadiness.reasons;

  const canInteract =
    catalogReadiness.ready &&
    !inventoryChecking;

  async function handleCheckout(): Promise<void> {
    if (!catalogReadiness.ready) {
      return;
    }

    const wasReady = inventoryReadiness.ready;

    const stillReady = await inventoryReadiness.revalidate();

    if (wasReady && stillReady) {
      (
        window as Window & {
          posthog?: {
            capture: (
              event: string,
              properties?: Record<string, string | number | boolean>,
            ) => void;
          };
        }
      ).posthog?.capture('checkout_started', {
        item_count: totals.itemCount,

        subtotal_amount: totals.subtotalAmount,

        currency: 'USD',

        is_demo_cart: totals.hasDemoItems,
      });

      window.location.assign(
        localizeHref(
          '/checkout',
          locale,
        ),
      );
    }
  }

  return (
    <div>
      <ShippingSummary
        subtotalAmount={totals.subtotalAmount}
        compact={compact}
        locale={locale}
      />

      {isTestCheckoutEnabled && (
        <p
          id={testNoticeId}
          className="mb-3 rounded-2xl border border-accent-200 bg-accent-50 p-3 text-xs font-bold leading-5 text-ink-700"
        >
          {commerceText(
            locale,
            'Test checkout only. Payments are simulated; no real payment is collected.',
            'Proceso de pago de prueba únicamente. Los pagos son simulados y no se cobra dinero real.',
          )}
        </p>
      )}

      <button
        type="button"
        className={[
          'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/45',

          checkoutReady
            ? 'border border-brand-600 bg-brand-500 text-white shadow-blue hover:-translate-y-0.5 hover:bg-brand-600'
            : inventoryBlocked
              ? 'border border-brand-300 bg-brand-50 text-brand-800 hover:bg-brand-100'
              : 'cursor-not-allowed border border-sand-dark bg-ink-200 text-ink-600',
        ].join(' ')}
        disabled={!canInteract}
        aria-busy={inventoryChecking}
        aria-describedby={
          isTestCheckoutEnabled
            ? `${testNoticeId} ${statusId}`
            : statusId
        }
        onClick={() => {
          void handleCheckout();
        }}
      >
        <CheckoutIcon />

        {buttonLabel}
      </button>

      <div
        id={statusId}
        className={compact ? 'mt-3' : 'mt-4'}
        aria-live="polite"
        aria-atomic="true"
      >
        {!checkoutReady && displayedReasons.length > 0 && (
          <div
            className={`rounded-2xl border border-accent-200 bg-accent-50 ${
              compact ? 'p-3' : 'p-4'
            }`}
          >
            {!inventoryChecking && (
              <p className="text-sm font-extrabold text-ink-800">
                {commerceText(
                  locale,
                  'Before you continue',
                  'Antes de continuar',
                )}
              </p>
            )}

            <ul className={inventoryChecking ? 'grid gap-2' : 'mt-2 grid gap-2'}>
              {displayedReasons.map((reason) => (
                <li
                  key={reason}
                  className="text-xs font-bold leading-5 text-ink-600"
                >
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {compact && !checkoutReady && !inventoryChecking && (
        <a
          href={localizeHref('/cart', locale)}
          className="mt-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-extrabold text-brand-700 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300/45"
        >
          {commerceText(locale, 'Review your cart', 'Revisar tu carrito')}
        </a>
      )}
    </div>
  );
}