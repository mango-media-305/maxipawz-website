import type {
    Product,
} from '../types/product';

import type {
    ProductLandingPageDefinition,
} from '../types/product-landing-page';

export type ProductLandingPageValidationSeverity =
    | 'error'
    | 'warning';

export interface ProductLandingPageValidationIssue {
    severity:
    ProductLandingPageValidationSeverity;

    code: string;

    landingPageSlug: string;

    path: string;

    message: string;
}

export interface ProductLandingPageValidationResult {
    valid: boolean;

    errors:
    ProductLandingPageValidationIssue[];

    warnings:
    ProductLandingPageValidationIssue[];
}

const SLUG_PATTERN =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CAMPAIGN_ID_PATTERN =
    /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

function isNonEmptyString(
    value: unknown,
): value is string {
    return (
        typeof value ===
        'string' &&
        value.trim().length >
        0
    );
}

function getLandingPageLabel(
    landingPage:
        ProductLandingPageDefinition,

    index: number,
): string {
    if (
        isNonEmptyString(
            landingPage.slug,
        )
    ) {
        return landingPage.slug;
    }

    return `landing-page-${index + 1}`;
}

function createIssue(
    severity:
        ProductLandingPageValidationSeverity,

    code: string,

    landingPageSlug: string,

    path: string,

    message: string,
): ProductLandingPageValidationIssue {
    return {
        severity,

        code,

        landingPageSlug,

        path,

        message,
    };
}

function addError(
    errors:
        ProductLandingPageValidationIssue[],

    code: string,

    landingPageSlug: string,

    path: string,

    message: string,
): void {
    errors.push(
        createIssue(
            'error',

            code,

            landingPageSlug,

            path,

            message,
        ),
    );
}

function addWarning(
    warnings:
        ProductLandingPageValidationIssue[],

    code: string,

    landingPageSlug: string,

    path: string,

    message: string,
): void {
    warnings.push(
        createIssue(
            'warning',

            code,

            landingPageSlug,

            path,

            message,
        ),
    );
}

function validateRequiredText(
    value: unknown,

    path: string,

    landingPageSlug: string,

    errors:
        ProductLandingPageValidationIssue[],
): void {
    if (
        isNonEmptyString(
            value,
        )
    ) {
        return;
    }

    addError(
        errors,

        'missing-required-text',

        landingPageSlug,

        path,

        'This value must contain non-empty text.',
    );
}

function validateOptionalText(
    value: unknown,

    path: string,

    landingPageSlug: string,

    errors:
        ProductLandingPageValidationIssue[],
): void {
    if (
        value ===
        undefined
    ) {
        return;
    }

    if (
        isNonEmptyString(
            value,
        )
    ) {
        return;
    }

    addError(
        errors,

        'invalid-optional-text',

        landingPageSlug,

        path,

        'Remove this field or provide non-empty text.',
    );
}

function validateImageIndex(
    imageIndex:
        | number
        | undefined,

    path: string,

    landingPageSlug: string,

    product:
        | Product
        | undefined,

    errors:
        ProductLandingPageValidationIssue[],
): void {
    if (
        imageIndex ===
        undefined
    ) {
        return;
    }

    if (
        !Number.isInteger(
            imageIndex,
        ) ||
        imageIndex <
        0
    ) {
        addError(
            errors,

            'invalid-image-index',

            landingPageSlug,

            path,

            'Image indexes must be whole numbers greater than or equal to zero.',
        );

        return;
    }

    if (
        product &&
        imageIndex >=
        product.images.length
    ) {
        addError(
            errors,

            'missing-product-image',

            landingPageSlug,

            path,

            `Image index ${imageIndex} does not exist on product "${product.slug}". The product currently has ${product.images.length} image${product.images.length === 1 ? '' : 's'}.`,
        );
    }
}

function validateUniqueGalleryIndexes(
    imageIndexes: number[],

    landingPageSlug: string,

    errors:
        ProductLandingPageValidationIssue[],
): void {
    const seen =
        new Set<number>();

    imageIndexes.forEach(
        (
            imageIndex,
            index,
        ) => {
            if (
                seen.has(
                    imageIndex,
                )
            ) {
                addError(
                    errors,

                    'duplicate-gallery-image-index',

                    landingPageSlug,

                    `gallery.imageIndexes[${index}]`,

                    `Image index ${imageIndex} is already used earlier in this gallery.`,
                );

                return;
            }

            seen.add(
                imageIndex,
            );
        },
    );
}

