import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const site =
  process.env.PUBLIC_SITE_URL?.trim() ||
  process.env.URL?.trim() ||
  'https://maxipawz.com';

const storefrontMode =
  process.env.PUBLIC_STOREFRONT_MODE?.trim() ?? 'prelaunch';

const storeIsLive = storefrontMode === 'live';

/*
 * Functional, administrative, transactional, campaign,
 * and intentionally excluded policy pages do not belong
 * in the search sitemap.
 *
 * Excluding a route here does not remove it from the site.
 * Its page-level robots policy remains responsible for
 * controlling whether search engines may index it.
 */
const alwaysExcludedSitemapPaths = [
  '/404',
  '/admin',
  '/api',
  '/cart',
  '/checkout',
  '/contact/success',
  '/email',
  '/featured',
  '/join',
  '/privacy-policy',
  '/terms',
  '/shipping-policy',
  '/return-policy',
  '/accessibility',
];

function normalizePathname(pathname) {
  if (pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/+$/, '');
}

function matchesPathOrDescendant(pathname, excludedPath) {
  return (
    pathname === excludedPath ||
    pathname.startsWith(`${excludedPath}/`)
  );
}

function shouldIncludeInSitemap(page) {
  const pageURL = new URL(page);
  const pathname = normalizePathname(pageURL.pathname);

  const isAlwaysExcluded = alwaysExcludedSitemapPaths.some(
    (excludedPath) =>
      matchesPathOrDescendant(pathname, excludedPath),
  );

  if (isAlwaysExcluded) {
    return false;
  }

  /*
   * Preserve the existing prelaunch restriction.
   * Shop routes remain excluded until the storefront
   * is intentionally placed in live mode.
   */
  if (
    !storeIsLive &&
    matchesPathOrDescendant(pathname, '/shop')
  ) {
    return false;
  }

  return true;
}

export default defineConfig({
  site,
  output: 'static',

  integrations: [
    mdx(),
    preact(),
    sitemap({
      filter: shouldIncludeInSitemap,
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});