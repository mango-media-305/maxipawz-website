import type { Config } from '@netlify/functions';

const BLOG_BUILD_HOOK_ENV = 'BLOG_PUBLISH_BUILD_HOOK_URL';

export default async function handler(): Promise<void> {
  const buildHookUrl = Netlify.env.get(BLOG_BUILD_HOOK_ENV)?.trim();

  if (!buildHookUrl) {
    console.warn(
      `${BLOG_BUILD_HOOK_ENV} is not configured. Skipping the scheduled blog publication rebuild.`,
    );
    return;
  }

  const response = await fetch(buildHookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      trigger: 'scheduled-blog-publication',
      requestedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Scheduled blog rebuild failed with ${response.status}: ${responseBody.slice(0, 300)}`,
    );
  }

  console.log('Scheduled blog publication rebuild requested successfully.');
}

export const config: Config = {
  // 05:05 UTC publishes date-based posts shortly after midnight Eastern time
  // throughout the year (00:05 EST / 01:05 EDT).
  schedule: '5 5 * * *',
};
