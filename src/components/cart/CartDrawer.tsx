import CheckoutButton from '../checkout/CheckoutButton';

import {
  useEffect,
  useMemo,
  useRef,
} from 'preact/hooks';

import CartItem from './CartItem';

import {
  useCart,
  useCartDrawer,
} from './useCart';

import {
  closeCartDrawer,
} from '../../stores/cart';

import {
  commerceText,
} from '../../i18n/commerce';

import type {
  Locale,
} from '../../i18n/languages';

import {
  localizeHref,
} from '../../i18n/routes';

import {
  formatCartAmount,
  getCartTotals,
  resolveCartLines,
} from '../../utils/cart';

import {
  getCartPresentation,
} from '../../utils/cart-presentation';

interface Props {
  locale?:
    Locale;
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H7" />

      <circle
        cx="10"
        cy="20"
        r="1.5"
      />

      <circle
        cx="18"
        cy="20"
        r="1.5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export default function CartDrawer({
  locale = 'en',
}: Props) {
  const open =
    useCartDrawer();

  const {
    state,
    hydrated,
  } =
    useCart();

  const drawerRef =
    useRef<HTMLElement>(
      null,
    );

  const closeButtonRef =
    useRef<HTMLButtonElement>(
      null,
    );

  const cartPresentation =
    getCartPresentation(
      locale,
    );

  const resolvedLines =
    useMemo(
      () =>
        resolveCartLines(
          state,
          locale,
        ),
      [
        state,
        locale,
      ],
    );

  const totals =
    useMemo(
      () =>
        getCartTotals(
          resolvedLines,
        ),
      [
        resolvedLines,
      ],
    );

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style
        .overflow =
        'hidden';

      window.requestAnimationFrame(
        () => {
          closeButtonRef
            .current
            ?.focus();
        },
      );

      function handleKeydown(
        event:
          KeyboardEvent,
      ): void {
        if (
          event.key ===
          'Escape'
        ) {
          closeCartDrawer();

          return;
        }

        if (
          event.key !==
            'Tab' ||
          !drawerRef.current
        ) {
          return;
        }

        const focusableElements =
          Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          );

        const firstElement =
          focusableElements[
            0
          ];

        const lastElement =
          focusableElements.at(
            -1,
          );

        if (
          !firstElement ||
          !lastElement
        ) {
          return;
        }

        if (
          event.shiftKey &&
          document.activeElement ===
            firstElement
        ) {
          event.preventDefault();

          lastElement.focus();

          return;
        }

        if (
          !event.shiftKey &&
          document.activeElement ===
            lastElement
        ) {
          event.preventDefault();

          firstElement.focus();
        }
      }

      document.addEventListener(
        'keydown',
        handleKeydown,
      );

      return () => {
        document.body.style
          .overflow =
          previousOverflow;

        document.removeEventListener(
          'keydown',
          handleKeydown,
        );
      };
    },
    [
      open,
    ],
  );

  if (
    !open
  ) {
    return null;
  }

  const closeLabel =
    commerceText(
      locale,
      'Close shopping cart',
      'Cerrar carrito de compras',
    );

  return (
    <div
      className="fixed inset-0 z-120"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 size-full cursor-default border-0 bg-ink-950/50 p-0 backdrop-blur-sm"
        aria-label={closeLabel}
        onClick={closeCartDrawer}
      />

      <aside
        ref={drawerRef}
        className="absolute inset-y-0 right-0 flex h-full w-[min(94vw,30rem)] flex-col overflow-hidden border-l border-brand-100 bg-cream-soft shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-sand bg-white-warm px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-500 text-white shadow-blue">
              <CartIcon />
            </span>

            <div>
              <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                {
                  commerceText(
                    locale,
                    'Maxi Pawz Cart',
                    'Carrito de Maxi Pawz',
                  )
                }
              </p>

              <h2
                id="cart-drawer-title"
                className="mt-1 text-xl text-ink-900"
              >
                {totals.itemCount}{' '}

                {
                  totals.itemCount ===
                  1
                    ? commerceText(
                        locale,
                        'item',
                        'producto',
                      )
                    : commerceText(
                        locale,
                        'items',
                        'productos',
                      )
                }
              </h2>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="grid size-10 place-items-center rounded-full border border-sand bg-cream-soft text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            aria-label={closeLabel}
            onClick={closeCartDrawer}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {
            !hydrated
              ? (
                  <div className="rounded-card-lg border border-sand bg-white-warm p-6 text-center shadow-sm">
                    <p className="font-bold text-ink-600">
                      {
                        commerceText(
                          locale,
                          'Loading your cart…',
                          'Cargando tu carrito…',
                        )
                      }
                    </p>
                  </div>
                )
              : resolvedLines.length ===
                0
                ? (
                    <div className="rounded-card-lg border border-brand-200 bg-linear-to-br from-brand-50 via-white-warm to-accent-50 p-7 text-center shadow-sm">
                      <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-100 text-brand-700">
                        <CartIcon />
                      </span>

                      <h3 className="mt-5 text-2xl text-ink-900">
                        {
                          commerceText(
                            locale,
                            'Your cart is empty.',
                            'Tu carrito está vacío.',
                          )
                        }
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-ink-600">
                        {
                          cartPresentation
                            .emptyDescription
                        }
                      </p>

                      <a
                        href={localizeHref(
                          cartPresentation
                            .primaryAction
                            .href,
                          locale,
                        )}
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-500 px-5 font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600"
                        onClick={closeCartDrawer}
                      >
                        {
                          cartPresentation
                            .primaryAction
                            .label
                        }
                      </a>

                      {
                        cartPresentation
                          .secondaryAction && (
                          <a
                            href={localizeHref(
                              cartPresentation
                                .secondaryAction
                                .href,
                              locale,
                            )}
                            className="mt-3 flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-extrabold text-brand-800 transition hover:bg-brand-50"
                            onClick={closeCartDrawer}
                          >
                            {
                              cartPresentation
                                .secondaryAction
                                .label
                            }
                          </a>
                        )
                      }
                    </div>
                  )
                : (
                    <div className="grid gap-3">
                      {
                        resolvedLines.map(
                          (
                            item,
                          ) => (
                            <CartItem
                              key={item.key}
                              item={item}
                              compact={true}
                              locale={locale}
                            />
                          ),
                        )
                      }
                    </div>
                  )
          }
        </div>

        {
          resolvedLines.length >
          0 && (
            <footer className="shrink-0 overflow-y-auto border-t border-sand bg-white-warm p-5">
              {
                totals.hasDemoItems && (
                  <p className="mb-4 rounded-2xl border border-accent-200 bg-accent-50 p-3 text-xs font-bold leading-5 text-ink-700">
                    {
                      commerceText(
                        locale,
                        'This cart contains demo items. Demo items are fictional and will not be shipped.',
                        'Este carrito contiene productos de demostración. Son productos ficticios y no serán enviados.',
                      )
                    }
                  </p>
                )
              }

              <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-ink-600">
                  {
                    commerceText(
                      locale,
                      'Merchandise subtotal',
                      'Subtotal de productos',
                    )
                  }
                </span>

                <span className="text-2xl font-black text-ink-900">
                  {
                    formatCartAmount(
                      totals.subtotalAmount,
                      'USD',
                      locale,
                    )
                  }
                </span>
              </div>

              {
                totals.savingsAmount >
                0 && (
                  <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-bold text-success-700">
                      {
                        totals.hasDemoItems
                          ? commerceText(
                              locale,
                              'Demo savings',
                              'Ahorro de demostración',
                            )
                          : commerceText(
                              locale,
                              'Savings',
                              'Ahorro',
                            )
                      }
                    </span>

                    <span className="font-black text-success-700">
                      −
                      {
                        formatCartAmount(
                          totals.savingsAmount,
                          'USD',
                          locale,
                        )
                      }
                    </span>
                  </div>
                )
              }

              {
                totals.unavailableLineCount >
                0 && (
                  <p className="mt-4 rounded-2xl border border-accent-200 bg-accent-50 p-3 text-xs font-bold leading-5 text-ink-700">
                    {
                      locale ===
                      'es'
                        ? `${totals.unavailableLineCount} ${
                            totals.unavailableLineCount ===
                            1
                              ? 'producto no está disponible actualmente y fue excluido'
                              : 'productos no están disponibles actualmente y fueron excluidos'
                          } del subtotal.`
                        : `${totals.unavailableLineCount} ${
                            totals.unavailableLineCount ===
                            1
                              ? 'item is'
                              : 'items are'
                          } currently unavailable and excluded from the subtotal.`
                    }
                  </p>
                )
              }

              <div className="mt-5">
                <CheckoutButton
                  lines={resolvedLines}
                  compact={true}
                  locale={locale}
                />
              </div>

              <a
                href={localizeHref(
                  '/cart',
                  locale,
                )}
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-brand-300 bg-brand-50 px-5 font-extrabold text-brand-800 transition hover:bg-brand-100"
                onClick={closeCartDrawer}
              >
                {
                  commerceText(
                    locale,
                    'View Full Cart',
                    'Ver carrito completo',
                  )
                }
              </a>
            </footer>
          )
        }
      </aside>
    </div>
  );
}