import type { Product } from '../types/product';

/**
 * MaxiPawz product catalog
 *
 * Add only real products with confirmed names, descriptions, images,
 * categories, prices, materials, sizing information, and safety notes.
 *
 * Catalog visibility:
 * - draft: internal preparation only
 * - active: published when the storefront is in live mode
 * - archived: retained in data but not published
 */
export const products: Product[] = [];