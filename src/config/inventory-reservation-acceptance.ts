/**
 * TEMPORARY PHASE 1B ACCEPTANCE CONFIGURATION
 *
 * Enables runtime inventory for one demo product while the reservation
 * system is tested in an isolated Netlify Deploy Preview database.
 *
 * Remove this application-level override after Phase 1B acceptance.
 */
const acceptedProductSlugs =
    new Set<string>([
        'tug-and-fetch-rope-ball',
    ]);

export function isInventoryReservationAcceptanceProduct(
    productSlug: string,
): boolean {
    return acceptedProductSlugs.has(
        productSlug,
    );
}