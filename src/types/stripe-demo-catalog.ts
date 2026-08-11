export interface StripeDemoCatalogProduct {
  stripeProductId: string;

  stripeDefaultPriceId?: string;

  variantPriceIds: Record<string, string>;
}

export type StripeDemoCatalog = Record<string, StripeDemoCatalogProduct>;