export function validateProductLandingPages(
    landingPages:
        readonly ProductLandingPageDefinition[],

    products:
        readonly Product[],
): ProductLandingPageValidationResult {
    const errors:
        ProductLandingPageValidationIssue[] =
        [];

    const warnings:
        ProductLandingPageValidationIssue[] =
        [];

    const productBySlug =
        new Map(
            products.map(
                (
                    product,
                ) => [
                        product.slug,
                        product,
                    ],
            ),
        );

    const landingSlugOwners =
        new Map<
            string,
            string[]
        >();

    const campaignIdOwners =
        new Map<
            string,
            string[]
        >();

    landingPages.forEach(
        (
            landingPage,
            index,
        ) => {
            const landingPageSlug =
                getLandingPageLabel(
                    landingPage,

                    index,
                );

            const normalizedSlug =
                landingPage.slug.trim();

            if (
                normalizedSlug
            ) {
                const owners =
                    landingSlugOwners.get(
                        normalizedSlug,
                    ) ??
                    [];

                owners.push(
                    landingPageSlug,
                );

                landingSlugOwners.set(
                    normalizedSlug,

                    owners,
                );
            }

            const campaignId =
                landingPage.campaign
                    ?.id
                    ?.trim();

            if (
                campaignId
            ) {
                const owners =
                    campaignIdOwners.get(
                        campaignId,
                    ) ??
                    [];

                owners.push(
                    landingPageSlug,
                );

                campaignIdOwners.set(
                    campaignId,

                    owners,
                );
            }
        },
    );

    landingSlugOwners.forEach(
        (
            owners,
            slug,
        ) => {
            if (
                owners.length <=
                1
            ) {
                return;
            }

            owners.forEach(
                (
                    landingPageSlug,
                ) => {
                    addError(
                        errors,

                        'duplicate-landing-slug',

                        landingPageSlug,

                        'slug',

                        `Landing page slug "${slug}" is used by more than one landing page.`,
                    );
                },
            );
        },
    );

    campaignIdOwners.forEach(
        (
            owners,
            campaignId,
        ) => {
            if (
                owners.length <=
                1
            ) {
                return;
            }

            owners.forEach(
                (
                    landingPageSlug,
                ) => {
                    addError(
                        errors,

                        'duplicate-campaign-id',

                        landingPageSlug,

                        'campaign.id',

                        `Campaign ID "${campaignId}" is used by more than one landing page.`,
                    );
                },
            );
        },
    );

    landingPages.forEach(
        (
            landingPage,
            landingPageIndex,
        ) => {
            const landingPageSlug =
                getLandingPageLabel(
                    landingPage,

                    landingPageIndex,
                );

            validateRequiredText(
                landingPage.slug,

                'slug',

                landingPageSlug,

                errors,
            );

            if (
                isNonEmptyString(
                    landingPage.slug,
                ) &&
                !SLUG_PATTERN.test(
                    landingPage.slug,
                )
            ) {
                addError(
                    errors,

                    'invalid-landing-slug',

                    landingPageSlug,

                    'slug',

                    'Landing page slugs must use lowercase letters, numbers, and single hyphens only.',
                );
            }

            validateRequiredText(
                landingPage.productSlug,

                'productSlug',

                landingPageSlug,

                errors,
            );

            const product =
                productBySlug.get(
                    landingPage.productSlug,
                );

            if (
                !product
            ) {
                addError(
                    errors,

                    'product-not-found',

                    landingPageSlug,

                    'productSlug',

                    `Product "${landingPage.productSlug}" does not exist in the product catalog.`,
                );
            } else {
                if (
                    landingPage.status ===
                    'active' &&
                    product.status !==
                    'active'
                ) {
                    addError(
                        errors,

                        'inactive-product',

                        landingPageSlug,

                        'productSlug',

                        `Active landing pages must reference an active product. "${product.slug}" currently has status "${product.status}".`,
                    );
                }

                if (
                    product.images.length ===
                    0
                ) {
                    addError(
                        errors,

                        'product-has-no-images',

                        landingPageSlug,

                        'productSlug',

                        `Product "${product.slug}" does not contain any product images.`,
                    );
                }

                if (
                    product.isDemo &&
                    landingPage.status ===
                    'active' &&
                    landingPage.seo
                        .noIndex !==
                    true
                ) {
                    addError(
                        errors,

                        'demo-landing-page-must-noindex',

                        landingPageSlug,

                        'seo.noIndex',

                        'Active landing pages for demo products must explicitly set seo.noIndex to true.',
                    );
                }
            }

            if (
                landingPage.chrome !==
                'site'
            ) {
                addWarning(
                    warnings,

                    'non-site-chrome',

                    landingPageSlug,

                    'chrome',

                    'The current featured landing-page route renders the normal Maxi Pawz site header and footer. Prefer chrome: "site".',
                );
            }

            if (
                landingPage.campaign
            ) {
                validateRequiredText(
                    landingPage.campaign
                        .id,

                    'campaign.id',

                    landingPageSlug,

                    errors,
                );

                if (
                    isNonEmptyString(
                        landingPage.campaign
                            .id,
                    ) &&
                    !CAMPAIGN_ID_PATTERN.test(
                        landingPage.campaign
                            .id,
                    )
                ) {
                    addError(
                        errors,

                        'invalid-campaign-id',

                        landingPageSlug,

                        'campaign.id',

                        'Campaign IDs must use lowercase letters, numbers, hyphens, or underscores.',
                    );
                }

                validateOptionalText(
                    landingPage.campaign
                        .channel,

                    'campaign.channel',

                    landingPageSlug,

                    errors,
                );

                validateOptionalText(
                    landingPage.campaign
                        .audience,

                    'campaign.audience',

                    landingPageSlug,

                    errors,
                );
            }

            validateRequiredText(
                landingPage.hero
                    .headline,

                'hero.headline',

                landingPageSlug,

                errors,
            );

            validateRequiredText(
                landingPage.hero
                    .description,

                'hero.description',

                landingPageSlug,

                errors,
            );

            validateRequiredText(
                landingPage.hero
                    .primaryCtaLabel,

                'hero.primaryCtaLabel',

                landingPageSlug,

                errors,
            );

            validateOptionalText(
                landingPage.hero
                    .eyebrow,

                'hero.eyebrow',

                landingPageSlug,

                errors,
            );

            validateOptionalText(
                landingPage.hero
                    .secondaryCtaLabel,

                'hero.secondaryCtaLabel',

                landingPageSlug,

                errors,
            );

            validateImageIndex(
                landingPage.hero
                    .imageIndex,

                'hero.imageIndex',

                landingPageSlug,

                product,

                errors,
            );

            landingPage.highlights?.forEach(
                (
                    highlight,
                    highlightIndex,
                ) => {
                    validateRequiredText(
                        highlight.title,

                        `highlights[${highlightIndex}].title`,

                        landingPageSlug,

                        errors,
                    );

                    validateOptionalText(
                        highlight.eyebrow,

                        `highlights[${highlightIndex}].eyebrow`,

                        landingPageSlug,

                        errors,
                    );

                    validateOptionalText(
                        highlight.description,

                        `highlights[${highlightIndex}].description`,

                        landingPageSlug,

                        errors,
                    );
                },
            );

            landingPage.story?.forEach(
                (
                    storyBlock,
                    storyIndex,
                ) => {
                    validateImageIndex(
                        storyBlock.imageIndex,

                        `story[${storyIndex}].imageIndex`,

                        landingPageSlug,

                        product,

                        errors,
                    );

                    validateRequiredText(
                        storyBlock.title,

                        `story[${storyIndex}].title`,

                        landingPageSlug,

                        errors,
                    );

                    validateOptionalText(
                        storyBlock.eyebrow,

                        `story[${storyIndex}].eyebrow`,

                        landingPageSlug,

                        errors,
                    );

                    if (
                        !Array.isArray(
                            storyBlock.body,
                        ) ||
                        storyBlock.body.length ===
                        0
                    ) {
                        addError(
                            errors,

                            'empty-story-body',

                            landingPageSlug,

                            `story[${storyIndex}].body`,

                            'Story blocks must contain at least one paragraph.',
                        );
                    } else {
                        storyBlock.body.forEach(
                            (
                                paragraph,
                                paragraphIndex,
                            ) => {
                                validateRequiredText(
                                    paragraph,

                                    `story[${storyIndex}].body[${paragraphIndex}]`,

                                    landingPageSlug,

                                    errors,
                                );
                            },
                        );
                    }

                    storyBlock.bullets?.forEach(
                        (
                            bullet,
                            bulletIndex,
                        ) => {
                            validateRequiredText(
                                bullet,

                                `story[${storyIndex}].bullets[${bulletIndex}]`,

                                landingPageSlug,

                                errors,
                            );
                        },
                    );
                },
            );

            if (
                landingPage.gallery
            ) {
                validateRequiredText(
                    landingPage.gallery
                        .title,

                    'gallery.title',

                    landingPageSlug,

                    errors,
                );

                validateOptionalText(
                    landingPage.gallery
                        .eyebrow,

                    'gallery.eyebrow',

                    landingPageSlug,

                    errors,
                );

                validateOptionalText(
                    landingPage.gallery
                        .description,

                    'gallery.description',

                    landingPageSlug,

                    errors,
                );

                if (
                    landingPage.gallery
                        .imageIndexes
                ) {
                    if (
                        landingPage.gallery
                            .imageIndexes
                            .length ===
                        0
                    ) {
                        addError(
                            errors,

                            'empty-gallery',

                            landingPageSlug,

                            'gallery.imageIndexes',

                            'Provide at least one gallery image index or omit imageIndexes to use all product images.',
                        );
                    }

                    validateUniqueGalleryIndexes(
                        landingPage.gallery
                            .imageIndexes,

                        landingPageSlug,

                        errors,
                    );

                    landingPage.gallery
                        .imageIndexes
                        .forEach(
                            (
                                imageIndex,
                                imageIndexPosition,
                            ) => {
                                validateImageIndex(
                                    imageIndex,

                                    `gallery.imageIndexes[${imageIndexPosition}]`,

                                    landingPageSlug,

                                    product,

                                    errors,
                                );
                            },
                        );
                }
            }

            validateRequiredText(
                landingPage.purchase
                    .title,

                'purchase.title',

                landingPageSlug,

                errors,
            );

            validateRequiredText(
                landingPage.purchase
                    .description,

                'purchase.description',

                landingPageSlug,

                errors,
            );

            validateOptionalText(
                landingPage.purchase
                    .eyebrow,

                'purchase.eyebrow',

                landingPageSlug,

                errors,
            );

            validateOptionalText(
                landingPage.purchase
                    .note,

                'purchase.note',

                landingPageSlug,

                errors,
            );

            validateImageIndex(
                landingPage.purchase
                    .imageIndex,

                'purchase.imageIndex',

                landingPageSlug,

                product,

                errors,
            );

            landingPage.faq?.forEach(
                (
                    item,
                    faqIndex,
                ) => {
                    validateRequiredText(
                        item.question,

                        `faq[${faqIndex}].question`,

                        landingPageSlug,

                        errors,
                    );

                    validateRequiredText(
                        item.answer,

                        `faq[${faqIndex}].answer`,

                        landingPageSlug,

                        errors,
                    );
                },
            );

            validateRequiredText(
                landingPage.seo
                    .title,

                'seo.title',

                landingPageSlug,

                errors,
            );

            validateRequiredText(
                landingPage.seo
                    .description,

                'seo.description',

                landingPageSlug,

                errors,
            );

            validateImageIndex(
                landingPage.seo
                    .imageIndex,

                'seo.imageIndex',

                landingPageSlug,

                product,

                errors,
            );
        },
    );

    return {
        valid:
            errors.length ===
            0,

        errors,

        warnings,
    };
}

export function formatProductLandingPageValidationIssue(
    issue:
        ProductLandingPageValidationIssue,
): string {
    return [
        `[${issue.code}]`,

        issue.landingPageSlug,

        issue.path,

        issue.message,
    ].join(
        ' ',
    );
}

export function assertValidProductLandingPages(
    landingPages:
        readonly ProductLandingPageDefinition[],

    products:
        readonly Product[],
): ProductLandingPageValidationResult {
    const result =
        validateProductLandingPages(
            landingPages,

            products,
        );

    if (
        result.valid
    ) {
        return result;
    }

    const formattedErrors =
        result.errors
            .map(
                (
                    issue,
                ) =>
                    `- ${formatProductLandingPageValidationIssue(issue)}`,
            )
            .join(
                '\n',
            );

    throw new Error(
        [
            'Product landing page validation failed.',

            formattedErrors,
        ].join(
            '\n\n',
        ),
    );
}