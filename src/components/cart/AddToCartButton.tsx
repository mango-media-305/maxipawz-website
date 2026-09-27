import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'preact/hooks';

import BackInStockForm from '../products/BackInStockForm';

import QuantityControl from './QuantityControl';

import {
    useCart,
} from './useCart';

import {
    useProductInventory,
} from './useProductInventory';

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
    addCartLine,
    openCartDrawer,
} from '../../stores/cart';

import {
    formatProductPrice,
    getAvailabilityLabel,
    getProductBySlug,
} from '../../utils/products';

import {
    getEffectiveProductAvailability,
    isInventoryTrackingEnabledForSelection,
} from '../../utils/product-inventory';

interface Props {
    productSlug:
    string;

    mode?:
    | 'card'
    | 'detail';

    locale?:
    Locale;
}

function CartIcon() {
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

export default function AddToCartButton({
    productSlug,
    mode = 'card',
    locale = 'en',
}: Props) {
    const product =
        getProductBySlug(
            productSlug,
            locale,
        );

    const {
        state:
        cartState,
    } =
        useCart();

    const [
        selectedVariantId,
        setSelectedVariantId,
    ] =
        useState('');

    const [
        quantity,
        setQuantity,
    ] =
        useState(
            1,
        );

    const [
        message,
        setMessage,
    ] =
        useState('');

    const messageTimer =
        useRef<number>();

    const variants =
        product?.variants ??
        [];

    const hasVariants =
        variants.length >
        0;

    const selectedVariant =
        useMemo(
            () =>
                variants.find(
                    (
                        variant,
                    ) =>
                        variant.id ===
                        selectedVariantId,
                ),
            [
                variants,
                selectedVariantId,
            ],
        );

    const needsVariantSelection =
        Boolean(
            product &&
            hasVariants &&
            !selectedVariant,
        );

    const effectiveAvailability =
        product
            ? getEffectiveProductAvailability(
                product,
                selectedVariant,
            )
            : undefined;

    const effectivePrice =
        selectedVariant
            ?.price ??
        product?.price;

    const inventoryTrackingEnabled =
        Boolean(
            product &&
            !needsVariantSelection &&
            isInventoryTrackingEnabledForSelection(
                product,
                selectedVariant,
            ),
        );

    const inventoryLookupEnabled =
        Boolean(
            product &&
            !needsVariantSelection &&
            effectiveAvailability ===
            'in-stock' &&
            inventoryTrackingEnabled,
        );

    const inventoryLookup =
        useProductInventory({
            productSlug,

            variantId:
                selectedVariant
                    ?.id,

            enabled:
                inventoryLookupEnabled,
        });

    const existingCartQuantity =
        useMemo(
            () => {
                if (
                    !product
                ) {
                    return 0;
                }

                return (
                    cartState.lines.find(
                        (
                            line,
                        ) =>
                            line.productSlug ===
                            product.slug &&
                            line.variantId ===
                            selectedVariant
                                ?.id,
                    )?.quantity ??
                    0
                );
            },
            [
                cartState,
                product,
                selectedVariant,
            ],
        );

    const remainingCartCapacity =
        Math.max(
            0,
            99 -
            existingCartQuantity,
        );

    const liveAvailable =
        inventoryLookup.status ===
            'ready'
            ? (
                inventoryLookup
                    .inventory
                    ?.available ??
                null
            )
            : null;

    const remainingInventoryCapacity =
        inventoryTrackingEnabled
            ? liveAvailable ===
                null
                ? 0
                : Math.max(
                    0,
                    liveAvailable -
                    existingCartQuantity,
                )
            : remainingCartCapacity;

    const maxSelectableQuantity =
        Math.min(
            remainingCartCapacity,
            remainingInventoryCapacity,
        );

    useEffect(
        () => {
            return () => {
                if (
                    messageTimer.current
                ) {
                    window.clearTimeout(
                        messageTimer.current,
                    );
                }
            };
        },
        [],
    );

    useEffect(
        () => {
            if (
                maxSelectableQuantity >
                0
            ) {
                if (
                    quantity >
                    maxSelectableQuantity
                ) {
                    setQuantity(
                        maxSelectableQuantity,
                    );
                }

                return;
            }

            if (
                quantity !==
                1
            ) {
                setQuantity(
                    1,
                );
            }
        },
        [
            maxSelectableQuantity,
            quantity,
        ],
    );

    if (
        !product
    ) {
        return null;
    }

    if (
        mode ===
        'card' &&
        hasVariants
    ) {
        return (
            <a
                href={localizeHref(
                    `/shop/${product.slug}`,
                    locale,
                )}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-brand-300 bg-brand-50 px-4 text-sm font-extrabold text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-100"
            >
                {
                    commerceText(
                        locale,
                        'Choose Options',
                        'Elegir opciones',
                    )
                }
            </a>
        );
    }

    const inventoryConfirmed =
        !inventoryTrackingEnabled ||
        (
            inventoryLookup.status ===
            'ready' &&
            inventoryLookup
                .inventory
                ?.tracked ===
            true
        );

    const inventoryCanPurchase =
        !inventoryTrackingEnabled ||
        Boolean(
            inventoryLookup
                .inventory
                ?.canPurchase &&
            liveAvailable !==
            null &&
            liveAvailable >
            0,
        );

    const isRuntimeSoldOut =
        inventoryTrackingEnabled &&
        effectiveAvailability ===
        'in-stock' &&
        inventoryLookup.status ===
        'ready' &&
        inventoryLookup
            .inventory
            ?.tracked ===
        true &&
        (
            inventoryLookup
                .inventory
                .status ===
            'sold-out' ||
            liveAvailable ===
            0
        );

    const canAdd =
        !needsVariantSelection &&
        effectiveAvailability ===
        'in-stock' &&
        Boolean(
            effectivePrice,
        ) &&
        inventoryConfirmed &&
        inventoryCanPurchase &&
        maxSelectableQuantity >
        0 &&
        quantity <=
        maxSelectableQuantity;

    let stockMessage =
        '';

    let stockMessageClass =
        'text-ink-600';

    if (
        needsVariantSelection
    ) {
        stockMessage =
            commerceText(
                locale,
                'Select an option to check availability.',
                'Selecciona una opción para comprobar la disponibilidad.',
            );
    } else if (
        effectiveAvailability &&
        effectiveAvailability !==
        'in-stock'
    ) {
        stockMessage =
            getAvailabilityLabel(
                effectiveAvailability,
                locale,
            );
    } else if (
        inventoryTrackingEnabled
    ) {
        if (
            inventoryLookup.status ===
            'loading'
        ) {
            stockMessage =
                commerceText(
                    locale,
                    'Checking live stock…',
                    'Verificando inventario…',
                );
        } else if (
            inventoryLookup.status ===
            'error'
        ) {
            stockMessage =
                commerceText(
                    locale,
                    'Stock temporarily unavailable.',
                    'Inventario temporalmente no disponible.',
                );

            stockMessageClass =
                'text-danger-700';
        } else if (
            inventoryLookup.status ===
            'ready' &&
            inventoryLookup.inventory
        ) {
            if (
                inventoryLookup
                    .inventory
                    .status ===
                'sold-out' ||
                liveAvailable ===
                0
            ) {
                stockMessage =
                    commerceText(
                        locale,
                        'Sold out',
                        'Agotado',
                    );

                stockMessageClass =
                    'text-danger-700';
            } else if (
                inventoryLookup
                    .inventory
                    .status ===
                'low-stock' &&
                liveAvailable !==
                null
            ) {
                stockMessage =
                    liveAvailable ===
                        1
                        ? commerceText(
                            locale,
                            'Only 1 left in stock',
                            'Solo queda 1 unidad',
                        )
                        : locale ===
                            'es'
                            ? `Solo quedan ${liveAvailable} unidades`
                            : `Only ${liveAvailable} left in stock`;

                stockMessageClass =
                    'text-accent-800';
            } else {
                stockMessage =
                    commerceText(
                        locale,
                        'In stock',
                        'Disponible',
                    );

                stockMessageClass =
                    'text-success-700';
            }
        }
    } else if (
        effectiveAvailability ===
        'in-stock'
    ) {
        stockMessage =
            commerceText(
                locale,
                'In stock',
                'Disponible',
            );

        stockMessageClass =
            'text-success-700';
    }

    const baseButtonLabel =
        product.isDemo
            ? commerceText(
                locale,
                'Add Demo Item',
                'Agregar producto de demostración',
            )
            : commerceText(
                locale,
                'Add to Cart',
                'Agregar al carrito',
            );

    let buttonLabel =
        baseButtonLabel;

    if (
        needsVariantSelection
    ) {
        buttonLabel =
            commerceText(
                locale,
                'Select an Option',
                'Selecciona una opción',
            );
    } else if (
        effectiveAvailability &&
        effectiveAvailability !==
        'in-stock'
    ) {
        buttonLabel =
            getAvailabilityLabel(
                effectiveAvailability,
                locale,
            );
    } else if (
        !effectivePrice
    ) {
        buttonLabel =
            commerceText(
                locale,
                'Price Unavailable',
                'Precio no disponible',
            );
    } else if (
        inventoryTrackingEnabled &&
        inventoryLookup.status ===
        'loading'
    ) {
        buttonLabel =
            commerceText(
                locale,
                'Checking Stock…',
                'Verificando inventario…',
            );
    } else if (
        inventoryTrackingEnabled &&
        inventoryLookup.status ===
        'error'
    ) {
        buttonLabel =
            commerceText(
                locale,
                'Stock Unavailable',
                'Inventario no disponible',
            );
    } else if (
        isRuntimeSoldOut
    ) {
        buttonLabel =
            commerceText(
                locale,
                'Sold Out',
                'Agotado',
            );
    } else if (
        maxSelectableQuantity ===
        0
    ) {
        buttonLabel =
            commerceText(
                locale,
                'Maximum in Cart',
                'Máximo en el carrito',
            );
    }

    function handleAdd():
        void {
        if (
            !canAdd
        ) {
            return;
        }

        addCartLine(
            product.slug,
            {
                variantId:
                    selectedVariant
                        ?.id,

                quantity,
            },
        );

        (
            window as Window & {
                posthog?: {
                    capture: (
                        event:
                            string,

                        properties?:
                            Record<
                                string,
                                string |
                                number |
                                boolean
                            >,
                    ) => void;
                };
            }
        ).posthog?.capture(
            'cart_item_added',
            {
                product_slug:
                    productSlug,

                variant_id:
                    selectedVariant
                        ?.id ??
                    'default',

                quantity,

                is_demo_product:
                    Boolean(
                        product.isDemo,
                    ),
            },
        );

        setMessage(
            locale ===
                'es'
                ? quantity ===
                    1
                    ? `${product.name} se agregó a tu carrito.`
                    : `${quantity} × ${product.name} se agregaron a tu carrito.`
                : quantity ===
                    1
                    ? `${product.name} added to your cart.`
                    : `${quantity} × ${product.name} added to your cart.`,
        );

        if (
            messageTimer.current
        ) {
            window.clearTimeout(
                messageTimer.current,
            );
        }

        messageTimer.current =
            window.setTimeout(
                () => {
                    setMessage('');
                },
                3000,
            );

        openCartDrawer();
    }

    if (
        mode ===
        'card'
    ) {
        return (
            <div>
                {stockMessage && (
                    <p
                        className={`mb-2 min-h-5 text-center text-xs font-extrabold ${stockMessageClass}`}
                        aria-live="polite"
                    >
                        {stockMessage}
                    </p>
                )}

                <button
                    type="button"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-brand-600 bg-brand-500 px-4 text-sm font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-sand-dark disabled:bg-sand disabled:text-ink-500 disabled:shadow-none"
                    disabled={!canAdd}
                    onClick={handleAdd}
                >
                    <CartIcon />

                    {buttonLabel}
                </button>

                <p
                    className="mt-2 min-h-5 text-center text-xs font-bold text-success-700"
                    aria-live="polite"
                >
                    {message}
                </p>
            </div>
        );
    }

    return (
        <div className="mt-6 rounded-card border border-brand-200 bg-brand-50/70 p-4 sm:p-5">
            {hasVariants && (
                <div>
                    <label
                        htmlFor={`product-option-${product.slug}`}
                        className="block text-sm font-extrabold text-ink-800"
                    >
                        {
                            commerceText(
                                locale,
                                'Choose an option',
                                'Elige una opción',
                            )
                        }
                    </label>

                    <select
                        id={`product-option-${product.slug}`}
                        className="form-control mt-2"
                        value={selectedVariantId}
                        onChange={(
                            event,
                        ) => {
                            setSelectedVariantId(
                                event.currentTarget
                                    .value,
                            );

                            setQuantity(
                                1,
                            );

                            setMessage(
                                '',
                            );
                        }}
                    >
                        <option value="">
                            {
                                commerceText(
                                    locale,
                                    'Select an option',
                                    'Selecciona una opción',
                                )
                            }
                        </option>

                        {variants.map(
                            (
                                variant,
                            ) => {
                                const availability =
                                    getEffectiveProductAvailability(
                                        product,
                                        variant,
                                    );

                                const price =
                                    variant.price ??
                                    product.price;

                                const unavailable =
                                    availability !==
                                    'in-stock';

                                return (
                                    <option
                                        key={variant.id}
                                        value={variant.id}
                                        disabled={unavailable}
                                    >
                                        {variant.label}

                                        {price
                                            ? ` — ${formatProductPrice(
                                                price,
                                                locale,
                                            )}`
                                            : ''}

                                        {unavailable
                                            ? ` — ${getAvailabilityLabel(
                                                availability,
                                                locale,
                                            )}`
                                            : ''}
                                    </option>
                                );
                            },
                        )}
                    </select>
                </div>
            )}

            {selectedVariant
                ?.price && (
                    <p className="mt-3 text-sm font-bold text-ink-600">
                        {
                            commerceText(
                                locale,
                                'Selected price:',
                                'Precio seleccionado:',
                            )
                        }{' '}

                        <span className="font-black text-ink-900">
                            {
                                formatProductPrice(
                                    selectedVariant.price,
                                    locale,
                                )
                            }
                        </span>
                    </p>
                )}

            {isRuntimeSoldOut ? (
                <BackInStockForm
                    productSlug={product.slug}
                    variantId={
                        selectedVariant
                            ?.id
                    }
                    productName={product.name}
                    variantLabel={
                        selectedVariant
                            ?.label
                    }
                    locale={locale}
                />
            ) : (
                <>
                    {stockMessage && (
                        <div className="mt-4 rounded-2xl border border-sand bg-white-warm px-4 py-3">
                            <p
                                className={`text-sm font-extrabold ${stockMessageClass}`}
                                aria-live="polite"
                            >
                                {stockMessage}
                            </p>

                            {inventoryTrackingEnabled &&
                                liveAvailable !==
                                null &&
                                existingCartQuantity >
                                0 &&
                                liveAvailable >
                                0 && (
                                    <p className="mt-1 text-xs font-bold leading-5 text-ink-500">
                                        {
                                            locale ===
                                                'es'
                                                ? `Actualmente tienes ${existingCartQuantity} en tu carrito.`
                                                : `You currently have ${existingCartQuantity} in your cart.`
                                        }
                                    </p>
                                )}
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <QuantityControl
                            quantity={quantity}
                            disableIncrease={
                                !canAdd ||
                                quantity >=
                                maxSelectableQuantity
                            }
                            onDecrease={() =>
                                setQuantity(
                                    Math.max(
                                        1,
                                        quantity -
                                        1,
                                    ),
                                )
                            }
                            onIncrease={() =>
                                setQuantity(
                                    Math.min(
                                        maxSelectableQuantity,
                                        quantity +
                                        1,
                                    ),
                                )
                            }
                            locale={locale}
                            label={
                                locale ===
                                    'es'
                                    ? `Cantidad de ${product.name}`
                                    : `Quantity for ${product.name}`
                            }
                        />

                        <button
                            type="button"
                            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-brand-600 bg-brand-500 px-5 font-extrabold text-white shadow-blue transition hover:-translate-y-0.5 hover:bg-brand-600 disabled:cursor-not-allowed disabled:border-sand-dark disabled:bg-sand disabled:text-ink-500 disabled:shadow-none"
                            disabled={!canAdd}
                            onClick={handleAdd}
                        >
                            <CartIcon />

                            {buttonLabel}
                        </button>
                    </div>

                    <p
                        className="mt-3 min-h-5 text-sm font-bold text-success-700"
                        aria-live="polite"
                    >
                        {message}
                    </p>
                </>
            )}
        </div>
    );
}