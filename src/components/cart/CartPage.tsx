import CheckoutButton from '../checkout/CheckoutButton';

import {
    useMemo,
} from 'preact/hooks';

import CartItem from './CartItem';
import {
    useCart,
} from './useCart';

import {
    clearCart,
} from '../../stores/cart';

import {
    formatCartAmount,
    getCartTotals,
    resolveCartLines,
} from '../../utils/cart';

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

export default function CartPage() {
    const {
        state,
        hydrated,
    } = useCart();

    const resolvedLines = useMemo(
        () => resolveCartLines(state),
        [state],
    );

    const totals = useMemo(
        () =>
            getCartTotals(
                resolvedLines,
            ),
        [resolvedLines],
    );

    if (!hydrated) {
        return (
            <div className="rounded-[2.5rem] border border-sand bg-white-warm p-8 text-center shadow-card">
                <p className="font-bold text-ink-600">
                    Loading your cart…
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
                    Your cart is empty.
                </h2>

                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-600">
                    Add some fictional demo products to test quantities, variants, totals, and persistent cart storage.
                </p>

                <a
                    href="/shop#products"
                    className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-brand-500 px-6 font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600"
                >
                    Browse Demo Products
                </a>
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
                            Shopping Cart
                        </p>

                        <h2
                            id="cart-items-title"
                            className="mt-2 text-2xl text-ink-900 sm:text-3xl"
                        >
                            {totals.itemCount}{' '}
                            {totals.itemCount === 1
                                ? 'item'
                                : 'items'}
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="w-fit rounded-full border border-danger-100 bg-danger-50 px-4 py-2 text-sm font-extrabold text-danger-700 transition hover:bg-danger-100"
                        onClick={() => {
                            const confirmed =
                                window.confirm(
                                    'Remove every item from your cart?',
                                );

                            if (confirmed) {
                                clearCart();
                            }
                        }}
                    >
                        Clear Cart
                    </button>
                </div>

                <div className="mt-5 grid gap-4">
                    {resolvedLines.map(
                        (item) => (
                            <CartItem
                                key={item.key}
                                item={item}
                            />
                        ),
                    )}
                </div>
            </section>

            <aside className="rounded-[2.5rem] border border-brand-200 bg-linear-to-br from-brand-50 via-white-warm to-accent-50 p-5 shadow-card lg:sticky lg:top-28">
                <p className="text-xs font-extrabold tracking-[0.08em] text-brand-700 uppercase">
                    Cart Summary
                </p>

                <h2 className="mt-2 text-2xl text-ink-900">
                    Demo total
                </h2>

                <dl className="mt-6 grid gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <dt className="font-bold text-ink-600">
                            Items
                        </dt>

                        <dd className="font-black text-ink-900">
                            {totals.itemCount}
                        </dd>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-sand pt-4">
                        <dt className="font-bold text-ink-600">
                            Subtotal
                        </dt>

                        <dd className="text-xl font-black text-ink-900">
                            {formatCartAmount(
                                totals.subtotalAmount,
                            )}
                        </dd>
                    </div>

                    {totals.savingsAmount >
                        0 && (
                            <div className="flex items-center justify-between gap-4 text-success-700">
                                <dt className="font-bold">
                                    Demo savings
                                </dt>

                                <dd className="font-black">
                                    −
                                    {formatCartAmount(
                                        totals.savingsAmount,
                                    )}
                                </dd>
                            </div>
                        )}
                </dl>

                {totals.unavailableLineCount >
                    0 && (
                        <p className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-3 text-sm font-bold leading-6 text-ink-700">
                            {totals.unavailableLineCount}{' '}
                            {totals.unavailableLineCount === 1
                                ? 'cart line is'
                                : 'cart lines are'}{' '}
                            currently unavailable and excluded from the subtotal.
                        </p>
                    )}

                {totals.hasDemoItems && (
                    <p className="mt-5 rounded-2xl border border-ink-700 bg-ink-950 p-4 text-sm font-bold leading-6 text-white/80">
                        These products and prices are fictional testing content. This cart cannot create an order or charge a payment method.
                    </p>
                )}

                <div className="mt-5">
                    <CheckoutButton
                        lines={resolvedLines}
                    />
                </div>

                <a
                    href="/shop#products"
                    className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-brand-300 bg-white-warm px-5 font-extrabold text-brand-800 transition hover:bg-brand-100"
                >
                    Continue Shopping
                </a>

                <p className="mt-4 text-center text-xs leading-5 text-ink-500">
                    Shipping, taxes, discounts, and payment processing are not connected.
                </p>
            </aside>
        </div>
    );
}