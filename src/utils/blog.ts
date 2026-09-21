import { env } from 'node:process';

import type {
  CollectionEntry,
} from 'astro:content';

import { siteConfig } from '../config/site';

import type {
  Locale,
} from '../i18n/languages';

type BlogPost =
  CollectionEntry<'blog'>;

export const BLOG_PUBLICATION_TIME_ZONE =
  'America/New_York';

const blogPublicationDateFormatter =
  new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone:
        BLOG_PUBLICATION_TIME_ZONE,

      year:
        'numeric',

      month:
        '2-digit',

      day:
        '2-digit',
    },
  );

function normalizeBlogEntryId(
  id:
    string,
): string {
  return id
    .replace(
      /\.(md|mdx)$/i,
      '',
    )
    .replace(
      /^es\//,
      '',
    );
}

export function getBlogPostLocale(
  post:
    BlogPost,
): Locale {
  return post.data.locale;
}

export function getBlogPostSlug(
  post:
    BlogPost,
): string {
  return (
    post.data.translationKey
      ?.trim() ||
    normalizeBlogEntryId(
      post.id,
    )
  );
}

export function getBlogPostPath(
  post:
    BlogPost,
): string {
  const slug =
    getBlogPostSlug(
      post,
    );

  return getBlogPostLocale(
    post,
  ) ===
    'es'
    ? `/es/pet-guides/${slug}`
    : `/pet-guides/${slug}`;
}

export function getBlogPostUrl(
  post:
    BlogPost,

  site =
    siteConfig.url,
): string {
  return new URL(
    getBlogPostPath(
      post,
    ),
    site,
  ).toString();
}

export function getBlogPostsForLocale(
  posts:
    BlogPost[],

  locale:
    Locale,
): BlogPost[] {
  return posts.filter(
    (
      post,
    ) =>
      getBlogPostLocale(
        post,
      ) ===
      locale,
  );
}

export function getBlogPostBySlug(
  posts:
    BlogPost[],

  slug:
    string,

  locale:
    Locale,
): BlogPost | undefined {
  return posts.find(
    (
      post,
    ) =>
      getBlogPostLocale(
        post,
      ) ===
        locale &&
      getBlogPostSlug(
        post,
      ) ===
        slug,
  );
}

export function sortBlogPostsNewestFirst(
  posts:
    BlogPost[],
): BlogPost[] {
  return [
    ...posts,
  ].sort(
    (
      first,
      second,
    ) =>
      second.data
        .publishedAt
        .getTime() -
      first.data
        .publishedAt
        .getTime(),
  );
}

export function getBlogPublicationDateKey(
  date =
    new Date(),
): string {
  const parts =
    blogPublicationDateFormatter
      .formatToParts(
        date,
      );

  const year =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        'year',
    )?.value;

  const month =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        'month',
    )?.value;

  const day =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        'day',
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    throw new Error(
      'Unable to resolve the current blog publication date.',
    );
  }

  return `${year}-${month}-${day}`;
}

export function getBlogPostPublicationDateKey(
  post:
    BlogPost,
): string {
  return post.data
    .publishedAt
    .toISOString()
    .slice(
      0,
      10,
    );
}

export function isBlogPostPublished(
  post:
    BlogPost,

  referenceDate =
    new Date(),
): boolean {
  return (
    getBlogPostPublicationDateKey(
      post,
    ) <=
    getBlogPublicationDateKey(
      referenceDate,
    )
  );
}

export function shouldExposeScheduledBlogPosts():
  boolean {
  return (
    env.CONTEXT !==
    'production'
  );
}

export function getIndexableBlogPosts(
  posts:
    BlogPost[],

  referenceDate =
    new Date(),
): BlogPost[] {
  const indexablePosts =
    posts.filter(
      (
        post,
      ) =>
        post.data.indexable,
    );

  if (
    shouldExposeScheduledBlogPosts()
  ) {
    return indexablePosts;
  }

  return indexablePosts.filter(
    (
      post,
    ) =>
      isBlogPostPublished(
        post,
        referenceDate,
      ),
  );
}

