/*
 * Add a slug here only after the complete Spanish MDX translation
 * exists and /es/pet-guides/[slug] can render it.
 *
 * This manifest allows individual article language switching to roll
 * out safely without sending visitors to nonexistent translated pages.
 */
const translatedPetGuideSlugs:
    ReadonlySet<string> =
    new Set<string>([
        'choosing-the-right-product',
        'dog-hydration-miami-heat',
        'feeding-and-hydration',
        'play-and-enrichment',
        'walk-and-travel',
    ]);

export function hasTranslatedPetGuideSlug(
    slug:
        string,
): boolean {
    return translatedPetGuideSlugs.has(
        slug,
    );
}