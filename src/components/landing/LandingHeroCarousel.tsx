import {
    useEffect,
    useState,
} from 'preact/hooks';

export type LandingHeroImagePosition =
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right';

export interface LandingHeroImage {
    src: string;

    alt: string;

    width: number;
    height: number;

    position?:
    LandingHeroImagePosition;
}

interface Props {
    images:
    LandingHeroImage[];

    productName: string;

    intervalMs?: number;
}

function getObjectPosition(
    position:
        LandingHeroImagePosition =
        'center',
): string {
    switch (
    position
    ) {
        case 'top':
            return 'center top';

        case 'bottom':
            return 'center bottom';

        case 'left':
            return 'left center';

        case 'right':
            return 'right center';

        case 'center':
        default:
            return 'center center';
    }
}

function PreviousIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
        >
            <path
                d="m15 18-6-6 6-6"
            />
        </svg>
    );
}

function NextIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
        >
            <path
                d="m9 18 6-6-6-6"
            />
        </svg>
    );
}

export default function LandingHeroCarousel({
    images,

    productName,

    intervalMs = 5200,
}: Props) {
    const [
        activeIndex,
        setActiveIndex,
    ] =
        useState(
            0,
        );

    const [
        paused,
        setPaused,
    ] =
        useState(
            false,
        );

    const [
        reducedMotion,
        setReducedMotion,
    ] =
        useState(
            false,
        );

    const imageCount =
        images.length;

    useEffect(
        () => {
            const mediaQuery =
                window.matchMedia(
                    '(prefers-reduced-motion: reduce)',
                );

            const updateReducedMotion =
                (): void => {
                    setReducedMotion(
                        mediaQuery.matches,
                    );
                };

            updateReducedMotion();

            mediaQuery.addEventListener(
                'change',
                updateReducedMotion,
            );

            return () => {
                mediaQuery.removeEventListener(
                    'change',
                    updateReducedMotion,
                );
            };
        },
        [],
    );

    useEffect(
        () => {
            if (
                imageCount <=
                1 ||
                paused ||
                reducedMotion
            ) {
                return;
            }

            const timer =
                window.setInterval(
                    () => {
                        setActiveIndex(
                            (
                                currentIndex,
                            ) =>
                                (
                                    currentIndex +
                                    1
                                ) %
                                imageCount,
                        );
                    },
                    intervalMs,
                );

            return () => {
                window.clearInterval(
                    timer,
                );
            };
        },
        [
            imageCount,
            intervalMs,
            paused,
            reducedMotion,
        ],
    );

    useEffect(
        () => {
            if (
                activeIndex >=
                imageCount &&
                imageCount >
                0
            ) {
                setActiveIndex(
                    0,
                );
            }
        },
        [
            activeIndex,
            imageCount,
        ],
    );

    if (
        imageCount ===
        0
    ) {
        return (
            <div
                className="absolute inset-0 grid place-items-center rounded-4xl bg-linear-to-br from-brand-100 via-cream-soft to-accent-100"
            >
                <p
                    className="font-extrabold text-ink-600"
                >
                    Product image coming
                    soon
                </p>
            </div>
        );
    }

    const goPrevious =
        (): void => {
            setActiveIndex(
                (
                    currentIndex,
                ) =>
                    (
                        currentIndex -
                        1 +
                        imageCount
                    ) %
                    imageCount,
            );
        };

    const goNext =
        (): void => {
            setActiveIndex(
                (
                    currentIndex,
                ) =>
                    (
                        currentIndex +
                        1
                    ) %
                    imageCount,
            );
        };

    return (
        <div
            className="absolute inset-0 overflow-hidden rounded-4xl bg-ink-950"
            role="region"
            aria-label={`${productName} image gallery`}
            onMouseEnter={() => {
                setPaused(
                    true,
                );
            }}
            onMouseLeave={() => {
                setPaused(
                    false,
                );
            }}
            onFocusCapture={() => {
                setPaused(
                    true,
                );
            }}
            onBlurCapture={() => {
                setPaused(
                    false,
                );
            }}
        >
            {images.map(
                (
                    image,
                    index,
                ) => {
                    const active =
                        index ===
                        activeIndex;

                    return (
                        <img
                            key={`${image.src}-${index}`}
                            src={
                                image.src
                            }
                            alt={
                                image.alt
                            }
                            width={
                                image.width
                            }
                            height={
                                image.height
                            }
                            loading={
                                index <=
                                    1
                                    ? 'eager'
                                    : 'lazy'
                            }
                            decoding="async"
                            fetchPriority={
                                index ===
                                    0
                                    ? 'high'
                                    : 'auto'
                            }
                            className={[
                                'landing-hero-slide-image',

                                'absolute inset-0 block max-w-none',

                                'transition-opacity duration-1000 ease-out',

                                active
                                    ? 'is-active opacity-100'
                                    : 'pointer-events-none opacity-0',
                            ].join(
                                ' ',
                            )}
                            style={{
                                position:
                                    'absolute',

                                inset:
                                    '0',

                                display:
                                    'block',

                                width:
                                    '100%',

                                height:
                                    '100%',

                                maxWidth:
                                    'none',

                                objectFit:
                                    'cover',

                                objectPosition:
                                    getObjectPosition(
                                        image.position,
                                    ),
                            }}
                            aria-hidden={
                                active
                                    ? undefined
                                    : true
                            }
                        />
                    );
                },
            )}

            {imageCount >
                1 && (
                    <>
                        <div
                            className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-full p-1.5 text-white sm:top-5 sm:right-5"
                        >
                            <button
                                type="button"
                                className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
                                aria-label="Previous product image"
                                onClick={
                                    goPrevious
                                }
                            >
                                <PreviousIcon />
                            </button>

                            {/* <p
                                className="min-w-12 text-center text-xs font-extrabold tracking-[0.08em]"
                                aria-live="polite"
                            >
                                {String(
                                    activeIndex +
                                    1,
                                ).padStart(
                                    2,
                                    '0',
                                )}

                                <span
                                    className="mx-1 text-white/45"
                                >
                                    /
                                </span>

                                {String(
                                    imageCount,
                                ).padStart(
                                    2,
                                    '0',
                                )}
                            </p> */}

                            <button
                                type="button"
                                className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
                                aria-label="Next product image"
                                onClick={
                                    goNext
                                }
                            >
                                <NextIcon />
                            </button>
                        </div>

                        <div
                            className="absolute right-5 bottom-5 z-30 hidden items-center gap-1.5 sm:flex"
                            aria-label="Choose product image"
                        >
                            {images.map(
                                (
                                    image,
                                    index,
                                ) => {
                                    const active =
                                        index ===
                                        activeIndex;

                                    return (
                                        <button
                                            key={`dot-${image.src}-${index}`}
                                            type="button"
                                            className={[
                                                'h-2 rounded-full border border-white/35 transition-all duration-300',

                                                active
                                                    ? 'w-8 bg-white'
                                                    : 'w-2 bg-white/45 hover:bg-white/75',
                                            ].join(
                                                ' ',
                                            )}
                                            aria-label={`Show image ${index + 1} of ${imageCount}`}
                                            aria-current={
                                                active
                                                    ? 'true'
                                                    : undefined
                                            }
                                            onClick={() => {
                                                setActiveIndex(
                                                    index,
                                                );
                                            }}
                                        />
                                    );
                                },
                            )}
                        </div>
                    </>
                )}
        </div>
    );
}