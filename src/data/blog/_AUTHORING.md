# Maxi Pawz Blog Authoring Standard

This directory is the source of truth for Maxi Pawz editorial content once the blog migration is complete.

Files beginning with `_` are documentation and are excluded from the Astro content collection.

## Editorial strategy

- Primary local market: Miami, Florida and South Florida.
- Commercial reach: the entire United States.
- Prioritize genuinely useful local content where Miami or South Florida changes the answer, such as heat, hurricanes, travel, outdoor routines, hydration, beaches, or seasonal conditions.
- Do not force Miami keywords into articles that do not have meaningful local intent.
- Do not invent a storefront, office, service area, credential, statistic, customer story, product claim, or local fact.
- Every article should answer a clear reader need first. SEO supports the content; it does not replace useful content.

## Required images

Every substantive article must contain several relevant images unless the subject genuinely does not benefit from them.

Default target:

1. One hero image.
2. Two to four contextual images distributed through the article.
3. More images only when they add useful information.

Images must directly support the section where they appear. Avoid decorative stock imagery that does not help explain the topic.

### Unsplash

Unsplash may be used when an appropriate Maxi Pawz-owned image is unavailable.

For every Unsplash image, record:

- descriptive `alt` text;
- an optional editorial `caption` when it adds context;
- photographer name and photographer profile URL under `credit`;
- `Unsplash` and the specific image URL under `source`;
- width and height when known.

The `BlogImage.astro` component renders this information as a small visible attribution below the image.

Example metadata:

```yaml
heroImage:
  src: "/images/blog/example-dog.webp"
  alt: "Golden retriever drinking water from a portable bowl outdoors"
  caption: "Portable water can make hot-weather walks easier to manage."
  width: 1600
  height: 1067
  credit:
    name: "Photographer Name"
    url: "https://unsplash.com/@photographer"
  source:
    name: "Unsplash"
    url: "https://unsplash.com/photos/example"
```

Do not write alt text as a list of SEO keywords. Describe the image accurately and concisely.

## Frontmatter template

```yaml
---
title: "Human-readable article title"
seoTitle: "Search-focused title"
description: "Reader-facing article summary."
seoDescription: "Search description written naturally."
publishedAt: 2026-08-18
updatedAt: 2026-08-18
author: "Maxi Pawz Store"
category: "Dog Care"
tags:
  - dogs
  - hydration
featured: false
showOnHomepage: false
indexable: true
heroImage:
  src: "/images/blog/example.webp"
  alt: "Accurate description of the hero image"
  width: 1600
  height: 1067
images: []
localSeo:
  primaryMarket: "Miami, FL"
  areas:
    - "Miami-Dade County"
    - "South Florida"
  localIntent: true
  nationwideRelevance: true
relatedPosts: []
relatedLinks: []
sources: []
ogImage: "/images/og/guides/example.webp"
ogImageAlt: "Social image description"
---
```

## Internal linking

Each article should include useful contextual links rather than relying only on a related-post block at the bottom.

Where relevant, link among:

- related Maxi Pawz educational articles;
- broader pillar guides;
- narrower supporting articles;
- product safety information;
- appropriate shop categories or products when the store is live;
- About or other trust-building pages when contextually useful;
- local Miami/South Florida content and broader nationwide evergreen content.

Anchor text should describe the destination naturally. Avoid repetitive exact-match keyword anchors.

## Sources

Use authoritative primary sources whenever possible for medical, public-safety, government, weather, emergency-management, regulatory, or scientific claims.

External sources used to substantiate the article should be recorded in `sources` so the article can display a clear reference section.

## Local SEO rule

Miami should be treated as Maxi Pawz's primary geographic content wedge, not as a keyword inserted into every page.

Set `localSeo.localIntent: true` only when location materially affects the article. Examples include hurricane preparedness, heat safety, outdoor activities, local travel, and seasonal South Florida routines.

For broadly applicable content, keep nationwide relevance and use local internal links only when they genuinely help the reader.
