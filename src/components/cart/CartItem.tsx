import QuantityControl from './QuantityControl';

import {
    removeCartLine,
    setCartLineQuantity,
} from '../../stores/cart';

import type {
    ResolvedCartLine,
} from '../../types/cart';

import {
    formatCartAmount,
    getProductImageSource,
} from '../../utils/cart';

interface Props {
    item: ResolvedCartLine;
    compact?: boolean;
}

function PawIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-7"
            fill="currentColor"
            aria-hidden="true"
        >
            <circle cx="6.5" cy="7" r="2.5" />
            <circle cx="12" cy="5.5" r="2.5" />
            <circle cx="17.5" cy="7" r="2.5" />
            <circle cx="19" cy="12" r="2.2" />

            <path d="M12 10c-4 0-7 3.2-7 6.2 0 2.1 1.6 3.8 3.8 3.8 1.2 0 2.2-.5 3.2-1.3 1 .8 2 1.3 3.2 1.3 2.2 0 3.8-1.7 3.8-3.8C19 13.2 16 10 12 10Z" />
        </svg>
    );
}

export default function CartItem({
    item,
    compact = false,
}: Props) {
    const {
        line,
        product,
        variant,
        unitPrice,
        lineTotalAmount,
        compareAtLineTotalAmount,
        available,
        issue,
    } = item;

    const imageSource =
        getProductImageSource(
            item.image,
        );

    const productName =
        product?.name ??
        'Unavailable product';

    const productHref = product
        ? `/shop/${product.slug}`
        : undefined;

    const hasSavings =
        compareAtLineTotalAmount >
        lineTotalAmount;

    function changeQuantity(
        nextQuantity: number,
    ): void {
        setCartLineQuantity(
            line.productSlug,
            line.variantId,
            nextQuantity,
        );
    }

    function removeItem(): void {
        removeCartLine(
            line.productSlug,
            line.variantId,
        );
    }

    return (
        <article
            className={`rounded-card border border-sand bg-white-warm shadow-sm ${compact
                    ? 'p-3'
                    : 'p-4 sm:p-5'
                }`}
        >
            <div
                className={`grid items-start ${compact
                        ? 'grid-cols-[4.5rem_minmax(0,1fr)] gap-3'
                        : 'grid-cols-[5.5rem_minmax(0,1fr)] gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]'
                    }`}
            >
                {productHref ? (
                    <a
                        href={productHref}
                        className="aspect-square overflow-hidden rounded-2xl border border-sand bg-cream-soft"
                        aria-label={`View ${productName}`}
                    >
                        {imageSource ? (
                            <img
                                src={imageSource}
                                alt={
                                    item.image?.alt ??
                                    productName
                                }
                                className="size-full object-cover"
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <span className="grid size-full place-items-center text-brand-500">
                                <PawIcon />
                            </span>
                        )}
                    </a>
                ) : (
                    <div className="grid aspect-square place-items-center rounded-2xl border border-sand bg-cream-soft text-brand-500">
                        <PawIcon />
                    </div>
                )}

                <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            {productHref ? (
                                <a
                                    href={productHref}
                                    className={`font-black text-ink-900 transition hover:text-brand-700 ${compact
                                            ? 'text-sm'
                                            : 'text-lg'
                                        }`}
                                >
                                    {productName}
                                </a>
                            ) : (
                                <h3
                                    className={`font-black text-ink-900 ${compact
                                            ? 'text-sm'
                                            : 'text-lg'
                                        }`}
                                >
                                    {productName}
                                </h3>
                            )}

                            {variant && (
                                <p className="mt-1 text-xs font-bold text-ink-500">
                                    Option: {variant.label}
                                </p>
                            )}

                            {product?.isDemo && (
                                <span className="mt-2 inline-flex rounded-full bg-ink-950 px-2.5 py-1 text-[0.6875rem] font-extrabold text-white">
                                    Demo item
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            className="shrink-0 rounded-full px-2 py-1 text-xs font-extrabold text-danger-700 transition hover:bg-danger-50"
                            onClick={removeItem}
                        >
                            Remove
                        </button>
                    </div>

                    {issue && (
                        <p className="mt-3 rounded-xl border border-accent-200 bg-accent-50 px-3 py-2 text-xs font-bold leading-5 text-ink-700">
                            {issue}
                        </p>
                    )}

                    <div
                        className={`mt-4 flex gap-3 ${compact
                                ? 'flex-col items-start'
                                : 'flex-col sm:flex-row sm:items-end sm:justify-between'
                            }`}
                    >
                        <QuantityControl
                            quantity={line.quantity}
                            compact={compact}
                            disableIncrease={!available}
                            onDecrease={() =>
                                changeQuantity(
                                    line.quantity - 1,
                                )
                            }
                            onIncrease={() =>
                                changeQuantity(
                                    line.quantity + 1,
                                )
                            }
                            label={`Quantity for ${productName}`}
                        />

                        <div
                            className={
                                compact
                                    ? 'text-left'
                                    : 'text-left sm:text-right'
                            }
                        >
                            {unitPrice ? (
                                <>
                                    <p className="text-xs font-bold text-ink-500">
                                        {formatCartAmount(
                                            unitPrice.amount,
                                            unitPrice.currency,
                                        )}{' '}
                                        each
                                    </p>

                                    <div className="mt-1 flex flex-wrap items-baseline gap-2 sm:justify-end">
                                        <p className="font-black text-ink-900">
                                            {formatCartAmount(
                                                lineTotalAmount,
                                                unitPrice.currency,
                                            )}
                                        </p>

                                        {hasSavings && (
                                            <span className="text-xs font-bold text-ink-400 line-through">
                                                {formatCartAmount(
                                                    compareAtLineTotalAmount,
                                                    unitPrice.currency,
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm font-extrabold text-ink-500">
                                    Price unavailable
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}