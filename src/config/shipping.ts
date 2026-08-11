export type ShippingDestinationZone = 'contiguous-us' | 'alaska-hawaii';

export interface ShippingRateTier {
  maxWeightOz: number;

  contiguousAmount: number;

  alaskaHawaiiAmount: number;
}

export const shippingConfig = {
  currency: 'USD',

  stripeCurrency: 'usd',

  allowedCountries: ['US'],

  destinationLabel: 'United States',

  paidDisplayName: 'Standard shipping',

  freeDisplayName: 'Free standard shipping',

  /**
   * $100.00 or more currently qualifies.
   */
  freeShippingThresholdAmount: 10000,

  /**
   * Small packaging allowance added once per order.
   *
   * This is intentionally provisional while the catalog
   * contains demo products.
   */
  packagingWeightOz: 4,

  /**
   * Demo-only fallback when a fictional product does not
   * yet contain weight data.
   *
   * Real launch products must have an actual shipping weight.
   */
  demoFallbackItemWeightOz: 16,

  /**
   * Orders above 20 lb are not automatically quoted by the
   * provisional table.
   */
  maximumAutomaticWeightOz: 320,

  /**
   * PROVISIONAL SANDBOX SHIPPING TABLE
   *
   * These are Maxi Pawz checkout estimates, not live USPS,
   * UPS, or FedEx quotes.
   *
   * Replace/calibrate these values before commercial launch.
   */
  rateTable: [
    {
      maxWeightOz: 16,

      contiguousAmount: 699,

      alaskaHawaiiAmount: 999,
    },

    {
      maxWeightOz: 48,

      contiguousAmount: 999,

      alaskaHawaiiAmount: 1499,
    },

    {
      maxWeightOz: 80,

      contiguousAmount: 1399,

      alaskaHawaiiAmount: 1999,
    },

    {
      maxWeightOz: 160,

      contiguousAmount: 1999,

      alaskaHawaiiAmount: 2999,
    },

    {
      maxWeightOz: 320,

      contiguousAmount: 2999,

      alaskaHawaiiAmount: 4499,
    },
  ] satisfies ShippingRateTier[],

  policyHref: '/shipping-policy',
} as const;
