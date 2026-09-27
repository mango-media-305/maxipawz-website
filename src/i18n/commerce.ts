import type { Locale } from './languages';

import type {
    PetType,
    ProductAvailability,
    ProductCategorySlug,
} from '../types/product';

export function commerceText(
    locale: Locale,
    english: string,
    spanish: string,
): string {
    return locale === 'es'
        ? spanish
        : english;
}

export function getCommerceNumberLocale(
    locale: Locale,
): string {
    return locale === 'es'
        ? 'es-US'
        : 'en-US';
}

const availabilityLabels:
    Record<
        Locale,
        Record<
            ProductAvailability,
            string
        >
    > = {
        en: {
            'coming-soon':
                'Coming soon',

            'in-stock':
                'Available',

            'out-of-stock':
                'Out of stock',

            discontinued:
                'Discontinued',
        },

        es: {
            'coming-soon':
                'Próximamente',

            'in-stock':
                'Disponible',

            'out-of-stock':
                'Agotado',

            discontinued:
                'Descontinuado',
        },
    };

const petTypeLabels:
    Record<
        Locale,
        Record<
            PetType,
            string
        >
    > = {
        en: {
            dog:
                'Dogs',

            cat:
                'Cats',

            'small-pet':
                'Small pets',

            other:
                'Other pets',
        },

        es: {
            dog:
                'Perros',

            cat:
                'Gatos',

            'small-pet':
                'Mascotas pequeñas',

            other:
                'Otras mascotas',
        },
    };

const categoryLabels:
    Record<
        Locale,
        Record<
            ProductCategorySlug,
            string
        >
    > = {
        en: {
            'play-and-enrichment':
                'Play & Enrichment',

            'walk-and-travel':
                'Walk & Travel',

            'feeding-and-hydration':
                'Feeding & Hydration',

            'comfort-and-home':
                'Comfort & Home',

            'grooming-and-care':
                'Grooming & Care',

            'collars-and-accessories':
                'Collars & Accessories',
        },

        es: {
            'play-and-enrichment':
                'Juego y enriquecimiento',

            'walk-and-travel':
                'Paseos y viajes',

            'feeding-and-hydration':
                'Alimentación e hidratación',

            'comfort-and-home':
                'Comodidad y hogar',

            'grooming-and-care':
                'Aseo y cuidado',

            'collars-and-accessories':
                'Collares y accesorios',
        },
    };

const commonVariantLabels:
    Record<
        Locale,
        Record<
            string,
            string
        >
    > = {
        en: {
            Small:
                'Small',

            Medium:
                'Medium',

            Large:
                'Large',
        },

        es: {
            Small:
                'Pequeño',

            Medium:
                'Mediano',

            Large:
                'Grande',
        },
    };

export function getLocalizedAvailabilityLabel(
    availability:
        ProductAvailability,

    locale:
        Locale = 'en',
): string {
    return availabilityLabels[
        locale
    ][
        availability
    ];
}

export function getLocalizedPetTypeLabel(
    petType:
        PetType,

    locale:
        Locale = 'en',
): string {
    return petTypeLabels[
        locale
    ][
        petType
    ];
}

export function getLocalizedCategoryLabel(
    category:
        ProductCategorySlug,

    locale:
        Locale = 'en',
): string {
    return categoryLabels[
        locale
    ][
        category
    ];
}

export function getLocalizedVariantLabel(
    label:
        string,

    locale:
        Locale = 'en',
): string {
    return (
        commonVariantLabels[
            locale
        ][
            label
        ] ??
        label
    );
}