import { businessConfig } from '../config/business';

export type ContactTopicIcon =
  | 'general'
  | 'product'
  | 'partnership'
  | 'feedback'
  | 'order'
  | 'return';

export type ContactTopicValue =
  | 'general-question'
  | 'product-question'
  | 'partnership'
  | 'website-feedback'
  | 'order-support'
  | 'return-request';

export interface ContactTopic {
  label: string;
  value: ContactTopicValue;
  title: string;
  description: string;
  icon: ContactTopicIcon;
  liveOnly?: boolean;
}

export interface ContactPrinciple {
  title: string;
  description: string;
}

export interface ContactChannel {
  title: string;
  email: string;
  description: string;
  icon: ContactTopicIcon;
}

export const contactTopics: ContactTopic[] = [
  {
    label: 'General question',
    value: 'general-question',

    title: 'General Questions',

    description: `Ask about ${businessConfig.shortName}, our story, the upcoming store, Pet Guides, or anything else related to the brand.`,

    icon: 'general',
  },

  {
    label: 'Product question',
    value: 'product-question',

    title: 'Product Questions',

    description:
      'Tell us what type of product, pet routine, size, feature, or category you would like to learn more about.',

    icon: 'product',
  },

  {
    label: 'Partnership or collaboration',
    value: 'partnership',

    title: 'Partnerships',

    description:
      'Share a thoughtful partnership, collaboration, wholesale, creator, or community opportunity.',

    icon: 'partnership',
  },

  {
    label: 'Website feedback',
    value: 'website-feedback',

    title: 'Website Feedback',

    description:
      'Let us know about an accessibility concern, broken link, confusing section, or suggestion for the website.',

    icon: 'feedback',
  },

  {
    label: 'Order support',
    value: 'order-support',

    title: 'Order Support',

    description: `Contact us about an existing ${businessConfig.shortName} order and include the order number when it is available.`,

    icon: 'order',
    liveOnly: true,
  },

  {
    label: 'Return request',
    value: 'return-request',

    title: 'Returns',

    description: `Start a return-related conversation for an eligible ${businessConfig.shortName} purchase after the store opens.`,

    icon: 'return',
    liveOnly: true,
  },
];

export const contactChannels: ContactChannel[] = [
  {
    title: 'General Questions',

    email: businessConfig.generalEmail,

    description:
      'General questions, product questions, partnerships, collaborations, Pet Guides, and website feedback.',

    icon: 'general',
  },

  {
    title: 'Order Support',

    email: businessConfig.ordersEmail,

    description:
      'Questions about an existing order, payment confirmation, shipping update, or order information.',

    icon: 'order',
  },

  {
    title: 'Returns and Product Issues',

    email: businessConfig.supportEmail,

    description:
      'Return requests and reports about damaged, defective, incorrect, missing, or incomplete products.',

    icon: 'return',
  },
];

export const contactPrinciples: ContactPrinciple[] = [
  {
    title: 'Include helpful details',

    description:
      'Names, product categories, order numbers, page links, and clear descriptions help us understand your message.',
  },

  {
    title: 'Protect sensitive information',

    description:
      'Do not submit card numbers, passwords, full payment details, or other highly sensitive information through this form.',
  },

  {
    title: 'Choose the closest topic',

    description:
      'Selecting the most relevant topic helps keep questions, feedback, partnerships, and future order support organized.',
  },
];

export function getAvailableContactTopics(isStoreLive: boolean): ContactTopic[] {
  return contactTopics.filter((topic) => isStoreLive || !topic.liveOnly);
}
