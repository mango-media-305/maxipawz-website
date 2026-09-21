import type {
  ImageMetadata,
} from 'astro';

import type {
  Locale,
} from '../i18n/languages';

import collarsAndAccessoriesImage from '../assets/categories/collars-and-accessories.webp';
import comfortAndHomeImage from '../assets/categories/comfort-and-home.webp';
import feedingAndHydrationImage from '../assets/categories/feeding-and-hydration.webp';
import groomingAndCareImage from '../assets/categories/grooming-and-care.webp';
import playAndEnrichmentImage from '../assets/categories/play-and-enrichment.webp';
import walkAndTravelImage from '../assets/categories/walk-and-travel.webp';

export type CategoryBackgroundPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';

export type CategoryBackgroundOverlay =
  | 'light'
  | 'medium'
  | 'dark';

export type LifestyleCategoryTone =
  | 'brand'
  | 'accent'
  | 'sand';

export type LifestyleCategoryIcon =
  | 'play'
  | 'travel'
  | 'hydration'
  | 'comfort'
  | 'care'
  | 'accessories';

export interface LifestyleCategory {
  title:
    string;

  description:
    string;

  slug:
    string;

  icon:
    LifestyleCategoryIcon;

  tone:
    LifestyleCategoryTone;

  backgroundImage?:
    ImageMetadata;

  backgroundPosition?:
    CategoryBackgroundPosition;

  backgroundOverlay?:
    CategoryBackgroundOverlay;
}

export type ShopPrincipleIcon =
  | 'purpose'
  | 'practical'
  | 'joy';

export interface ShopPrinciple {
  title:
    string;

  description:
    string;

  icon:
    ShopPrincipleIcon;
}

export interface CollectionHighlight {
  title:
    string;

  description:
    string;
}

export const lifestyleCategories:
  LifestyleCategory[] = [
    {
      title:
        'Play & Enrichment',

      description:
        'Toys, puzzles, interactive products, and engaging activities that help keep pets active, curious, and entertained.',

      slug:
        'play-and-enrichment',

      icon:
        'play',

      tone:
        'accent',

      backgroundImage:
        playAndEnrichmentImage,

      backgroundPosition:
        'center',

      backgroundOverlay:
        'medium',
    },

    {
      title:
        'Walk & Travel',

      description:
        'Portable essentials, walking accessories, travel gear, and practical products for comfortable adventures together.',

      slug:
        'walk-and-travel',

      icon:
        'travel',

      tone:
        'brand',

      backgroundImage:
        walkAndTravelImage,

      backgroundPosition:
        'center',

      backgroundOverlay:
        'medium',
    },

    {
      title:
        'Feeding & Hydration',

      description:
        'Water bottles, bowls, feeding accessories, and helpful products for meals, treats, and hydration at home or away.',

      slug:
        'feeding-and-hydration',

      icon:
        'hydration',

      tone:
        'sand',

      backgroundImage:
        feedingAndHydrationImage,

      backgroundPosition:
        'center',

      backgroundOverlay:
        'medium',
    },

    {
      title:
        'Comfort & Home',

      description:
        'Cozy, calming, and practical products designed to make resting and everyday life at home more comfortable.',

      slug:
        'comfort-and-home',

      icon:
        'comfort',

      tone:
        'brand',

      backgroundImage:
        comfortAndHomeImage,

      backgroundPosition:
        'center',

      backgroundOverlay:
        'medium',
    },

    {
      title:
        'Grooming & Care',

      description:
        'Useful care products and grooming essentials that help make regular pet-care routines simpler and more enjoyable.',

      slug:
        'grooming-and-care',

      icon:
        'care',

      tone:
        'accent',

      backgroundImage:
        groomingAndCareImage,

      backgroundPosition:
        'center',

      backgroundOverlay:
        'light',
    },

    {
      title:
        'Collars & Accessories',

      description:
        'Collars, wearable accessories, identification products, and expressive details for everyday pet style.',

      slug:
        'collars-and-accessories',

      icon:
        'accessories',

      tone:
        'sand',

      backgroundImage:
        collarsAndAccessoriesImage,

      backgroundPosition:
        'right',

      backgroundOverlay:
        'medium',
    },
  ];

const spanishLifestyleCategories:
  Record<
    string,
    Pick<
      LifestyleCategory,
      'title' |
      'description'
    >
  > = {
    'play-and-enrichment': {
      title:
        'Juego y enriquecimiento',

      description:
        'Juguetes, rompecabezas, productos interactivos y actividades que ayudan a mantener a las mascotas activas, curiosas y entretenidas.',
    },

    'walk-and-travel': {
      title:
        'Paseos y viajes',

      description:
        'Artículos portátiles, accesorios para paseos, productos de viaje y opciones prácticas para disfrutar aventuras cómodas juntos.',
    },

    'feeding-and-hydration': {
      title:
        'Alimentación e hidratación',

      description:
        'Botellas de agua, tazones, accesorios de alimentación y productos útiles para comidas, premios e hidratación dentro y fuera de casa.',
    },

    'comfort-and-home': {
      title:
        'Comodidad y hogar',

      description:
        'Productos acogedores, prácticos y pensados para hacer que el descanso y la vida cotidiana en casa sean más cómodos.',
    },

    'grooming-and-care': {
      title:
        'Aseo y cuidado',

      description:
        'Productos útiles de cuidado y artículos de aseo que ayudan a simplificar y hacer más agradables las rutinas habituales de tu mascota.',
    },

    'collars-and-accessories': {
      title:
        'Collares y accesorios',

      description:
        'Collares, accesorios portables, productos de identificación y detalles expresivos para el estilo cotidiano de tu mascota.',
    },
  };

