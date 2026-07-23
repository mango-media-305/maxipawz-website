export const siteConfig = {
  name: 'MaxiPawz Store',
  shortName: 'MaxiPawz',
  description: 'A joyful pet-toy store created for playful pets and the people who love them.',
  language: 'en',
  locale: 'en_US',
  currency: 'USD',
  country: 'US',

  announcement: {
    enabled: true,
    message: 'Play more. Wag more. Love more.',
  },

  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
