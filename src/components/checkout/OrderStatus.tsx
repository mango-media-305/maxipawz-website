import {
  useEffect,
  useRef,
  useState,
} from 'preact/hooks';

import {
  commerceConfig,
} from '../../config/commerce';

import {
  commerceText,
} from '../../i18n/commerce';

import type {
  Locale,
} from '../../i18n/languages';

import {
  localizeHref,
  localizedLinkLabel,
} from '../../i18n/routes';

import {
  clearCart,
} from '../../stores/cart';

import type {
  OrderStatusResponse,
  OrderStatusSuccessResponse,
} from '../../types/order';

import {
  formatCartAmount,
} from '../../utils/cart';

type ViewStatus =
  | 'checking'
  | 'processing'
  | 'confirmed'
  | 'failed'
  | 'not-found'
  | 'invalid'
  | 'error';

interface ViewState {
  status:
    ViewStatus;

  message:
    string;

  order?:
    OrderStatusSuccessResponse;
}

interface Props {
  locale?:
    Locale;
}

const MAXIMUM_STATUS_ATTEMPTS =
  12;

const POLL_DELAY_MS =
  2000;

function isRecord(
  value:
    unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}

function isSuccessResponse(
  value:
    unknown,
): value is OrderStatusSuccessResponse {
  return (
    isRecord(
      value,
    ) &&
    value.ok ===
      true &&
    typeof value.status ===
      'string' &&
    typeof value.amountTotal ===
      'number' &&
    typeof value.itemCount ===
      'number'
  );
}

