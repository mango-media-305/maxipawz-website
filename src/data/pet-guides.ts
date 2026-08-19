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
