import {
    useEffect,
    useMemo,
} from 'preact/hooks';

import CartDrawer from './CartDrawer';
import {
    useCart,
} from './useCart';

import {
    openCartDrawer,
} from '../../stores/cart';

import {
    getCartTotals,
    resolveCartLines,
} from '../../utils/cart';

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
            <circle cx="10" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
        </svg>
    );
}

export default function CartButton() {
    const {
        state,
    } = useCart();

    const totals = useMemo(
        () =>
            getCartTotals(
                resolveCartLines(state),
            ),
        [state],
    );

    useEffect(() => {
        document
            .querySelectorAll<HTMLElement>(
                '[data-cart-count]',
            )
            .forEach((element) => {
                element.textContent =
                    String(totals.itemCount);
            });

        document
            .querySelectorAll<HTMLElement>(
                '[data-cart-link]',
            )
            .forEach((element) => {
                element.setAttribute(
                    'aria-label',

                    `View shopping cart, ${totals.itemCount} ${totals.itemCount === 1
                        ? 'item'
                        : 'items'
                    }`,
                );
            });
    }, [totals.itemCount]);

    return (
        <>
            <button
                type="button"
                className="relative flex min-h-10 items-center gap-1.5 rounded-full border border-accent-300 bg-accent-50 px-2.5 py-1.5 text-sm font-extrabold text-accent-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent-500 hover:bg-accent-100 sm:px-3"
                aria-label={`Open shopping cart, ${totals.itemCount} ${totals.itemCount === 1
                        ? 'item'
                        : 'items'
                    }`}
                onClick={openCartDrawer}
            >
                <CartIcon />

                <span className="hidden xl:inline">
                    Cart
                </span>

                <span className="grid min-w-5 place-items-center rounded-full bg-accent-500 px-1.5 py-0.5 text-[0.6875rem] leading-none font-black text-ink-950">
                    {totals.itemCount}
                </span>
            </button>

            <CartDrawer />
        </>
    );
}