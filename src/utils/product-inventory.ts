import type {
    Product,
    ProductAvailability,
    ProductVariant,
} from '../types/product';

export function getEffectiveProductAvailability(
    product: Product,
    variant?: ProductVariant,
): ProductAvailability {
    return (
        variant?.availability ??
        product.availability
    );
}

export function isInventoryTrackingEnabledForSelection(
    product: Product,
    variant?: ProductVariant,
): boolean {
    const hasVariants =
        Boolean(
            product.variants?.length,
        );

    if (
        hasVariants &&
        !variant
    ) {
        return false;
    }

    return (
        variant?.trackInventory ??
        product.trackInventory ??
        false
    );
}

export function productHasTrackedInventory(
    product: Product,
): boolean {
    if (
        product.trackInventory ===
        true
    ) {
        return true;
    }

    return (
        product.variants?.some(
            (variant) =>
                variant.trackInventory ===
                true,
        ) ??
        false
    );
}

export function getInventorySku(
    product: Product,
    variant?: ProductVariant,
): string | undefined {
    if (variant) {
        return variant.sku;
    }

    if (
        product.variants?.length
    ) {
        return undefined;
    }

    return product.sku;
}