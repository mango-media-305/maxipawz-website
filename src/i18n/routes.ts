import type { Locale } from './languages';

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
        '/contact',
        '/contact/success',
        '/faq',
        '/product-safety',
    ]);

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
    return translatedPaths.has(
        getEnglishPathname(
            pathname,
        ),
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

    /*
     * Preserve the exact existing English link when
     * no translation is available.
     */
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