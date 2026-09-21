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
        'alligator-crocodile-dog-safety-south-florida',
        'back-to-school-dog-routine',
        'blue-green-algae-dogs-florida',
        'cane-toad-dog-safety-south-florida',
        'choosing-the-right-product',
        'collars-and-accessories',
        'comfort-at-home',
        'dog-bbq-safety',
        'dog-beach-safety-miami',
        'dog-body-condition-score-healthy-weight',
        'dog-car-travel-safety',
        'dog-dental-care-routine',
        'dog-dental-home-care',
        'dog-ear-care-after-swimming',
        'dog-first-aid-kit',
        'dog-food-storage-safety',
        'dog-heartworm-prevention-miami',
        'dog-hydration-miami-heat',
        'dog-leptospirosis-floodwater-miami',
        'dog-microchip-id-emergency-preparedness',
        'dog-microchip-id-miami',
        'dog-motion-sickness-car-travel',
        'dog-nail-trimming-at-home',
        'dog-park-safety-miami',
        'dog-snake-bite-safety-florida',
        'dog-sunburn-sunscreen-safety',
        'dog-thunderstorm-anxiety-miami',
        'dog-thunderstorm-anxiety-safety',
        'dog-tick-check-prevention',
        'dog-toy-safety-clean-replace',
        'dog-treat-calories',
        'dog-water-safety-florida',
        'feeding-and-hydration',
        'flea-tick-prevention-florida-dogs',
        'florida-dog-yard-safety-after-rain',
        'grooming-and-care',
        'heartworm-prevention-florida-dogs',
        'hot-pavement-dog-walks-miami',
        'hurricane-crate-training-dogs',
        'hurricane-preparedness-for-dogs',
        'indoor-dog-enrichment-miami-heat',
        'leptospirosis-dogs-miami-rain',
        'miami-dade-hurricane-evacuation-dogs',
        'miami-mosquito-heartworm-dogs',
        'play-and-enrichment',
        'rainy-season-dog-paw-care-miami',
        'sago-palm-dog-safety-florida',
        'senior-dog-home-comfort',
        'sniff-walks-dog-enrichment',
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
