# Maxi Pawz blog scheduling

The blog uses `publishedAt` as its publication schedule.

## Editorial behavior by environment

The publication rules intentionally mirror the approach used by the SMART Solutions `dental-it` project:

- Local development, Netlify Branch Deploys, and Netlify Deploy Previews expose indexable future posts so they can be reviewed before publication.
- Netlify production builds (`CONTEXT=production`) expose only indexable posts whose `publishedAt` date is today or earlier in `America/New_York`.
- Production filtering applies to the `/pet-guides` index, generated article routes, and related-post cards.
- Because the site is statically generated, a production rebuild is required when a new publication date arrives so the new route, index card, sitemap entry, and related links are generated.

Keep publication dates in the existing date-only form:

```yaml
publishedAt: 2026-09-15
updatedAt: 2026-09-15
```

Do not add a separate draft/scheduled status unless the content schema is intentionally redesigned. The date plus deployment context is the publication state.

## Automatic production rebuild

`netlify/functions/rebuild-for-scheduled-blogs.ts` runs daily at `05:05 UTC`, shortly after midnight Eastern time throughout the year. The function calls a Netlify Build Hook so production is rebuilt and the date gate is re-evaluated.

One-time Netlify configuration is required after this feature is merged to the production branch:

1. In the production Netlify site, open **Project configuration → Build & deploy → Continuous deployment → Build hooks**.
2. Create a build hook named `Scheduled blog publication` targeting the production branch (`main`).
3. Store that hook URL as the server-only Netlify environment variable `BLOG_PUBLISH_BUILD_HOOK_URL` for the production context.
4. Trigger one deploy after configuring the variable so the scheduled function receives it.

Never commit the build-hook URL. Treat it as a deployment credential.

If the environment variable is missing, the scheduled function logs a warning and exits successfully instead of failing unrelated site functionality.

## Weekly content workflow

The weekly content task should prepare one editorial batch for the upcoming Monday through Sunday:

- create one fresh weekly branch from current `dev`;
- research the full week before writing;
- create up to seven strong, non-duplicative posts rather than forcing weak filler;
- assign the intended future date to each post's `publishedAt` field;
- open one PR into `dev` containing that weekly batch;
- review the future posts on the `dev` Branch Deploy / Deploy Preview;
- merge only after human review.

After the approved content reaches the production branch, future-dated posts remain absent from production until their scheduled date and the automatic daily production rebuild occurs.

## Validation checklist

Before approving a weekly content PR:

- run `npm run build`;
- run `npm run validate`;
- confirm all future posts are visible in the preview environment;
- confirm a production-context build excludes future posts;
- verify each scheduled post's hero/context images and attribution links;
- verify related-post cards never point to a not-yet-published production route;
- verify the `/pet-guides` index and sitemap expose only production-eligible posts.
