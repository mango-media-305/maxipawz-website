interface Props {
  quantity: number;

  onDecrease: () => void;
  onIncrease: () => void;

  disableIncrease?: boolean;
  compact?: boolean;

  label?: string;
}

function MinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
  disableIncrease = false,
  compact = false,
  label = 'Product quantity',
}: Props) {
  const buttonSize = compact ? 'size-8' : 'size-10';

  return (
    <div
      className="inline-flex items-center rounded-full border border-sand bg-cream-soft p-1"
      aria-label={label}
    >
      <button
        type="button"
        className={`grid ${buttonSize} place-items-center rounded-full bg-white-warm text-ink-700 transition hover:bg-brand-50 hover:text-brand-800`}
        onClick={onDecrease}
        aria-label={quantity === 1 ? 'Remove item' : 'Decrease quantity'}
      >
        <MinusIcon />
      </button>

      <span
        className={`grid min-w-9 place-items-center px-1 font-black text-ink-900 ${
          compact ? 'text-sm' : 'text-base'
        }`}
        aria-live="polite"
      >
        {quantity}
      </span>

      <button
        type="button"
        className={`grid ${buttonSize} place-items-center rounded-full bg-white-warm text-ink-700 transition hover:bg-brand-50 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-40`}
        onClick={onIncrease}
        disabled={disableIncrease || quantity >= 99}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
