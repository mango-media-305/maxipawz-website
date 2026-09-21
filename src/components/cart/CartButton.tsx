import type {
  ComponentType,
} from 'preact';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

import {
  useCart,
  useCartDrawer,
} from './useCart';

import {
  closeCartDrawer,
  openCartDrawer,
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

interface CartDrawerProps {
  locale?:
    Locale;
}

type LoadedCartDrawer =
  ComponentType<CartDrawerProps>;

type CartDrawerModule =
  typeof import('./CartDrawer');

interface CartDrawerFallbackProps {
  loadFailed:
    boolean;

  locale:
    Locale;
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4.5"
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

function CartDrawerFallback({
  loadFailed,
  locale,
}: CartDrawerFallbackProps) {
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
        className="absolute inset-0 size-full cursor-default border-0 bg-ink-950/50 p-0"
        aria-label={closeLabel}
        onClick={closeCartDrawer}
      />

      <aside
        className="absolute inset-y-0 right-0 flex h-full w-[min(94vw,30rem)] flex-col overflow-hidden border-l border-brand-100 bg-cream-soft shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-loading-title"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-sand bg-white-warm px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-500 text-white shadow-blue">
              <CartIcon />
            </span>

            <div>
              <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                {commerceText(
                  locale,
                  'Maxi Pawz Cart',
                  'Carrito de Maxi Pawz',
                )}
              </p>

              <h2
                id="cart-loading-title"
                className="mt-1 text-xl text-ink-900"
              >
                {
                  loadFailed
                    ? commerceText(
                        locale,
                        'Cart unavailable',
                        'Carrito no disponible',
                      )
                    : commerceText(
                        locale,
                        'Opening your cart…',
                        'Abriendo tu carrito…',
                      )
                }
              </h2>
            </div>
          </div>

          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-sand bg-cream-soft text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            aria-label={closeLabel}
            onClick={closeCartDrawer}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="grid flex-1 place-items-center p-5">
          <div className="w-full rounded-card-lg border border-brand-200 bg-linear-to-br from-brand-50 via-white-warm to-accent-50 p-7 text-center shadow-sm">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-100 text-brand-700">
              <CartIcon />
            </span>

            {
              loadFailed
                ? (
                    <>
                      <h3 className="mt-5 text-2xl text-ink-900">
                        {
                          commerceText(
                            locale,
                            'We could not open the cart drawer.',
                            'No pudimos abrir el panel del carrito.',
                          )
                        }
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-ink-600">
                        {
                          commerceText(
                            locale,
                            'You can still open the full cart page and continue from there.',
                            'Puedes abrir la página completa del carrito y continuar desde allí.',
                          )
                        }
                      </p>

                      <a
                        href={localizeHref(
                          '/cart',
                          locale,
                        )}
                        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-500 px-5 font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600"
                      >
                        {
                          commerceText(
                            locale,
                            'Open Full Cart',
                            'Abrir carrito completo',
                          )
                        }
                      </a>
                    </>
                  )
                : (
                    <>
                      <h3 className="mt-5 text-2xl text-ink-900">
                        {
                          commerceText(
                            locale,
                            'Preparing your cart.',
                            'Preparando tu carrito.',
                          )
                        }
                      </h3>

                      <p
                        className="mt-3 text-sm font-bold leading-6 text-ink-600"
                        role="status"
                        aria-live="polite"
                      >
                        {
                          commerceText(
                            locale,
                            'Loading your saved items and checkout options.',
                            'Cargando tus productos guardados y las opciones de pago.',
                          )
                        }
                      </p>
                    </>
                  )
            }
          </div>
        </div>
      </aside>
    </div>
  );
}

interface Props {
  locale?:
    Locale;
}

export default function CartButton({
  locale = 'en',
}: Props) {
  const {
    state,
  } =
    useCart();

  const drawerOpen =
    useCartDrawer();

  const [
    DrawerComponent,
    setDrawerComponent,
  ] =
    useState<
      LoadedCartDrawer |
      null
    >(
      null,
    );

  const [
    drawerLoadFailed,
    setDrawerLoadFailed,
  ] =
    useState(
      false,
    );

  const drawerRequest =
    useRef<
      Promise<CartDrawerModule> |
      null
    >(
      null,
    );

  const itemCount =
    useMemo(
      () =>
        state.lines.reduce(
          (
            total,
            line,
          ) =>
            total +
            line.quantity,
          0,
        ),
      [
        state.lines,
      ],
    );

  const prepareDrawer =
    useCallback(
      (): void => {
        if (
          DrawerComponent ||
          drawerRequest.current ||
          drawerLoadFailed
        ) {
          return;
        }

        const request =
          import('./CartDrawer');

        drawerRequest.current =
          request;

        void request
          .then(
            (
              module,
            ) => {
              setDrawerComponent(
                () =>
                  module.default,
              );
            },
          )
          .catch(
            () => {
              drawerRequest.current =
                null;

              setDrawerLoadFailed(
                true,
              );
            },
          );
      },
      [
        DrawerComponent,
        drawerLoadFailed,
      ],
    );

  useEffect(
    () => {
      if (
        drawerOpen
      ) {
        prepareDrawer();
      }
    },
    [
      drawerOpen,
      prepareDrawer,
    ],
  );

  useEffect(
    () => {
      if (
        !drawerOpen ||
        DrawerComponent
      ) {
        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style
        .overflow =
        'hidden';

      return () => {
        document.body.style
          .overflow =
          previousOverflow;
      };
    },
    [
      drawerOpen,
      DrawerComponent,
    ],
  );

  const itemCountLabel =
    itemCount ===
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
        );

  const viewCartLabel =
    locale ===
    'es'
      ? `Ver carrito de compras, ${itemCount} ${itemCountLabel}`
      : `View shopping cart, ${itemCount} ${itemCountLabel}`;

  useEffect(
    () => {
      document
        .querySelectorAll<HTMLElement>(
          '[data-cart-count]',
        )
        .forEach(
          (
            element,
          ) => {
            element.textContent =
              String(
                itemCount,
              );
          },
        );

      document
        .querySelectorAll<HTMLElement>(
          '[data-cart-link]',
        )
        .forEach(
          (
            element,
          ) => {
            element.setAttribute(
              'aria-label',
              viewCartLabel,
            );
          },
        );
    },
    [
      itemCount,
      viewCartLabel,
    ],
  );

  const handleOpenCart =
    (): void => {
      prepareDrawer();

      openCartDrawer();
    };

  return (
    <>
      <button
        type="button"
        className="relative flex min-h-10 items-center gap-1.5 rounded-full border border-accent-300 bg-accent-50 px-2.5 py-1.5 text-sm font-extrabold text-accent-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent-500 hover:bg-accent-100 sm:px-3"
        aria-label={
          locale ===
          'es'
            ? `Abrir carrito de compras, ${itemCount} ${itemCountLabel}`
            : `Open shopping cart, ${itemCount} ${itemCountLabel}`
        }
        onPointerEnter={prepareDrawer}
        onFocus={prepareDrawer}
        onClick={handleOpenCart}
      >
        <CartIcon />

        <span className="hidden xl:inline">
          {
            commerceText(
              locale,
              'Cart',
              'Carrito',
            )
          }
        </span>

        <span className="grid min-w-5 place-items-center rounded-full bg-accent-500 px-1.5 py-0.5 text-[0.6875rem] leading-none font-black text-ink-950">
          {itemCount}
        </span>
      </button>

      {
        drawerOpen &&
        (
          DrawerComponent
            ? (
                <DrawerComponent
                  locale={locale}
                />
              )
            : (
                <CartDrawerFallback
                  loadFailed={
                    drawerLoadFailed
                  }
                  locale={locale}
                />
              )
        )
      }
    </>
  );
}