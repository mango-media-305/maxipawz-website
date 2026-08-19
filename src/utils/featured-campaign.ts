export interface FeaturedCampaignContext {
    landingPageSlug: string;

    campaignId: string;

    productSlug: string;

    channel?: string;

    audience?: string;
}

export interface FeaturedCampaignAttribution {
    version: 1;

    landingPageSlug: string;

    campaignId: string;

    productSlug: string;

    channel?: string;

    audience?: string;

    utmSource?: string;

    utmMedium?: string;

    utmCampaign?: string;

    utmContent?: string;

    utmTerm?: string;

    referrerHost?: string;

    capturedAt: number;

    expiresAt: number;
}

export type AnalyticsParameter =
    | string
    | number
    | boolean;

export type AnalyticsParameters =
    Record<
        string,
        AnalyticsParameter | undefined
    >;

interface AnalyticsWindow
    extends Window {
    gtag?: (
        ...args: unknown[]
    ) => void;

    clarity?: (
        ...args: unknown[]
    ) => void;
}

const ATTRIBUTION_STORAGE_KEY =
    'maxipawz-featured-campaign-v1';

const ATTRIBUTION_LIFETIME_MS =
    30 *
    24 *
    60 *
    60 *
    1000;

const ANALYTICS_EVENT_NAME =
    'maxipawz:analytics-event';

let memoryAttribution:
    | FeaturedCampaignAttribution
    | null = null;

function isBrowser(): boolean {
    return (
        typeof window !==
        'undefined'
    );
}

function isRecord(
    value: unknown,
): value is Record<
    string,
    unknown
> {
    return (
        typeof value ===
        'object' &&
        value !== null &&
        !Array.isArray(
            value,
        )
    );
}

function sanitizeText(
    value:
        | string
        | null
        | undefined,

    maximumLength = 160,
):
    | string
    | undefined {
    if (!value) {
        return undefined;
    }

    const normalized =
        value
            .trim()
            .replace(
                /\s+/g,
                ' ',
            );

    if (!normalized) {
        return undefined;
    }

    return normalized.slice(
        0,
        maximumLength,
    );
}

function sanitizeRequiredText(
    value: string,

    maximumLength = 160,
): string {
    return (
        sanitizeText(
            value,
            maximumLength,
        ) ?? ''
    );
}

function getReferrerHost():
    | string
    | undefined {
    if (
        !isBrowser() ||
        !document.referrer
    ) {
        return undefined;
    }

    try {
        const referrer =
            new URL(
                document.referrer,
            );

        if (
            referrer.origin ===
            window.location.origin
        ) {
            return undefined;
        }

        return sanitizeText(
            referrer.hostname,
            120,
        );
    } catch {
        return undefined;
    }
}

function isValidStoredAttribution(
    value: unknown,
): value is FeaturedCampaignAttribution {
    if (
        !isRecord(
            value,
        )
    ) {
        return false;
    }

    if (
        value.version !==
        1 ||
        typeof value.landingPageSlug !==
        'string' ||
        typeof value.campaignId !==
        'string' ||
        typeof value.productSlug !==
        'string' ||
        typeof value.capturedAt !==
        'number' ||
        typeof value.expiresAt !==
        'number'
    ) {
        return false;
    }

    if (
        !Number.isFinite(
            value.capturedAt,
        ) ||
        !Number.isFinite(
            value.expiresAt,
        )
    ) {
        return false;
    }

    return true;
}

function removeStoredAttribution():
    void {
    memoryAttribution =
        null;

    if (!isBrowser()) {
        return;
    }

    try {
        window.localStorage.removeItem(
            ATTRIBUTION_STORAGE_KEY,
        );
    } catch {
        // Attribution can still live in memory
        // when localStorage is unavailable.
    }
}

