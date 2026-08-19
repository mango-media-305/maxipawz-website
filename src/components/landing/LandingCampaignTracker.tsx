import {
    useEffect,
} from 'preact/hooks';

import {
    captureFeaturedCampaignAttribution,
    getFeaturedCampaignAnalyticsParameters,
    getFeaturedCampaignAttribution,
    trackAnalyticsEvent,
} from '../../utils/featured-campaign';

interface Props {
    landingPageSlug: string;

    campaignId: string;

    productSlug: string;

    channel?: string;

    audience?: string;
}

function getText(
    element:
        Element | null,
): string | undefined {
    const value =
        element
            ?.textContent
            ?.trim()
            .replace(
                /\s+/g,
                ' ',
            );

    if (!value) {
        return undefined;
    }

    return value.slice(
        0,
        120,
    );
}

export default function LandingCampaignTracker({
    landingPageSlug,

    campaignId,

    productSlug,

    channel,

    audience,
}: Props) {
    useEffect(
        () => {
            const capturedAttribution =
                captureFeaturedCampaignAttribution(
                    {
                        landingPageSlug,

                        campaignId,

                        productSlug,

                        channel,

                        audience,
                    },
                );

            trackAnalyticsEvent(
                'featured_product_view',
                {
                    ...getFeaturedCampaignAnalyticsParameters(
                        capturedAttribution,
                    ),

                    page_path:
                        window.location.pathname,
                },
            );

            function getCampaignParameters() {
                return getFeaturedCampaignAnalyticsParameters(
                    getFeaturedCampaignAttribution(),
                );
            }

            function handleClick(
                event: MouseEvent,
            ): void {
                if (
                    !(
                        event.target instanceof
                        Element
                    )
                ) {
                    return;
                }

                const target =
                    event.target;

                /*
                 * Product / landing-page CTAs.
                 */
                const cta =
                    target.closest<HTMLElement>(
                        '[data-featured-cta-origin]',
                    );

                if (cta) {
                    const origin =
                        cta.dataset
                            .featuredCtaOrigin;

                    const link =
                        target.closest<HTMLAnchorElement>(
                            'a',
                        ) ??
                        cta.querySelector<HTMLAnchorElement>(
                            'a',
                        );

                    trackAnalyticsEvent(
                        'featured_product_cta_click',
                        {
                            ...getCampaignParameters(),

                            cta_origin:
                                origin,

                            cta_text:
                                getText(
                                    link ??
                                    cta,
                                ),

                            destination:
                                link?.getAttribute(
                                    'href',
                                ),
                        },
                    );
                }

                /*
                 * Hero carousel interaction.
                 */
                const galleryControl =
                    target.closest<HTMLElement>(
                        '[data-featured-gallery-control]',
                    );

                if (
                    galleryControl
                ) {
                    trackAnalyticsEvent(
                        'featured_product_gallery_interaction',
                        {
                            ...getCampaignParameters(),

                            gallery:
                                'hero',

                            action:
                                galleryControl
                                    .dataset
                                    .featuredGalleryControl,

                            image_index:
                                galleryControl
                                    .dataset
                                    .featuredGalleryIndex,
                        },
                    );
                }

                /*
                 * Add-to-cart tracking without modifying the
                 * shared cart component.
                 *
                 * The shared AddToCartButton remains the source
                 * of truth for inventory and actual cart mutation.
                 */
                const purchaseButton =
                    target.closest<HTMLButtonElement>(
                        '[data-featured-purchase-controls] button',
                    );

                if (
                    purchaseButton &&
                    !purchaseButton.disabled
                ) {
                    const buttonText =
                        getText(
                            purchaseButton,
                        ) ?? '';

                    const isAddButton =
                        /^add to cart$/i.test(
                            buttonText,
                        ) ||
                        /^add demo item$/i.test(
                            buttonText,
                        );

                    if (
                        isAddButton
                    ) {
                        const controls =
                            purchaseButton.closest<HTMLElement>(
                                '[data-featured-purchase-controls]',
                            );

                        const variantSelect =
                            controls?.querySelector<HTMLSelectElement>(
                                'select[id^="product-option-"]',
                            );

                        trackAnalyticsEvent(
                            'featured_product_add_to_cart',
                            {
                                ...getCampaignParameters(),

                                product_slug:
                                    productSlug,

                                variant_id:
                                    variantSelect
                                        ?.value ||
                                    undefined,

                                cta_origin:
                                    'purchase',
                            },
                        );
                    }
                }
            }

            function handleChange(
                event: Event,
            ): void {
                if (
                    !(
                        event.target instanceof
                        HTMLSelectElement
                    )
                ) {
                    return;
                }

                const select =
                    event.target;

                if (
                    !select.id.startsWith(
                        'product-option-',
                    )
                ) {
                    return;
                }

                if (
                    !select.closest(
                        '[data-featured-purchase-controls]',
                    )
                ) {
                    return;
                }

                if (!select.value) {
                    return;
                }

                trackAnalyticsEvent(
                    'featured_product_variant_selected',
                    {
                        ...getCampaignParameters(),

                        product_slug:
                            productSlug,

                        variant_id:
                            select.value,
                    },
                );
            }

            document.addEventListener(
                'click',
                handleClick,
            );

            document.addEventListener(
                'change',
                handleChange,
            );

            return () => {
                document.removeEventListener(
                    'click',
                    handleClick,
                );

                document.removeEventListener(
                    'change',
                    handleChange,
                );
            };
        },
        [
            audience,
            campaignId,
            channel,
            landingPageSlug,
            productSlug,
        ],
    );

    return null;
}