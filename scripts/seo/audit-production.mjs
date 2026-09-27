/**
 * Maxi Pawz — production bilingual SEO smoke audit.
 * Run from the repository root:
 *   node scripts/seo/audit-production.mjs
 *
 * Read-only: this script never modifies the website or repository.
 * Requires Node.js 22+ (the version already specified in package.json).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const base = new URL(process.env.AUDIT_BASE_URL || 'https://maxipawz.com');
const blogDir = resolve('src/data/blog');
const spanishDir = join(blogDir, 'es');
const errors = [];
let pagesChecked = 0;

if (!existsSync(blogDir) || !existsSync(spanishDir)) {
  console.error('Run this script from the Maxi Pawz repository root.');
  process.exit(1);
}

function fail(message) {
  errors.push(message);
}
function normalizedPath(path) {
  return path.replace(/\/+$/, '') || '/';
}
function keyForUrl(value) {
  const url = new URL(value, base);
  return `${url.origin}${normalizedPath(url.pathname)}`;
}
function samePage(actual, expected) {
  return keyForUrl(actual) === keyForUrl(expected);
}
function at(path) {
  return new URL(path, base).toString();
}
function escapeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}
function getTagAttrs(tag) {
  const attributes = {};
  const pattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const [, key, double, single, bare] of tag.matchAll(pattern)) {
    attributes[key.toLowerCase()] = double ?? single ?? bare;
  }
  return attributes;
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) =>
    getTagAttrs(match[0]),
  );
}
function frontmatterField(source, field) {
  const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) return null;
  const match = fm[1].match(new RegExp(`^${field}:\\s*["']?([^"'\\r\\n]+)["']?\\s*$`, 'm'));
  return match?.[1]?.trim() ?? null;
}
function postsIn(directory) {
  const posts = new Map();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name.startsWith('_') || !/\.mdx?$/.test(entry.name)) continue;
    const slug = entry.name.replace(/\.mdx?$/, '');
    const source = readFileSync(join(directory, entry.name), 'utf8');
    posts.set(slug, {
      date: frontmatterField(source, 'publishedAt')?.slice(0, 10),
      indexable: frontmatterField(source, 'indexable') !== 'false',
      locale: frontmatterField(source, 'locale'),
      key: frontmatterField(source, 'translationKey'),
    });
  }
  return posts;
}
function nyDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
async function fetchText(url) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(20_000),
        headers: { 'user-agent': 'MaxiPawz-SEO-Audit/1.0' },
      });
      if ((response.status === 429 || response.status >= 500) && attempt === 0) {
        await new Promise((done) => setTimeout(done, 1_000));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { text: await response.text(), url: response.url };
    } catch (error) {
      if (attempt === 1 || /HTTP 4\d\d/.test(String(error))) throw error;
      await new Promise((done) => setTimeout(done, 1_000));
    }
  }
  throw new Error('Request failed');
}
function linksByRel(html, rel) {
  return tags(html, 'link').filter((link) => link.rel?.toLowerCase() === rel);
}
function metaByName(html, name) {
  return tags(html, 'meta').find((meta) => meta.name?.toLowerCase() === name);
}
function articleJsonLd(html) {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (getTagAttrs(match[1]).type !== 'application/ld+json') continue;
    try {
      const data = JSON.parse(match[2]);
      const nodes = Array.isArray(data) ? data : data['@graph'] || [data];
      const article = nodes.find((node) =>
        (Array.isArray(node['@type']) ? node['@type'] : [node['@type']]).some((type) =>
          ['BlogPosting', 'Article'].includes(type),
        ),
      );
      if (article) return article;
    } catch {
      /* Another script may be unrelated JSON-LD. */
    }
  }
  return null;
}
function checkDocument(html, path, locale, isArticle = false) {
  pagesChecked += 1;
  const label = path;
  const htmlTag = tags(html, 'html')[0];
  if (htmlTag?.lang !== locale) fail(`${label}: expected html lang="${locale}"`);
  if (!/<title>\s*[^<\s][\s\S]*?<\/title>/i.test(html)) fail(`${label}: missing page title`);
  if (!metaByName(html, 'description')?.content?.trim()) fail(`${label}: missing description`);
  if (/\bnoindex\b/i.test(metaByName(html, 'robots')?.content || '')) {
    fail(`${label}: unexpected noindex on an indexable page`);
  }
  const canonicals = linksByRel(html, 'canonical');
  if (canonicals.length !== 1 || !canonicals[0].href || !samePage(canonicals[0].href, at(path))) {
    fail(`${label}: canonical should point to its own ${at(path)}`);
  }
  const englishPath =
    locale === 'es' ? (normalizedPath(path) === '/es' ? '/' : normalizedPath(path).slice(3)) : path;
  const expected = {
    en: at(englishPath),
    es: at(englishPath === '/' ? '/es/' : `/es${normalizedPath(englishPath)}`),
    'x-default': at(englishPath),
  };
  const alternates = linksByRel(html, 'alternate').filter((link) => link.hreflang);
  for (const [lang, url] of Object.entries(expected)) {
    const found = alternates.filter((link) => link.hreflang === lang);
    if (found.length !== 1 || !found[0].href || !samePage(found[0].href, url)) {
      fail(`${label}: missing/incorrect hreflang="${lang}" (expected ${url})`);
    }
  }
  if (!isArticle) return;
  const article = articleJsonLd(html);
  if (!article) {
    fail(`${label}: missing BlogPosting JSON-LD`);
  } else {
    if (article.inLanguage !== (locale === 'es' ? 'es-US' : 'en-US')) {
      fail(`${label}: incorrect BlogPosting inLanguage`);
    }
    if (!article.url || !samePage(article.url, at(path))) {
      fail(`${label}: BlogPosting URL differs from the page URL`);
    }
  }
}
async function pool(items, worker, size = 5) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++];
        await worker(item);
      }
    }),
  );
}

