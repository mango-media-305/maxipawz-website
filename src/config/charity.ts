export const charityConfig = {
  planned: true,

  enabled: false,

  partnerName: '',

  partnerWebsite: '',

  programName: 'Support a Local Animal Shelter',

  suggestedContributionAmounts: [100, 300, 500],

  countsTowardFreeShipping: false,

  disclosure:
    'Any future optional contribution will be identified separately from merchandise, tax, and shipping charges. Maxi Pawz will not represent a contribution as tax-deductible unless the partner, payment structure, receipts, and applicable legal requirements have been confirmed.',
} as const;

export const charityPartnershipReady =
  charityConfig.enabled && charityConfig.partnerName.trim().length > 0;
