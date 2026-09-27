export type Locale = 'en' | 'es';

export const DEFAULT_LOCALE: Locale = 'en';

export const LANGUAGE_STORAGE_KEY = 'maxipawz-language';

export const languageLabels: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
};

export function isLocale(value: unknown): value is Locale {
    return value === 'en' || value === 'es';
}

/** Read the language of an existing URL, independently of user preferences. */
export function getLocaleFromPathname(pathname: string): Locale {
    return pathname === '/es' || pathname.startsWith('/es/') ? 'es' : 'en';
}

/** A manual choice wins. Otherwise, use the browser's primary language. */
export function resolvePreferredLocale(
    savedLanguage: unknown,
    browserLanguage?: string,
): Locale {
    if (isLocale(savedLanguage)) {
        return savedLanguage;
    }

    const primaryLanguage = browserLanguage?.trim().toLowerCase().split('-')[0];

    return primaryLanguage === 'es' ? 'es' : DEFAULT_LOCALE;
}

export function readSavedLanguage(): Locale | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

        return isLocale(savedLanguage) ? savedLanguage : null;
    } catch {
        // Browsers can block storage. Language links must still work.
        return null;
    }
}

/** Call only when the visitor explicitly chooses a language. */
export function saveLanguagePreference(locale: Locale): boolean {
    if (typeof window === 'undefined' || !isLocale(locale)) {
        return false;
    }

    try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);

        return true;
    } catch {
        return false;
    }
}

/** Resolve a preference without navigating or changing the current page. */
export function getPreferredLanguage(): Locale {
    if (typeof window === 'undefined') {
        return DEFAULT_LOCALE;
    }

    const browserLanguage =
        window.navigator.languages?.[0] ?? window.navigator.language;

    return resolvePreferredLocale(readSavedLanguage(), browserLanguage);
}