async function main() {
  const english = postsIn(blogDir);
  const spanish = postsIn(spanishDir);
  const today = nyDate();

  for (const [slug, en] of english) {
    const es = spanish.get(slug);
    if (!es) {
      fail(`Missing Spanish MDX: ${slug}`);
      continue;
    }
    if (es.locale !== 'es' || es.key !== slug)
      fail(`${slug}: Spanish locale/translationKey mismatch`);
    if (en.date !== es.date || en.indexable !== es.indexable) {
      fail(`${slug}: EN/ES publication date or indexability differs`);
    }
  }
  for (const slug of spanish.keys()) {
    if (!english.has(slug)) fail(`Orphan Spanish MDX: ${slug}`);
  }

  const dueSlugs = [...english]
    .filter(
      ([slug, entry]) => entry.indexable && entry.date && entry.date <= today && spanish.has(slug),
    )
    .map(([slug]) => slug)
    .sort();

  console.log(`\nMaxi Pawz production SEO audit — ${base.origin}`);
  console.log(
    `Local content: ${english.size} EN / ${spanish.size} ES; ${dueSlugs.length} due to be published by ${today} (New York).`,
  );

  const robots = await fetchText(at('/robots.txt'));
  if (/^\s*Disallow:\s*\/\s*$/im.test(robots.text)) {
    fail('/robots.txt: production is blocking all crawlers');
  }
  if (!robots.text.includes(at('/sitemap-index.xml'))) {
    fail('/robots.txt: missing production sitemap URL');
  }

  const sitemapIndex = await fetchText(at('/sitemap-index.xml'));
  const sitemapFiles = [...sitemapIndex.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    escapeXml(match[1]),
  );
  if (!sitemapFiles.length) fail('/sitemap-index.xml: no sitemap files');

  const indexed = new Set();
  await pool(
    sitemapFiles,
    async (url) => {
      try {
        if (new URL(url).origin !== base.origin) {
          fail(`Sitemap file uses the wrong origin: ${url}`);
          return;
        }
        const { text } = await fetchText(url);
        for (const match of text.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)) {
          const entry = escapeXml(match[1]);
          if (new URL(entry).origin !== base.origin)
            fail(`Sitemap URL uses wrong origin: ${entry}`);
          indexed.add(keyForUrl(entry));
        }
      } catch (error) {
        fail(`Cannot read sitemap ${url}: ${error.message}`);
      }
    },
    3,
  );

  const paths = ['/', '/es/', '/pet-guides', '/es/pet-guides'];
  for (const slug of dueSlugs) {
    paths.push(`/pet-guides/${slug}`, `/es/pet-guides/${slug}`);
  }
  for (const path of paths) {
    if (!indexed.has(keyForUrl(at(path)))) fail(`${path}: missing from production sitemap`);
  }
  for (const slug of dueSlugs) {
    if (
      indexed.has(keyForUrl(at(`/pet-guides/${slug}`))) !==
      indexed.has(keyForUrl(at(`/es/pet-guides/${slug}`)))
    ) {
      fail(`${slug}: EN/ES sitemap entries do not match`);
    }
  }

  await pool(paths, async (path) => {
    try {
      const response = await fetchText(at(path));
      if (!samePage(response.url, at(path))) {
        fail(`${path}: redirects to unexpected page ${response.url}`);
      }
      const locale = normalizedPath(path) === '/es' || path.startsWith('/es/') ? 'es' : 'en';
      const isArticle = /^\/(?:es\/)?pet-guides\/[^/]+$/.test(path);
      checkDocument(response.text, path, locale, isArticle);
      if (isArticle && locale === 'es') {
        const content = response.text.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1];
        if (!content) {
          fail(`${path}: missing article content`);
          return;
        }
        for (const link of tags(content, 'a')) {
          if (!link.href || link.href.startsWith('#')) continue;
          let dest;
          try {
            dest = new URL(link.href, response.url);
          } catch {
            continue;
          }
          if (dest.origin !== base.origin) continue;
          if (/^\/pet-guides\/[^/]+\/?$/.test(dest.pathname)) {
            fail(`${path}: article links to English guide ${dest.pathname}`);
          }
          if (/^\/es\/pet-guides\/[^/]+\/?$/.test(dest.pathname) && !indexed.has(keyForUrl(dest))) {
            fail(`${path}: Spanish guide link is not published: ${dest.pathname}`);
          }
        }
      }
    } catch (error) {
      fail(`${path}: ${error.message}`);
    }
  });

  for (const issue of errors) console.error(`FAIL  ${issue}`);
  console.log(
    `\nChecked ${pagesChecked}/${paths.length} pages, ${sitemapFiles.length} sitemap file(s).`,
  );
  console.log(`Result: ${errors.length} error(s).`);
  if (errors.length) process.exitCode = 1;
  else console.log('PASS  Bilingual production SEO smoke audit passed.');
}

main().catch((error) => {
  console.error(`AUDIT ABORTED: ${error.stack || error.message}`);
  process.exitCode = 1;
});
