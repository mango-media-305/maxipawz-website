/**
 * Public business information used by policy and customer-support pages.
 *
 * IMPORTANT:
 * Replace `legalName` before the commercial launch if the registered
 * business entity differs from the public MaxiPawz Store name.
 *
 * Add a public support email or mailing address only after those contact
 * details are ready to appear permanently on the website.
 */
export const businessConfig = {
    publicName: 'MaxiPawz Store',
    shortName: 'MaxiPawz',

    legalName: '',

    country: 'United States',

    contactLabel: 'MaxiPawz contact form',
    contactHref: '/contact',

    supportEmail: '',
    privacyEmail: '',
    mailingAddress: '',

    policyEffectiveDate: 'July 27, 2026',
    policyLastUpdated: 'August 2, 2026',

    policyStage: 'prelaunch',

    /**
     * Keep this false until shipping destinations, processing times,
     * return eligibility, return windows, cancellation rules, and refund
     * procedures have been formally approved.
     */
    commercePoliciesFinalized: false,
} as const;

export const businessDisplayName =
    businessConfig.legalName.trim() ||
    businessConfig.publicName;