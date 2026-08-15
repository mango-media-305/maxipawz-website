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

function PauseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="currentColor"
            aria-hidden="true"
        >
            <rect
                x="6"
                y="5"
                width="4"
                height="14"
                rx="1"
            />

            <rect
                x="14"
                y="5"
                width="4"
                height="14"
                rx="1"
            />
        </svg>
    );
}

function PlayIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="currentColor"
            aria-hidden="true"
        >
            <path
                d="M8 5.75v12.5a1 1 0 0 0 1.52.85l9.4-6.25a1 1 0 0 0 0-1.7L9.52 4.9A1 1 0 0 0 8 5.75Z"
            />
        </svg>
    );
}

export default function LandingHeroCarousel({
    images,

    productName,

    intervalMs =
    5200,
}: Props) {
    const [
        activeIndex,
        setActiveIndex,
    ] =
        useState(
            0,
        );

    const [
        userPaused,
        setUserPaused,
    ] =
        useState(
            false,
        );

    const [
        hoverPaused,
        setHoverPaused,
    ] =
        useState(
            false,
        );

    const [
        focusPaused,
        setFocusPaused,
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

    const [
        announcement,
        setAnnouncement,
    ] =
        useState(
            '',
        );

    const imageCount =
        images.length;

    const motionPaused =
        userPaused ||
        hoverPaused ||
        focusPaused ||
        reducedMotion;

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
                motionPaused
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
            activeIndex,
            imageCount,
            intervalMs,
            motionPaused,
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
                    Product image coming soon
                </p>
            </div>
        );
    }

    function announceImage(
        index: number,
    ): void {
        setAnnouncement(
            `Showing image ${index + 1} of ${imageCount}: ${images[index]?.alt ?? productName}`,
        );
    }

    function showImage(
        index: number,
    ): void {
        setActiveIndex(
            index,
        );

        announceImage(
            index,
        );
    }

    function goPrevious():
        void {
        const nextIndex =
            (
                activeIndex -
                1 +
                imageCount
            ) %
            imageCount;

        showImage(
            nextIndex,
        );
    }

    function goNext():
        void {
        const nextIndex =
            (
                activeIndex +
                1
            ) %
            imageCount;

        showImage(
            nextIndex,
        );
    }

    const previousIndex =
        (
            activeIndex -
            1 +
            imageCount
        ) %
        imageCount;

    const nextIndex =
        (
            activeIndex +
            1
        ) %
        imageCount;

    return (
        <div
            className="absolute inset-0 overflow-hidden rounded-4xl bg-ink-950"
            role="region"
            aria-roledescription="carousel"
            aria-label={`${productName} image gallery`}
            onMouseEnter={() => {
                setHoverPaused(
                    true,
                );
            }}
            onMouseLeave={() => {
                setHoverPaused(
                    false,
                );
            }}
            onFocusCapture={() => {
                setFocusPaused(
                    true,
                );
            }}
            onBlurCapture={(
                event,
            ) => {
                const nextFocus =
                    event.relatedTarget;

                if (
                    !(
                        nextFocus instanceof
                        Node
                    ) ||
                    !event.currentTarget.contains(
                        nextFocus,
                    )
                ) {
                    setFocusPaused(
                        false,
                    );
                }
            }}
            onKeyDown={(
                event,
            ) => {
                if (
                    event.altKey ||
                    event.ctrlKey ||
                    event.metaKey
                ) {
                    return;
                }

                if (
                    event.key ===
                    'ArrowLeft'
                ) {
                    event.preventDefault();

                    goPrevious();
                }

                if (
                    event.key ===
                    'ArrowRight'
                ) {
                    event.preventDefault();

                    goNext();
                }
            }}
        >
            <span
                className="sr-only"
                aria-live="polite"
                aria-atomic="true"
            >
                {announcement}
            </span>

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
                                index ===
                                    0
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
                            draggable={
                                false
                            }
                            className={[
                                'landing-hero-slide-image',

                                'absolute inset-0 block max-w-none',

                                'transition-opacity duration-1000 ease-out motion-reduce:transition-none',

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

                                animationPlayState:
                                    motionPaused
                                        ? 'paused'
                                        : 'running',
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
                            className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-full border border-white/25 bg-ink-950/55 p-1.5 text-white shadow-soft backdrop-blur-md sm:top-5 sm:right-5"
                            role="group"
                            aria-label="Image carousel controls"
                        >
                            <button
                                type="button"
                                data-featured-gallery-control="previous"
                                data-featured-gallery-index={String(
                                    previousIndex,
                                )}
                                className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/70 motion-reduce:transition-none"
                                aria-label="Previous product image"
                                onClick={
                                    goPrevious
                                }
                            >
                                <PreviousIcon />
                            </button>

                            <button
                                type="button"
                                data-featured-gallery-control={
                                    userPaused
                                        ? 'play'
                                        : 'pause'
                                }
                                className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none"
                                aria-label={
                                    reducedMotion
                                        ? 'Automatic image rotation is disabled by your reduced-motion preference'
                                        : userPaused
                                            ? 'Resume automatic image rotation'
                                            : 'Pause automatic image rotation'
                                }
                                aria-pressed={
                                    userPaused
                                }
                                disabled={
                                    reducedMotion
                                }
                                onClick={() => {
                                    setUserPaused(
                                        (
                                            paused,
                                        ) =>
                                            !paused,
                                    );
                                }}
                            >
                                {
                                    userPaused ||
                                        reducedMotion
                                        ? (
                                            <PlayIcon />
                                        )
                                        : (
                                            <PauseIcon />
                                        )
                                }
                            </button>

                            <button
                                type="button"
                                data-featured-gallery-control="next"
                                data-featured-gallery-index={String(
                                    nextIndex,
                                )}
                                className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/70 motion-reduce:transition-none"
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
                            role="group"
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
                                            data-featured-gallery-control="select"
                                            data-featured-gallery-index={String(
                                                index,
                                            )}
                                            className={[
                                                'h-3 rounded-full border border-white/35 transition-all duration-300 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/70 motion-reduce:transition-none',

                                                active
                                                    ? 'w-9 bg-white'
                                                    : 'w-3 bg-white/45 hover:bg-white/75',
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
                                                showImage(
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