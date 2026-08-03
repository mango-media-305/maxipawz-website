const configuredSiteUrl =
  import.meta.env.PUBLIC_SITE_URL ?? 'https://maxi-pawz.netlify.app';

export const siteConfig = {
  name: 'MaxiPawz Store',
  shortName: 'MaxiPawz',
  url: configuredSiteUrl,

  description:
    'A joyful online pet store for thoughtfully selected toys, accessories, travel gear, hydration essentials, and everyday supplies.',

  slogan: 'Happy Pets • Happy Life',

  language: 'en',
  locale: 'en_US',
  currency: 'USD',
  country: 'US',

  social: {
    instagram: 'https://www.instagram.com/maxipawzstore/',
    facebook: 'https://www.facebook.com/maxipawzstore/',
    tiktok: 'https://www.tiktok.com/@maxipawzstore',
  },
} as const;

export type SiteConfig = typeof siteConfig;