export function captureFeaturedCampaignAttribution(
    context:
        FeaturedCampaignContext,
):
    | FeaturedCampaignAttribution
    | null {
    if (!isBrowser()) {
        return null;
    }

    const now =
        Date.now();

    const searchParameters =
        new URLSearchParams(
            window.location.search,
        );

    const attribution:
        FeaturedCampaignAttribution =
    {
        version: 1,

        landingPageSlug:
            sanitizeRequiredText(
                context.landingPageSlug,
            ),

        campaignId:
            sanitizeRequiredText(
                context.campaignId,
            ),

        productSlug:
            sanitizeRequiredText(
                context.productSlug,
            ),

        channel:
            sanitizeText(
                context.channel,
            ),

        audience:
            sanitizeText(
                context.audience,
            ),

        utmSource:
            sanitizeText(
                searchParameters.get(
                    'utm_source',
                ),
            ),

        utmMedium:
            sanitizeText(
                searchParameters.get(
                    'utm_medium',
                ),
            ),

        utmCampaign:
            sanitizeText(
                searchParameters.get(
                    'utm_campaign',
                ),
            ),

        utmContent:
            sanitizeText(
                searchParameters.get(
                    'utm_content',
                ),
            ),

        utmTerm:
            sanitizeText(
                searchParameters.get(
                    'utm_term',
                ),
            ),

        referrerHost:
            getReferrerHost(),

        capturedAt:
            now,

        expiresAt:
            now +
            ATTRIBUTION_LIFETIME_MS,
    };

    memoryAttribution =
        attribution;

    try {
        window.localStorage.setItem(
            ATTRIBUTION_STORAGE_KEY,

            JSON.stringify(
                attribution,
            ),
        );
    } catch {
        // Keep the in-memory attribution when
        // storage is blocked or unavailable.
    }

    return attribution;
}

export function getFeaturedCampaignAttribution():
    | FeaturedCampaignAttribution
    | null {
    const now =
        Date.now();

    if (
        memoryAttribution
    ) {
        if (
            memoryAttribution.expiresAt >
            now
        ) {
            return {
                ...memoryAttribution,
            };
        }

        memoryAttribution =
            null;
    }

    if (!isBrowser()) {
        return null;
    }

    let rawValue:
        | string
        | null = null;

    try {
        rawValue =
            window.localStorage.getItem(
                ATTRIBUTION_STORAGE_KEY,
            );
    } catch {
        return null;
    }

    if (!rawValue) {
        return null;
    }

    try {
        const parsedValue =
            JSON.parse(
                rawValue,
            ) as unknown;

        if (
            !isValidStoredAttribution(
                parsedValue,
            )
        ) {
            removeStoredAttribution();

            return null;
        }

        if (
            parsedValue.expiresAt <=
            now
        ) {
            removeStoredAttribution();

            return null;
        }

        memoryAttribution =
            parsedValue;

        return {
            ...parsedValue,
        };
    } catch {
        removeStoredAttribution();

        return null;
    }
}

export function getFeaturedCampaignAnalyticsParameters(
    attribution:
        | FeaturedCampaignAttribution
        | null,
): AnalyticsParameters {
    if (!attribution) {
        return {};
    }

    return {
        landing_page_slug:
            attribution.landingPageSlug,

        campaign_id:
            attribution.campaignId,

        product_slug:
            attribution.productSlug,

        campaign_channel:
            attribution.channel,

        campaign_audience:
            attribution.audience,

        utm_source:
            attribution.utmSource,

        utm_medium:
            attribution.utmMedium,

        utm_campaign:
            attribution.utmCampaign,

        utm_content:
            attribution.utmContent,

        utm_term:
            attribution.utmTerm,

        referrer_host:
            attribution.referrerHost,
    };
}

export function trackAnalyticsEvent(
    eventName: string,

    parameters:
        AnalyticsParameters =
        {},
): void {
    if (!isBrowser()) {
        return;
    }

    const normalizedEventName =
        sanitizeRequiredText(
            eventName,
            80,
        );

    if (
        !normalizedEventName
    ) {
        return;
    }

    const cleanParameters:
        Record<
            string,
            AnalyticsParameter
        > = {};

    Object.entries(
        parameters,
    ).forEach(
        ([
            key,
            value,
        ]) => {
            if (
                value ===
                undefined
            ) {
                return;
            }

            cleanParameters[
                key
            ] = value;
        },
    );

    /*
     * Always dispatch a local browser event.
     *
     * This is useful for local/staging QA even when
     * GA4 and Clarity are intentionally disabled.
     */
    window.dispatchEvent(
        new CustomEvent(
            ANALYTICS_EVENT_NAME,
            {
                detail: {
                    name:
                        normalizedEventName,

                    parameters:
                        cleanParameters,
                },
            },
        ),
    );

    const analyticsWindow =
        window as
        AnalyticsWindow;

    /*
     * Analytics.astro creates these queues before
     * the external vendor scripts finish loading,
     * so calls are safe when analytics is enabled.
     */
    analyticsWindow.gtag?.(
        'event',
        normalizedEventName,
        cleanParameters,
    );

    /*
     * Clarity custom events use an event name.
     * The richer parameters remain available in GA4.
     */
    analyticsWindow.clarity?.(
        'event',
        normalizedEventName,
    );
}