function StatusIcon({
  status,
}: {
  status:
    ViewStatus;
}) {
  if (
    status ===
      'checking' ||
    status ===
      'processing'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-9 animate-spin"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          className="opacity-25"
        />

        <path
          d="M21 12a9 9 0 0 0-9-9"
          className="opacity-90"
        />
      </svg>
    );
  }

  if (
    status ===
    'confirmed'
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="m8 12 2.5 2.5L16.5 8.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="size-10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v6" />

      <circle
        cx="12"
        cy="17"
        r="1"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function getPresentation(
  viewState:
    ViewState,

  locale:
    Locale,
): {
  eyebrow:
    string;

  title:
    string;

  description:
    string;

  iconClasses:
    string;
} {
  const spanish =
    locale === 'es';

  switch (
    viewState.status
  ) {
    case 'confirmed':
      return {
        eyebrow:
          spanish
            ? 'Pago confirmado'
            : 'Payment Confirmed',

        title:
          viewState.order
            ?.livemode
            ? spanish
              ? 'Tu pago ha sido confirmado.'
              : 'Your payment has been confirmed.'
            : spanish
              ? 'Tu pago de prueba de Stripe ha sido confirmado.'
              : 'Your Stripe test payment has been confirmed.',

        description:
          spanish
            ? 'El webhook firmado de Stripe llegó al sistema de pedidos de Maxi Pawz y el estado del pago fue verificado.'
            : 'The signed Stripe webhook reached the Maxi Pawz order system and the payment status was verified.',

        iconClasses:
          'border-success-100 bg-success-50 text-success-700',
      };

    case 'processing':
      return {
        eyebrow:
          spanish
            ? 'Pago en proceso'
            : 'Payment Processing',

        title:
          spanish
            ? 'Stripe todavía está procesando el pago.'
            : 'Stripe is still processing the payment.',

        description:
          spanish
            ? 'Algunos métodos de pago se completan de forma asíncrona. Esta página continuará comprobando el resultado final.'
            : 'Some payment methods finish asynchronously. This page will continue checking for a final result.',

        iconClasses:
          'border-brand-200 bg-brand-50 text-brand-700',
      };

    case 'failed':
      return {
        eyebrow:
          spanish
            ? 'Pago fallido'
            : 'Payment Failed',

        title:
          spanish
            ? 'El pago no se completó.'
            : 'The payment was not completed.',

        description:
          spanish
            ? 'Stripe informó que el pago diferido no se completó correctamente. Revisa el carrito antes de intentarlo nuevamente.'
            : 'Stripe reported that the delayed payment did not succeed. Review the cart before trying again.',

        iconClasses:
          'border-danger-100 bg-danger-50 text-danger-700',
      };

    case 'not-found':
      return {
        eyebrow:
          spanish
            ? 'Confirmación demorada'
            : 'Confirmation Delayed',

        title:
          spanish
            ? 'La confirmación del pedido todavía no ha llegado.'
            : 'The order confirmation has not arrived yet.',

        description:
          spanish
            ? 'La sesión de Checkout regresó correctamente, pero no encontramos un registro de webhook verificado después de varios intentos.'
            : 'The Checkout Session returned successfully, but no verified webhook record was found after several attempts.',

        iconClasses:
          'border-accent-200 bg-accent-50 text-accent-700',
      };

    case 'invalid':
      return {
        eyebrow:
          spanish
            ? 'Regreso de pago no válido'
            : 'Invalid Checkout Return',

        title:
          spanish
            ? 'El ID de la sesión de Checkout falta o no es válido.'
            : 'The Checkout Session ID is missing or invalid.',

        description:
          spanish
            ? 'Regresa al carrito e inicia nuevamente el proceso de pago desde el sitio web de Maxi Pawz.'
            : 'Return to the cart and begin checkout again from the Maxi Pawz website.',

        iconClasses:
          'border-accent-200 bg-accent-50 text-accent-700',
      };

    case 'error':
      return {
        eyebrow:
          spanish
            ? 'Estado no disponible'
            : 'Status Unavailable',

        title:
          spanish
            ? 'No pudimos verificar el estado del pago.'
            : 'Payment status could not be checked.',

        description:
          spanish
            ? 'No pudimos consultar el estado del pago en este momento. Inténtalo nuevamente o regresa al carrito.'
            : viewState.message,

        iconClasses:
          'border-danger-100 bg-danger-50 text-danger-700',
      };

    default:
      return {
        eyebrow:
          spanish
            ? 'Confirmando el pago'
            : 'Confirming Payment',

        title:
          spanish
            ? 'Estamos verificando la confirmación firmada de Stripe.'
            : 'We are checking the signed Stripe confirmation.',

        description:
          spanish
            ? 'Mantén esta página abierta mientras el sistema de pedidos verifica la sesión de Checkout.'
            : 'Please keep this page open while the order system verifies the Checkout Session.',

        iconClasses:
          'border-brand-200 bg-brand-50 text-brand-700',
      };
  }
}

export default function OrderStatus({
  locale = 'en',
}: Props) {
  const [
    viewState,
    setViewState,
  ] =
    useState<ViewState>({
      status:
        'checking',

      message:
        commerceText(
          locale,
          'Checking payment confirmation.',
          'Verificando la confirmación del pago.',
        ),
    });

  const cartCleared =
    useRef(
      false,
    );

  useEffect(
    () => {
      const sessionId =
        new URLSearchParams(
          window.location.search,
        )
          .get(
            'session_id',
          )
          ?.trim();

      if (
        !sessionId
      ) {
        setViewState({
          status:
            'invalid',

          message:
            commerceText(
              locale,
              'The Checkout Session ID is missing.',
              'Falta el ID de la sesión de Checkout.',
            ),
        });

        return;
      }

      let cancelled =
        false;

      let attempt =
        0;

      let pollTimer:
        number |
        undefined;

      const controller =
        new AbortController();

      function scheduleNextCheck():
        void {
        if (
          cancelled ||
          attempt >=
            MAXIMUM_STATUS_ATTEMPTS
        ) {
          return;
        }

        pollTimer =
          window.setTimeout(
            () => {
              void checkStatus();
            },

            POLL_DELAY_MS,
          );
      }

      async function checkStatus():
        Promise<void> {
        attempt +=
          1;

        try {
          const endpoint =
            new URL(
              commerceConfig
                .orderStatusEndpoint,

              window.location
                .origin,
            );

          endpoint.searchParams.set(
            'session_id',
            sessionId,
          );

          const response =
            await fetch(
              endpoint,

              {
                method:
                  'GET',

                headers: {
                  Accept:
                    'application/json',
                },

                cache:
                  'no-store',

                signal:
                  controller.signal,
              },
            );

          const payload =
            (await response
              .json()
              .catch(
                () =>
                  null,
              )) as
              | OrderStatusResponse
              | null;

          if (
            response.status ===
            404
          ) {
            if (
              attempt <
              MAXIMUM_STATUS_ATTEMPTS
            ) {
              setViewState({
                status:
                  'checking',

                message:
                  commerceText(
                    locale,
                    'Waiting for the Stripe webhook.',
                    'Esperando el webhook de Stripe.',
                  ),
              });

              scheduleNextCheck();

              return;
            }

            setViewState({
              status:
                'not-found',

              message:
                commerceText(
                  locale,
                  'No verified order record was found.',
                  'No encontramos un registro de pedido verificado.',
                ),
            });

            return;
          }

          if (
            !response.ok ||
            !isSuccessResponse(
              payload,
            )
          ) {
            throw new Error(
              locale ===
                'en' &&
              isRecord(
                payload,
              ) &&
              typeof payload.message ===
                'string'
                ? payload.message
                : commerceText(
                    locale,
                    'Payment status could not be checked.',
                    'No pudimos verificar el estado del pago.',
                  ),
            );
          }

          if (
            payload.status ===
            'confirmed'
          ) {
            if (
              payload.clearCart &&
              !cartCleared.current
            ) {
              cartCleared.current =
                true;

              clearCart();
            }

            setViewState({
              status:
                'confirmed',

              message:
                commerceText(
                  locale,
                  'Payment confirmed.',
                  'Pago confirmado.',
                ),

              order:
                payload,
            });

            return;
          }

          if (
            payload.status ===
            'failed'
          ) {
            setViewState({
              status:
                'failed',

              message:
                commerceText(
                  locale,
                  'Payment failed.',
                  'El pago falló.',
                ),

              order:
                payload,
            });

            return;
          }

          setViewState({
            status:
              'processing',

            message:
              commerceText(
                locale,
                'Payment is still processing.',
                'El pago todavía está siendo procesado.',
              ),

            order:
              payload,
          });

          if (
            attempt <
            MAXIMUM_STATUS_ATTEMPTS
          ) {
            scheduleNextCheck();
          }
        } catch (
          error
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }

          setViewState({
            status:
              'error',

            message:
              locale ===
                'en' &&
              error instanceof
                Error
                ? error.message
                : commerceText(
                    locale,
                    'Payment status could not be checked.',
                    'No pudimos verificar el estado del pago.',
                  ),
          });
        }
      }

      void checkStatus();

      return () => {
        cancelled =
          true;

        controller.abort();

        if (
          pollTimer
        ) {
          window.clearTimeout(
            pollTimer,
          );
        }
      };
    },
    [
      locale,
    ],
  );

  const presentation =
    getPresentation(
      viewState,
      locale,
    );

  const cartHref =
    localizeHref(
      '/cart',
      locale,
    );

  const shopSourceHref =
    '/shop#products';

  const shopHref =
    localizeHref(
      shopSourceHref,
      locale,
    );

  const shopLabel =
    localizedLinkLabel(
      commerceText(
        locale,
        'Continue Shopping',
        'Seguir comprando',
      ),
      shopSourceHref,
      locale,
    );

  return (
    <section className="py-10 sm:py-14 lg:py-18">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-[2.75rem] border border-brand-200 bg-linear-to-br from-brand-50 via-white-warm to-accent-50 p-6 text-center shadow-card sm:p-10 lg:p-14">
          <div
            className="pointer-events-none absolute -top-28 -left-24 size-80 rounded-full bg-brand-300/25 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -right-24 -bottom-28 size-80 rounded-full bg-accent-300/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-3xl">
            <span
              className={[
                'mx-auto grid size-20 place-items-center rounded-full border shadow-soft',
                presentation
                  .iconClasses,
              ].join(
                ' ',
              )}
              aria-hidden="true"
            >
              <StatusIcon
                status={
                  viewState.status
                }
              />
            </span>

            <p className="mt-6 text-sm font-extrabold tracking-[0.09em] text-brand-700 uppercase">
              {
                presentation
                  .eyebrow
              }
            </p>

            <h1 className="mt-4 text-4xl text-ink-900 sm:text-5xl lg:text-6xl">
              {
                presentation
                  .title
              }
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-ink-600">
              {
                presentation
                  .description
              }
            </p>

            {
              viewState.order && (
                <dl className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
                  <div className="rounded-2xl border border-sand bg-white-warm p-4">
                    <dt className="text-xs font-extrabold tracking-[0.08em] text-ink-500 uppercase">
                      {
                        commerceText(
                          locale,
                          'Amount',
                          'Importe',
                        )
                      }
                    </dt>

                    <dd className="mt-2 text-xl font-black text-ink-900">
                      {
                        formatCartAmount(
                          viewState
                            .order
                            .amountTotal,

                          viewState
                            .order
                            .currency
                            .toUpperCase(),

                          locale,
                        )
                      }
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-sand bg-white-warm p-4">
                    <dt className="text-xs font-extrabold tracking-[0.08em] text-ink-500 uppercase">
                      {
                        commerceText(
                          locale,
                          'Items',
                          'Productos',
                        )
                      }
                    </dt>

                    <dd className="mt-2 text-xl font-black text-ink-900">
                      {
                        viewState
                          .order
                          .itemCount
                      }
                    </dd>
                  </div>
                </dl>
              )
            }

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={cartHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-600 bg-brand-500 px-6 font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600"
              >
                {
                  commerceText(
                    locale,
                    'Return to Cart',
                    'Volver al carrito',
                  )
                }
              </a>

              <a
                href={shopHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-300 bg-white-warm px-6 font-extrabold text-brand-800 transition hover:bg-brand-50"
              >
                {shopLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}