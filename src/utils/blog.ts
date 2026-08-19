import type { CollectionEntry } from 'astro:content';

import { siteConfig } from '../config/site';

type BlogPost = CollectionEntry<'blog'>;

export const getBlogPostPath = (post: BlogPost) => `/pet-guides/${post.id}`;

export const getBlogPostUrl = (post: BlogPost, site = siteConfig.url) =>
  new URL(getBlogPostPath(post), site).toString();

export const sortBlogPostsNewestFirst = (posts: BlogPost[]) =>
  [...posts].sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

export const getIndexableBlogPosts = (posts: BlogPost[]) =>
  posts.filter((post) => post.data.indexable);

export const getBlogReadingTime = (body: string | undefined) => {
  const words = body?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const minutes = Math.max(1, Math.ceil(words / 220));

  return `${minutes} min read`;
};

export const buildBlogStructuredData = ({
  post,
  site = siteConfig.url,
}: {
  post: BlogPost;
  site?: string;
}) => {
  const homeUrl = new URL('/', site).toString();
  const petGuidesUrl = new URL('/pet-guides', site).toString();
  const postUrl = getBlogPostUrl(post, site);
  const imageUrl = new URL(post.data.ogImage ?? post.data.heroImage.src, site).toString();
  const organizationId = `${homeUrl}#organization`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: siteConfig.name,
        url: homeUrl,
      },
      {
        '@type': 'BlogPosting',
        '@id': `${postUrl}#article`,
        url: postUrl,
        headline: post.data.title,
        description: post.data.seoDescription,
        image: {
          '@type': 'ImageObject',
          url: imageUrl,
          caption: post.data.ogImageAlt ?? post.data.heroImage.alt,
        },
        articleSection: post.data.category,
        keywords: post.data.tags.join(', '),
        inLanguage: 'en-US',
        datePublished: post.data.publishedAt.toISOString(),
        dateModified: post.data.updatedAt.toISOString(),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': postUrl,
        },
        isPartOf: {
          '@type': 'Blog',
          '@id': petGuidesUrl,
          name: 'Maxi Pawz Pet Guides',
          url: petGuidesUrl,
        },
        author: {
          '@type': 'Organization',
          '@id': organizationId,
          name: post.data.author,
        },
        publisher: {
          '@id': organizationId,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: homeUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Pet Guides',
            item: petGuidesUrl,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.data.title,
            item: postUrl,
          },
        ],
      },
    ],
  };
};
