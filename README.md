# Maxi Pawz Store

A fast, accessible, and scalable e-commerce storefront for pet toys, built with Astro, TypeScript, Tailwind CSS, Stripe, and Netlify.

> **Project status:** Early development / MVP

## Overview

Maxi Pawz Store is an online pet-toy shop focused on providing a simple, enjoyable, and secure shopping experience for pet owners.

The initial version uses a lean architecture without a traditional application database:

- Product information is stored in Astro Content Collections.
- Product pricing is managed through Stripe Products and Prices.
- Shopping-cart interactivity is handled through an Astro island.
- Stripe Checkout securely processes payments.
- Netlify Functions create Checkout Sessions and handle Stripe webhooks.
- Netlify Forms handles contact, return, support, and custom-order inquiries.

This approach keeps infrastructure costs and maintenance low while providing a clear upgrade path for customer accounts, inventory management, wishlists, reviews, loyalty programs, and advanced order management.

---

## Tech Stack

### Frontend

- [Astro 7](https://astro.build/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Preact](https://preactjs.com/) for interactive islands
- [Phosphor Icons](https://phosphoricons.com/)
- Astro Components
- Astro Islands
- Astro Content Collections
- Semantic HTML
- Mobile-first responsive design

### Payments

- [Stripe Products](https://stripe.com/)
- Stripe Prices
- Stripe Checkout
- Stripe Customers
- Stripe Payment Links
- Stripe Webhooks
- Stripe automatic receipts
- Optional Stripe Tax integration

### Hosting and Backend

- [Netlify](https://www.netlify.com/)
- Astro Netlify Adapter
- Netlify Functions
- Netlify Forms
- Netlify Deploy Previews
- Netlify environment variables
- Netlify CDN
- Netlify Image CDN

### Development and Quality Assurance

- Node.js 22.12+
- npm
- Git
- GitHub
- Vite
- ESLint
- Prettier
- Playwright
- TypeScript strict mode

---

## Core Features

### Storefront

- Responsive homepage
- Product catalog
- Category pages
- Product detail pages
- Product image galleries
- Product variants
- Quantity selection
- Related products
- New-arrival and featured-product sections

### Shopping Cart

- Add products to cart
- Remove products from cart
- Update quantities
- Persist cart data in local storage
- Display cart item count
- Responsive cart drawer
- Server-side product and quantity validation

### Checkout

- Secure Stripe-hosted Checkout
- Shipping-address collection
- Configurable shipping rates
- Promotion-code support
- Stripe Customer creation
- Automatic payment receipts
- Custom success page
- Custom cancellation page

### Customer Support

Netlify Forms will support:

- General contact requests
- Product questions
- Return requests
- Damaged-item reports
- Order support
- Custom orders
- Wholesale inquiries
- Newsletter subscriptions

### SEO and Accessibility

- Product structured data
- Breadcrumb structured data
- Open Graph metadata
- Canonical URLs
- XML sitemap
- Robots directives
- Optimized images
- Semantic HTML
- Keyboard navigation
- Accessible form validation
- Visible focus states
- WCAG 2.2 AA target

---

## Architecture

```text
Astro Storefront
│
├── Static and server-rendered pages
│   ├── Homepage
│   ├── Category pages
│   ├── Product pages
│   ├── Policy pages
│   └── Support pages
│
├── Astro Content Collections
│   └── Product catalog
│
├── Preact Cart Island
│   ├── Cart state
│   ├── Quantity controls
│   ├── Variant selection
│   └── Local storage persistence
│
├── Netlify Functions
│   ├── Create Stripe Checkout Session
│   ├── Retrieve Checkout Session
│   └── Process Stripe Webhooks
│
├── Stripe Checkout
│   └── Secure payment processing
│
├── Stripe Webhooks
│   └── Payment confirmation
│
└── Netlify Forms
    ├── Contact
    ├── Product questions
    ├── Returns
    ├── Support
    └── Custom orders
```

---

## Project Structure

```text
maxipawz-store/
├── public/
│   ├── favicon/
│   ├── fonts/
│   ├── social/
│   └── robots.txt
│
├── src/
│   ├── assets/
│   │   └── products/
│   │
│   ├── components/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── forms/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── products/
│   │   ├── seo/
│   │   └── ui/
│   │
│   ├── content/
│   │   └── products/
│   │
│   ├── islands/
│   │   └── CartIsland.tsx
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── ProductLayout.astro
│   │
│   ├── lib/
│   │   ├── cart/
│   │   ├── catalog/
│   │   ├── stripe/
│   │   ├── validation/
│   │   └── seo/
│   │
│   ├── pages/
│   │   ├── shop/
│   │   ├── products/
│   │   ├── support/
│   │   ├── policies/
│   │   ├── order/
│   │   ├── index.astro
│   │   └── 404.astro
│   │
│   ├── styles/
│   │   └── global.css
│   │
│   └── content.config.ts
│
├── netlify/
│   └── functions/
│       ├── create-checkout-session.ts
│       ├── get-checkout-session.ts
│       └── stripe-webhook.ts
│
├── scripts/
│   ├── validate-catalog.ts
│   └── validate-stripe-prices.ts
│
├── tests/
│   └── e2e/
│
├── astro.config.mjs
├── netlify.toml
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── README.md
```

---

## Prerequisites

Before running the project locally, install:

- Node.js 22.12 or newer
- npm
- Git
- A Stripe account
- A Netlify account
- The Stripe CLI for local webhook testing
- The Netlify CLI for local function testing

Verify your local versions:

```bash
node --version
npm --version
git --version
stripe --version
netlify --version
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/maxipawz-store.git
cd maxipawz-store
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the local environment file

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Add the required values:

```env
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me

PUBLIC_SITE_URL=http://localhost:8888

STRIPE_STANDARD_SHIPPING_RATE_ID=shr_replace_me
STRIPE_EXPRESS_SHIPPING_RATE_ID=shr_replace_me
```

Never commit `.env` files or Stripe secret keys to GitHub.

### 4. Start the local development server

To run Astro directly:

```bash
npm run dev
```

To test the application with Netlify Functions:

```bash
npm run netlify:dev
```

The Netlify development server will normally be available at:

```text
http://localhost:8888
```

---

## Environment Variables

| Variable                           | Required | Description                                       |
| ---------------------------------- | -------: | ------------------------------------------------- |
| `STRIPE_SECRET_KEY`                |      Yes | Stripe secret API key                             |
| `STRIPE_WEBHOOK_SECRET`            |      Yes | Stripe webhook signing secret                     |
| `PUBLIC_SITE_URL`                  |      Yes | Public URL for success and cancellation redirects |
| `STRIPE_STANDARD_SHIPPING_RATE_ID` |       No | Stripe standard shipping-rate ID                  |
| `STRIPE_EXPRESS_SHIPPING_RATE_ID`  |       No | Stripe express shipping-rate ID                   |
| `RESEND_API_KEY`                   |    Later | API key for custom transactional emails           |
| `SUPABASE_URL`                     |    Later | Supabase project URL                              |
| `SUPABASE_ANON_KEY`                |    Later | Supabase public anonymous key                     |
| `SUPABASE_SERVICE_ROLE_KEY`        |    Later | Server-only Supabase administrative key           |

Variables without the `PUBLIC_` prefix must never be accessed from browser-side code.

---

## Available Scripts

| Command                    | Description                                  |
| -------------------------- | -------------------------------------------- |
| `npm run dev`              | Starts the Astro development server          |
| `npm run netlify:dev`      | Starts the site with local Netlify Functions |
| `npm run build`            | Creates a production build                   |
| `npm run preview`          | Previews the production build locally        |
| `npm run check`            | Runs Astro and TypeScript checks             |
| `npm run lint`             | Runs ESLint                                  |
| `npm run lint:fix`         | Fixes supported ESLint issues                |
| `npm run format`           | Formats files with Prettier                  |
| `npm run format:check`     | Verifies Prettier formatting                 |
| `npm run test:e2e`         | Runs Playwright end-to-end tests             |
| `npm run test:e2e:ui`      | Opens the Playwright test interface          |
| `npm run validate:catalog` | Validates local product data                 |
| `npm run validate:stripe`  | Checks configured Stripe Price IDs           |

Example `package.json` scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "netlify:dev": "netlify dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "validate:catalog": "tsx scripts/validate-catalog.ts",
    "validate:stripe": "tsx scripts/validate-stripe-prices.ts"
  }
}
```

---

## Product Catalog

Product display information is stored in Astro Content Collections.

Each product entry should include fields such as:

```yaml
name: Durable Rope Tug Toy
slug: durable-rope-tug-toy
sku: MP-DOG-ROPE-001
category: dog-toys
petType:
  - dog
toyType:
  - tug
  - chew
stripeProductId: prod_replace_me
stripePriceId: price_replace_me
displayPrice: 14.99
currency: USD
featured: true
newArrival: false
stockStatus: in-stock
materials:
  - Cotton rope
recommendedPetSize:
  - Medium
  - Large
images:
  - src: ../../assets/products/rope-tug-main.jpg
    alt: Red and blue cotton rope tug toy
shortDescription: A durable cotton rope toy for tugging and supervised chewing.
safetyInformation: Always supervise your pet while using this product.
seoTitle: Durable Rope Tug Toy for Dogs
seoDescription: Shop a durable cotton rope tug toy for medium and large dogs.
```

### Product source of truth

Astro product entries control:

- Product descriptions
- Images
- Categories
- Materials
- Safety information
- Search metadata
- Storefront availability

Stripe controls:

- Chargeable prices
- Currency
- Checkout
- Payment collection
- Payment receipts
- Customer payment records

The application must never trust a price supplied by the browser.

---

## Shopping Cart

The cart is implemented as an interactive island and stores minimal data:

```ts
type CartItem = {
  productId: string;
  priceId: string;
  variantId?: string;
  quantity: number;
};
```

The cart may use local storage for persistence, but all products and quantities must be validated again inside the Netlify checkout function.

### Cart security rules

The checkout function must:

1. Reject unknown product IDs.
2. Reject unknown Stripe Price IDs.
3. Reject disabled products.
4. Reject zero or negative quantities.
5. Enforce maximum purchase quantities.
6. Use server-approved Stripe Price IDs.
7. Never use a price supplied by the browser.
8. Never use a total calculated by the browser.

---

## Stripe Setup

### Create products and prices

For every product:

1. Create a Stripe Product.
2. Create one or more Stripe Prices.
3. Copy the Product ID into the Astro product entry.
4. Copy the Price ID into the Astro product entry.
5. Confirm that the displayed price matches Stripe.
6. Keep test and production Price IDs separate.

Example IDs:

```text
Product ID: prod_123456789
Price ID: price_123456789
```

### Checkout flow

```text
Customer adds products
        ↓
Cart sends product IDs and quantities
        ↓
Netlify Function validates the cart
        ↓
Function creates a Stripe Checkout Session
        ↓
Customer pays through Stripe Checkout
        ↓
Stripe sends a webhook event
        ↓
Webhook verifies the payment
        ↓
Customer sees the order-success page
```

### Local webhook testing

Authenticate the Stripe CLI:

```bash
stripe login
```

Forward Stripe events to the local webhook function:

```bash
stripe listen \
  --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

Copy the generated webhook signing secret into `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_replace_me
```

Trigger a test Checkout event:

```bash
stripe trigger checkout.session.completed
```

---

## Stripe Webhooks

The webhook handler should initially support:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
```

The handler must:

- Read the original raw request body
- Verify the `Stripe-Signature` header
- Reject invalid signatures
- Confirm the Checkout Session payment status
- Retrieve purchased line items
- Handle duplicate events safely
- Avoid logging private customer information
- Return successful HTTP responses promptly

A browser redirect to the success page must never be considered proof of payment.

---

## Netlify Forms

Planned forms include:

```text
contact
product-question
return-request
damaged-item
order-support
custom-order
wholesale-inquiry
newsletter
```

Each form should include:

- A unique Netlify form name
- A hidden `form-name` input
- Accessible labels
- Server-detectable HTML
- Client and server validation
- Honeypot spam protection
- A custom success page
- A privacy notice

Example:

```html
<form
  name="contact"
  method="POST"
  data-netlify="true"
  netlify-honeypot="bot-field"
  action="/contact/success"
>
  <input type="hidden" name="form-name" value="contact" />

  <p hidden>
    <label>
      Do not fill this out:
      <input name="bot-field" />
    </label>
  </p>

  <label for="name">Name</label>
  <input id="name" name="name" type="text" required />

  <label for="email">Email</label>
  <input id="email" name="email" type="email" required />

  <label for="message">Message</label>
  <textarea id="message" name="message" required></textarea>

  <button type="submit">Send message</button>
</form>
```

---

## Testing

### End-to-end tests

Playwright should cover:

- Homepage rendering
- Store navigation
- Category filtering
- Product-page rendering
- Adding a product to the cart
- Removing a product from the cart
- Updating quantities
- Restoring the cart after page reload
- Empty-cart behavior
- Checkout Session creation
- Invalid-cart rejection
- Checkout cancellation
- Successful Stripe test payment
- Order-success rendering
- Form submissions
- Mobile navigation
- Keyboard navigation

### Stripe test scenarios

Test:

- Successful payment
- Declined payment
- Authentication-required payment
- Delayed payment
- Cancelled checkout
- Invalid Price ID
- Disabled product
- Invalid quantity
- Shipping-address collection
- Promotion codes
- Duplicate webhooks
- Invalid webhook signatures

---

## Deployment

### Netlify deployment

1. Push the repository to GitHub.
2. Create a new Netlify site.
3. Import the GitHub repository.
4. Configure the production branch as `main`.
5. Add the required environment variables.
6. Configure Stripe test credentials for Deploy Previews.
7. Configure Stripe live credentials for production.
8. Deploy the site.
9. Add the custom domain.
10. Verify HTTPS.
11. Register the production Stripe webhook URL.

Example production webhook URL:

```text
https://www.maxipawz.com/.netlify/functions/stripe-webhook
```

### Deploy Previews

Every pull request should create a Netlify Deploy Preview.

Deploy Previews should use:

- Stripe test-mode credentials
- Test Stripe Products and Prices
- Non-production webhook endpoints
- Protected or non-indexable preview URLs

---

## Continuous Integration

Pull requests should verify:

```bash
npm run check
npm run lint
npm run format:check
npm run validate:catalog
npm run build
npm run test:e2e
```

Recommended GitHub workflow:

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Check Astro and TypeScript
        run: npm run check

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

      - name: Validate product catalog
        run: npm run validate:catalog

      - name: Build project
        run: npm run build

      - name: Run end-to-end tests
        run: npm run test:e2e
```

---

## Security

This project follows these security principles:

- Stripe secret keys remain server-side.
- Checkout totals are never trusted from the browser.
- Stripe webhook signatures are verified.
- Product IDs and Price IDs are validated server-side.
- Payment-card information never passes through Maxi Pawz servers.
- Sensitive environment variables are not committed.
- Customer information is excluded from unnecessary logs.
- Test and live Stripe credentials are separated.
- Form submissions use spam protection.
- Dependencies are reviewed and updated regularly.
- Production errors do not expose implementation details.

To report a security issue, contact:

```text
security@maxipawz.com
```

Replace this address with the official Maxi Pawz security or support email before launch.

---

## Accessibility

  Store aims to meet WCAG 2.2 Level AA.

Accessibility testing should include:

- Keyboard-only navigation
- Visible focus indicators
- Sufficient color contrast
- Accessible form labels
- Form error announcements
- Descriptive image alternative text
- Logical heading order
- Cart-drawer focus management
- Modal escape behavior
- Touch-target sizing
- Reduced-motion preferences
- Screen-reader testing
- Mobile zoom support

---

## SEO

The storefront should provide:

- Unique page titles
- Unique meta descriptions
- Canonical URLs
- Product structured data
- Offer and availability data
- Breadcrumb structured data
- Organization structured data
- Open Graph metadata
- Social-sharing images
- XML sitemap
- Robots directives
- Search-friendly category descriptions
- Optimized product images
- Descriptive URLs
- Internal product linking

---

## MVP Scope

The initial release includes:

- United States sales
- USD currency
- Guest checkout
- Stripe-hosted Checkout
- Manual fulfillment
- Manual inventory updates
- Basic shipping rules
- Stripe payment receipts
- Contact and support forms
- Responsive storefront
- Product safety information
- Basic analytics
- Technical SEO
- Accessibility testing

The MVP does not initially include:

- Customer accounts
- Saved addresses
- Wishlists
- Product reviews
- Loyalty points
- Advanced inventory management
- Internal order dashboards
- Automated shipping-label creation
- Abandoned-cart emails
- CRM integration

---

## Roadmap

### Phase 1: MVP Launch

- [ ] Brand identity
- [ ] Homepage
- [ ] Product catalog
- [ ] Category pages
- [ ] Product detail pages
- [ ] Shopping cart
- [ ] Stripe Checkout
- [ ] Shipping rates
- [ ] Stripe webhooks
- [ ] Success and cancellation pages
- [ ] Netlify Forms
- [ ] Policy pages
- [ ] Accessibility testing
- [ ] SEO setup
- [ ] Production deployment

### Phase 2: Growing Store

- [ ] Supabase integration
- [ ] Automated inventory updates
- [ ] Persistent order records
- [ ] Customer accounts
- [ ] Saved addresses
- [ ] Wishlists
- [ ] Product reviews
- [ ] Resend transactional emails
- [ ] Shipping-confirmation emails
- [ ] Stripe Tax
- [ ] Google Analytics 4
- [ ] Microsoft Clarity
- [ ] Admin dashboard

### Phase 3: Larger Operation

- [ ] Shippo or EasyPost integration
- [ ] Live carrier rates
- [ ] Shipping labels
- [ ] Customer tracking portal
- [ ] Abandoned-cart emails
- [ ] Loyalty program
- [ ] Product bundles
- [ ] Advanced search
- [ ] CRM integration
- [ ] Accounting integration
- [ ] Wholesale portal
- [ ] Multi-location inventory

---

## Branching Strategy

The repository uses a lightweight feature-branch workflow:

```text
main
├── feature/homepage
├── feature/product-catalog
├── feature/cart
├── feature/stripe-checkout
├── feature/netlify-forms
└── fix/cart-quantity-validation
```

Development process:

1. Create a branch from `main`.
2. Make focused changes.
3. Run checks locally.
4. Push the branch.
5. Open a pull request.
6. Review the Netlify Deploy Preview.
7. Confirm CI passes.
8. Merge into `main`.

---

## Commit Convention

Recommended commit prefixes:

```text
feat: add product-card component
fix: reject invalid checkout quantities
docs: update Stripe setup instructions
style: improve mobile cart layout
refactor: centralize catalog validation
test: add checkout cancellation test
chore: update dependencies
```

---

## Contributing

This repository is currently maintained as a private business project.

Before contributing:

1. Create a focused feature branch.
2. Follow the established project structure.
3. Use TypeScript strict mode.
4. Preserve accessibility behavior.
5. Add or update tests.
6. Run all required checks.
7. Do not commit secrets or customer information.
8. Open a pull request with a clear description.

---

## License

Copyright © 2026 Maxi Pawz Store.

All rights reserved.

The source code, brand assets, product photography, written content, and other materials in this repository may not be copied, modified, distributed, sublicensed, or used commercially without written permission from Maxi Pawz Store.

---

## Contact

**Maxi Pawz Store**

Website: `https://www.maxipawz.com`
Email: `support@maxipawz.com`

Replace the placeholder GitHub username, domain, email addresses, and Stripe identifiers before production launch.
