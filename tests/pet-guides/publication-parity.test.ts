import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const englishDirectory = join(repositoryRoot, 'src/data/blog');

const spanishDirectory = join(englishDirectory, 'es');

interface PublicationSettings {
  slug: string;
  publishedAt: string;
  indexable: boolean;
}

function readFrontmatter(directory: string, filename: string): string {
  const source = readFileSync(join(directory, filename), 'utf8');

  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  assert.ok(match?.[1] !== undefined, `${filename}: missing YAML frontmatter`);

  return match[1];
}

function readPublicationSettings(directory: string, filename: string): PublicationSettings {
  const frontmatter = readFrontmatter(directory, filename);

  const slug = filename.replace(/\.mdx?$/, '');

  const publishedAt = frontmatter.match(/^publishedAt:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1];

  assert.ok(publishedAt !== undefined, `${filename}: publishedAt must use YYYY-MM-DD`);

  const parsedDate = new Date(`${publishedAt}T00:00:00Z`);

  assert.ok(
    !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === publishedAt,
    `${filename}: publishedAt is not a valid date`,
  );

  const rawIndexable = frontmatter.match(/^indexable:\s*(true|false)\s*$/m)?.[1];

  const indexable = rawIndexable !== 'false';

  return {
    slug,
    publishedAt,
    indexable,
  };
}

function getPosts(directory: string): Map<string, PublicationSettings> {
  const posts = new Map<string, PublicationSettings>();

  const filenames = readdirSync(directory)
    .filter((filename) => !filename.startsWith('_') && /\.mdx?$/.test(filename))
    .sort();

  for (const filename of filenames) {
    const settings = readPublicationSettings(directory, filename);

    assert.ok(!posts.has(settings.slug), `Duplicate guide slug: ${settings.slug}`);

    posts.set(settings.slug, settings);
  }

  return posts;
}

test('English and Spanish Pet Guides publish on the same date', () => {
  const english = getPosts(englishDirectory);
  const spanish = getPosts(spanishDirectory);

  assert.ok(english.size > 0, 'No English Pet Guides found');

  assert.deepEqual(
    [...spanish.keys()].sort(),
    [...english.keys()].sort(),
    'Every published guide must have both language versions',
  );

  for (const [slug, englishPost] of english) {
    const spanishPost = spanish.get(slug);

    assert.ok(spanishPost !== undefined, `${slug}: missing Spanish guide`);

    assert.equal(
      spanishPost.publishedAt,
      englishPost.publishedAt,
      `${slug}: English and Spanish publication dates differ`,
    );

    assert.equal(
      spanishPost.indexable,
      englishPost.indexable,
      `${slug}: English and Spanish indexability settings differ`,
    );
  }
});
