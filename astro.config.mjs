import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const site =
  process.env.PUBLIC_SITE_URL ??
  process.env.URL ??
  'https://maxi-pawz.netlify.app';

export default defineConfig({
  site,

  output: 'static',

  integrations: [preact(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});