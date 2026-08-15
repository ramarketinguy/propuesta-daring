# Daring Admin Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first production-ready foundation for Daring's Cloudflare-hosted landing, operational admin panel, inventory, testimonials, and Mercado Pago order lifecycle.

**Architecture:** Keep the existing landing in the repository, add a Cloudflare Pages/Functions-compatible API structure, use D1 for relational commerce data, R2 for testimonial media, and secure secrets for external providers. Payments become effective only after a verified Mercado Pago webhook.

**Tech Stack:** Cloudflare Pages, Workers/Pages Functions, D1, R2, TypeScript, vanilla HTML/CSS/JS integration with the existing landing, Mercado Pago Checkout Pro, Resend-compatible email provider.

---

### Task 1: Cloudflare project foundation

**Files:**
- Create: `wrangler.jsonc`
- Create: `functions/health.ts`
- Create: `.dev.vars.example`
- Modify: `.gitignore`

- [ ] Add Cloudflare bindings for the D1 database and R2 media bucket without committing secrets.
- [ ] Add a health endpoint returning environment and schema readiness without exposing credentials.
- [ ] Add `.dev.vars` and Cloudflare state files to `.gitignore`.
- [ ] Run `wrangler deploy --dry-run` after resources exist.

### Task 2: D1 schema and migrations

**Files:**
- Create: `migrations/0001_initial.sql`
- Create: `src/db/queries.ts`

- [ ] Create tables for admin users, products, stock movements, orders, order items, checkout events, testimonials, media, and email deliveries.
- [ ] Add indexes for order status/date, checkout event/date, and testimonial publication/order.
- [ ] Make order status and payment ID idempotent through unique constraints.
- [ ] Apply the migration locally and remotely.

### Task 3: Authentication and admin shell

**Files:**
- Create: `functions/api/admin/login.ts`
- Create: `functions/api/admin/logout.ts`
- Create: `functions/api/admin/me.ts`
- Create: `functions/_middleware.ts`
- Create: `admin/index.html`
- Create: `admin/admin.js`

- [ ] Add secure password verification and HTTP-only session cookies.
- [ ] Protect all admin API routes and the admin interface.
- [ ] Build the initial dashboard shell with empty states for metrics, orders, stock, and testimonials.

### Task 4: Inventory and metrics

**Files:**
- Create: `functions/api/admin/stock.ts`
- Create: `functions/api/admin/orders.ts`
- Create: `functions/api/metrics/public.ts`
- Modify: `daring-landing.html`

- [ ] Add stock updates and stock movement history.
- [ ] Add checkout-started, payment-approved, payment-pending, and payment-rejected event aggregation.
- [ ] Expose only aggregate public sales and availability values.
- [ ] Add the public urgency counter without exposing customer data.

### Task 5: Testimonials and media

**Files:**
- Create: `functions/api/admin/testimonials.ts`
- Create: `functions/api/admin/media-upload.ts`
- Create: `functions/api/testimonials/public.ts`
- Modify: `admin/index.html`
- Modify: `daring-landing.html`

- [ ] Add authenticated image/video uploads to R2 with size and MIME validation.
- [ ] Add testimonial create, edit, publish, reorder, and delete operations.
- [ ] Render published testimonials in the existing visual language.

### Task 6: Checkout and payment confirmation

**Files:**
- Create: `functions/api/checkout/start.ts`
- Create: `functions/api/webhooks/mercadopago.ts`
- Create: `functions/api/admin/orders/[id].ts`
- Modify: `daring-landing.html`

- [ ] Add the pre-checkout shipping form modal.
- [ ] Create Mercado Pago Checkout Pro preferences with an internal order identifier.
- [ ] Validate payment status server-to-server in the webhook.
- [ ] Reserve stock on checkout start and permanently decrement only on approved payment.
- [ ] Make webhook processing idempotent.

### Task 7: Email and production validation

**Files:**
- Create: `src/email/order-confirmation.ts`
- Create: `functions/api/admin/email-status.ts`
- Modify: `.dev.vars.example`

- [ ] Send confirmation only after approved payment.
- [ ] Include order, color, quantity, shipping data, recipe, and assembly video links.
- [ ] Add email delivery status to the admin order view.
- [ ] Run local tests, dry-run deployment, webhook replay tests, and mobile/desktop smoke tests.
