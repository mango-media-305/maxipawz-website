export type PetGuideTone = 'brand' | 'accent' | 'sand';

export type PetGuideIcon =
  | 'choosing'
  | 'play'
  | 'travel'
  | 'hydration'
  | 'comfort'
  | 'care'
  | 'accessories';

export interface PetGuideTip {
  title: string;
  description: string;
}

export interface PetGuideSection {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
  tip?: PetGuideTip;
}

export interface PetGuide {
  slug: string;
  href: string;
  indexable?: boolean;
  title: string;
  seoTitle: string;
  seoDescription: string;
  relatedLinks: {
    title: string;
    description: string;
    href: string;
  }[];
  cardTitle: string;
  description: string;
  introduction: string;

  eyebrow: string;
  icon: PetGuideIcon;
  tone: PetGuideTone;

  readingTime: string;
  publishedAt: string;
  updatedAt: string;

  featured?: boolean;
  showOnHomepage?: boolean;

  learningPoints: string[];
  sections: PetGuideSection[];

  closingTitle: string;
  closingDescription: string;
}

export const petGuides: PetGuide[] = [
  {
    slug: 'choosing-the-right-product',
    href: '/pet-guides/choosing-the-right-product',

    title: 'How to Choose Safe Toys and Products for Your Dog',

    cardTitle: 'Choosing Safe Dog Products',

    description:
      'Learn how to choose dog toys and everyday products based on your dog’s size, age, habits, play style, materials, fit, supervision needs, and daily routine.',

    introduction:
      'A thoughtful product choice starts with understanding your dog—not simply selecting the product that looks the most exciting.',

    seoTitle: 'How to Choose Safe Dog Toys and Products',

    seoDescription:
      'Learn how to choose safe dog toys and everyday products based on size, age, play style, materials, fit, supervision, and daily routines.',

    eyebrow: 'Start Here',
    icon: 'choosing',
    tone: 'brand',

    readingTime: '9 min read',

    publishedAt: '2026-07-27',
    updatedAt: '2026-08-02',

    indexable: true,
    featured: true,

    learningPoints: [
      'Match products to your dog’s size, age, habits, and activity level.',
      'Choose products for a clear purpose within your dog’s routine.',
      'Evaluate materials, construction, fit, and supervision requirements.',
      'Inspect toys and accessories regularly for wear or damage.',
    ],

    sections: [
      {
        id: 'start-with-your-dog',

        title: 'Start with your dog—not the product.',

        paragraphs: [
          'Before comparing features, colors, prices, or reviews, create a simple profile of your dog. The same product can be enjoyable and appropriate for one dog while being uncomfortable, uninteresting, or impractical for another.',

          'Consider your dog’s size, age, life stage, activity level, habits, play style, daily routine, mobility, and response to unfamiliar materials or experiences.',
        ],

        points: [
          'Use your dog’s actual measurements instead of relying only on breed labels.',
          'Consider whether your dog plays gently or interacts with toys intensely.',
          'Think about where and how frequently the product will be used.',
          'Account for your dog’s current age and life stage.',
          'Pay attention to comfort, mobility, and known sensitivities.',
        ],

        tip: {
          title: 'A lesson from Maxi',

          description:
            'The products Maxi enjoys most are not always the newest or most elaborate. They are often the ones that match his personality and fit naturally into his routine.',
        },
      },

      {
        id: 'define-the-purpose',

        title: 'Define what the product should accomplish.',

        paragraphs: [
          'A product is easier to evaluate when its purpose is clear. Ask what need it should meet, what activity it should support, or what part of your daily routine it should improve.',

          'A toy may support movement, interaction, retrieval, chewing, comfort, or mental stimulation. A walking or travel product may help with hydration, organization, identification, comfort, or transportation.',
        ],

        points: [
          'Identify the activity or routine the product should support.',
          'Avoid purchasing an item only because it looks appealing.',
          'Consider how frequently the product will be used.',
          'Think about storage, cleaning, maintenance, and portability.',
          'Consider whether a simpler product may meet the need more effectively.',
        ],
      },

      {
        id: 'choose-the-right-size',

        title: 'Choose the correct size and fit.',

        paragraphs: [
          'Labels such as small, medium, and large are not universal. Measure your dog and compare those measurements with the specific product’s sizing information whenever possible.',

          'Wearable products should allow comfortable movement and normal breathing. Toys should be appropriately sized for the way your dog handles, carries, retrieves, or chews them.',
        ],

        points: [
          'Measure the neck, chest, body, or paw when required.',
          'Do not select a size using breed name alone.',
          'Recheck fit as puppies grow.',
          'Check sizing again after meaningful weight or coat changes.',
          'Avoid toys that are inappropriately small for your dog.',
        ],
      },

      {
        id: 'inspect-materials',

        title: 'Inspect materials and construction.',

        paragraphs: [
          'Durability claims are not a substitute for inspection. Examine a product before its first use and continue checking it throughout its useful life.',

          'Pay close attention to seams, edges, closures, attachments, clips, rings, handles, cords, and other areas that may loosen or wear over time.',
        ],

        points: [
          'Look for loose or easily detached parts.',
          'Check for rough, cracked, sharp, or unfinished edges.',
          'Inspect fabric for weak seams or exposed filling.',
          'Test clips, buckles, rings, and closures.',
          'Consider whether the product can be cleaned and dried properly.',
        ],
      },

      {
        id: 'supervision-needs',

        title: 'Consider how much supervision the product requires.',

        paragraphs: [
          'Some products are designed for independent use, while others should be used only during active interaction or close supervision.',

          'Consider whether the product contains detachable pieces, cords, fabric, filling, hard edges, food compartments, or other elements that require closer observation.',
        ],

        points: [
          'Read the manufacturer’s instructions and warnings.',
          'Supervise unfamiliar toy use.',
          'Remove products when active supervision is not possible.',
          'Observe how your dog actually uses the product.',
          'Stop use when behavior or damage makes continued use inappropriate.',
        ],
      },

      {
        id: 'introduce-the-product',

        title: 'Introduce unfamiliar products gradually.',

        paragraphs: [
          'A new product may look ordinary to us while feeling unfamiliar to a dog. Allow your dog to investigate at a comfortable pace instead of forcing immediate interaction.',

          'Keep the first experience brief and calm. Observe your dog’s response and reinforce comfortable, appropriate interaction.',
        ],

        points: [
          'Allow your dog to look at and smell the product.',
          'Keep the first interaction short.',
          'Use praise or another appropriate positive experience.',
          'Pause when your dog shows sustained discomfort.',
          'Make adjustments before trying the product again.',
        ],
      },

      {
        id: 'monitor-and-replace',

        title: 'Monitor, maintain, and replace the product.',

        paragraphs: [
          'Product selection does not end after the purchase. Continue observing how your dog uses the item, clean it according to its instructions, and inspect it regularly.',

          'Stop using an item when damage, poor fit, worn materials, or changes in your dog’s behavior make continued use inappropriate.',
        ],

        points: [
          'Replace items with loose, cracked, sharp, or exposed pieces.',
          'Stop using damaged closures or hardware.',
          'Recheck the fit of wearable products.',
          'Clean products according to their care instructions.',
          'Remove products that are no longer appropriate for your dog.',
        ],
      },

      {
        id: 'final-checklist',

        title: 'Use a final product-selection checklist.',

        paragraphs: [
          'Before deciding, evaluate the product as part of your dog’s real routine rather than as an isolated purchase.',
        ],

        points: [
          'Does this product meet a real need?',
          'Is it appropriate for my dog’s current size and life stage?',
          'Does it match the way my dog normally plays or behaves?',
          'Can it be used comfortably in the intended environment?',
          'Can I clean, inspect, and maintain it properly?',
          'Will it require supervision?',
          'Do I know when it should be replaced?',
        ],
      },
    ],

    relatedLinks: [
      {
        title: 'How to Choose Dog Toys for Play and Enrichment',

        description:
          'Learn how to match toys to different play styles, sizes, activities, and supervision needs.',

        href: '/pet-guides/play-and-enrichment',
      },

      {
        title: 'How to Choose and Fit Dog Collars and Accessories',

        description:
          'Review sizing, comfort, identification, hardware, and everyday fit considerations.',

        href: '/pet-guides/collars-and-accessories',
      },

      {
        title: 'Pet Product Safety',

        description:
          'Review general safety guidance for selecting, inspecting, supervising, and replacing pet products.',

        href: '/product-safety',
      },
    ],

    closingTitle: 'A better choice begins with understanding your dog.',

    closingDescription:
      'The right product is one that supports your dog’s comfort, personality, habits, safety needs, and everyday life.',
  },

  {
    slug: 'play-and-enrichment',
    href: '/pet-guides/play-and-enrichment',

    title: 'How to Choose Dog Toys for Play and Enrichment',

    cardTitle: 'Play & Enrichment',

    description:
      'Learn how to choose dog toys based on play style, size, activity, construction, supervision needs, toy rotation, and signs that a toy should be replaced.',

    introduction:
      'Dogs play in different ways. Understanding how your dog prefers to engage can help you choose toys that are more appropriate, interesting, and useful.',

    seoTitle: 'How to Choose Dog Toys for Play and Enrichment',

    seoDescription:
      'Choose dog toys by play style, size, construction, supervision needs, toy rotation, and signs that a damaged toy should be replaced.',

    eyebrow: 'Play & Enrichment',
    icon: 'play',
    tone: 'accent',

    readingTime: '8 min read',

    publishedAt: '2026-07-27',
    updatedAt: '2026-08-02',

    indexable: true,
    showOnHomepage: true,

    learningPoints: [
      'Recognize different dog play styles.',
      'Match toys to your dog’s size and normal behavior.',
      'Use toy rotation to maintain interest.',
      'Inspect toys and know when they should be removed.',
    ],

    sections: [
      {
        id: 'understand-play-style',

        title: 'Understand your dog’s play style.',

        paragraphs: [
          'Some dogs enjoy chasing and retrieving, while others prefer tugging, carrying, chewing, searching, or solving simple puzzles.',

          'Observe which activities naturally hold your dog’s attention before selecting a toy. A toy that matches an existing interest is often more useful than one selected only for its appearance.',
        ],

        points: [
          'Chasing and retrieving',
          'Tugging and interactive play',
          'Carrying and comfort play',
          'Chewing',
          'Searching and puzzle solving',
          'Independent versus social play',
        ],
      },

      {
        id: 'match-toy-to-size',

        title: 'Match the toy to your dog’s size and behavior.',

        paragraphs: [
          'A toy should be appropriately sized for the way your dog carries, retrieves, chews, or manipulates it.',

          'Breed labels and general size categories can be helpful starting points, but your dog’s actual measurements and play behavior are more important.',
        ],

        points: [
          'Avoid toys that can be swallowed or lodged in the mouth.',
          'Consider jaw size and carrying style.',
          'Account for puppy growth.',
          'Choose a shape your dog can handle comfortably.',
          'Consider whether the toy will be used indoors or outdoors.',
        ],
      },

      {
        id: 'choose-appropriate-toys',

        title: 'Evaluate construction and intended use.',

        paragraphs: [
          'Consider size, shape, movement, texture, seams, attachments, materials, and the amount of supervision the toy requires.',

          'No toy should be treated as indestructible. Regular observation and inspection remain important even when a product is described as durable.',
        ],

        points: [
          'Match construction to normal play behavior.',
          'Avoid loose or easily detached pieces.',
          'Inspect seams, cords, squeakers, and attachments.',
          'Read the intended-use instructions.',
          'Supervise unfamiliar toy use.',
        ],
      },

      {
        id: 'create-variety',

        title: 'Provide different types of play.',

        paragraphs: [
          'A small collection of toys that supports different activities may be more useful than many toys that all serve the same purpose.',

          'Consider combining movement, interaction, searching, chewing, comfort, and simple problem-solving activities according to your dog’s interests.',
        ],

        points: [
          'Use fetch toys for movement and retrieval.',
          'Use tug toys for supervised interactive play.',
          'Use searching or puzzle activities for mental engagement.',
          'Keep appropriate comfort toys available.',
          'Adapt the selection as your dog’s interests change.',
        ],
      },

      {
        id: 'rotate-toys',

        title: 'Use toy rotation to maintain interest.',

        paragraphs: [
          'Keeping every toy available at all times can make familiar items feel less interesting. A simple rotation may renew attention without requiring constant new purchases.',

          'Do not remove an important comfort item merely to follow a rotation schedule. The rotation should support your dog’s routine, not disrupt it.',
        ],

        points: [
          'Keep a small selection available.',
          'Rotate some toys every few days.',
          'Retain favorite comfort items when appropriate.',
          'Clean toys before returning them to the rotation.',
          'Notice which toys consistently maintain interest.',
        ],

        tip: {
          title: 'Maxi’s play routine',

          description:
            'Maxi often becomes interested in a familiar toy again after it has been stored for a few days and then reintroduced.',
        },
      },

      {
        id: 'supervise-play',

        title: 'Supervise play when the toy requires it.',

        paragraphs: [
          'Interactive toys, tug products, food-dispensing toys, cords, fabric toys, and products with attachments may require closer supervision.',

          'Observe whether your dog uses the toy as intended or begins tearing, swallowing, guarding, or interacting with it in another unsafe way.',
        ],

        points: [
          'Stay nearby during unfamiliar play.',
          'Remove toys when active supervision is required but unavailable.',
          'Separate dogs when shared play becomes unsafe.',
          'Follow product-specific warnings.',
          'End the activity when the toy becomes damaged.',
        ],
      },

      {
        id: 'inspect-play-products',

        title: 'Inspect toys before and after play.',

        paragraphs: [
          'Look for torn fabric, exposed filling, damaged edges, cracks, loosened attachments, missing pieces, or changes in shape that could make continued use inappropriate.',

          'Cleaning also provides an opportunity to inspect areas that may be hidden by dirt, saliva, or debris.',
        ],

        points: [
          'Remove heavily damaged toys.',
          'Check seams, cords, and attachments.',
          'Look for missing or exposed pieces.',
          'Clean according to the product instructions.',
          'Replace toys that can no longer be used appropriately.',
        ],
      },
    ],

    relatedLinks: [
      {
        title: 'How to Choose Safe Toys and Products for Your Dog',

        description:
          'Use a complete checklist for product size, materials, purpose, supervision, maintenance, and replacement.',

        href: '/pet-guides/choosing-the-right-product',
      },

      {
        title: 'How to Create a Comfortable Resting Space for Your Dog',

        description:
          'Learn how comfort items and familiar resting spaces can support calm everyday routines.',

        href: '/pet-guides/comfort-at-home',
      },

      {
        title: 'Pet Product Safety',

        description:
          'Review general guidance for supervising play and removing damaged pet products.',

        href: '/product-safety',
      },
    ],

    closingTitle: 'Good play begins with observation.',

    closingDescription:
      'The goal is not simply to provide more toys, but to provide activities that suit the way your dog enjoys playing.',
  },

  {
    slug: 'walk-and-travel',
    href: '/pet-guides/walk-and-travel',

    title: 'Dog Walking and Travel Essentials: A Practical Checklist',

    cardTitle: 'Walk & Travel',

    description:
      'Prepare for dog walks, car rides, day trips, and longer adventures with practical guidance for equipment, hydration, identification, comfort, and organization.',

    introduction:
      'Good walking and travel products should support comfort, organization, hydration, identification, and safer everyday movement.',

    seoTitle: 'Dog Walking and Travel Essentials Checklist',

    seoDescription:
      'Prepare for dog walks and travel with a practical checklist covering harnesses, leashes, hydration, identification, comfort, and cleanup supplies.',

    eyebrow: 'Walk & Travel',
    icon: 'travel',
    tone: 'brand',

    readingTime: '8 min read',

    publishedAt: '2026-07-27',
    updatedAt: '2026-08-02',

    indexable: true,
    showOnHomepage: true,

    learningPoints: [
      'Choose comfortable and properly fitted walking equipment.',
      'Prepare a practical checklist for different outings.',
      'Plan for hydration, identification, and cleanup.',
      'Introduce unfamiliar travel products before a major trip.',
    ],

    sections: [
      {
        id: 'walking-equipment',

        title: 'Choose comfortable walking equipment.',

        paragraphs: [
          'Collars, harnesses, and leashes should fit correctly and support the kind of walking or activity you plan to do.',

          'Inspect connection points and closures before leaving home. A product that fit correctly in the past may require adjustment after growth, grooming, weight changes, or normal wear.',
        ],

        points: [
          'Measure before selecting a size.',
          'Check buckles, clips, rings, and stitching.',
          'Confirm that normal movement is not restricted.',
          'Recheck fit regularly.',
          'Replace equipment with damaged hardware or weakened material.',
        ],
      },

      {
        id: 'identification',

        title: 'Keep identification information current.',

        paragraphs: [
          'Identification products are useful only when their information remains readable and accurate.',

          'Check tags, rings, engraving, and attachment points before outings, particularly before travel away from familiar areas.',
        ],

        points: [
          'Confirm that the phone number is current.',
          'Make sure printed or engraved text remains readable.',
          'Inspect attachment rings.',
          'Replace damaged identification products.',
          'Follow applicable identification and licensing requirements.',
        ],
      },

      {
        id: 'pack-the-essentials',

        title: 'Pack essentials for the specific outing.',

        paragraphs: [
          'The length, location, temperature, transportation method, and purpose of the outing should determine what you bring.',

          'A short neighborhood walk may require only basic supplies, while a longer trip may require additional water, food, cleanup products, medication, comfort items, and documentation.',
        ],

        points: [
          'Water and a portable drinking container',
          'Current identification information',
          'Waste bags',
          'Any necessary food or treats',
          'A towel or cleanup item',
          'A familiar comfort item for longer trips',
          'Required medication or health documentation',
        ],
      },

      {
        id: 'portable-hydration',

        title: 'Plan for hydration before leaving home.',

        paragraphs: [
          'Bring enough water for the expected length and conditions of the outing. Heat, activity level, travel time, and access to clean water can affect what you need.',

          'Test portable bottles and bowls at home so your dog is familiar with them before you depend on them away from home.',
        ],

        points: [
          'Fill portable containers before leaving.',
          'Check for leaks.',
          'Bring more water when conditions require it.',
          'Offer water at appropriate intervals.',
          'Clean portable hydration products after use.',
        ],
      },

      {
        id: 'car-and-travel-comfort',

        title: 'Introduce transportation products gradually.',

        paragraphs: [
          'Introduce carriers, travel beds, seat protection, restraints, and other unfamiliar products before the day of a major trip.',

          'Short practice experiences can help you observe whether sizing, placement, temperature, or comfort adjustments are needed.',
        ],

        points: [
          'Introduce travel equipment at home.',
          'Begin with shorter practice trips.',
          'Maintain ventilation and temperature comfort.',
          'Bring familiar items when appropriate.',
          'Never leave a dog unattended in unsafe conditions.',
        ],
      },

      {
        id: 'destination-planning',

        title: 'Review the destination before traveling.',

        paragraphs: [
          'Confirm pet rules, weather conditions, available shade, walking surfaces, water access, transportation requirements, and emergency resources before leaving.',

          'A destination that allows pets may still have restrictions relating to size, carriers, leashes, vaccination records, or access to specific areas.',
        ],

        points: [
          'Confirm current pet policies.',
          'Check expected weather.',
          'Identify nearby veterinary resources for longer trips.',
          'Review transportation requirements.',
          'Plan rest and hydration stops.',
        ],
      },

      {
        id: 'after-the-outing',

        title: 'Inspect and clean equipment after the outing.',

        paragraphs: [
          'Walking and travel products may collect dirt, moisture, sand, salt, or debris. Cleaning and inspection help keep them ready for the next adventure.',

          'Restock used supplies immediately so the travel kit remains useful.',
        ],

        points: [
          'Allow wet products to dry fully.',
          'Check hardware and closures.',
          'Clean portable bowls and bottles.',
          'Refill waste bags and other supplies.',
          'Store travel essentials together.',
        ],
      },
    ],

    relatedLinks: [
      {
        title: 'Dog Feeding and Hydration Essentials',

        description:
          'Choose practical bowls, water products, and portable hydration options for daily routines and outings.',

        href: '/pet-guides/feeding-and-hydration',
      },

      {
        title: 'How to Choose and Fit Dog Collars and Accessories',

        description:
          'Review sizing, comfort, identification, hardware, and regular fit inspections.',

        href: '/pet-guides/collars-and-accessories',
      },

      {
        title: 'How to Choose Safe Toys and Products for Your Dog',

        description:
          'Use a complete product-selection checklist before choosing travel and walking equipment.',

        href: '/pet-guides/choosing-the-right-product',
      },
    ],

    closingTitle: 'A little preparation makes adventures easier.',

    closingDescription:
      'The best travel setup is practical, comfortable, organized, and appropriate for the specific outing you are planning.',
  },

  {
    slug: 'feeding-and-hydration',
    href: '/pet-guides/feeding-and-hydration',

    title: 'Dog Feeding and Hydration Essentials for Everyday Routines',

    cardTitle: 'Feeding & Hydration',

    description:
      'Choose dog bowls, portable water products, and feeding accessories based on capacity, stability, materials, cleaning, travel needs, and daily routines.',

    introduction:
      'Feeding and hydration products should be appropriately sized, stable, easy to use, and practical to clean and maintain.',

    seoTitle: 'Dog Feeding and Hydration Essentials',

    seoDescription:
      'Choose dog bowls and portable water products based on size, stability, materials, cleaning, travel needs, and everyday feeding routines.',

    eyebrow: 'Feeding & Hydration',
    icon: 'hydration',
    tone: 'sand',

    readingTime: '7 min read',

    publishedAt: '2026-07-27',
    updatedAt: '2026-08-02',

    indexable: true,
    showOnHomepage: true,

    learningPoints: [
      'Consider bowl size, depth, capacity, and stability.',
      'Select materials that can be cleaned and maintained.',
      'Prepare portable hydration for outings.',
      'Know your dog’s normal eating and drinking patterns.',
    ],

    sections: [
      {
        id: 'choose-bowls',

        title: 'Choose appropriately sized feeding products.',

        paragraphs: [
          'Consider the product’s size, shape, depth, capacity, stability, material, and intended location.',

          'The product should suit your dog’s size and the way your dog normally approaches food and water.',
        ],

        points: [
          'Choose an appropriate capacity.',
          'Consider the height and depth of the product.',
          'Make sure your dog can access food or water comfortably.',
          'Avoid selecting solely by appearance.',
          'Follow product-specific sizing instructions.',
        ],
      },

      {
        id: 'stability-and-location',

        title: 'Consider stability and placement.',

        paragraphs: [
          'A feeding or water product should remain reasonably stable during normal use and should be placed where it is easy for your dog to access.',

          'Consider the flooring, household traffic, nearby electrical equipment, cleaning needs, and the possibility of spills.',
        ],

        points: [
          'Use a stable, level surface.',
          'Keep the area easy to clean.',
          'Avoid locations where the product is frequently disturbed.',
          'Consider a mat when appropriate.',
          'Maintain access to fresh water according to your dog’s needs.',
        ],
      },

      {
        id: 'materials-and-condition',

        title: 'Evaluate materials and product condition.',

        paragraphs: [
          'Different materials have different cleaning, durability, weight, and handling characteristics.',

          'Inspect bowls, lids, seals, hinges, valves, and portable containers for cracks, deep scratches, chips, damaged coatings, or areas that are difficult to clean.',
        ],

        points: [
          'Review material and care information.',
          'Check for chips, cracks, or sharp edges.',
          'Inspect portable seals and closures.',
          'Replace products that cannot be cleaned properly.',
          'Follow manufacturer care instructions.',
        ],
      },

      {
        id: 'portable-hydration',

        title: 'Prepare portable hydration for outings.',

        paragraphs: [
          'Portable bottles and bowls can make it easier to offer water during walks, travel, and outdoor activities.',

          'Test unfamiliar hydration products at home before depending on them away from home.',
        ],

        points: [
          'Fill the product before leaving.',
          'Confirm that it does not leak.',
          'Bring enough water for the planned activity.',
          'Offer water at suitable intervals.',
          'Clean the product after each outing.',
        ],
      },

      {
        id: 'cleaning-routine',

        title: 'Maintain a consistent cleaning routine.',

        paragraphs: [
          'Food and water products should be cleaned regularly according to their material, use, and care instructions.',

          'Cleaning frequency may differ between food bowls, water bowls, portable containers, food-dispensing products, and storage accessories.',
        ],

        points: [
          'Remove leftover food.',
          'Wash bowls and accessories regularly.',
          'Clean lids, corners, seals, and moving parts.',
          'Allow cleaned items to dry properly.',
          'Replace damaged or difficult-to-clean products.',
        ],
      },

      {
        id: 'storage-and-travel',

        title: 'Store food and travel supplies appropriately.',

        paragraphs: [
          'Food-storage products should be used according to their intended purpose and kept in conditions appropriate for the product being stored.',

          'Portable containers should be emptied, cleaned, and dried after outings unless their instructions specify another process.',
        ],

        points: [
          'Close storage products securely.',
          'Label travel supplies when helpful.',
          'Do not leave wet accessories sealed in storage.',
          'Inspect containers before refilling.',
          'Follow applicable food-storage guidance.',
        ],
      },

      {
        id: 'observe-normal-habits',

        title: 'Know your dog’s normal habits.',

        paragraphs: [
          'Familiarity with your dog’s usual eating and drinking patterns makes it easier to notice meaningful changes.',

          'Concerns about appetite, hydration, swallowing, discomfort, weight, or health should be discussed with a qualified veterinarian.',
        ],
      },
    ],

    relatedLinks: [
      {
        title: 'Dog Walking and Travel Essentials',

        description:
          'Prepare portable water, cleanup supplies, identification, and comfort items for outings and travel.',

        href: '/pet-guides/walk-and-travel',
      },

      {
        title: 'How to Choose Safe Toys and Products for Your Dog',

        description:
          'Evaluate materials, construction, cleaning requirements, size, and everyday practicality.',

        href: '/pet-guides/choosing-the-right-product',
      },

      {
        title: 'How to Create a Comfortable Resting Space for Your Dog',

        description:
          'Build practical home routines around rest, accessibility, cleanliness, and familiar spaces.',

        href: '/pet-guides/comfort-at-home',
      },
    ],

    closingTitle: 'Simple products can support important daily routines.',

    closingDescription:
      'Choose feeding and hydration products that are practical for your dog and manageable within the way your household operates.',
  },

  {
    slug: 'comfort-at-home',
    href: '/pet-guides/comfort-at-home',

    title: 'How to Create a Comfortable Resting Space for Your Dog',

    cardTitle: 'Comfort at Home',

    description:
      'Create a practical resting space for your dog based on sleeping style, size, location, temperature, mobility, washable materials, and familiar routines.',

    introduction:
      'A comfortable resting space should feel familiar, appropriately sized, easy to maintain, and suitable for the way your dog normally relaxes.',

    seoTitle: 'How to Create a Comfortable Space for Your Dog',

    seoDescription:
      'Create a comfortable dog resting space based on sleeping style, size, location, temperature, mobility, washable materials, and familiar routines.',

    eyebrow: 'Comfort at Home',
    icon: 'comfort',
    tone: 'brand',

    readingTime: '7 min read',

    publishedAt: '2026-07-27',
    updatedAt: '2026-08-02',

    indexable: true,

    learningPoints: [
      'Observe how and where your dog prefers to rest.',
      'Choose an appropriately sized resting product.',
      'Select a calm, accessible, and practical location.',
      'Use washable materials and maintain familiar routines.',
    ],

    sections: [
      {
        id: 'observe-resting-style',

        title: 'Observe how your dog prefers to rest.',

        paragraphs: [
          'Some dogs curl into a compact position, while others stretch out fully or prefer leaning against a raised edge.',

          'Your dog’s normal sleeping posture can help guide decisions about shape, cushioning, raised edges, and available space.',
        ],

        points: [
          'Observe normal sleeping positions.',
          'Notice whether your dog prefers soft or firmer surfaces.',
          'Consider whether your dog seeks warmth or cooler areas.',
          'Pay attention to preferred rooms and locations.',
          'Account for age, mobility, and ease of access.',
        ],
      },

      {
        id: 'measure-the-space',

        title: 'Measure your dog and the available space.',

        paragraphs: [
          'Measure the approximate area your dog uses while resting naturally. A resting product should provide enough usable space for normal sleeping positions.',

          'Also measure the area in your home where the product will be placed so it does not obstruct walkways or become difficult to access.',
        ],

        points: [
          'Measure your dog while resting in a normal position.',
          'Compare measurements with product dimensions.',
          'Confirm the space fits within the intended room.',
          'Allow room for safe access around the product.',
          'Reevaluate sizing as puppies grow.',
        ],
      },

      {
        id: 'choose-the-location',

        title: 'Choose a calm and practical location.',

        paragraphs: [
          'A resting area should be accessible without being placed directly in the busiest or most disruptive part of the home.',

          'Many dogs benefit from having a familiar place where they can rest without unnecessary interruption while still remaining connected to household activity.',
        ],

        points: [
          'Avoid frequently blocked walkways.',
          'Consider household noise and traffic.',
          'Avoid unsafe heat or direct drafts.',
          'Make the space easy for your dog to enter and leave.',
          'Provide more than one suitable location when practical.',
        ],
      },

      {
        id: 'mobility-and-access',

        title: 'Consider mobility and accessibility.',

        paragraphs: [
          'Puppies, older dogs, dogs recovering from illness, and dogs with mobility limitations may require easier access, different cushioning, or a lower entry point.',

          'Persistent pain, stiffness, difficulty standing, or significant changes in sleeping habits should be discussed with a veterinarian.',
        ],

        points: [
          'Consider the height of raised edges.',
          'Use nonslip placement when appropriate.',
          'Keep the resting area easy to access.',
          'Observe whether your dog can enter and leave comfortably.',
          'Reassess the setup when mobility changes.',
        ],
      },

      {
        id: 'materials-and-cleaning',

        title: 'Choose practical materials and a cleaning routine.',

        paragraphs: [
          'Comfort products should suit the home environment and be maintainable over time.',

          'Review whether covers, inserts, cushions, frames, and other components can be cleaned according to the manufacturer’s instructions.',
        ],

        points: [
          'Check washing and care instructions.',
          'Consider removable or washable covers.',
          'Allow damp products to dry completely.',
          'Inspect seams, filling, zippers, and closures.',
          'Replace products with exposed filling or damaged components.',
        ],
      },

      {
        id: 'temperature-and-environment',

        title: 'Consider temperature and the surrounding environment.',

        paragraphs: [
          'Sunlight, air-conditioning vents, heaters, humidity, flooring, and seasonal temperature changes can affect how comfortable a resting location feels.',

          'Observe where your dog chooses to rest during different times of day and different seasons.',
        ],

        points: [
          'Avoid unsafe heat sources.',
          'Consider cool surfaces during warm conditions.',
          'Provide suitable warmth when conditions require it.',
          'Keep the area dry and ventilated.',
          'Adjust the location when environmental conditions change.',
        ],
      },

      {
        id: 'maintain-familiarity',

        title: 'Maintain familiar comfort routines.',

        paragraphs: [
          'Familiar scents, locations, and resting products can become part of a dog’s normal daily routine.',

          'When replacing or moving a comfort product, a gradual transition may help some dogs adjust.',
        ],

        points: [
          'Introduce a new resting product near a familiar location.',
          'Allow your dog to investigate without pressure.',
          'Retain a familiar blanket when appropriate.',
          'Avoid repeatedly relocating the resting space.',
          'Observe whether the new arrangement is actually used.',
        ],

        tip: {
          title: 'Maxi’s familiar place',

          description:
            'Maxi often returns to the same resting locations because they are familiar, calm, and connected to his normal routine.',
        },
      },
    ],

    relatedLinks: [
      {
        title: 'Dog Grooming Tools and Everyday Care Routines',

        description:
          'Introduce grooming and care products gradually while maintaining predictable, comfortable routines.',

        href: '/pet-guides/grooming-and-care',
      },

      {
        title: 'How to Choose Safe Toys and Products for Your Dog',

        description:
          'Choose comfort products based on size, purpose, materials, maintenance, and real daily use.',

        href: '/pet-guides/choosing-the-right-product',
      },

      {
        title: 'How to Choose Dog Toys for Play and Enrichment',

        description:
          'Balance active play with familiar comfort items and appropriate resting routines.',

        href: '/pet-guides/play-and-enrichment',
      },
    ],

    closingTitle: 'Comfort is personal.',

    closingDescription:
      'The most useful resting space is one that reflects how your dog actually relaxes and moves through everyday life at home.',
  },

  {
    slug: 'grooming-and-care',
    href: '/pet-guides/grooming-and-care',

    title: 'Dog Grooming Tools and Everyday Care Routines',

    cardTitle: 'Grooming & Everyday Care',

    description:
      'Learn how to introduce dog grooming tools through brief, predictable routines while choosing products for the intended coat, task, body area, and comfort level.',

    introduction:
      'Simple grooming and care routines can become easier when products are introduced gradually and used with respect for your dog’s comfort.',

    seoTitle: 'Dog Grooming Tools and Everyday Care Routines',

    seoDescription:
      'Introduce dog grooming tools gradually, keep sessions comfortable, choose products for the intended task, and know when professional support is needed.',

    eyebrow: 'Grooming & Care',
    icon: 'care',
    tone: 'accent',

    readingTime: '8 min read',

    publishedAt: '2026-07-27',
    updatedAt: '2026-08-02',

    indexable: true,

    learningPoints: [
      'Introduce grooming products gradually.',
      'Keep early sessions brief and predictable.',
      'Choose tools for the intended coat, task, and body area.',
      'Recognize when veterinary or professional grooming support is appropriate.',
    ],

    sections: [
      {
        id: 'introduce-tools',

        title: 'Introduce tools before using them.',

        paragraphs: [
          'Allow your dog to see and investigate an unfamiliar brush, comb, towel, cleaning product, nail-care item, or other tool before beginning the full routine.',

          'A calm introduction can reduce uncertainty and give you an opportunity to observe your dog’s response before physical contact begins.',
        ],

        points: [
          'Place the tool nearby without immediately using it.',
          'Allow visual and scent investigation.',
          'Pair calm investigation with a positive experience.',
          'Avoid forcing prolonged interaction.',
          'Store the product safely after the introduction.',
        ],
      },

      {
        id: 'prepare-the-environment',

        title: 'Prepare a calm and practical environment.',

        paragraphs: [
          'Choose a location with enough light, stable footing, manageable distractions, and access to the supplies you need.',

          'Preparing brushes, towels, cleanup products, and other items in advance can reduce unnecessary pauses and movement during the routine.',
        ],

        points: [
          'Use a stable, nonslip surface when appropriate.',
          'Gather supplies before beginning.',
          'Keep the environment reasonably calm.',
          'Use sufficient lighting.',
          'Keep unsafe products out of reach.',
        ],
      },

      {
        id: 'keep-sessions-short',

        title: 'Keep early sessions short and positive.',

        paragraphs: [
          'It is often better to complete a small amount comfortably than to continue until the dog becomes overwhelmed.',

          'Increase duration gradually as your dog becomes more familiar with the tool, environment, handling, and routine.',
        ],

        points: [
          'Begin with a brief interaction.',
          'Work on one small area at a time.',
          'Pause when discomfort increases.',
          'Reinforce calm cooperation.',
          'Build duration gradually.',
        ],
      },

      {
        id: 'choose-the-right-tool',

        title: 'Choose tools for the intended task.',

        paragraphs: [
          'Different coat types, body areas, and care routines may require different products. Read instructions and select tools appropriate for their intended purpose.',

          'A tool intended for general brushing may not be suitable for mats, sensitive areas, nail care, dental care, ears, or skin concerns.',
        ],

        points: [
          'Follow product directions.',
          'Match the tool to the intended coat or task.',
          'Check edges and working surfaces before use.',
          'Avoid using damaged tools.',
          'Ask a professional when the appropriate tool is unclear.',
        ],
      },

      {
        id: 'observe-comfort',

        title: 'Observe body language and comfort.',

        paragraphs: [
          'Watch for changes in posture, movement, avoidance, vocalization, attempts to leave, or other behavior that may indicate increasing discomfort.',

          'Do not assume that remaining still always means the dog is comfortable. Consider the full context and your dog’s normal behavior.',
        ],

        points: [
          'Pause when discomfort increases.',
          'Adjust pressure, position, or duration.',
          'Avoid restraining beyond what is appropriate and safe.',
          'Do not continue through signs of pain.',
          'Seek professional help when handling becomes unsafe.',
        ],
      },

      {
        id: 'clean-and-store-tools',

        title: 'Clean, inspect, and store tools properly.',

        paragraphs: [
          'Remove hair, dirt, moisture, or product residue according to the tool’s instructions after each routine.',

          'Allow products to dry when necessary and store them where pets and children cannot access them unsupervised.',
        ],

        points: [
          'Remove collected hair and debris.',
          'Follow cleaning instructions.',
          'Allow damp tools to dry.',
          'Inspect handles, pins, blades, cords, and working surfaces.',
          'Store products securely.',
        ],
      },

      {
        id: 'professional-support',

        title: 'Know when to seek professional support.',

        paragraphs: [
          'Grooming products and general guides do not replace veterinary care or professional grooming expertise.',

          'Pain, skin concerns, wounds, injuries, significant matting, ear problems, nail injuries, coat changes, or strong behavioral responses should be discussed with an appropriate professional.',
        ],

        points: [
          'Contact a veterinarian for medical concerns.',
          'Use a qualified groomer for tasks beyond your experience.',
          'Do not use products intended to treat a condition without appropriate guidance.',
          'Stop when the routine becomes unsafe.',
          'Share relevant health or behavior information with the professional.',
        ],
      },
    ],

    relatedLinks: [
      {
        title: 'How to Create a Comfortable Resting Space for Your Dog',

        description:
          'Create predictable home routines and practical spaces that support rest and comfort.',

        href: '/pet-guides/comfort-at-home',
      },

      {
        title: 'How to Choose Safe Toys and Products for Your Dog',

        description:
          'Evaluate grooming products based on purpose, materials, maintenance, safety, and real use.',

        href: '/pet-guides/choosing-the-right-product',
      },

      {
        title: 'How to Choose and Fit Dog Collars and Accessories',

        description: 'Recheck wearable-product fit after grooming or changes in coat thickness.',

        href: '/pet-guides/collars-and-accessories',
      },
    ],

    closingTitle: 'Patience can make care routines easier.',

    closingDescription:
      'Introduce products gradually, observe your dog closely, and prioritize comfort throughout each grooming or care routine.',
  },

  {
    slug: 'collars-and-accessories',
    href: '/pet-guides/collars-and-accessories',

    title: 'How to Choose and Fit Dog Collars and Accessories',

    cardTitle: 'Collars & Accessories',

    description:
      'Choose dog collars and wearable accessories with attention to measurements, fit, comfort, identification, materials, hardware, coat changes, and regular inspection.',

    introduction:
      'A collar or wearable accessory should fit securely without restricting normal movement, breathing, or everyday comfort.',

    seoTitle: 'How to Choose and Fit Dog Collars and Accessories',

    seoDescription:
      'Choose and fit dog collars using accurate measurements, comfort checks, current identification, durable hardware, and regular fit inspections.',

    eyebrow: 'Collars & Accessories',
    icon: 'accessories',
    tone: 'sand',

    readingTime: '8 min read',

    publishedAt: '2026-07-27',
    updatedAt: '2026-08-02',

    indexable: true,

    learningPoints: [
      'Measure your dog before selecting a size.',
      'Check comfort and fit regularly.',
      'Keep identification information current.',
      'Inspect hardware, stitching, and decorative details.',
    ],

    sections: [
      {
        id: 'measure-first',

        title: 'Measure before selecting a size.',

        paragraphs: [
          'Do not rely only on terms such as small, medium, or large. Compare your dog’s actual measurements with the product’s specific sizing information.',

          'Follow the manufacturer’s instructions because products may be measured differently depending on their design and intended position.',
        ],

        points: [
          'Use a flexible measuring tape.',
          'Measure where the product will sit.',
          'Follow the product’s measurement instructions.',
          'Record the measurement before shopping.',
          'Recheck the measurement before ordering.',
        ],
      },

      {
        id: 'understand-product-purpose',

        title: 'Choose the product for its intended purpose.',

        paragraphs: [
          'Collars and wearable accessories may be designed for identification, walking, visibility, decoration, training-related use, travel, or another specific purpose.',

          'Do not assume every collar or accessory is suitable for every activity. Review the intended use, warnings, construction, and attachment points.',
        ],

        points: [
          'Identify the primary purpose.',
          'Review product-specific instructions.',
          'Confirm whether the product is intended for leash attachment.',
          'Avoid using decorative items for unsupported purposes.',
          'Use appropriate walking equipment for the activity.',
        ],
      },

      {
        id: 'check-the-fit',

        title: 'Check comfort and fit.',

        paragraphs: [
          'The collar or accessory should remain secure while allowing normal movement and breathing.',

          'Fit recommendations may vary by product design. Follow the manufacturer’s directions instead of relying on one universal rule.',
        ],

        points: [
          'Confirm the product is not excessively loose.',
          'Check that it does not create unnecessary pressure.',
          'Look for rubbing, hair loss, or irritation.',
          'Observe movement during normal activity.',
          'Remove or adjust the product when fit is inappropriate.',
        ],
      },

      {
        id: 'recheck-fit',

        title: 'Recheck fit as your dog changes.',

        paragraphs: [
          'Puppy growth, weight changes, grooming, seasonal coat differences, and normal material stretching can change how a wearable product fits.',

          'Regular checks are particularly important for products worn frequently.',
        ],

        points: [
          'Check fit as puppies grow.',
          'Recheck after grooming.',
          'Account for seasonal coat changes.',
          'Inspect adjustable areas for slipping.',
          'Replace products that can no longer be adjusted correctly.',
        ],
      },

      {
        id: 'identification',

        title: 'Keep identification information current.',

        paragraphs: [
          'Identification accessories are useful only when the information remains readable and up to date.',

          'Check tags, rings, engraving, printed information, and attachment points regularly.',
        ],

        points: [
          'Confirm current contact information.',
          'Check that text remains readable.',
          'Inspect rings and attachment points.',
          'Replace damaged identification products.',
          'Review identification before travel.',
        ],
      },

      {
        id: 'inspect-accessories',

        title: 'Inspect hardware, stitching, and decorative details.',

        paragraphs: [
          'Wearable accessories may include buckles, clips, rings, stitching, reflective material, lights, decorations, or other parts that can loosen with use.',

          'Inspect the entire product rather than checking only the primary buckle or attachment point.',
        ],

        points: [
          'Test closures before use.',
          'Check for frayed or weakened stitching.',
          'Inspect rings and attachment points.',
          'Look for loose decorations or batteries.',
          'Remove accessories that cause irritation.',
        ],
      },

      {
        id: 'clean-and-maintain',

        title: 'Clean and maintain wearable products.',

        paragraphs: [
          'Dirt, moisture, salt, sand, grooming products, and normal wear can affect materials and hardware over time.',

          'Follow cleaning instructions and allow wet products to dry completely before continued use or storage.',
        ],

        points: [
          'Follow the care label.',
          'Rinse products after exposure when appropriate.',
          'Allow hardware and fabric to dry.',
          'Check for odor, stiffness, corrosion, or weakened material.',
          'Replace products that remain damaged after cleaning.',
        ],
      },
    ],

    relatedLinks: [
      {
        title: 'Dog Walking and Travel Essentials',

        description:
          'Prepare walking equipment, identification, hydration, comfort items, and practical travel supplies.',

        href: '/pet-guides/walk-and-travel',
      },

      {
        title: 'How to Choose Safe Toys and Products for Your Dog',

        description:
          'Use a broader checklist for sizing, materials, purpose, supervision, maintenance, and replacement.',

        href: '/pet-guides/choosing-the-right-product',
      },

      {
        title: 'Dog Grooming Tools and Everyday Care Routines',

        description:
          'Learn why collar and accessory fit should be checked again after grooming and coat changes.',

        href: '/pet-guides/grooming-and-care',
      },
    ],

    closingTitle: 'Style should never come before comfort.',

    closingDescription:
      'Choose accessories that fit correctly, remain secure, and work comfortably within your dog’s daily routine.',
  },
];

export const featuredGuide = petGuides.find((guide) => guide.featured) as PetGuide;

export const petGuideTopics = petGuides.filter((guide) => !guide.featured);

export const homepagePetGuides = petGuides.filter((guide) => guide.showOnHomepage);

export const maxiGuideTips = [
  {
    title: 'Start with your dog',

    description:
      'Personality, size, age, habits, and routines matter more than choosing a product only because it looks appealing.',
  },

  {
    title: 'Introduce products gradually',

    description:
      'Give your dog time to investigate unfamiliar toys, accessories, bowls, carriers, or grooming tools.',
  },

  {
    title: 'Observe real use',

    description:
      'Watch how your dog interacts with a product and adjust when it creates frustration, discomfort, or unsafe behavior.',
  },

  {
    title: 'Inspect products regularly',

    description:
      'Replace items that become damaged, loose, sharp, heavily worn, or no longer appropriate for continued use.',
  },
] as const;

export function getPetGuideBySlug(slug: string): PetGuide | undefined {
  return petGuides.find((guide) => guide.slug === slug);
}
