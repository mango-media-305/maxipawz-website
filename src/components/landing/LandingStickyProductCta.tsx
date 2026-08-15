import {
    useEffect,
    useState,
} from 'preact/hooks';

interface Props {
    productName: string;

    productHref: string;

    priceLabel?: string;

    heroId?: string;

    purchaseId?: string;
}

function ArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            aria-hidden="true"
        >
            <path
                d="M5 12h14"
            />

            <path
                d="m13 6 6 6-6 6"
            />
        </svg>
    );
}

export default function LandingStickyProductCta({
    productName,

    productHref,

    priceLabel,

    heroId =
    'featured-hero',

    purchaseId =
    'buy',
}: Props) {
    const [
        heroVisible,
        setHeroVisible,
    ] =
        useState(
            true,
        );

    const [
        hasReachedPurchase,
        setHasReachedPurchase,
    ] =
        useState(
            false,
        );

    useEffect(
        () => {
            const hero =
                document.getElementById(
                    heroId,
                );

            const purchase =
                document.getElementById(
                    purchaseId,
                );

            if (!hero) {
                setHeroVisible(
                    false,
                );
            }

            const heroObserver =
                hero
                    ? new IntersectionObserver(
                        (
                            entries,
                        ) => {
                            const entry =
                                entries[0];

                            if (!entry) {
                                return;
                            }

                            setHeroVisible(
                                entry.isIntersecting,
                            );
                        },
                        {
                            threshold:
                                0.08,
                        },
                    )
                    : null;

            const purchaseObserver =
                purchase
                    ? new IntersectionObserver(
                        (
                            entries,
                        ) => {
                            const entry =
                                entries[0];

                            if (
                                !entry ||
                                !entry.isIntersecting
                            ) {
                                return;
                            }

                            /*
                             * Once the visitor reaches the real
                             * purchase area, the sticky CTA stays
                             * out of the way for the remainder of
                             * the page.
                             */
                            setHasReachedPurchase(
                                true,
                            );
                        },
                        {
                            threshold:
                                0.05,
                        },
                    )
                    : null;

            if (
                hero &&
                heroObserver
            ) {
                heroObserver.observe(
                    hero,
                );
            }

            if (
                purchase &&
                purchaseObserver
            ) {
                purchaseObserver.observe(
                    purchase,
                );
            }

            return () => {
                heroObserver?.disconnect();

                purchaseObserver?.disconnect();
            };
        },
        [
            heroId,
            purchaseId,
        ],
    );

    const visible =
        !heroVisible &&
        !hasReachedPurchase;

    return (
        <div
            className={[
                'fixed inset-x-3 z-60 transition duration-300 lg:hidden',

                visible
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-6 opacity-0',
            ].join(
                ' ',
            )}
            style={{
                bottom:
                    'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
            aria-hidden={
                !visible
            }
        >
            <div
                className="mx-auto flex max-w-xl items-center gap-3 rounded-3xl border border-white/45 bg-white-warm/95 p-2.5 shadow-card backdrop-blur-xl"
            >
                <div
                    className="min-w-0 flex-1 pl-2"
                >
                    <p
                        className="truncate text-xs font-extrabold text-ink-900"
                    >
                        {productName}
                    </p>

                    {priceLabel && (
                        <p
                            className="mt-0.5 truncate text-xs font-bold text-ink-500"
                        >
                            {priceLabel}
                        </p>
                    )}
                </div>

                <a
                    href={
                        productHref
                    }
                    data-featured-cta-origin="sticky_mobile"
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-accent-600 bg-accent-500 px-4 text-sm font-extrabold text-ink-950 shadow-orange transition active:scale-[0.98]"
                >
                    View Product

                    <ArrowIcon />
                </a>
            </div>
        </div>
    );
}