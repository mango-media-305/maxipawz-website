import { stripeDemoCatalog } from './stripe-demo-catalog.generated';

import type { Product, ProductImage, ProductImagePosition } from '../types/product';

function unsplashImage(
  photoId: string,
  alt: string,
  creditName: string,
  searchPath: string,
  position: ProductImagePosition = 'center',
): ProductImage {
  return {
    src: `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&h=1200&q=82`,

    alt,
    position,

    width: 1200,
    height: 1200,

    credit: {
      name: creditName,

      href: `https://unsplash.com/s/photos/${searchPath}?utm_source=maxipawz&utm_medium=referral`,

      source: 'Unsplash',
    },
  };
}

/**
 * DEMO CATALOG
 *
 * Every product below is fictional and exists only for interface,
 * filtering, product-page, and future checkout testing.
 *
 * The Unsplash images are lifestyle placeholders and should not be
 * interpreted as exact representations of the fictional products.
 *
 * Remove or replace these records before the real store launches.
 */
const demoProducts: Product[] = [
  {
    slug: 'tug-and-fetch-rope-ball',
    name: 'Tug & Fetch Rope Ball',
    sku: 'DEMO-PLAY-001',

    category: 'play-and-enrichment',
    status: 'active',
    availability: 'in-stock',
    trackInventory: true,

    shortDescription:
      'A fictional rope-and-ball toy created to test product cards, sale pricing, and dog-toy filters.',

    description: [
      'This fictional demo product represents a versatile toy intended for supervised games of fetch and tug.',

      'It is included only to demonstrate how product descriptions, materials, care instructions, pricing, and safety information will appear in the Maxi Pawz catalog.',
    ],

    petTypes: ['dog'],

    tags: ['Fetch', 'Interactive play', 'Supervised use'],

    searchKeywords: ['ball', 'rope', 'tug', 'fetch toy', 'dog play'],

    images: [
      unsplashImage(
        '1600352712371-15fd49ca42b5',
        'Dog outdoors, used as the primary lifestyle image for the fictional Adventure Fit Harness',
        'Jamie Street',
        'dog-harness',
        'center',
      ),

      {
        src: '/images/products/adventure-fit-harness/adventure-fit-harness-lifestyle.webp',
        alt: 'Dog wearing the Adventure Fit Harness outdoors during a walk',
        position: 'center',
        width: 1200,
        height: 1200,
      },

      {
        src: '/images/products/adventure-fit-harness/adventure-fit-harness-detail.webp',
        alt: 'Close-up view of the Adventure Fit Harness construction and hardware',
        position: 'center',
        width: 1200,
        height: 1200,
      },

      {
        src: '/images/products/adventure-fit-harness/adventure-fit-harness-side.webp',
        alt: 'Side view showing the Adventure Fit Harness shape and coverage',
        position: 'center',
        width: 1200,
        height: 1200,
      },

      {
        src: '/images/products/adventure-fit-harness/adventure-fit-harness-fit.webp',
        alt: 'Adventure Fit Harness shown on a dog to demonstrate overall fit',
        position: 'center',
        width: 1200,
        height: 1200,
      },
    ],

    featured: true,
    isDemo: true,

    price: {
      amount: 1499,
      currency: 'USD',
    },

    compareAtPrice: {
      amount: 1899,
      currency: 'USD',
    },

    materials: ['Demo cotton rope', 'Demo rubber ball'],

    dimensions: {
      length: 12,
      width: 3,
      height: 3,
      unit: 'in',

      weight: {
        value: 7,
        unit: 'oz',
      },
    },

    careInstructions: [
      'Spot clean using mild soap and water.',
      'Allow the product to dry completely before storage.',
      'Inspect the rope and ball before and after play.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Intended for supervised interactive play.',
      'Remove the item if it becomes damaged or develops loose pieces.',
    ],
  },

  {
    slug: 'whisker-feather-wand',
    name: 'Whisker Feather Wand',
    sku: 'DEMO-PLAY-002',

    category: 'play-and-enrichment',
    status: 'active',
    availability: 'in-stock',

    shortDescription:
      'A fictional feather wand for testing cat-product searches and multi-pet catalog filters.',

    description: [
      'This demo wand represents an interactive cat toy designed for supervised chase and pounce activities.',

      'The listing is fictional and exists to demonstrate cat-specific filtering and product-detail layouts.',
    ],

    petTypes: ['cat'],

    tags: ['Chase', 'Cat enrichment', 'Interactive'],

    searchKeywords: ['cat wand', 'feather', 'kitten toy', 'chase toy', 'cat play'],

    images: [
      unsplashImage(
        '1638826595775-e2eae86cda8e',
        'Cat playing with a feather wand, used as a demo product image',
        'Piotr Musioł',
        'cat-toy',
        'center',
      ),
    ],

    isDemo: true,

    price: {
      amount: 1199,
      currency: 'USD',
    },

    materials: ['Demo flexible wand', 'Demo feather attachment', 'Demo woven cord'],

    dimensions: {
      length: 24,
      width: 2,
      height: 1,
      unit: 'in',

      weight: {
        value: 3,
        unit: 'oz',
      },
    },

    careInstructions: [
      'Wipe the wand with a dry or lightly damp cloth.',
      'Store the wand away from pets between play sessions.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Use only during active supervision.',
      'Do not allow chewing or swallowing of the attachment or cord.',
    ],
  },

  {
    slug: 'adventure-fit-harness',
    name: 'Adventure Fit Harness',
    sku: 'DEMO-WALK-001',

    category: 'walk-and-travel',
    status: 'active',
    availability: 'in-stock',
    trackInventory: true,

    shortDescription:
      'A fictional adjustable harness used to test variants, sizing, featured products, and walk filters.',

    description: [
      'This demo listing represents an adjustable walking harness designed around everyday outings.',

      'Its sizes, specifications, pricing, and materials are fictional placeholders for testing the storefront.',
    ],

    petTypes: ['dog'],

    tags: ['Walking', 'Adjustable', 'Everyday outings'],

    searchKeywords: ['harness', 'dog walking', 'travel gear', 'adjustable vest'],

    images: [
      unsplashImage(
        '1600352712371-15fd49ca42b5',
        'Dog outdoors, used as a lifestyle image for a fictional harness',
        'Jamie Street',
        'dog-harness',
        'center',
      ),
    ],

    featured: true,
    isDemo: true,

    price: {
      amount: 3299,
      currency: 'USD',
    },

    materials: ['Demo woven polyester', 'Demo breathable mesh', 'Demo metal attachment ring'],

    variants: [
      {
        id: 'small',
        label: 'Small',
        sku: 'DEMO-WALK-001-S',

        price: {
          amount: 2999,
          currency: 'USD',
        },

        availability: 'in-stock',
      },

      {
        id: 'medium',
        label: 'Medium',
        sku: 'DEMO-WALK-001-M',

        price: {
          amount: 3299,
          currency: 'USD',
        },

        availability: 'in-stock',
      },

      {
        id: 'large',
        label: 'Large',
        sku: 'DEMO-WALK-001-L',

        price: {
          amount: 3499,
          currency: 'USD',
        },

        availability: 'in-stock',
      },
    ],

    careInstructions: [
      'Hand wash using mild soap and cool water.',
      'Air dry completely before the next use.',
      'Inspect adjustment points and attachment hardware regularly.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Confirm fit using product-specific measurements.',
      'Check the harness and hardware before every walk.',
    ],
  },

  {
    slug: 'trail-loop-leash',
    name: 'Trail Loop Leash',
    sku: 'DEMO-WALK-002',

    category: 'walk-and-travel',
    status: 'active',
    availability: 'coming-soon',

    shortDescription:
      'A fictional everyday leash created to test coming-soon inventory and walking-product searches.',

    description: [
      'This demo leash represents a lightweight walking accessory with a padded hand loop.',

      'The product is fictional and its information exists only for storefront testing.',
    ],

    petTypes: ['dog'],

    tags: ['Leash', 'Travel', 'Walking'],

    searchKeywords: ['dog leash', 'lead', 'walking accessory', 'travel'],

    images: [
      unsplashImage(
        '1507146426996-ef05306b995a',
        'Brown puppy outdoors, used as a lifestyle image for a fictional leash',
        'Berkay Gumustekin',
        'dog-leash',
        'center',
      ),
    ],

    isDemo: true,

    price: {
      amount: 2199,
      currency: 'USD',
    },

    materials: ['Demo woven nylon', 'Demo zinc-alloy clip', 'Demo padded handle'],

    dimensions: {
      length: 60,
      width: 1,
      unit: 'in',

      weight: {
        value: 6,
        unit: 'oz',
      },
    },

    careInstructions: [
      'Wipe clean after outdoor use.',
      'Allow a wet leash to dry fully before storage.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Inspect the leash, clip, handle, and stitching before each walk.',
    ],
  },

  {
    slug: 'duo-ceramic-bowl-set',
    name: 'Duo Ceramic Bowl Set',
    sku: 'DEMO-FEED-001',

    category: 'feeding-and-hydration',
    status: 'active',
    availability: 'in-stock',

    shortDescription:
      'A fictional two-bowl set used to test shared dog-and-cat filters and promotional pricing.',

    description: [
      'This fictional demo set represents two ceramic bowls for food and water.',

      'It is included to demonstrate product specifications, shared pet-type filtering, and sale pricing.',
    ],

    petTypes: ['dog', 'cat'],

    tags: ['Feeding', 'Hydration', 'Ceramic'],

    searchKeywords: ['pet bowl', 'water bowl', 'food dish', 'feeding set'],

    images: [
      unsplashImage(
        '1565204333704-e2618a0a6938',
        'Blue pet bowl, used as a demo product image',
        'Jen Theodore',
        'dog-bowls',
        'center',
      ),
    ],

    featured: true,
    isDemo: true,

    price: {
      amount: 3499,
      currency: 'USD',
    },

    compareAtPrice: {
      amount: 3999,
      currency: 'USD',
    },

    materials: ['Demo glazed ceramic', 'Demo silicone base'],

    dimensions: {
      width: 6,
      height: 2.5,
      unit: 'in',

      weight: {
        value: 2.1,
        unit: 'lb',
      },
    },

    careInstructions: [
      'Wash and dry food bowls after use.',
      'Wash water bowls regularly.',
      'Discontinue use if ceramic becomes cracked or chipped.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Place bowls on a stable, level surface.',
    ],
  },

  {
    slug: 'slow-moment-feeding-bowl',
    name: 'Slow-Moment Feeding Bowl',
    sku: 'DEMO-FEED-002',

    category: 'feeding-and-hydration',
    status: 'active',
    availability: 'out-of-stock',

    shortDescription:
      'A fictional feeding bowl used to test out-of-stock products and price filtering.',

    description: [
      'This demo listing represents a textured feeding bowl intended to make mealtime more engaging.',

      'No nutritional, behavioral, or health claim is being made because the item is fictional testing content.',
    ],

    petTypes: ['dog'],

    tags: ['Mealtime', 'Feeding', 'Daily routine'],

    searchKeywords: ['slow feeder', 'dog bowl', 'meal bowl', 'feeding accessory'],

    images: [
      unsplashImage(
        '1714068691210-073dc52c6c1d',
        'Dog eating from a bowl, used as a demo product image',
        'Ayla Verschueren',
        'dog-bowls',
        'center',
      ),
    ],

    isDemo: true,

    price: {
      amount: 2499,
      currency: 'USD',
    },

    materials: ['Demo food-safe polymer', 'Demo nonslip base'],

    dimensions: {
      width: 8,
      height: 2.25,
      unit: 'in',

      weight: {
        value: 13,
        unit: 'oz',
      },
    },

    careInstructions: [
      'Wash and dry after each meal.',
      'Inspect the surface for deep scratches or cracks.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Select an appropriate bowl size for the individual pet.',
    ],
  },

  {
    slug: 'cloud-nest-pet-bed',
    name: 'Cloud Nest Pet Bed',
    sku: 'DEMO-HOME-001',

    category: 'comfort-and-home',
    status: 'active',
    availability: 'in-stock',

    shortDescription:
      'A fictional cushioned bed used to test premium pricing, variants, and dog-and-cat filters.',

    description: [
      'This fictional demo product represents a cushioned resting bed with a removable outer cover.',

      'It is included to demonstrate larger product pricing, variant options, and comfort-category pages.',
    ],

    petTypes: ['dog', 'cat'],

    tags: ['Rest', 'Comfort', 'Home'],

    searchKeywords: ['pet bed', 'dog bed', 'cat bed', 'cushion', 'sleep'],

    images: [
      unsplashImage(
        '1601758123927-4f7acc7da589',
        'Dog resting on a pet bed, used as a demo product image',
        'Chewy',
        'pet-bed',
        'center',
      ),
    ],

    featured: true,
    isDemo: true,

    price: {
      amount: 5499,
      currency: 'USD',
    },

    variants: [
      {
        id: 'small',
        label: 'Small',

        price: {
          amount: 4499,
          currency: 'USD',
        },

        availability: 'in-stock',
      },

      {
        id: 'medium',
        label: 'Medium',

        price: {
          amount: 5499,
          currency: 'USD',
        },

        availability: 'in-stock',
      },

      {
        id: 'large',
        label: 'Large',

        price: {
          amount: 6999,
          currency: 'USD',
        },

        availability: 'coming-soon',
      },
    ],

    materials: ['Demo polyester cover', 'Demo fiber filling'],

    dimensions: {
      length: 30,
      width: 24,
      height: 7,
      unit: 'in',

      weight: {
        value: 4.2,
        unit: 'lb',
      },
    },

    careInstructions: [
      'Follow the care label for the removable cover.',
      'Allow all components to dry completely.',
      'Vacuum or remove loose pet hair regularly.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Remove the bed if filling or damaged internal material becomes exposed.',
    ],
  },

  {
    slug: 'cozy-basket-lounger',
    name: 'Cozy Basket Lounger',
    sku: 'DEMO-HOME-002',

    category: 'comfort-and-home',
    status: 'active',
    availability: 'coming-soon',

    shortDescription:
      'A fictional compact lounger used to test small-pet filtering and coming-soon status.',

    description: [
      'This fictional demo product represents a small cushioned lounger for quiet indoor resting spaces.',

      'The listing exists to test responsive product cards and small-pet catalog filters.',
    ],

    petTypes: ['cat', 'small-pet'],

    tags: ['Cozy', 'Indoor', 'Compact'],

    searchKeywords: ['basket bed', 'cat lounger', 'small pet bed', 'indoor comfort'],

    images: [
      unsplashImage(
        '1653638390484-bc1c263ce9e4',
        'Pet resting in a bed, used as a demo product image',
        'Brett Wharton',
        'pet-bed',
        'center',
      ),
    ],

    isDemo: true,

    price: {
      amount: 4299,
      currency: 'USD',
    },

    materials: ['Demo woven exterior', 'Demo removable cushion'],

    dimensions: {
      length: 22,
      width: 18,
      height: 8,
      unit: 'in',

      weight: {
        value: 2.7,
        unit: 'lb',
      },
    },

    careInstructions: [
      'Spot clean the exterior.',
      'Clean the removable cushion according to its care label.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Confirm that the resting space is appropriately sized for the pet.',
    ],
  },

  {
    slug: 'everyday-slicker-brush',
    name: 'Everyday Slicker Brush',
    sku: 'DEMO-CARE-001',

    category: 'grooming-and-care',
    status: 'active',
    availability: 'in-stock',

    shortDescription:
      'A fictional grooming brush created to test care-product searches and shared pet filters.',

    description: [
      'This fictional listing represents a handheld grooming brush for routine coat care.',

      'It does not provide veterinary, skin-care, or coat-treatment advice and exists only for interface testing.',
    ],

    petTypes: ['dog', 'cat'],

    tags: ['Grooming', 'Coat care', 'Routine'],

    searchKeywords: ['brush', 'grooming tool', 'coat care', 'pet hair'],

    images: [
      unsplashImage(
        '1581888227599-779811939961',
        'Dog resting on a couch, used as a lifestyle image for a fictional grooming brush',
        'Jamie Street',
        'pet-grooming',
        'center',
      ),
    ],

    isDemo: true,

    price: {
      amount: 1699,
      currency: 'USD',
    },

    materials: ['Demo polymer handle', 'Demo stainless-steel pins'],

    dimensions: {
      length: 7,
      width: 4,
      height: 2,
      unit: 'in',

      weight: {
        value: 5,
        unit: 'oz',
      },
    },

    careInstructions: [
      'Remove collected hair after each grooming session.',
      'Wipe the brush clean and allow it to dry.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Use gentle pressure and stop if the pet shows pain or continuing discomfort.',
    ],
  },

  {
    slug: 'paw-rinse-cleaning-cup',
    name: 'Paw Rinse Cleaning Cup',
    sku: 'DEMO-CARE-002',

    category: 'grooming-and-care',
    status: 'active',
    availability: 'out-of-stock',

    shortDescription:
      'A fictional paw-cleaning accessory used to test unavailable inventory and grooming filters.',

    description: [
      'This demo product represents a portable paw-rinsing cup for use after outdoor activities.',

      'The dimensions, materials, and product performance are fictional placeholders.',
    ],

    petTypes: ['dog'],

    tags: ['Paw care', 'Travel', 'Cleaning'],

    searchKeywords: ['paw cleaner', 'rinse cup', 'mud', 'dog grooming', 'outdoor care'],

    images: [
      unsplashImage(
        '1507146426996-ef05306b995a',
        'Brown puppy outdoors, used as a lifestyle image for a fictional paw cleaner',
        'Berkay Gumustekin',
        'dog-grooming',
        'center',
      ),
    ],

    isDemo: true,

    price: {
      amount: 1899,
      currency: 'USD',
    },

    materials: ['Demo silicone insert', 'Demo polymer cup'],

    dimensions: {
      height: 6,
      width: 4,
      unit: 'in',

      weight: {
        value: 8,
        unit: 'oz',
      },
    },

    careInstructions: [
      'Rinse the cup after use.',
      'Remove and dry the internal insert before storage.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Do not use on injured, painful, or irritated paws without professional guidance.',
    ],
  },

  {
    slug: 'classic-everyday-collar',
    name: 'Classic Everyday Collar',
    sku: 'DEMO-STYLE-001',

    category: 'collars-and-accessories',
    status: 'active',
    availability: 'in-stock',

    shortDescription:
      'A fictional adjustable collar used to test wearable-product sizing and accessory filters.',

    description: [
      'This fictional demo listing represents an adjustable everyday dog collar.',

      'The product exists to demonstrate sizing variants, care guidance, and wearable-product information.',
    ],

    petTypes: ['dog'],

    tags: ['Collar', 'Adjustable', 'Everyday style'],

    searchKeywords: ['dog collar', 'wearable', 'walking accessory', 'adjustable collar'],

    images: [
      unsplashImage(
        '1600352712371-15fd49ca42b5',
        'Dog wearing an accessory outdoors, used as a demo collar image',
        'Jamie Street',
        'dog-collar',
        'center',
      ),
    ],

    isDemo: true,

    price: {
      amount: 1799,
      currency: 'USD',
    },

    variants: [
      {
        id: 'small',
        label: 'Small',

        price: {
          amount: 1599,
          currency: 'USD',
        },

        availability: 'in-stock',
      },

      {
        id: 'medium',
        label: 'Medium',

        price: {
          amount: 1799,
          currency: 'USD',
        },

        availability: 'in-stock',
      },

      {
        id: 'large',
        label: 'Large',

        price: {
          amount: 1999,
          currency: 'USD',
        },

        availability: 'in-stock',
      },
    ],

    materials: ['Demo woven nylon', 'Demo metal ring', 'Demo polymer buckle'],

    careInstructions: [
      'Hand wash with mild soap.',
      'Dry completely before placing the collar back on the pet.',
    ],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Measure the pet and confirm fit regularly.',
      'Inspect the buckle, ring, adjustment points, and stitching.',
    ],
  },

  {
    slug: 'paw-charm-pet-collar',
    name: 'Paw Charm Pet Collar',
    sku: 'DEMO-STYLE-002',

    category: 'collars-and-accessories',
    status: 'active',
    availability: 'coming-soon',

    shortDescription:
      'A fictional decorative collar created to test cat searches and coming-soon accessories.',

    description: [
      'This fictional demo listing represents a lightweight pet collar with a decorative paw charm.',

      'No claim is made that the placeholder image displays the exact fictional product.',
    ],

    petTypes: ['cat'],

    tags: ['Collar', 'Paw charm', 'Pet style'],

    searchKeywords: ['cat collar', 'paw charm', 'wearable accessory', 'pet collar'],

    images: [
      unsplashImage(
        '1592194996308-7b43878e84a6',
        'Cat portrait, used as a lifestyle image for a fictional pet collar',
        'Alvan Nee',
        'cat-collar',
        'center',
      ),
    ],

    isDemo: true,

    price: {
      amount: 1599,
      currency: 'USD',
    },

    materials: ['Demo woven fabric', 'Demo metal charm', 'Demo closure'],

    dimensions: {
      width: 0.5,
      unit: 'in',

      weight: {
        value: 1.5,
        unit: 'oz',
      },
    },

    careInstructions: ['Wipe clean using a lightly damp cloth.', 'Dry completely before reuse.'],

    safetyNotes: [
      'Fictional testing product—not currently available for purchase.',
      'Confirm that the collar design and fit are appropriate for the individual pet.',
    ],
  },
];

export const products: Product[] = demoProducts.map((product) => {
  const stripeReference = stripeDemoCatalog[product.slug];

  if (!stripeReference) {
    return product;
  }

  const variants = product.variants?.map((variant) => {
    const stripePriceId = stripeReference.variantPriceIds[variant.id];

    if (!stripePriceId) {
      return variant;
    }

    return {
      ...variant,
      stripePriceId,
    };
  });

  return {
    ...product,

    stripeProductId: stripeReference.stripeProductId,

    ...(stripeReference.stripeDefaultPriceId
      ? {
        stripeDefaultPriceId: stripeReference.stripeDefaultPriceId,
      }
      : {}),

    ...(variants
      ? {
        variants,
      }
      : {}),
  };
});
