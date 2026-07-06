# Food Village POS — API Documentation

## Overview

NestJS backend for Food Village POS. Multi-tenant food-court system: super admin, vendor staff (owner/kitchen/cashier), waiters, and public customers (QR-order flow) share one API.

- **Base URL**: `http://localhost:3001/api` (dev). Global prefix `api` set in [main.ts](src/main.ts).
- **Live interactive docs (Swagger)**: `GET /api/docs` — always in sync with code, prefer it over this file for exact schemas.
- **Auth**: Bearer JWT (`Authorization: Bearer <token>`), two token kinds — normal user, and staff PIN.
- **Content-Type**: `application/json` for all requests/responses except CSV exports.
- **DB**: Prisma / PostgreSQL (Supabase in prod).

## Conventions

### Response envelope

No global success envelope — controllers return resource JSON directly. Errors always use this shape ([http-exception.filter.ts](src/common/filters/http-exception.filter.ts)):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email must be an email",
    "status": 400,
    "details": ["email must be an email"]
  }
}
```

| Status | Code | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 403 | `FORBIDDEN` | Authenticated but role not permitted |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate / state conflict |
| 422 | `VALIDATION_ERROR` | DTO validation failed (class-validator) |
| 500 | `INTERNAL_ERROR` | Unhandled exception |

### Validation

Global `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, implicit type conversion. Unknown body fields → 400. Query/param strings auto-coerced to declared types (numbers, booleans).

### Pagination

List endpoints accepting `page`/`limit` query params return paginated results (defaults vary by endpoint — check Swagger). Use `page` (1-indexed) and `limit`.

### Rate limiting

`@Throttle` applied selectively:

| Context | Limit |
|---|---|
| `auth` (login, pin-login) | 5 req / 60s per IP |
| `order` (order creation) | 30 req / 60s per IP |

Most authenticated staff/admin routes are exempt (`@SkipThrottle`).

### CORS

Single allowed origin via `FRONTEND_URL` env var (default `http://localhost:3000`), `credentials: true`.

---

## Authentication

### Token types

1. **User token** — `sub` = Supabase user UUID. Issued by `/api/auth/login`.
2. **Staff PIN token** — `sub` = `pin:<staffPinId>`. Issued by `/api/auth/pin-login`, scoped to one `vendor_id`.

JWT payload: `{ sub, email, role, aud }`. Verified against `supabase.jwtSecret` ([jwt.strategy.ts](src/modules/auth/jwt.strategy.ts)).

> **Local dev mode**: if `SUPABASE_URL` points to localhost, `/api/auth/login` skips Supabase and does bcrypt + self-signed JWT (24h expiry) directly against the local `users` table. Production always calls Supabase `signInWithPassword`.

### Roles (`UserRole` enum)

`super_admin` · `admin` · `vendor_owner` · `vendor_kitchen` · `vendor_cashier` · `waiter`

Enforced by `JwtAuthGuard` (authentication) + `RolesGuard` + `@Roles(...)` (authorization). Routes without `@Roles()` only require a valid token; routes marked `@Public()` skip auth entirely.

### Auth endpoints

Base: `/api/auth` · Tag: `Auth`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/auth/login` | Public, throttled (5/min) | `{ email, password }` | Email/password login → `{ access_token, user }` |
| POST | `/api/auth/pin-login` | Public, throttled (5/min) | `{ vendor_id, pin }` (4-digit) | Staff PIN login, scoped to vendor → `{ access_token, staff }` |
| GET | `/api/auth/me` | Bearer | — | Current user profile |
| POST | `/api/auth/logout` | Bearer | — | Stateless logout confirmation (no server-side revocation) |

---

## Endpoints by Module

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check (load balancer target) |

### Menu (public, customer-facing)

Base: `/api` · Tag: `Menu` — all public, no token required.

| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/api/vendors` | `status?` | List vendors |
| GET | `/api/vendors/:vendorId/menu` | `available?` (bool, default true) | Vendor menu |
| GET | `/api/vendors/:vendorId/categories` | — | Vendor categories |
| GET | `/api/menu-items/:itemId` | — | Menu item detail (incl. modifiers) |
| POST | `/api/promos/validate` | body: `{ code, subtotal }` | Validate promo code (untyped body — see note below) |

### Sessions

Base: `/api/sessions` · Tag: `Sessions`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/sessions` | Public | `{ table_id, waiter_id? }` | Open table session |
| GET | `/api/sessions/:id` | Bearer | — | Session detail |
| PATCH | `/api/sessions/:id/close` | Bearer | — | Close session |

### Orders

Base: `/api/orders` · Tag: `Orders`

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/orders` | Public, throttled (30/min) | `CreateOrderDto` — `session_id, table_id, waiter_id?, idempotency_key, items[]` | Place order (idempotent via `idempotency_key`) |
| GET | `/api/orders/:orderId` | Bearer | — | Full order detail |
| GET | `/api/orders/:orderId/status` | Public | — | Order status (customer tracking page) |
| PATCH | `/api/orders/:orderId/cancel` | Bearer | `{ reason? }` | Cancel order |