export const shopHeroHighlights = [
  'Playful and practical finds',
  'Products for everyday routines',
  'A collection inspired by real pet life',
] as const;

const spanishShopHeroHighlights = [
  'Productos prácticos y divertidos',
  'Artículos para las rutinas diarias',
  'Una colección inspirada en la vida real con mascotas',
] as const;

export const shopPrinciples:
  ShopPrinciple[] = [
    {
      title:
        'Chosen with purpose',

      description:
        'We consider how a product supports play, comfort, movement, feeding, travel, or another real part of pet life.',

      icon:
        'purpose',
    },

    {
      title:
        'Useful every day',

      description:
        'Our collection is being shaped around products that can earn a meaningful place in everyday routines.',

      icon:
        'practical',
    },

    {
      title:
        'Joyful by nature',

      description:
        'Maxi Pawz brings warmth, color, personality, and a sense of fun to shopping for the pets we love.',

      icon:
        'joy',
    },
  ];

const spanishShopPrinciples:
  ShopPrinciple[] = [
    {
      title:
        'Elegidos con propósito',

      description:
        'Consideramos cómo cada producto puede apoyar el juego, la comodidad, el movimiento, la alimentación, los viajes u otra parte real de la vida con mascotas.',

      icon:
        'purpose',
    },

    {
      title:
        'Útiles todos los días',

      description:
        'Nuestra colección está tomando forma alrededor de productos que pueden ocupar un lugar útil en las rutinas cotidianas.',

      icon:
        'practical',
    },

    {
      title:
        'Alegría por naturaleza',

      description:
        'Maxi Pawz aporta calidez, color, personalidad y diversión a la experiencia de comprar para las mascotas que queremos.',

      icon:
        'joy',
    },
  ];

export const prelaunchCollectionHighlights:
  CollectionHighlight[] = [
    {
      title:
        'A varied collection',

      description:
        'Maxi Pawz is preparing products for play, walking, travel, feeding, hydration, comfort, grooming, and personal style.',
    },

    {
      title:
        'Thoughtful organization',

      description:
        'Products will be organized around the moments and routines pet owners understand instead of one long, confusing catalog.',
    },

    {
      title:
        'Helpful product guidance',

      description:
        'Our Pet Guides will support more informed decisions about sizing, purpose, use, comfort, and everyday care.',
    },

    {
      title:
        'A friendly shopping experience',

      description:
        'The store is being designed to feel welcoming, useful, colorful, and easy to explore on any device.',
    },
  ];

const spanishPrelaunchCollectionHighlights:
  CollectionHighlight[] = [
    {
      title:
        'Una colección variada',

      description:
        'Maxi Pawz está preparando productos para jugar, pasear, viajar, alimentar, hidratar, descansar, cuidar y expresar el estilo de cada mascota.',
    },

    {
      title:
        'Organización pensada para ti',

      description:
        'Los productos estarán organizados alrededor de momentos y rutinas fáciles de reconocer, en lugar de presentarse como un catálogo largo y confuso.',
    },

    {
      title:
        'Orientación útil sobre productos',

      description:
        'Nuestras Guías para Mascotas ayudarán a tomar decisiones más informadas sobre tallas, propósito, uso, comodidad y cuidado cotidiano.',
    },

    {
      title:
        'Una experiencia de compra amigable',

      description:
        'La tienda está siendo diseñada para sentirse acogedora, útil, colorida y fácil de explorar desde cualquier dispositivo.',
    },
  ];

export function getLifestyleCategories(
  locale:
    Locale = 'en',
): LifestyleCategory[] {
  if (
    locale ===
    'en'
  ) {
    return lifestyleCategories;
  }

  return lifestyleCategories.map(
    (
      category,
    ) => ({
      ...category,

      ...spanishLifestyleCategories[
        category.slug
      ],
    }),
  );
}

export function getShopHeroHighlights(
  locale:
    Locale = 'en',
): readonly string[] {
  return locale ===
    'es'
    ? spanishShopHeroHighlights
    : shopHeroHighlights;
}

export function getShopPrinciples(
  locale:
    Locale = 'en',
): ShopPrinciple[] {
  return locale ===
    'es'
    ? spanishShopPrinciples
    : shopPrinciples;
}

export function getPrelaunchCollectionHighlights(
  locale:
    Locale = 'en',
): CollectionHighlight[] {
  return locale ===
    'es'
    ? spanishPrelaunchCollectionHighlights
    : prelaunchCollectionHighlights;
}