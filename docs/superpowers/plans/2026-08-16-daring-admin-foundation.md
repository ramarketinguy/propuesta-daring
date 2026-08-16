# Daring Admin Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable foundation of the Daring admin panel with secure login, revocable sessions, protected API routes, and a minimal admin shell.

**Architecture:** Cloudflare Pages Functions will own authentication and session endpoints. D1 will store the existing `admin_users` and `admin_sessions` records. The admin HTML will remain separate from the public landing and will obtain all protected data through authenticated API calls.

**Tech Stack:** Cloudflare Pages Functions, TypeScript, D1 SQLite, Web Crypto API, vanilla HTML/CSS/JavaScript.

---

## File Map

- Create: `functions/api/_lib/auth.ts` for password hashing, session creation, cookie parsing, and session validation.
- Create: `functions/api/_lib/response.ts` for consistent JSON and redirect responses.
- Create: `functions/api/auth/login.ts` for credential validation and session creation.
- Create: `functions/api/auth/logout.ts` for session revocation.
- Create: `functions/api/auth/session.ts` for the current-session check.
- Create: `functions/api/admin/health.ts` for a protected API smoke test.
- Create: `admin/index.html` for the initial protected panel shell.
- Create: `admin/admin.css` for the first panel layout.
- Create: `admin/admin.js` for session validation, logout, and health status.
- Modify: `wrangler.jsonc` only if the Pages asset binding or local D1 configuration requires it.
- Create: `scripts/create-admin-hash.mjs` to generate a password hash locally without saving a password in the repository.
- Create: `tests/auth-contract.mjs` for deterministic cookie and validation contract checks.

## Task 1: Authentication Primitives

**Files:**
- Create: `functions/api/_lib/auth.ts`
- Create: `functions/api/_lib/response.ts`
- Create: `scripts/create-admin-hash.mjs`
- Test: `tests/auth-contract.mjs`

- [ ] **Step 1: Define the auth contract test first.**

Test these behaviors without a live database:

```js
import assert from 'node:assert/strict';
import { parseSessionCookie, sessionCookie } from '../functions/api/_lib/auth.ts';

assert.equal(parseSessionCookie('daring_session=abc123'), 'abc123');
assert.equal(parseSessionCookie('other=value'), null);
assert.match(sessionCookie('abc123', 3600), /HttpOnly/);
assert.match(sessionCookie('abc123', 3600), /SameSite=Lax/);
assert.match(sessionCookie('abc123', 3600), /Max-Age=3600/);
console.log('auth contract passed');
```

- [ ] **Step 2: Run the contract test and confirm it fails because the auth module does not exist.**

Run: `node tests/auth-contract.mjs`

Expected: failure caused by the missing auth helpers.

- [ ] **Step 3: Implement the minimal auth helpers.**

`auth.ts` must export:

```ts
export function parseSessionCookie(cookie: string | null): string | null;
export function sessionCookie(id: string, maxAge: number): string;
export function clearSessionCookie(): string;
export async function hashPassword(password: string): Promise<string>;
export async function verifyPassword(password: string, stored: string): Promise<boolean>;
export async function createSession(db: D1Database, adminUserId: string): Promise<string>;
export async function getSessionAdmin(db: D1Database, request: Request): Promise<{ id: string; email: string } | null>;
export async function revokeSession(db: D1Database, request: Request): Promise<void>;
```

Use PBKDF2 through `crypto.subtle`, a cryptographically random salt, and a 32-byte derived key. Store the encoded format as `pbkdf2$iterations$salt$hash`. Reject malformed stored hashes instead of guessing.

Session cookies must be `HttpOnly; Secure; SameSite=Lax; Path=/admin; Max-Age=<seconds>`.

- [ ] **Step 4: Add the local hash generator.**

`create-admin-hash.mjs` accepts the password as an interactive prompt or `--password` argument, prints only the generated hash, and never writes a file.

- [ ] **Step 5: Run the contract test again.**

Run: `node tests/auth-contract.mjs`

Expected: `auth contract passed`.

- [ ] **Step 6: Commit the isolated auth primitives.**

```bash
git add functions/api/_lib scripts/create-admin-hash.mjs tests/auth-contract.mjs
git commit -m "feat: add admin auth primitives"
```

## Task 2: Auth API Routes

**Files:**
- Create: `functions/api/auth/login.ts`
- Create: `functions/api/auth/logout.ts`
- Create: `functions/api/auth/session.ts`
- Create: `functions/api/admin/health.ts`

- [ ] **Step 1: Define endpoint behavior before implementation.**

