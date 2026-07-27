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
    formatCartAmount,
    getCartTotals,
    resolveCartLines,
} from '../../utils/cart';

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
            <circle cx="10" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
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

export default function CartDrawer() {
    const open = useCartDrawer();

    const {
        state,
        hydrated,
    } = useCart();

    const drawerRef =
        useRef<HTMLElement>(null);

    const closeButtonRef =
        useRef<HTMLButtonElement>(null);

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

    useEffect(() => {
        if (!open) {
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            'hidden';

        window.requestAnimationFrame(
            () => {
                closeButtonRef.current?.focus();
            },
        );

        function handleKeydown(
            event: KeyboardEvent,
        ): void {
            if (event.key === 'Escape') {
                closeCartDrawer();
                return;
            }

            if (
                event.key !== 'Tab' ||
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
                focusableElements[0];

            const lastElement =
                focusableElements.at(-1);

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
            document.body.style.overflow =
                previousOverflow;

            document.removeEventListener(
                'keydown',
                handleKeydown,
            );
        };
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[120]"
            role="presentation"
        >
            <button
                type="button"
                className="absolute inset-0 size-full cursor-default border-0 bg-ink-950/50 p-0 backdrop-blur-sm"
                aria-label="Close shopping cart"
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
                                MaxiPawz Cart
                            </p>

                            <h2
                                id="cart-drawer-title"
                                className="mt-1 text-xl text-ink-900"
                            >
                                {totals.itemCount}{' '}
                                {totals.itemCount === 1
                                    ? 'item'
                                    : 'items'}
                            </h2>
                        </div>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        className="grid size-10 place-items-center rounded-full border border-sand bg-cream-soft text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                        aria-label="Close shopping cart"
                        onClick={closeCartDrawer}
                    >
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
                    {!hydrated ? (
                        <div className="rounded-card-lg border border-sand bg-white-warm p-6 text-center shadow-sm">
                            <p className="font-bold text-ink-600">
                                Loading your cart…
                            </p>
                        </div>
                    ) : resolvedLines.length === 0 ? (
                        <div className="rounded-card-lg border border-brand-200 bg-linear-to-br from-brand-50 via-white-warm to-accent-50 p-7 text-center shadow-sm">
                            <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-100 text-brand-700">
                                <CartIcon />
                            </span>

                            <h3 className="mt-5 text-2xl text-ink-900">
                                Your cart is empty.
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-ink-600">
                                Explore the demo catalog and add a few products to test the cart experience.
                            </p>

                            <a
                                href="/shop#products"
                                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-500 px-5 font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600"
                                onClick={closeCartDrawer}
                            >
                                Browse Products
                            </a>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {resolvedLines.map(
                                (item) => (
                                    <CartItem
                                        key={item.key}
                                        item={item}
                                        compact={true}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </div>

                {resolvedLines.length > 0 && (
                    <footer className="shrink-0 border-t border-sand bg-white-warm p-5">
                        {totals.hasDemoItems && (
                            <p className="mb-4 rounded-2xl border border-accent-200 bg-accent-50 p-3 text-xs font-bold leading-5 text-ink-700">
                                This cart contains fictional demo products. No order or payment can be submitted.
                            </p>
                        )}

                        <div className="flex items-center justify-between gap-4">
                            <span className="font-bold text-ink-600">
                                Subtotal
                            </span>

                            <span className="text-2xl font-black text-ink-900">
                                {formatCartAmount(
                                    totals.subtotalAmount,
                                )}
                            </span>
                        </div>

                        {totals.savingsAmount >
                            0 && (
                                <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                                    <span className="font-bold text-success-700">
                                        Demo savings
                                    </span>

                                    <span className="font-black text-success-700">
                                        −
                                        {formatCartAmount(
                                            totals.savingsAmount,
                                        )}
                                    </span>
                                </div>
                            )}

                        <div className="mt-5">
                            <CheckoutButton
                                lines={resolvedLines}
                                compact={true}
                            />
                        </div>

                        <a
                            href="/cart"
                            className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-brand-300 bg-brand-50 px-5 font-extrabold text-brand-800 transition hover:bg-brand-100"
                            onClick={closeCartDrawer}
                        >
                            View Full Cart
                        </a>
                    </footer>
                )}
            </aside>
        </div>
    );
}