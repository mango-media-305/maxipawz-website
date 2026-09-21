import CheckoutButton from '../checkout/CheckoutButton';

import { useMemo } from 'preact/hooks';

import CartItem from './CartItem';

import { useCart } from './useCart';

import { clearCart } from '../../stores/cart';

import type { Locale } from '../../i18n/languages';

import { commerceText } from '../../i18n/commerce';

import { localizeHref } from '../../i18n/routes';

import { formatCartAmount, getCartTotals, resolveCartLines } from '../../utils/cart';

import { getCartPresentation } from '../../utils/cart-presentation';

interface Props {
  locale?: Locale;
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-8"
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

export default function CartPage({
  locale = 'en',
}: Props) {
  const { state, hydrated } = useCart();

  const cartPresentation = getCartPresentation(locale);

  const resolvedLines = useMemo(
    () => resolveCartLines(state, locale),
    [state, locale],
  );

  const totals = useMemo(
    () => getCartTotals(resolvedLines),
    [resolvedLines],
  );

  if (!hydrated) {
    return (
      <div className="rounded-[2.5rem] border border-sand bg-white-warm p-8 text-center shadow-card">
        <p className="font-bold text-ink-600">
          {commerceText(locale, 'Loading your cart…', 'Cargando tu carrito…')}
        </p>
      </div>
    );
  }

  if (resolvedLines.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-200 bg-linear-to-br from-brand-50 via-white-warm to-accent-50 p-8 text-center shadow-card sm:p-10 lg:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-full border border-brand-200 bg-white-warm text-brand-600 shadow-soft">
          <CartIcon />
        </span>

        <h2 className="mt-6 text-3xl text-ink-900 sm:text-4xl">
          {commerceText(locale, 'Your cart is empty.', 'Tu carrito está vacío.')}
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-600">
          {cartPresentation.emptyDescription}
        </p>

        <a
          href={localizeHref(cartPresentation.primaryAction.href, locale)}
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-500 px-6 font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600"
        >
          {cartPresentation.primaryAction.label}
        </a>

        {cartPresentation.secondaryAction && (
          <a
            href={localizeHref(cartPresentation.secondaryAction.href, locale)}
            className="mx-auto mt-3 flex min-h-12 w-fit items-center justify-center rounded-full px-5 font-extrabold text-brand-800 transition hover:bg-brand-50"
          >
            {cartPresentation.secondaryAction.label}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
      <section
        className="rounded-[2.5rem] border border-sand bg-white-warm/80 p-4 shadow-card sm:p-6"
        aria-labelledby="cart-items-title"
      >
        <div className="flex flex-col gap-4 border-b border-sand pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
              {commerceText(locale, 'Shopping Cart', 'Carrito de compras')}
            </p>

            <h2 id="cart-items-title" className="mt-2 text-2xl text-ink-900 sm:text-3xl">
              {totals.itemCount}{' '}
              {totals.itemCount === 1
                ? commerceText(locale, 'item', 'producto')
                : commerceText(locale, 'items', 'productos')}
            </h2>
          </div>

          <button
            type="button"
            className="w-fit rounded-full border border-danger-100 bg-danger-50 px-4 py-2 text-sm font-extrabold text-danger-700 transition hover:bg-danger-100"
            onClick={() => {
              const confirmed = window.confirm(
                commerceText(
                  locale,
                  'Remove every item from your cart?',
                  '¿Eliminar todos los productos de tu carrito?',
                ),
              );

              if (confirmed) {
                clearCart();
              }
            }}
          >
            {commerceText(locale, 'Clear Cart', 'Vaciar carrito')}
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          {resolvedLines.map((item) => (
            <CartItem
              key={item.key}
              item={item}
              locale={locale}
            />
          ))}
        </div>
      </section>

      <aside className="rounded-[2.5rem] border border-brand-200 bg-linear-to-br from-brand-50 via-white-warm to-accent-50 p-5 shadow-card lg:sticky lg:top-28">
        <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
          {commerceText(locale, 'Cart Summary', 'Resumen del carrito')}
        </p>

        <h2 className="mt-2 text-2xl text-ink-900">
          {commerceText(locale, 'Order estimate', 'Estimado del pedido')}
        </h2>

        <dl className="mt-6 grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-bold text-ink-600">
              {commerceText(locale, 'Items', 'Productos')}
            </dt>

            <dd className="font-black text-ink-900">{totals.itemCount}</dd>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-sand pt-4">
            <dt className="font-bold text-ink-600">
              {commerceText(locale, 'Merchandise subtotal', 'Subtotal de productos')}
            </dt>

            <dd className="text-xl font-black text-ink-900">
              {formatCartAmount(totals.subtotalAmount, 'USD', locale)}
            </dd>
          </div>

          {totals.savingsAmount > 0 && (
            <div className="flex items-center justify-between gap-4 text-success-700">
              <dt className="font-bold">
                {totals.hasDemoItems
                  ? commerceText(locale, 'Demo savings', 'Ahorro de demostración')
                  : commerceText(locale, 'Savings', 'Ahorro')}
              </dt>

              <dd className="font-black">
                −{formatCartAmount(totals.savingsAmount, 'USD', locale)}
              </dd>
            </div>
          )}
        </dl>

        {totals.unavailableLineCount > 0 && (
          <p className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-3 text-sm font-bold leading-6 text-ink-700">
            {locale === 'es'
              ? `${totals.unavailableLineCount} ${
                  totals.unavailableLineCount === 1
                    ? 'producto no está disponible actualmente y fue excluido'
                    : 'productos no están disponibles actualmente y fueron excluidos'
                } del subtotal.`
              : `${totals.unavailableLineCount} ${
                  totals.unavailableLineCount === 1 ? 'item is' : 'items are'
                } currently unavailable and excluded from the subtotal.`}
          </p>
        )}

        {totals.hasDemoItems && (
          <p className="mt-5 rounded-2xl border border-ink-700 bg-ink-950 p-4 text-sm font-bold leading-6 text-white/80">
            {commerceText(
              locale,
              'This cart contains demo items. Demo items are fictional and will not be shipped.',
              'Este carrito contiene productos de demostración. Son productos ficticios y no serán enviados.',
            )}
          </p>
        )}

        <div className="mt-5">
          <CheckoutButton
            lines={resolvedLines}
            locale={locale}
          />
        </div>

        <a
          href={localizeHref(cartPresentation.continueAction.href, locale)}
          className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-brand-300 bg-white-warm px-5 font-extrabold text-brand-800 transition hover:bg-brand-100"
        >
          {cartPresentation.continueAction.label}
        </a>

        <p className="mt-4 text-center text-xs leading-5 text-ink-500">
          {commerceText(
            locale,
            'Shipping and any applicable taxes are shown at checkout.',
            'El envío y los impuestos aplicables se mostrarán durante el proceso de pago.',
          )}
        </p>
      </aside>
    </div>
  );
}