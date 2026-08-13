export const productLandingPageStatuses = [
    'draft',
    'active',
] as const;

export type ProductLandingPageStatus =
    (typeof productLandingPageStatuses)[number];

export const productLandingChromeModes = [
    'minimal',
    'site',
] as const;

export type ProductLandingChromeMode =
    (typeof productLandingChromeModes)[number];

export const productLandingHeroStyles = [
    'cinematic',
    'studio',
] as const;

export type ProductLandingHeroStyle =
    (typeof productLandingHeroStyles)[number];

export type ProductLandingImageFit =
    | 'cover'
    | 'contain';

export interface ProductLandingCampaign {
    id: string;

    channel?: string;
    audience?: string;
}

export interface ProductLandingHero {
    style: ProductLandingHeroStyle;

    imageIndex?: number;

    eyebrow?: string;

    headline: string;
    description: string;

    primaryCtaLabel: string;

    secondaryCtaLabel?: string;
}

export interface ProductLandingHighlight {
    eyebrow?: string;

    title: string;
    description?: string;
}

export interface ProductLandingStoryBlock {
    imageIndex?: number;

    imageFit?: ProductLandingImageFit;
    imageSide?: 'left' | 'right';

    eyebrow?: string;

    title: string;

    body: string[];

    bullets?: string[];
}

export interface ProductLandingGallery {
    eyebrow?: string;

    title: string;
    description?: string;

    imageIndexes?: number[];

    imageFit?: ProductLandingImageFit;
}

export interface ProductLandingPurchase {
    eyebrow?: string;

    title: string;
    description: string;

    imageIndex?: number;

    note?: string;
}

export interface ProductLandingFaqItem {
    question: string;
    answer: string;
}

export interface ProductLandingSeo {
    title: string;
    description: string;

    imageIndex?: number;

    /**
     * Campaign landing pages should normally remain
     * noindex so the permanent /shop/... product page
     * remains the primary SEO destination.
     */
    noIndex?: boolean;
}

export interface ProductLandingPageDefinition {
    slug: string;

    productSlug: string;

    status: ProductLandingPageStatus;

    chrome: ProductLandingChromeMode;

    campaign?: ProductLandingCampaign;

    hero: ProductLandingHero;

    highlights?: ProductLandingHighlight[];

    story?: ProductLandingStoryBlock[];

    gallery?: ProductLandingGallery;

    purchase: ProductLandingPurchase;

    faq?: ProductLandingFaqItem[];

    seo: ProductLandingSeo;
}