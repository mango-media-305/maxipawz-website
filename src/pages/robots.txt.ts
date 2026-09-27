import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const siteURL = site ?? new URL('https://maxipawz.com');

  const explicitNoIndex =
    import.meta.env.PUBLIC_ROBOTS_NOINDEX?.trim().toLowerCase() === 'true';

  const deploymentContext =
    process.env.CONTEXT?.trim().toLowerCase();

  const isPreviewDeployment =
    deploymentContext === 'deploy-preview' ||
    deploymentContext === 'branch-deploy';

  /*
   * Keep preview deployments blocked even if their explicit
   * noindex environment variable is accidentally disabled.
   */
  const blockCrawling = explicitNoIndex || isPreviewDeployment;

  const sitemapURL = new URL('/sitemap-index.xml', siteURL);

  /*
   * A single wildcard group preserves the existing production
   * allow policy without repeating identical rules for each bot.
   *
   * Page-level indexing decisions remain in the page metadata.
   */
  const robotsContent = blockCrawling
    ? [
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${sitemapURL.toString()}`,
        '',
      ].join('\n');

  return new Response(robotsContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};