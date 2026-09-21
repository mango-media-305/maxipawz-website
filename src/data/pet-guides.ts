import type { Locale } from '../i18n/languages';

// Transitional homepage presentation adapter.
//
// Article content lives exclusively in the Astro `blog` Content Collection under
// `src/data/blog`. This file intentionally contains only the small amount of
// presentation metadata still consumed by `PetGuidesPreview.astro`.
//
// TODO: move these display concerns into the homepage component/collection metadata
// and remove this adapter once the homepage preview is collection-driven.

export type PetGuideTone = 'brand' | 'accent' | 'sand';

export type PetGuideIcon = 'choosing' | 'play' | 'travel' | 'hydration' | 'comfort' | 'care' | 'accessories';

export interface HomepagePetGuide {
  slug: string;
  href: string;
  cardTitle: string;
  description: string;
  eyebrow: string;
  icon: PetGuideIcon;
  tone: PetGuideTone;
  readingTime: string;
}

export const homepagePetGuides: HomepagePetGuide[] = [
  {
    slug: 'dog-hydration-miami-heat',
    href: '/pet-guides/dog-hydration-miami-heat',
    cardTitle: 'Dog Hydration in Miami Heat',
    description:
      'Plan safer warm-weather walks with practical guidance for fresh water, cooler walking hours, shade breaks, hot pavement, and signs of overheating.',
    eyebrow: 'Miami Dog Safety',
    icon: 'hydration',
    tone: 'brand',
    readingTime: '7 min read',
  },
  {
    slug: 'play-and-enrichment',
    href: '/pet-guides/play-and-enrichment',
    cardTitle: 'Play & Enrichment',
    description:
      'Learn how to choose dog toys based on play style, size, activity, construction, supervision needs, toy rotation, and signs that a toy should be replaced.',
    eyebrow: 'Play & Enrichment',
    icon: 'play',
    tone: 'accent',
    readingTime: '8 min read',
  },
  {
    slug: 'walk-and-travel',
    href: '/pet-guides/walk-and-travel',
    cardTitle: 'Walk & Travel',
    description:
      'Prepare for dog walks, car rides, day trips, and longer adventures with practical guidance for equipment, hydration, identification, comfort, heat, and organization.',
    eyebrow: 'Walk & Travel',
    icon: 'travel',
    tone: 'brand',
    readingTime: '8 min read',
  },
  {
    slug: 'feeding-and-hydration',
    href: '/pet-guides/feeding-and-hydration',
    cardTitle: 'Feeding & Hydration',
    description:
      'Choose dog bowls, portable water products, and feeding accessories based on capacity, stability, materials, cleaning, travel needs, and daily routines.',
    eyebrow: 'Feeding & Hydration',
    icon: 'hydration',
    tone: 'sand',
    readingTime: '7 min read',
  },
];

type GuideTranslation = Pick<HomepagePetGuide, 'cardTitle' | 'description' | 'eyebrow' | 'readingTime'>;

const spanishHomepageGuides: Record<string, GuideTranslation> = {
  'dog-hydration-miami-heat': {
    cardTitle: 'Hidratación de perros en el calor de Miami',
    description:
      'Planifica paseos más seguros cuando hace calor con consejos sobre agua fresca, horarios más frescos, descansos a la sombra, pavimento caliente y señales de sobrecalentamiento.',
    eyebrow: 'Seguridad canina en Miami',
    readingTime: '7 min de lectura',
  },
  'play-and-enrichment': {
    cardTitle: 'Juego y enriquecimiento',
    description:
      'Aprende a elegir juguetes para perros según su forma de jugar, tamaño, actividad, fabricación, supervisión necesaria, rotación de juguetes y señales de desgaste.',
    eyebrow: 'Juego y enriquecimiento',
    readingTime: '8 min de lectura',
  },
  'walk-and-travel': {
    cardTitle: 'Paseos y viajes',
    description:
      'Prepara los paseos, viajes en auto, excursiones y otras aventuras con consejos sobre equipo, hidratación, identificación, comodidad, calor y organización.',
    eyebrow: 'Paseos y viajes',
    readingTime: '8 min de lectura',
  },
  'feeding-and-hydration': {
    cardTitle: 'Alimentación e hidratación',
    description:
      'Elige tazones, productos de agua portátiles y accesorios de alimentación según su capacidad, estabilidad, materiales, limpieza, uso en viajes y rutinas diarias.',
    eyebrow: 'Alimentación e hidratación',
    readingTime: '7 min de lectura',
  },
};

/** Translate preview copy without changing canonical slugs or article URLs. */
export function getHomepagePetGuides(locale: Locale): HomepagePetGuide[] {
  return homepagePetGuides.map((guide) => {
    if (locale !== 'es') return { ...guide };

    const translation = spanishHomepageGuides[guide.slug];
    if (!translation) {
      throw new Error(`Missing Spanish homepage guide: ${guide.slug}`);
    }

    return { ...guide, ...translation };
  });
}