## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Blog and Pet Guides

- `dev` is the source branch for blog-system and editorial work. Feature/content branches must originate from the current `dev` branch and pull requests must target `dev`.
- Blog content belongs in the Astro `blog` content collection defined by `src/content.config.ts`.
- Follow `src/data/blog/_AUTHORING.md` for the complete editorial standard.
- Miami, Florida and South Florida are the primary local SEO market; nationwide United States relevance remains important.
- Use local keywords and local context only when location materially changes the reader's problem or answer. Do not use artificial local keyword stuffing.
- Every substantive blog post should contain several useful, topic-relevant images: normally one hero image plus two to four contextual images.
- Maxi Pawz-owned images are preferred when appropriate. Unsplash may be used when needed.
- Every Unsplash image must include photographer credit, photographer URL, source name, specific source URL, accurate alt text, and dimensions when known. Render attribution visibly below the image using `src/components/blog/BlogImage.astro`.
- External factual claims that benefit from verification should use authoritative sources, recorded in the article's `sources` frontmatter and rendered with `src/components/blog/ArticleSources.astro`.
- Add contextual internal links throughout articles. Do not rely only on a related-post block.
- Preserve existing indexed Pet Guide URLs during migration unless an explicit SEO reason requires a redirect.
