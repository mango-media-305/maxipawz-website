/**
 * Public business information used by policy, customer-support,
 * transactional-email, and website identity features.
 *
 * The public brand name may be displayed while registration is pending.
 * Keep `legalName` empty until the exact registered corporation name has
 * been approved and officially registered.
 */
export const businessConfig = {
  publicName: 'Maxi Pawz Store',
  shortName: 'Maxi Pawz',

  /**
   * Exact registered entity name.
   *
   * This must remain empty until registration is complete.
   */
  legalName: '',

  registrationStatus: 'pending',
  intendedEntityType: 'Florida for-profit corporation',

  country: 'United States',
  state: 'Florida',

  contactLabel: 'Maxi Pawz contact form',
  contactHref: '/contact',

  generalEmail: 'info@maxipawz.com',
  ordersEmail: 'orders@maxipawz.com',
  supportEmail: 'support@maxipawz.com',
  privacyEmail: 'support@maxipawz.com',

  automatedEmailSenderName: 'Maxi Pawz Store',
  automatedEmailSenderAddress: 'orders@updates.maxipawz.com',

  /**
   * No public mailing address or telephone number will be displayed
   * during the current prelaunch stage.
   */
  mailingAddress: '',
  phoneNumber: '',

  supportResponseTime: 'We normally respond within 1–2 business days.',

  policyEffectiveDate: 'July 27, 2026',
  policyLastUpdated: 'August 4, 2026',

  policyStage: 'prelaunch',

  /**
   * Keep this false until shipping destinations, processing times,
   * return eligibility, return windows, cancellation rules, and refund
   * procedures have been formally approved.
   */
  commercePoliciesFinalized: false,
} as const;

export const businessDisplayName = businessConfig.legalName.trim() || businessConfig.publicName;