export function getIndexableBlogPostsForLocale(
  posts:
    BlogPost[],

  locale:
    Locale,

  referenceDate =
    new Date(),
): BlogPost[] {
  return getIndexableBlogPosts(
    getBlogPostsForLocale(
      posts,
      locale,
    ),
    referenceDate,
  );
}

export function getBlogReadingTime(
  body:
    string |
    undefined,

  locale:
    Locale = 'en',
): string {
  const words =
    body
      ?.trim()
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      )
      .length ??
    0;

  const minutes =
    Math.max(
      1,
      Math.ceil(
        words /
          220,
      ),
    );

  return locale ===
    'es'
    ? `${minutes} min de lectura`
    : `${minutes} min read`;
}

export function buildBlogStructuredData({
  post,
  site = siteConfig.url,
}: {
  post:
    BlogPost;

  site?:
    string;
}) {
  const locale =
    getBlogPostLocale(
      post,
    );

  const spanish =
    locale ===
    'es';

  const homePath =
    spanish
      ? '/es/'
      : '/';

  const guidesPath =
    spanish
      ? '/es/pet-guides'
      : '/pet-guides';

  const homeUrl =
    new URL(
      homePath,
      site,
    ).toString();

  const petGuidesUrl =
    new URL(
      guidesPath,
      site,
    ).toString();

  const postUrl =
    getBlogPostUrl(
      post,
      site,
    );

  const imageUrl =
    new URL(
      post.data.ogImage ??
        post.data.heroImage.src,
      site,
    ).toString();

  const organizationUrl =
    new URL(
      '/',
      site,
    ).toString();

  const organizationId =
    `${organizationUrl}#organization`;

  return {
    '@context':
      'https://schema.org',

    '@graph': [
      {
        '@type':
          'Organization',

        '@id':
          organizationId,

        name:
          siteConfig.name,

        url:
          organizationUrl,
      },

      {
        '@type':
          'BlogPosting',

        '@id':
          `${postUrl}#article`,

        url:
          postUrl,

        headline:
          post.data.title,

        description:
          post.data
            .seoDescription,

        image: {
          '@type':
            'ImageObject',

          url:
            imageUrl,

          caption:
            post.data
              .ogImageAlt ??
            post.data
              .heroImage
              .alt,
        },

        articleSection:
          post.data.category,

        keywords:
          post.data.tags.join(
            ', ',
          ),

        inLanguage:
          spanish
            ? 'es-US'
            : 'en-US',

        datePublished:
          post.data
            .publishedAt
            .toISOString(),

        dateModified:
          post.data
            .updatedAt
            .toISOString(),

        mainEntityOfPage: {
          '@type':
            'WebPage',

          '@id':
            postUrl,
        },

        isPartOf: {
          '@type':
            'Blog',

          '@id':
            petGuidesUrl,

          name:
            spanish
              ? 'Guías para mascotas de Maxi Pawz'
              : 'Maxi Pawz Pet Guides',

          url:
            petGuidesUrl,
        },

        author: {
          '@type':
            'Organization',

          '@id':
            organizationId,

          name:
            post.data.author,
        },

        publisher: {
          '@id':
            organizationId,
        },
      },

      {
        '@type':
          'BreadcrumbList',

        itemListElement: [
          {
            '@type':
              'ListItem',

            position:
              1,

            name:
              spanish
                ? 'Inicio'
                : 'Home',

            item:
              homeUrl,
          },

          {
            '@type':
              'ListItem',

            position:
              2,

            name:
              spanish
                ? 'Guías para mascotas'
                : 'Pet Guides',

            item:
              petGuidesUrl,
          },

          {
            '@type':
              'ListItem',

            position:
              3,

            name:
              post.data.title,

            item:
              postUrl,
          },
        ],
      },
    ],
  };
}