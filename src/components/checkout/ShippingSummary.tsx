import { commerceConfig } from '../../config/commerce';

import { commerceText } from '../../i18n/commerce';

import type { Locale } from '../../i18n/languages';

import { localizeHref } from '../../i18n/routes';

import { formatCartAmount } from '../../utils/cart';

import { getShippingThresholdState } from '../../utils/shipping';

interface Props {
  subtotalAmount: number;

  compact?: boolean;

  locale?: Locale;
}

export default function ShippingSummary({
  subtotalAmount,
  compact = false,
  locale = 'en',
}: Props) {
  const shippingState = getShippingThresholdState(subtotalAmount);

  return (
    <section
      className={[
        'rounded-2xl border border-brand-200 bg-brand-50',
        compact ? 'mb-4 p-3' : 'mb-5 p-4',
      ].join(' ')}
      aria-label={commerceText(locale, 'Shipping estimate', 'Estimado de envío')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
            {commerceText(locale, 'Shipping', 'Envío')}
          </p>

          <p className="mt-1 text-sm font-black text-ink-900">
            {shippingState.qualifiesForFreeShipping
              ? commerceText(
                  locale,
                  'Free standard shipping unlocked',
                  'Envío estándar gratuito disponible',
                )
              : locale === 'es'
                ? `Agrega ${formatCartAmount(
                    shippingState.amountUntilFreeShipping,
                    'USD',
                    locale,
                  )} para obtener envío estándar gratuito`
                : `Add ${formatCartAmount(
                    shippingState.amountUntilFreeShipping,
                    'USD',
                    locale,
                  )} for free standard shipping`}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-brand-200 bg-white-warm px-3 py-1 text-xs font-extrabold text-brand-800">
          {shippingState.progress}%
        </span>
      </div>

      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-brand-100"
        role="progressbar"
        aria-label={commerceText(
          locale,
          'Progress toward free standard shipping',
          'Progreso para obtener envío estándar gratuito',
        )}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shippingState.progress}
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
          style={{
            width: `${shippingState.progress}%`,
          }}
        />
      </div>

      <dl className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="font-bold text-ink-600">
            {commerceText(locale, 'Standard shipping', 'Envío estándar')}
          </dt>

          <dd className="text-right font-black text-ink-900">
            {shippingState.qualifiesForFreeShipping
              ? commerceText(locale, 'Free', 'Gratis')
              : commerceText(
                  locale,
                  'Weight-based estimate',
                  'Estimado según el peso',
                )}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-brand-200 pt-2">
          <dt className="font-bold text-ink-600">
            {commerceText(locale, 'Final shipping charge', 'Cargo final de envío')}
          </dt>

          <dd className="text-right font-black text-ink-900">
            {shippingState.qualifiesForFreeShipping
              ? commerceText(locale, 'Included', 'Incluido')
              : commerceText(
                  locale,
                  'Calculated at checkout',
                  'Calculado durante el pago',
                )}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs font-bold leading-5 text-ink-600">
        {commerceText(
          locale,
          "Standard shipping is estimated from the order's packed weight and U.S. destination. The amount is shown before payment.",
          'El envío estándar se estima según el peso del pedido preparado y el destino dentro de Estados Unidos. El importe se muestra antes del pago.',
        )}
      </p>

      <a
        href={localizeHref(
          commerceConfig.shipping.policyHref,
          locale,
        )}
        className="mt-3 inline-flex text-xs font-extrabold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-900"
      >
        {commerceText(
          locale,
          'Review shipping policy',
          'Consultar política de envíos',
        )}
      </a>
    </section>
  );
}