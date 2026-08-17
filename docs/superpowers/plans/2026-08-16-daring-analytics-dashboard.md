# Daring Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add privacy-conscious event tracking and a beginner-friendly metrics summary with actionable alerts to the protected Daring admin panel.

**Architecture:** The landing sends a small allowlisted event payload to a public Pages Function and never waits for the response. D1 stores events with anonymous visitor/session identifiers. Protected admin endpoints aggregate events into a summary and return explicit “not available” states instead of invented values.

**Tech Stack:** Cloudflare Pages Functions, D1 SQLite, TypeScript, vanilla JavaScript, `navigator.sendBeacon` with `fetch` fallback.

---

## Event Contract

Allowed events:

- `page_view`
- `hero_buy_click`
- `hero_action_click`
- `checkout_open`
- `checkout_submit`
- `whatsapp_click`

Event fields:

```ts
type PublicEvent = {
  event: string;
  visitor_id?: string;
  session_id?: string;
  page_path?: string;
  referrer?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet' | 'unknown';
};
```

No email, name, phone, address, payment data, or arbitrary client metadata may be sent to the public event endpoint.

## Task 1: Analytics Storage And Aggregation

**Files:**
- Create: `migrations/0002_analytics_events.sql`
- Create: `functions/api/metrics/_lib.ts`
- Create: `tests/metrics-contract.mjs`

- [ ] **Step 1: Write the failing schema/aggregation contract.**

The contract must assert that event names are allowlisted, device values are normalized, and summary conversion is calculated as approved events divided by page views when both values exist.

- [ ] **Step 2: Run the contract and confirm it fails because the metrics helpers do not exist.**

Run: `node --experimental-strip-types tests/metrics-contract.mjs`

Expected: failure caused by the missing metrics module.

- [ ] **Step 3: Add the D1 migration.**

Create `analytics_events` with:

```sql
id TEXT PRIMARY KEY,
event_name TEXT NOT NULL,
visitor_id TEXT,
session_id TEXT,
page_path TEXT NOT NULL,
referrer TEXT,
device_type TEXT NOT NULL,
created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Add indexes for `created_at`, `event_name + created_at`, and `visitor_id + created_at`.

- [ ] **Step 4: Implement normalization and aggregation helpers.**

Export functions for event validation, device normalization, date-window creation, and summary aggregation. The summary must return zeroes for empty periods and `null` for metrics that cannot be calculated.

- [ ] **Step 5: Run the contract and apply the local migration.**

Run:

```bash
node --experimental-strip-types tests/metrics-contract.mjs
npx wrangler d1 migrations apply daring-production --local --config wrangler.jsonc
```

Expected: contract passes and migration reports success.

- [ ] **Step 6: Commit storage and helpers.**

```bash
git add migrations/0002_analytics_events.sql functions/api/metrics/_lib.ts tests/metrics-contract.mjs
git commit -m "feat: add analytics event storage"
```

## Task 2: Public Event Endpoint

**Files:**
- Create: `functions/api/metrics/events.ts`

- [ ] **Step 1: Define endpoint behavior.**

```text
POST /api/metrics/events
202 {"accepted":true} for a valid allowlisted event
400 {"accepted":false,"error":"Evento inválido"} for invalid input
```

The endpoint must cap the request body, reject unknown fields/events, normalize device type, and insert one event into D1. It must never return database details.

- [ ] **Step 2: Implement the route.**

Use the shared JSON response helper and return quickly after the insert. A failure in this endpoint must not be able to affect the public landing.

- [ ] **Step 3: Add the browser tracking helper.**

Add a small `trackEvent` function to the landing script. It creates anonymous identifiers in `sessionStorage`/`localStorage`, uses `sendBeacon` where available, and falls back to a short `fetch` request. Event calls must be wrapped so they cannot throw into landing behavior.

- [ ] **Step 4: Instrument only approved actions.**

Add tracking for page view, hero CTAs, checkout open/submit, and WhatsApp click. Do not track form values.

- [ ] **Step 5: Verify public failures are harmless.**

Disable or break the endpoint locally and confirm the landing still loads and all buttons work.

- [ ] **Step 6: Commit event collection.**

```bash
git add functions/api/metrics/events.ts daring-landing.html
git commit -m "feat: collect landing analytics events"
```

## Task 3: Protected Summary And Alerts API

**Files:**
- Create: `functions/api/metrics/summary.ts`
- Create: `functions/api/alerts.ts`

- [ ] **Step 1: Define protected responses.**

Unauthenticated requests must return HTTP 401. Authenticated summary responses include:

```json
{
  "period": "7d",
  "page_views": 0,
  "unique_visitors": 0,
  "buy_clicks": 0,
  "checkout_opens": 0,
  "checkout_submits": 0,
  "approved_payments": null,
  "conversion_rate": null,
  "comparison": null
}
```

- [ ] **Step 2: Implement summary aggregation.**

Support `7d`, `30d`, and `all` periods. Compare the selected period with the previous period of the same length when enough data exists. Do not report approved payments until payment webhooks exist.

- [ ] **Step 3: Implement beginner-friendly alerts.**

Return alert objects with `severity`, `title`, `explanation`, and `action`. Only generate alerts when the data supports them; otherwise return an empty list.

- [ ] **Step 4: Verify authorization and empty-state behavior.**

Run unauthenticated requests and confirm 401. Seed test events locally and confirm counts and conversion calculations.

- [ ] **Step 5: Commit protected analytics APIs.**

```bash
git add functions/api/metrics/summary.ts functions/api/alerts.ts
git commit -m "feat: add protected analytics summary"
```

## Task 4: Dashboard Integration

**Files:**
- Modify: `admin/index.html`
- Modify: `admin/admin.css`
- Modify: `admin/admin.js`

- [ ] **Step 1: Replace the empty state with metric cards.**

Show visits, buy clicks, checkout completion, and conversion with `—` for unavailable values. Include the selected period.

- [ ] **Step 2: Add alert cards.**

Render alerts in plain Spanish with a clear “Qué mirar” or “Qué hacer” action. Do not use color alone to convey severity.

- [ ] **Step 3: Add loading, empty, and API-error states.**

The panel must distinguish between loading, no data, unavailable payment data, and API failure.

- [ ] **Step 4: Verify responsive and accessible behavior.**

Check 375px and 1440px layouts, keyboard focus, visible labels, and no fake numbers.

- [ ] **Step 5: Commit dashboard integration.**

```bash
git add admin
git commit -m "feat: show analytics dashboard"
```

## Completion Criteria

- Landing events are collected without blocking public behavior.
- Unknown events and oversized payloads are rejected.
- Summary and alerts require authentication.
- Empty periods show zeroes or explicit unavailable values.
- The dashboard explains what a metric means and what action to take.
- Payment metrics remain unavailable until Mercado Pago webhooks are connected.
- Local contract, syntax, migration, API, and responsive checks pass.
