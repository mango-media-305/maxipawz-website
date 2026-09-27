import type { Locale } from './languages';

import {
    hasTranslatedPetGuideSlug,
} from './pet-guides';

/*
 * Register an English pathname only after its complete Spanish page exists.
 * Use no trailing slash except for the homepage. Spanish keeps the same slug.
 */
const translatedPaths:
    ReadonlySet<string> =
    new Set<string>([
        '/',
        '/about',
        '/accessibility',
        '/cart',
        '/checkout',
        '/checkout/cancel',
        '/checkout/success',
        '/contact',
        '/contact/success',
        '/faq',
        '/join/problem',
        '/join/success',
        '/join/thanks',
        '/pet-guides',
        '/privacy-policy',
        '/product-safety',
        '/return-policy',
        '/shipping-policy',
        '/shop',
        '/terms',
    ]);

/*
 * Product detail pages use the same stable slug in both languages.
 * Both /shop/[slug] and /es/shop/[slug] are generated from the same
 * canonical product catalog.
 */
const translatedPathPatterns:
    readonly RegExp[] = [
        /^\/shop\/[^/]+$/,
    ];

function isTranslatedPetGuidePath(
    pathname:
        string,
): boolean {
    const match =
        pathname.match(
            /^\/pet-guides\/([^/]+)$/,
        );

    if (
        !match
    ) {
        return false;
    }

    const slug =
        match[1];

    return Boolean(
        slug &&
        hasTranslatedPetGuideSlug(
            slug,
        ),
    );
}

export function normalizePathname(
    pathname:
        string,
): string {
    return pathname.replace(
        /\/+$/,
        '',
    ) || '/';
}

export function getEnglishPathname(
    pathname:
        string,
): string {
    const normalized =
        normalizePathname(
            pathname,
        );

    if (
        normalized ===
        '/es'
    ) {
        return '/';
    }

    return normalized.startsWith(
        '/es/',
    )
        ? normalized.slice(
            3,
        )
        : normalized;
}

export function hasSpanishTranslation(
    pathname:
        string,
): boolean {
    const englishPath =
        getEnglishPathname(
            pathname,
        );

    return (
        translatedPaths.has(
            englishPath,
        ) ||
        translatedPathPatterns.some(
            (
                pattern,
            ) =>
                pattern.test(
                    englishPath,
                ),
        ) ||
        isTranslatedPetGuidePath(
            englishPath,
        )
    );
}

/**
 * Accept internal links with optional query strings
 * and fragments.
 */
export function localizeHref(
    href:
        string,

    locale:
        Locale,
): string {
    if (
        !href.startsWith(
            '/',
        ) ||
        href.startsWith(
            '//',
        )
    ) {
        return href;
    }

    const match =
        href.match(
            /^([^?#]*)(.*)$/,
        );

    const pathname =
        match?.[1] ??
        '/';

    const suffix =
        match?.[2] ??
        '';

    const englishPath =
        getEnglishPathname(
            pathname,
        );

    if (
        locale ===
            'es' &&
        hasSpanishTranslation(
            englishPath,
        )
    ) {
        const spanishPath =
            englishPath ===
            '/'
                ? '/es/'
                : `/es${englishPath}`;

        const trailingSlash =
            englishPath !==
                '/' &&
            pathname.endsWith(
                '/',
            )
                ? '/'
                : '';

        return `${spanishPath}${trailingSlash}${suffix}`;
    }

    if (
        !pathname.startsWith(
            '/es/',
        ) &&
        pathname !==
            '/es'
    ) {
        return href;
    }

    const trailingSlash =
        englishPath !==
            '/' &&
        pathname.endsWith(
            '/',
        )
            ? '/'
            : '';

    return `${englishPath}${trailingSlash}${suffix}`;
}

export function localizedLinkLabel(
    label:
        string,

    href:
        string,

    locale:
        Locale,
): string {
    const pathname =
        href.split(
            /[?#]/,
        )[0] ??
        '/';

    return (
        locale ===
            'es' &&
        !hasSpanishTranslation(
            pathname,
        )
    )
        ? `${label} (en inglés)`
        : label;
}