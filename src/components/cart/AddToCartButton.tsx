import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import QuantityControl from './QuantityControl';

import { useCart } from './useCart';

import { useProductInventory } from './useProductInventory';

import { addCartLine, openCartDrawer } from '../../stores/cart';

import { formatProductPrice, getAvailabilityLabel, getProductBySlug } from '../../utils/products';

import {
  getEffectiveProductAvailability,
  isInventoryTrackingEnabledForSelection,
} from '../../utils/product-inventory';

interface Props {
  productSlug: string;
  mode?: 'card' | 'detail';
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

      <circle cx="10" cy="20" r="1.5" />

      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

export default function AddToCartButton({ productSlug, mode = 'card' }: Props) {
  const product = getProductBySlug(productSlug);

  const { state: cartState } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState('');

  const [quantity, setQuantity] = useState(1);

  const [message, setMessage] = useState('');

  const messageTimer = useRef<number>();

  const variants = product?.variants ?? [];

  const hasVariants = variants.length > 0;

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId),
    [variants, selectedVariantId],
  );

  const needsVariantSelection = Boolean(product && hasVariants && !selectedVariant);

  const effectiveAvailability = product
    ? getEffectiveProductAvailability(product, selectedVariant)
    : undefined;

  const effectivePrice = selectedVariant?.price ?? product?.price;

  const inventoryTrackingEnabled = Boolean(
    product &&
      !needsVariantSelection &&
      isInventoryTrackingEnabledForSelection(product, selectedVariant),
  );

  const inventoryLookupEnabled = Boolean(
    product &&
      !needsVariantSelection &&
      effectiveAvailability === 'in-stock' &&
      inventoryTrackingEnabled,
  );

  const inventoryLookup = useProductInventory({
    productSlug,

    variantId: selectedVariant?.id,

    enabled: inventoryLookupEnabled,
  });

  const existingCartQuantity = useMemo(() => {
    if (!product) {
      return 0;
    }

    return (
      cartState.lines.find(
        (line) => line.productSlug === product.slug && line.variantId === selectedVariant?.id,
      )?.quantity ?? 0
    );
  }, [cartState, product, selectedVariant]);

  const remainingCartCapacity = Math.max(0, 99 - existingCartQuantity);

  const liveAvailable =
    inventoryLookup.status === 'ready' ? (inventoryLookup.inventory?.available ?? null) : null;

  const remainingInventoryCapacity = inventoryTrackingEnabled
    ? liveAvailable === null
      ? 0
      : Math.max(0, liveAvailable - existingCartQuantity)
    : remainingCartCapacity;

  const maxSelectableQuantity = Math.min(remainingCartCapacity, remainingInventoryCapacity);

  useEffect(() => {
    return () => {
      if (messageTimer.current) {
        window.clearTimeout(messageTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (maxSelectableQuantity > 0) {
      if (quantity > maxSelectableQuantity) {
        setQuantity(maxSelectableQuantity);
      }

      return;
    }

    if (quantity !== 1) {
      setQuantity(1);
    }
  }, [maxSelectableQuantity, quantity]);

  if (!product) {
    return null;
  }

  if (mode === 'card' && hasVariants) {
    return (
      <a
        href={`/shop/${product.slug}`}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-brand-300 bg-brand-50 px-4 text-sm font-extrabold text-brand-800 transition hover:-translate-y-0.5 hover:bg-brand-100"
      >
        Choose Options
      </a>
    );
  }

  const inventoryConfirmed =
    !inventoryTrackingEnabled ||
    (inventoryLookup.status === 'ready' && inventoryLookup.inventory?.tracked === true);

  const inventoryCanPurchase =
    !inventoryTrackingEnabled ||
    Boolean(inventoryLookup.inventory?.canPurchase && liveAvailable !== null && liveAvailable > 0);

  const canAdd =
    !needsVariantSelection &&
    effectiveAvailability === 'in-stock' &&
    Boolean(effectivePrice) &&
    inventoryConfirmed &&
    inventoryCanPurchase &&
    maxSelectableQuantity > 0 &&
    quantity <= maxSelectableQuantity;

  let stockMessage = '';

  let stockMessageClass = 'text-ink-600';

  if (needsVariantSelection) {
    stockMessage = 'Select an option to check availability.';
  } else if (effectiveAvailability && effectiveAvailability !== 'in-stock') {
    stockMessage = getAvailabilityLabel(effectiveAvailability);
  } else if (inventoryTrackingEnabled) {
    if (inventoryLookup.status === 'loading') {
      stockMessage = 'Checking live stock…';
    } else if (inventoryLookup.status === 'error') {
      stockMessage = 'Stock temporarily unavailable.';

      stockMessageClass = 'text-danger-700';
    } else if (inventoryLookup.status === 'ready' && inventoryLookup.inventory) {
      if (inventoryLookup.inventory.status === 'sold-out' || liveAvailable === 0) {
        stockMessage = 'Sold out';

        stockMessageClass = 'text-danger-700';
      } else if (inventoryLookup.inventory.status === 'low-stock' && liveAvailable !== null) {
        stockMessage =
          liveAvailable === 1 ? 'Only 1 left in stock' : `Only ${liveAvailable} left in stock`;

        stockMessageClass = 'text-accent-800';
      } else {
        stockMessage = 'In stock';

        stockMessageClass = 'text-success-700';
      }
    }
  } else if (effectiveAvailability === 'in-stock') {
    stockMessage = 'In stock';

    stockMessageClass = 'text-success-700';
  }

  const baseButtonLabel = product.isDemo ? 'Add Demo Item' : 'Add to Cart';

  let buttonLabel = baseButtonLabel;

  if (needsVariantSelection) {
    buttonLabel = 'Select an Option';
  } else if (effectiveAvailability !== 'in-stock') {
    buttonLabel = getAvailabilityLabel(effectiveAvailability);
  } else if (!effectivePrice) {
    buttonLabel = 'Price Unavailable';
  } else if (inventoryTrackingEnabled && inventoryLookup.status === 'loading') {
    buttonLabel = 'Checking Stock…';
  } else if (inventoryTrackingEnabled && inventoryLookup.status === 'error') {
    buttonLabel = 'Stock Unavailable';
  } else if (
    inventoryTrackingEnabled &&
    (inventoryLookup.inventory?.status === 'sold-out' || liveAvailable === 0)
  ) {
    buttonLabel = 'Sold Out';
  } else if (maxSelectableQuantity === 0) {
    buttonLabel = 'Maximum in Cart';
  }

  function handleAdd(): void {
    if (!canAdd) {
      return;
    }

    addCartLine(product.slug, {
      variantId: selectedVariant?.id,

      quantity,
    });

    setMessage(
      quantity === 1
        ? `${product.name} added to your cart.`
        : `${quantity} × ${product.name} added to your cart.`,
    );

    if (messageTimer.current) {
      window.clearTimeout(messageTimer.current);
    }

    messageTimer.current = window.setTimeout(() => {
      setMessage('');
    }, 3000);

    openCartDrawer();
  }

  if (mode === 'card') {
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
            Choose an option
          </label>

          <select
            id={`product-option-${product.slug}`}
            className="form-control mt-2"
            value={selectedVariantId}
            onChange={(event) => {
              setSelectedVariantId(event.currentTarget.value);

              setQuantity(1);

              setMessage('');
            }}
          >
            <option value="">Select an option</option>

            {variants.map((variant) => {
              const availability = getEffectiveProductAvailability(product, variant);

              const price = variant.price ?? product.price;

              const unavailable = availability !== 'in-stock';

              return (
                <option key={variant.id} value={variant.id} disabled={unavailable}>
                  {variant.label}

                  {price ? ` — ${formatProductPrice(price)}` : ''}

                  {unavailable ? ` — ${getAvailabilityLabel(availability)}` : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {selectedVariant?.price && (
        <p className="mt-3 text-sm font-bold text-ink-600">
          Selected price:{' '}
          <span className="font-black text-ink-900">
            {formatProductPrice(selectedVariant.price)}
          </span>
        </p>
      )}

      {stockMessage && (
        <div className="mt-4 rounded-2xl border border-sand bg-white-warm px-4 py-3">
          <p className={`text-sm font-extrabold ${stockMessageClass}`} aria-live="polite">
            {stockMessage}
          </p>

          {inventoryTrackingEnabled &&
            liveAvailable !== null &&
            existingCartQuantity > 0 &&
            liveAvailable > 0 && (
              <p className="mt-1 text-xs font-bold leading-5 text-ink-500">
                You currently have {existingCartQuantity} in your cart.
              </p>
            )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <QuantityControl
          quantity={quantity}
          disableIncrease={!canAdd || quantity >= maxSelectableQuantity}
          onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
          onIncrease={() => setQuantity(Math.min(maxSelectableQuantity, quantity + 1))}
          label={`Quantity for ${product.name}`}
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

      <p className="mt-3 min-h-5 text-sm font-bold text-success-700" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
