import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
    const siteURL =
        site ?? new URL('https://maxi-pawz.netlify.app');

    const blockIndexing =
        import.meta.env.PUBLIC_ROBOTS_NOINDEX === 'true';

    const sitemapURL = new URL(
        '/sitemap-index.xml',
        siteURL,
    );

    const robotsContent = blockIndexing
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