`CartItemDto`: `{ menu_item_id, vendor_id, quantity (≥1), modifiers: [{ modifier_id, quantity }], special_instructions? (≤200 chars) }`

Base: `/api/display` · Tag: `Display Board`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/display/board` | Public | Kitchen/pickup display board feed |

### KDS — Kitchen Display System

Base: `/api/kds` · Tag: `KDS` · Roles: `vendor_kitchen, vendor_cashier, vendor_owner, admin`

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/api/kds/orders` | — | Kitchen order queue (scoped to current user's vendor) |
| PATCH | `/api/kds/items/:itemId/accept` | — | Accept item |
| PATCH | `/api/kds/items/:itemId/preparing` | — | Mark preparing |
| PATCH | `/api/kds/items/:itemId/ready` | — | Mark ready |
| PATCH | `/api/kds/items/:itemId/complete` | — | Mark complete |
| PATCH | `/api/kds/items/:itemId/reject` | `{ reason: 'out_of_stock'\|'equipment_issue'\|'custom', custom_reason? }` | Reject item |
| GET | `/api/kds/queue-stats` | — | Queue stats |

### Vendor — self-service (menu, settings, orders)

Base: `/api/vendor` · Tag: `Vendor` · Roles: `vendor_owner, vendor_kitchen, vendor_cashier, admin` (writes further restricted to `vendor_owner, admin` where noted)

| Method | Path | Roles | Body | Description |
|---|---|---|---|---|
| GET | `/api/vendor/dashboard` | default | — | Vendor dashboard summary |
| GET | `/api/vendor/orders` | default | query: `from?, to?, status?, page?, limit?` | List own orders |
| GET | `/api/vendor/orders/:orderId` | default | — | ⚠️ **stub**, returns `{ orderId }` only — not wired up |
| GET | `/api/vendor/menu` | default | — | Full menu (categories + items + modifiers) |
| GET | `/api/vendor/menu-items` | default | query: `category?, available?` | List menu items |
| POST | `/api/vendor/menu-items` | owner/admin | `CreateMenuItemDto` | Create item |
| PUT | `/api/vendor/menu-items/:id` | owner/admin | `UpdateMenuItemDto` | Update item |
| DELETE | `/api/vendor/menu-items/:id` | owner/admin | — | Delete item |
| PATCH | `/api/vendor/menu-items/:id/availability` | default | `{ is_available }` | Toggle availability |
| GET | `/api/vendor/categories` | default | — | List categories |
| POST | `/api/vendor/categories` | owner/admin | `{ name, sort_order? }` | Create category |
| PUT | `/api/vendor/categories/:id` | owner/admin | partial | Update category |
| DELETE | `/api/vendor/categories/:id` | owner/admin | — | Delete category |
| PATCH | `/api/vendor/categories/:id/bulk-availability` | owner/admin | `{ is_available }` | Bulk toggle items in category |
| POST | `/api/vendor/modifier-groups` | owner/admin | `CreateModifierGroupDto` | Create modifier group |
| PUT | `/api/vendor/modifier-groups/:id` | owner/admin | partial | Update modifier group |
| POST | `/api/vendor/modifier-groups/:id/modifiers` | owner/admin | `CreateModifierDto` | Add modifier |
| DELETE | `/api/vendor/modifier-groups/:groupId/modifiers/:modId` | owner/admin | — | Remove modifier |
| DELETE | `/api/vendor/modifier-groups/:id` | owner/admin | — | Delete modifier group |
| POST | `/api/vendor/menu-items/:itemId/modifier-groups/:groupId` | owner/admin | — | Link group to item |
| DELETE | `/api/vendor/menu-items/:itemId/modifier-groups/:groupId` | owner/admin | — | Unlink group from item |
| GET | `/api/vendor/settings` | default | — | Get settings |
| PUT | `/api/vendor/settings` | owner/admin | `UpdateVendorSettingsDto` | Update settings |
| PATCH | `/api/vendor/status` | default | `UpdateVendorStatusDto` | Set own online/offline status |

### Vendor Operations (finance/feedback for vendor staff)

Base: `/api/vendor/operations` · Tag: `Vendor Operations`

| Method | Path | Roles | Body | Description |
|---|---|---|---|---|
| GET | `/api/vendor/operations/transactions` | owner/kitchen/cashier/admin/super_admin | query: `month?` | Own vendor transactions (rent/utilities) |
| PATCH | `/api/vendor/operations/transactions/:id` | owner/admin/super_admin | `{ is_paid, amount?, notes? }` | Update transaction |
| GET | `/api/vendor/operations/feedback` | owner/kitchen/cashier/admin/super_admin | query: `month?` | Own vendor feedback |
| POST | `/api/vendor/operations/feedback` | owner/kitchen/cashier | `{ type, title (≤120), description (≤1000), severity? }` | Submit feedback/complaint |
| GET | `/api/vendor/operations/admin/feedback` | admin/super_admin | query: `type?, status?, severity?, month?` | All feedback (cross-vendor) |
| PATCH | `/api/vendor/operations/admin/feedback/:id` | admin/super_admin | `{ status, admin_note? (≤500) }` | Review/resolve feedback |
| GET | `/api/vendor/operations/admin/transactions` | admin/super_admin | query: `month?, vendor_id?` | All transactions (cross-vendor) |

### Admin

Base: `/api/admin` · Tag: `Admin` · Roles: `super_admin, admin` (all routes)

| Method | Path | Query/Body | Description |
|---|---|---|---|
| GET | `/api/admin/overview` | — | Dashboard overview |
| GET | `/api/admin/orders/live` | — | Live order feed |
| GET | `/api/admin/analytics/revenue` | `from?, to?, interval?` | Revenue over time |
| GET | `/api/admin/analytics/vendors` | `from?, to?` | Per-vendor analytics |
| GET | `/api/admin/analytics/peak-hours` | `from?, to?` | Peak hours report |
| GET | `/api/admin/analytics/top-items` | `from?, to?, vendor_id?, limit?` | Top-selling items |
| GET | `/api/admin/analytics/prep-times` | `from?, to?, vendor_id?` | Prep-time report |
| GET | `/api/admin/analytics/by-cuisine` | `from?, to?` | Sales by cuisine |
| GET | `/api/admin/orders/export` | `from?, to?` | CSV export of orders |
| GET | `/api/admin/orders` | `from?, to?, status?, vendor_id?, page?, limit?` | Search/list orders |
| GET | `/api/admin/orders/:id` | — | Order detail |
| PATCH | `/api/admin/orders/:id/status` | `{ status, reason? }` | Override order status |
| POST | `/api/admin/orders/:id/cancel` | `{ reason }` | Cancel order |
| GET | `/api/admin/vendors` | `status?, page?, limit?` | List vendors |
| POST | `/api/admin/vendors` | `CreateVendorDto` | Create vendor + owner account |
| PUT | `/api/admin/vendors/:id` | `UpdateVendorDto` | Update vendor |
| PATCH | `/api/admin/vendors/:id/status` | `{ status: online\|offline\|suspended }` | Set vendor status |
| DELETE | `/api/admin/vendors/:id` | — | Delete vendor |
| GET | `/api/admin/vendors/:id/staff` | — | List vendor staff |
| DELETE | `/api/admin/vendors/:vendorId/staff/:userId` | — | Remove staff member |
| GET | `/api/admin/finance/daily` | `from?, to?` | Daily finance summary |
| GET | `/api/admin/finance/by-vendor` | `from?, to?` | Revenue by vendor |
| GET | `/api/admin/finance/cash-log` | `date?, page?, limit?` | Cash log |
| POST | `/api/admin/finance/cash-log` | `{ order_id, amount, collected_by, notes? }` | Record cash log |
| GET | `/api/admin/finance/export` | `from?, to?` | CSV finance export |
| GET | `/api/admin/promotions` | `active?, page?, limit?` | List promotions |
| POST | `/api/admin/promotions` | `CreatePromotionDto` | Create promotion |
| PUT | `/api/admin/promotions/:id` | partial | Update promotion |
| PATCH | `/api/admin/promotions/:id/toggle` | — | Toggle active |
| DELETE | `/api/admin/promotions/:id` | — | Delete promotion |
| GET | `/api/admin/promotions/:id/stats` | — | Promotion usage stats |
| GET | `/api/admin/audit` | `from?, to?, actor_id?, action?, page?, limit?` | Audit log |

Base: `/api/promotions` (public, separate from admin) · Tag: `Admin`

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/promotions/validate` | `ValidatePromoDto { code, subtotal, vendor_id? }` | Validate promo (public, customer checkout) |

---

## Frontend screen → endpoint map

| Screen | Card/Component | Endpoint | Method | Description |
|---|---|---|---|---|
| **HOME** | | | | |
| Home | Header | `/api/auth/me` | GET | Get user profile data |

> Extend this table as frontend screens are wired up. Keep it in sync with `frontend/app/**` — one row per component-to-endpoint binding.

---

## Known issues / TODOs

- **`GET /api/vendor/orders/:orderId` is a stub** — returns `{ orderId }` only, not implemented.
- **Duplicate promo validation**: `POST /api/promotions/validate` (DTO-validated) vs `POST /api/promos/validate` (untyped inline body). Pick one, deprecate the other.
- **`Public()` decorator duplicated per-controller** instead of shared import — harmless but worth consolidating.
- **Logout is stateless** — no server-side token revocation/blacklist; relies on client discarding the token.

## Environment variables

| Var | Purpose |
|---|---|
| `PORT` | Server port (default `3001`) |
| `FRONTEND_URL` | CORS allowed origin (default `http://localhost:3000`) |
| `SUPABASE_URL` / Supabase config | Auth provider; localhost value switches login to local bcrypt/JWT dev mode |
| `DATABASE_URL` | Prisma/PostgreSQL connection |

## Running & exploring

```bash
npm run start:dev     # dev server, http://localhost:3001/api
# Swagger UI:
open http://localhost:3001/api/docs
```

Prefer Swagger (`/api/docs`) for exact request/response schemas — this file is the map, Swagger is the ground truth.
