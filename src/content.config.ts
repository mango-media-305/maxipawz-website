import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const imageCreditSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

const blogImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  credit: imageCreditSchema.optional(),
  source: z
    .object({
      name: z.string().min(1),
      url: z.string().url(),
    })
    .optional(),
});

const sourceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.string().url(),
  accessedAt: z.coerce.date().optional(),
});

const localSeoSchema = z.object({
  primaryMarket: z.string().default('Miami, FL'),
  areas: z.array(z.string()).default([]),
  localIntent: z.boolean().default(false),
  nationwideRelevance: z.boolean().default(true),
});

const blog = defineCollection({
  loader: glob({
    base: './src/data/blog',
    pattern: '**/[^_]*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string().min(1),
    seoTitle: z.string().min(1),
    description: z.string().min(1),
    seoDescription: z.string().min(1),

    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),

    author: z.string().default('Maxi Pawz Store'),
    category: z.string().min(1),
    tags: z.array(z.string()).default([]),

    featured: z.boolean().default(false),
    showOnHomepage: z.boolean().default(false),
    indexable: z.boolean().default(true),

    heroImage: blogImageSchema,
    images: z.array(blogImageSchema).default([]),

    localSeo: localSeoSchema.default({
      primaryMarket: 'Miami, FL',
      areas: [],
      localIntent: false,
      nationwideRelevance: true,
    }),

    relatedPosts: z.array(z.string()).default([]),
    relatedLinks: z
      .array(
        z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          href: z.string().min(1),
        }),
      )
      .default([]),

    sources: z.array(sourceSchema).default([]),

    ogImage: z.string().optional(),
    ogImageAlt: z.string().optional(),
  }),
});

export const collections = { blog };
