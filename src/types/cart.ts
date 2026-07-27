import type {
    Product,
    ProductImage,
    ProductPrice,
    ProductVariant,
} from './product';

export interface CartLine {
    productSlug: string;
    variantId?: string;
    quantity: number;
}

export interface CartState {
    version: 1;
    lines: CartLine[];
    updatedAt: number;
}

export interface ResolvedCartLine {
    key: string;
    line: CartLine;

    product?: Product;
    variant?: ProductVariant;
    image?: ProductImage;

    unitPrice?: ProductPrice;
    compareAtUnitPrice?: ProductPrice;

    lineTotalAmount: number;
    compareAtLineTotalAmount: number;

    available: boolean;
    issue?: string;
}

export interface CartTotals {
    itemCount: number;
    validItemCount: number;

    subtotalAmount: number;
    compareAtSubtotalAmount: number;
    savingsAmount: number;

    unavailableLineCount: number;
    hasDemoItems: boolean;
}