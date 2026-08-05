export type HeroSlideTone = 'brand' | 'accent' | 'sand';
export type HeroImageFit = 'cover' | 'contain';

export interface HeroSlide {
    id: string;
    eyebrow: string;
    title: string;
    description: string;

    image: string;
    imageAlt: string;
    imageFit?: HeroImageFit;
    objectPosition?: string;

    tone?: HeroSlideTone;
    meta?: string;

    href?: string;
    linkLabel?: string;
}

/*
 * Temporary product shape used by the homepage slider.
 *
 * The product collection will eventually map published products into this
 * interface. Products may be toys, supplies, accessories, travel gear,
 * hydration products, grooming items, or other pet essentials.
 */
export interface HeroProductPreview {
    name: string;
    description: string;
    href: string;

    image: string;
    imageAlt: string;

    priceLabel?: string;
    badge?: string;
}

export const prelaunchHeroSlides: HeroSlide[] = [
    {
        id: 'everyday-pet-joy',

        eyebrow: 'The Maxi Pawz spirit',

        title: 'More joy for every part of pet life',

        description:
            'We are creating a friendly destination for playtime, walks, travel, feeding, hydration, comfort, care, and everyday moments together.',

        image: "https://miro.medium.com/v2/resize:fit:2000/1*rnRDOjGuPaRpoetcAoZxHA.png",
        imageAlt: 'Happy brown Maxi Pawz dog mascot',
        imageFit: 'cover',
        objectPosition: 'center 28%',

        tone: 'accent',

        href: '/#join-the-pack',
        linkLabel: 'Join the Pack',
    },

    {
        id: 'playful-and-practical',

        eyebrow: 'Playful and practical',

        title: 'Useful essentials with a joyful personality',

        description:
            'Discover future products ranging from toys and enrichment items to water bottles, collars, walking accessories, travel gear, and everyday supplies.',

        image: "https://static.tildacdn.com/tild6635-6330-4165-a233-393634353438/13364.jpg",
        imageAlt: 'Blue and orange Maxi Pawz brand mark',
        imageFit: 'cover',

        tone: 'brand',

        href: '/about',
        linkLabel: 'Discover Maxi Pawz',
    },

    {
        id: 'complete-pet-store',

        eyebrow: 'Coming soon',

        title: 'A complete pet-shopping experience is taking shape',

        description:
            'Maxi Pawz is preparing thoughtful products, helpful pet guidance, and a warm shopping experience for pets and their people.',

        image: "https://m.media-amazon.com/images/I/71pou1A0rDL._AC_UF1000,1000_QL80_.jpg",
        imageAlt: 'Maxi Pawz Store horizontal logo',
        imageFit: 'cover',

        tone: 'sand',

        href: '/pet-guides',
        linkLabel: 'Explore Pet Guides',
    },
];

const productSlideTones: HeroSlideTone[] = [
    'accent',
    'brand',
    'sand',
];

function createProductSlideId(
    productName: string,
    index: number,
): string {
    const normalizedName = productName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalizedName
        ? `product-${normalizedName}`
        : `product-${index + 1}`;
}

/*
 * Converts published products into homepage slides.
 *
 * This function is intentionally product-category neutral. It works with
 * toys, accessories, supplies, hydration products, travel gear, collars,
 * grooming products, and other Maxi Pawz merchandise.
 */
export function createProductHeroSlides(
    products: HeroProductPreview[],
): HeroSlide[] {
    return products.slice(0, 5).map((product, index) => ({
        id: createProductSlideId(product.name, index),

        eyebrow:
            product.badge ??
            (index === 0
                ? 'Featured Maxi Pawz pick'
                : 'Customer favorite'),

        title: product.name,
        description: product.description,

        image: product.image,
        imageAlt: product.imageAlt,
        imageFit: 'cover',
        objectPosition: 'center',

        tone:
            productSlideTones[index % productSlideTones.length] ??
            'accent',

        meta: product.priceLabel,

        href: product.href,
        linkLabel: 'View product',
    }));
}