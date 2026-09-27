import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const blogDirectory = join(repositoryRoot, 'src/data/blog');
const spanishDirectory = join(blogDirectory, 'es');
const translationManifest = join(repositoryRoot, 'src/i18n/pet-guides.ts');

function getPostSlugs(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('_') && /\.mdx?$/.test(entry.name))
    .map((entry) => entry.name.replace(/\.mdx?$/, ''))
    .sort();
}

function readPost(directory: string, slug: string): string {
  const mdx = join(directory, `${slug}.mdx`);
  const md = join(directory, `${slug}.md`);
  const path = existsSync(mdx) ? mdx : md;

  assert.ok(existsSync(path), `Missing post: ${path}`);

  return readFileSync(path, 'utf8');
}

test('every English Pet Guide has a Spanish peer in the translation manifest', () => {
  const englishSlugs = getPostSlugs(blogDirectory);
  const spanishSlugs = getPostSlugs(spanishDirectory);

  assert.ok(englishSlugs.length > 0, 'No English Pet Guides found');

  assert.deepEqual(
    spanishSlugs,
    englishSlugs,
    'English and Spanish Pet Guides must be published together',
  );

  const manifest = readFileSync(translationManifest, 'utf8');

  const entries = [...manifest.matchAll(/^\s*'([a-z0-9-]+)',\s*$/gm)].flatMap((match) => {
    const slug = match[1];
    return slug === undefined ? [] : [slug];
  });

  assert.equal(
    entries.length,
    new Set(entries).size,
    'Duplicate slug in the translated Pet Guides manifest',
  );

  assert.deepEqual(
    [...entries].sort(),
    englishSlugs,
    'Keep the route translation manifest aligned with actual MDX posts',
  );
});

test('Spanish guides have matching locale metadata and no links back to English guides', () => {
  for (const slug of getPostSlugs(spanishDirectory)) {
    const source = readPost(spanishDirectory, slug);

    const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

    const frontmatter = frontmatterMatch?.[1];

    assert.ok(frontmatter !== undefined, `${slug}: missing YAML frontmatter`);

    assert.match(frontmatter, /^locale:\s*es\s*$/m, `${slug}: locale must be es`);

    const translationKey = frontmatter.match(/^translationKey:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1];

    assert.equal(translationKey, slug, `${slug}: translationKey must match the English slug`);

    const englishLinks = [...source.matchAll(/(?<!\/es)\/pet-guides\/[a-z][a-z0-9-]*/g)].map(
      (match) => match[0],
    );

    assert.deepEqual(
      englishLinks,
      [],
      `${slug}: link to the Spanish guide when a translation exists`,
    );
  }
});

test('relative imports in Spanish MDX resolve to real files', () => {
  for (const slug of getPostSlugs(spanishDirectory)) {
    const source = readPost(spanishDirectory, slug);

    for (const match of source.matchAll(
      /^\s*import\s+[^\r\n]+\s+from\s+['"](\.\.?\/[^'"]+)['"]/gm,
    )) {
      const relativePath = match[1];

      assert.ok(relativePath !== undefined, `${slug}: missing relative import path`);

      const importPath = resolve(spanishDirectory, relativePath);

      assert.ok(existsSync(importPath), `${slug}: unresolved relative MDX import ${relativePath}`);
    }
  }
});

test('shared article layout owns sources and related posts in both languages', () => {
  for (const directory of [blogDirectory, spanishDirectory]) {
    const source = readPost(directory, 'dog-snake-bite-safety-florida');

    assert.doesNotMatch(
      source,
      /<(?:ArticleSources|RelatedPosts)\b/,
      'Do not render sources and related posts twice',
    );
  }
});
