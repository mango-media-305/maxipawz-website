/*
 * Add a slug here only after the complete Spanish MDX translation
 * exists and /es/pet-guides/[slug] can render it.
 *
 * This manifest allows individual article language switching to roll
 * out safely without sending visitors to nonexistent translated pages.
 */
const translatedPetGuideSlugs:
    ReadonlySet<string> =
    new Set<string>([]);

export function hasTranslatedPetGuideSlug(
    slug:
        string,
): boolean {
    return translatedPetGuideSlugs.has(
        slug,
    );
}