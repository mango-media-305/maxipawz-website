import preact from '@astrojs/preact';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import {
  defineConfig,
} from 'astro/config';

const site =
  process.env
    .PUBLIC_SITE_URL
    ?.trim() ||
  process.env.URL
    ?.trim() ||
  'https://maxipawz.com';

const storefrontMode =
  process.env
    .PUBLIC_STOREFRONT_MODE
    ?.trim() ??
  'prelaunch';

const storeIsLive =
  storefrontMode ===
  'live';

/*
 * These routes are functional, administrative,
 * transactional, campaign-specific, or intentionally
 * excluded policy pages.
 *
 * They remain available when visited directly, but they
 * are not submitted to search engines through the
 * generated sitemap.
 */
const alwaysExcludedSitemapPaths =
  [
    '/404',

    '/admin',

    '/api',

    '/cart',

    '/checkout',

    '/contact/success',

    /*
     * Featured product campaign pages normally remain
     * noindex and canonicalize to /shop/<product>.
     *
     * If an evergreen featured page is intentionally made
     * indexable later, revisit this sitemap policy as part
     * of that launch.
     */
    '/featured',

    '/join/success',

    '/privacy-policy',

    '/terms',

    '/shipping-policy',

    '/return-policy',

    '/accessibility',
  ];

function normalizePathname(
  pathname,
) {
  if (
    pathname ===
    '/'
  ) {
    return '/';
  }

  return pathname.replace(
    /\/+$/,
    '',
  );
}

function matchesPathOrDescendant(
  pathname,

  excludedPath,
) {
  return (
    pathname ===
    excludedPath ||
    pathname.startsWith(
      `${excludedPath}/`,
    )
  );
}

function shouldIncludeInSitemap(
  page,
) {
  const pageURL =
    new URL(
      page,
    );

  const pathname =
    normalizePathname(
      pageURL.pathname,
    );

  const isAlwaysExcluded =
    alwaysExcludedSitemapPaths.some(
      (
        excludedPath,
      ) =>
        matchesPathOrDescendant(
          pathname,

          excludedPath,
        ),
    );

  if (
    isAlwaysExcluded
  ) {
    return false;
  }

  /*
   * During prelaunch, the shop and its fictional/demo
   * product-detail pages use noindex and should not be
   * submitted through the sitemap.
   *
   * Once PUBLIC_STOREFRONT_MODE becomes "live", the shop
   * and real product pages become eligible for inclusion.
   */
  if (
    !storeIsLive &&
    matchesPathOrDescendant(
      pathname,

      '/shop',
    )
  ) {
    return false;
  }

  return true;
}

export default defineConfig(
  {
    site,

    output:
      'static',

    integrations: [
      preact(),

      sitemap(
        {
          filter:
            shouldIncludeInSitemap,
        },
      ),
    ],

    vite: {
      plugins: [
        tailwindcss(),
      ],
    },
  },
);