The endpoints must behave as follows:

```text
POST /api/auth/login
200 {"ok":true,"admin":{"email":"..."}} + Set-Cookie on valid credentials
401 {"ok":false,"error":"Credenciales inválidas"} on invalid credentials
400 {"ok":false,"error":"Datos incompletos"} when email or password is missing

POST /api/auth/logout
204 + expired session cookie

GET /api/auth/session
200 {"authenticated":true,"admin":{...}} for a valid session
200 {"authenticated":false} for no or invalid session

GET /api/admin/health
200 {"ok":true,"admin":{...}} for a valid session
401 {"ok":false,"error":"No autorizado"} otherwise
```

- [ ] **Step 2: Implement login with D1 lookup and constant-shape errors.**

Look up the normalized email in `admin_users`, verify the password hash, update `last_login_at`, create a D1 session with a seven-day expiration, and return the secure cookie. Do not reveal whether the email or password was incorrect.

- [ ] **Step 3: Implement logout and session endpoints.**

Logout revokes the current session when present and always expires the cookie. Session returns an unauthenticated response instead of throwing for missing cookies.

- [ ] **Step 4: Protect the health endpoint with the shared helper.**

The endpoint must not expose D1 or environment details to unauthenticated callers.

- [ ] **Step 5: Verify the routes locally.**

Run: `npx wrangler pages dev . --d1=DB=daring-production`

Check with PowerShell:

```powershell
Invoke-WebRequest http://localhost:8788/api/auth/session
Invoke-WebRequest http://localhost:8788/api/admin/health
```

Expected: session returns `authenticated:false`; health returns HTTP 401.

- [ ] **Step 6: Commit the API routes.**

```bash
git add functions/api/auth functions/api/admin
git commit -m "feat: add admin auth routes"
```

## Task 3: Protected Admin Shell

**Files:**
- Create: `admin/index.html`
- Create: `admin/admin.css`
- Create: `admin/admin.js`

- [ ] **Step 1: Add a no-data shell.**

The shell must include the Daring identity, a clear title “Panel de Daring”, a connection status card, a logout button, and an empty-state message saying that metrics will appear when tracking is connected. Do not display fake metrics.

- [ ] **Step 2: Implement session gating in `admin.js`.**

On load, call `/api/auth/session`. If unauthenticated, redirect to `/admin/login`. If authenticated, call `/api/admin/health` and render a green or red connection status without exposing server internals.

- [ ] **Step 3: Add the logout action.**

POST `/api/auth/logout`, then redirect to `/admin/login`.

- [ ] **Step 4: Verify responsive layout and keyboard access.**

Check the shell at 375px and 1440px. Verify visible focus states, button labels, and that the panel never shows a metric value before the API provides one.

- [ ] **Step 5: Commit the shell.**

```bash
git add admin
git commit -m "feat: add protected admin shell"
```

## Task 4: Admin Provisioning And Deployment Checks

**Files:**
- Modify: `wrangler.jsonc` only when required by the local Pages setup.
- Modify: `.dev.vars.example` with variable names only.
- Create: `docs/superpowers/runbooks/admin-provisioning.md`

- [ ] **Step 1: Document required secrets without values.**

Document `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`, and the D1 binding. Never put real values in the repository.

- [ ] **Step 2: Add the first admin provisioning runbook.**

Document how to create the hash locally, insert the admin row into D1, run the local login smoke test, and configure the same values as Cloudflare secrets.

- [ ] **Step 3: Verify no secret patterns are staged.**

Run:

```bash
git grep -n -I -E 'sbp_[A-Za-z0-9]+|EAAB[A-Za-z0-9]+|access_token=[A-Za-z0-9]|api[_-]?key=[A-Za-z0-9]' --cached
```

Expected: no output.

- [ ] **Step 4: Run final first-stage checks.**

Run:

```bash
node tests/auth-contract.mjs
node --check admin/admin.js
npx wrangler pages dev .
```

Verify login, session persistence, logout, unauthorized health, authorized health, and landing availability.

- [ ] **Step 5: Commit the provisioning documentation.**

```bash
git add .dev.vars.example docs/superpowers/runbooks wrangler.jsonc
git commit -m "docs: add admin provisioning runbook"
```

## First-Stage Completion Criteria

- An admin can log in with a hashed password.
- Sessions persist securely and can be revoked.
- Protected API routes reject unauthenticated calls.
- The admin shell does not expose fake data.
- The public landing continues to load if the admin API is unavailable.
- Local verification commands pass.
- No credentials are committed.
