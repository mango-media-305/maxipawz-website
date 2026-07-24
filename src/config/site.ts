export const siteConfig = {
  name: 'MaxiPawz Store',
  shortName: 'MaxiPawz',

  description:
    'A joyful pet store for toys, accessories, travel gear, hydration essentials, and everyday supplies.',

  language: 'en',
  locale: 'en_US',
  currency: 'USD',
  country: 'US',

  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
  },
} as const;

export type SiteConfig = typeof siteConfig;