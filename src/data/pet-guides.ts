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

export type PetGuideIcon =
  | 'choosing'
  | 'play'
  | 'travel'
  | 'hydration'
  | 'comfort'
  | 'care'
  | 'accessories';

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

const homepagePetGuidesEs: HomepagePetGuide[] = [
  {
    slug: 'dog-hydration-miami-heat',
    href: '/pet-guides/dog-hydration-miami-heat',
    cardTitle: 'Hidratación para perros en el calor de Miami',
    description:
      'Planifica paseos más seguros en días calurosos con consejos prácticos sobre agua fresca, horarios más frescos, descansos a la sombra, pavimento caliente y señales de sobrecalentamiento.',
    eyebrow: 'Seguridad canina en Miami',
    icon: 'hydration',
    tone: 'brand',
    readingTime: '7 min de lectura',
  },
  {
    slug: 'play-and-enrichment',
    href: '/pet-guides/play-and-enrichment',
    cardTitle: 'Juego y enriquecimiento',
    description:
      'Aprende a elegir juguetes para perros según su estilo de juego, tamaño, nivel de actividad, construcción, necesidades de supervisión, rotación de juguetes y señales de que es hora de reemplazarlos.',
    eyebrow: 'Juego y enriquecimiento',
    icon: 'play',
    tone: 'accent',
    readingTime: '8 min de lectura',
  },
  {
    slug: 'walk-and-travel',
    href: '/pet-guides/walk-and-travel',
    cardTitle: 'Paseos y viajes',
    description:
      'Prepárate para paseos, viajes en auto, excursiones de un día y aventuras más largas con consejos prácticos sobre equipo, hidratación, identificación, comodidad, calor y organización.',
    eyebrow: 'Paseos y viajes',
    icon: 'travel',
    tone: 'brand',
    readingTime: '8 min de lectura',
  },
  {
    slug: 'feeding-and-hydration',
    href: '/pet-guides/feeding-and-hydration',
    cardTitle: 'Alimentación e hidratación',
    description:
      'Elige recipientes para comida, productos portátiles de agua y accesorios de alimentación según su capacidad, estabilidad, materiales, limpieza, necesidades de viaje y rutinas diarias.',
    eyebrow: 'Alimentación e hidratación',
    icon: 'hydration',
    tone: 'sand',
    readingTime: '7 min de lectura',
  },
];

export function getHomepagePetGuides(locale: Locale): HomepagePetGuide[] {
  return locale === 'es' ? homepagePetGuidesEs : homepagePetGuides;
}
