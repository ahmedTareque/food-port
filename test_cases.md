# Food Port POS — API Test Cases (Tasks #1–#30)

> Base URL: `http://localhost:3001/api`
> Auth: Bearer JWT in `Authorization` header unless marked **Public**
> Content-Type: `application/json`

---

## Auth Conventions

| Role | Email | Password |
|------|-------|----------|
| super_admin | admin@foodvillage.com | admin123 |
| vendor_owner (Food Port) | booth11@foodvillage.com | vendor123 |
| vendor_owner (Burger Barn) | booth1@foodvillage.com | vendor123 |

---

## POST `/api/auth/login`
**Auth:** Public

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Expected response:**
```json
{ "access_token": "string", "user": { "id": "string", "role": "string" } }
```

**TC-AUTH-01** — valid admin login
**TC-AUTH-02** — valid vendor login (booth11)
**TC-AUTH-03** — wrong password → 401

---

## Task #01–#03 — Core Order Flow (Kiosk → Order → Confirmation)

### GET `/api/vendors`
**Auth:** Public

**TC-01-01** — list all vendors; expect array with `id`, `name`, `slug`, `booth_color`
**TC-01-02** — response includes Food Port with `booth_number: 11`

### GET `/api/vendors/:vendorId/menu`
**Auth:** Public

**TC-01-03** — get Food Port menu; expect 20 categories including `Juice`, `Momo`, `Taco`
**TC-01-04** — unknown vendorId → 404

### GET `/api/vendors/:vendorId/categories`
**Auth:** Public

**TC-01-05** — returns category list for vendor; each has `id`, `name`, `slug`
**TC-01-06** — inactive vendor still returns categories (categories are always public)

---

## Task #04 — Kiosk Idle / Screensaver Reset

> Frontend-only. No dedicated API endpoint.
> Validated via `/api/orders` idempotency (same key returns same order, session stays valid).

### POST `/api/orders` (idempotency check)
**Auth:** Public

**TC-04-01** — POST order with `idempotency_key`; repeat POST same key → returns same order, no duplicate
**TC-04-02** — POST with different `idempotency_key` → creates new order

---

## Task #05 — Order Status Tracking Page

### GET `/api/orders/:orderId/status`
**Auth:** Public

**Request:** none

**Expected response:**
```ts
{
  order_id: string
  token_number: number
  overall_status: "pending" | "confirmed" | "partially_ready" | "ready" | "completed" | "cancelled"
  items: Array<{
    id: string
    vendor_name: string
    vendor_color: string
    item_name: string
    status: string
    estimated_prep_time_minutes: number
  }>
}
```

**TC-05-01** — valid orderId → 200 with above shape
**TC-05-02** — non-existent orderId → 404 `Order not found`
**TC-05-03** — after vendor accepts item, status changes to `confirmed`
**TC-05-04** — malformed UUID → 404

---

## Task #06 — Promotions Visible on Kiosk

### POST `/api/promos/validate`
**Auth:** Public

**Request body:**
```ts
{ code: string; subtotal: number }
```

**Expected response:**
```ts
{ valid: boolean; discount_amount: number; code: string }
```

**TC-06-01** — valid active promo code → `{ valid: true, discount_amount: > 0 }`
**TC-06-02** — expired code → `{ valid: false }` or 400
**TC-06-03** — code not found → 404 or `{ valid: false }`
**TC-06-04** — subtotal below `min_order_amount` → `{ valid: false }` with reason

---

## Task #07 — Item Image Zoom Modal

> Frontend-only. Validated via menu item endpoint.

### GET `/api/menu-items/:itemId`
**Auth:** Public

**TC-07-01** — returns item with `image_url` field (may be null for unuploaded items)
**TC-07-02** — deleted item (`is_deleted: true`) → 404

---

## Task #08 — QR Table-Order Mode

### POST `/api/orders`
**Auth:** Public

**Request body:**
```ts
{
  table_id: string         // UUID or table_number string
  session_id?: string
  idempotency_key: string  // UUID, client-generated
  items: Array<{
    vendor_id: string
    menu_item_id: string
    quantity: number
    modifiers: Array<{ modifier_id: string; quantity: number }>
    special_instructions?: string
  }>
}
```

**Expected response:**
```ts
{
  id: string
  token_number: number
  status: "pending"
  subtotal: number
  tax_amount: number
  total: number
  items: Array<{ ... }>
}
```

**TC-08-01** — order with valid `table_id` as integer string `"5"` → 201
**TC-08-02** — order with valid `table_id` as UUID → 201
**TC-08-03** — inactive/non-existent table → 404
**TC-08-04** — item `is_available: false` → 400 `sold out`
**TC-08-05** — `quantity: 0` → 400 validation error
**TC-08-06** — empty `items` array → 400

---

## Task #09 — Kiosk Accessibility Mode

> Frontend-only (font-size toggle, high-contrast, TTS). No API endpoint.
> Validated via GET menu — confirm `dietary_tags` and `allergens` present for screen reader use.

**TC-09-01** — GET `/api/vendors/:id/menu` → each item has `dietary_tags: string[]` and `allergens: string[]`
**TC-09-02** — Food Port Juice items all have `"vegan"` tag in `dietary_tags`

---

## Task #10 — Customer-Facing Display Board

### GET `/api/display/board`
**Auth:** Public

**Expected response:**
```ts
{
  food_village_name: string
  vendors: Array<{
    vendor_id: string
    vendor_name: string
    booth_color: string
    logo_url: string | null
    preparing: number[]   // token numbers
    ready: number[]       // token numbers
  }>
  last_updated: string  // ISO timestamp
}
```

**TC-10-01** — returns board; `last_updated` is valid ISO string
**TC-10-02** — vendors list is array (may be empty); no 500

---

## Task #11 — WebSocket Real-Time Push for KDS

### GET `/api/kds/orders`
**Auth:** Bearer (vendor_owner or vendor_kitchen)

**Expected response:** `Array<{ order_id, token_number, items: [...] }>`

**TC-11-01** — authenticated vendor → 200 with pending items for their vendor only
**TC-11-02** — unauthenticated → 401
**TC-11-03** — vendor from different booth → sees 0 items from other vendor's orders

### PATCH `/api/kds/items/:itemId/accept`
**Auth:** Bearer (vendor)

**TC-11-04** — accept a pending item → `{ status: "accepted" }`
**TC-11-05** — accept already-accepted item → 400 `Invalid transition`
**TC-11-06** — itemId belongs to different vendor → 403 or 404

---

## Task #12 — KDS Urgency Color Coding

> Frontend-only (color bands based on wait time). Validated via KDS API returning timestamps.

**TC-12-01** — `GET /api/kds/orders` → each item has `created_at` timestamp for age calculation
**TC-12-02** — item `estimated_prep_time` field present and is an integer (minutes)

---

## Task #13 — KDS Audio Alert on New Order

> Frontend-only (Web Audio API oscillator). No API endpoint.
> Validated via WebSocket connection to `/kds` namespace.

**TC-13-01** — `GET /api/kds/orders` after creating a new order → new item appears in list
**TC-13-02** — WS event `new_order` fires when order POSTed (integration; verify via WS client)

---

## Task #14 — KDS Bump / Undo (15s Undo Toast)

### PATCH `/api/kds/items/:itemId/ready`
**Auth:** Bearer (vendor)

**TC-14-01** — mark preparing item as ready → `{ status: "ready" }`
**TC-14-02** — mark pending item directly as ready → 400 `Invalid transition`

### PATCH `/api/kds/items/:itemId/preparing`
**Auth:** Bearer (vendor)

**TC-14-03** — mark accepted item as preparing → `{ status: "preparing" }`

---

## Task #15 — KDS Prep Countdown Timer

> Frontend-only. Validated via item fields from KDS orders.

**TC-15-01** — `GET /api/kds/orders` → each item has `accepted_at` (null when pending, ISO when accepted)
**TC-15-02** — `estimated_prep_time` matches menu item's `prep_time_minutes`

---

## Task #16 — KDS Queue Stats Widget

### GET `/api/kds/queue-stats`
**Auth:** Bearer (vendor)

**Expected response:**
```ts
{
  queue_depth: number            // pending + accepted items
  avg_wait_minutes: number       // avg completed item wait
  oldest_pending_minutes: number // age of oldest unaccepted item
}
```

**TC-16-01** — authenticated vendor → 200 with all 3 fields as numbers
**TC-16-02** — empty queue → `{ queue_depth: 0, avg_wait_minutes: 0, oldest_pending_minutes: 0 }`
**TC-16-03** — unauthenticated → 401

---

## Task #17 — Vendor Temporarily Paused Toggle from KDS

### PATCH `/api/vendor/status`
**Auth:** Bearer (vendor_owner)

**Request body:**
```ts
{ is_accepting_orders: boolean }
```

**Expected response:**
```ts
{ is_accepting_orders: boolean }
```

**TC-17-01** — set `is_accepting_orders: false` → vendor paused; response reflects new state
**TC-17-02** — set `is_accepting_orders: true` → vendor unpaused
**TC-17-03** — unauthenticated → 401
**TC-17-04** — kitchen role (not owner) → 403

---

## Task #18 — Order with Special Notes

### POST `/api/orders`
**Auth:** Public

**Request body includes:**
```ts
{ special_notes?: string }
```

**TC-18-01** — order with `special_notes: "No onions please"` → stored; GET order returns `special_notes`
**TC-18-02** — order without `special_notes` → field is null in response

---

## Task #19 — Vendor Operating Hours Editor

### GET `/api/vendor/settings`
**Auth:** Bearer (vendor_owner)

**Expected response:**
```ts
{
  id: string
  name: string
  cuisine_type: string
  avg_prep_time_minutes: number
  operating_hours: Record<string, { open: string; close: string; closed: boolean }> | null
  logo_url: string | null
  booth_color: string
  is_accepting_orders: boolean
}
```

**TC-19-01** — GET settings → 200 with `operating_hours` field (may be null initially)
**TC-19-02** — unauthenticated → 401

### PUT `/api/vendor/settings`
**Auth:** Bearer (vendor_owner)

**Request body:**
```ts
{
  name?: string
  cuisine_type?: string
  avg_prep_time_minutes?: number
  operating_hours?: {
    mon: { open: "09:00", close: "22:00", closed: false }
    tue: { open: "09:00", close: "22:00", closed: false }
    // ... all 7 days
  }
}
```

**TC-19-03** — PUT with operating_hours → 200; GET afterwards returns same hours
**TC-19-04** — PUT with `name: ""` → 400 validation error

---

## Task #20 — Vendor Dashboard Stats

### GET `/api/vendor/dashboard`
**Auth:** Bearer (vendor_owner)

**Expected response:**
```ts
{
  today_revenue: number
  today_orders: number
  avg_prep_time_minutes: number
  pending_count: number
  top_items: Array<{ name: string; count: number }>
}
```

**TC-20-01** — GET dashboard → 200 with all numeric fields
**TC-20-02** — unauthenticated → 401

---

## Task #21 — Menu Category Management

### POST `/api/vendor/categories`
**Auth:** Bearer (vendor_owner)

**Request body:**
```ts
{ name: string; sort_order?: number }
```

**Expected response:**
```ts
{ id: string; name: string; slug: string; sort_order: number }
```

**TC-21-01** — create category `"Specials"` → 201 with auto-generated slug
**TC-21-02** — duplicate category name for same vendor → 409 or 400
**TC-21-03** — empty name → 400

### DELETE `/api/vendor/categories/:id`
**Auth:** Bearer (vendor_owner)

**TC-21-04** — delete empty category → 200
**TC-21-05** — delete category with active items → 400 `category has items`
**TC-21-06** — delete category belonging to different vendor → 404

---

## Task #22 — Bulk 86 Toggle (Sold Out by Category)

### PATCH `/api/vendor/categories/:id/bulk-availability`
**Auth:** Bearer (vendor_owner)

**Request body:**
```ts
{ is_available: boolean }
```

**Expected response:**
```ts
{ updated: number }  // count of items updated
```

**TC-22-01** — `{ is_available: false }` on category with 5 items → `{ updated: 5 }`; all items unavailable
**TC-22-02** — `{ is_available: true }` → restores all items
**TC-22-03** — category belongs to different vendor → 404
**TC-22-04** — ordering unavailable item after 86 → 400 `sold out`

---

## Task #23 — Vendor Booth Logo Upload

### PUT `/api/vendor/settings`
**Auth:** Bearer (vendor_owner)

**Request body:**
```ts
{ logo_url: string }  // Supabase public URL
```

**TC-23-01** — PUT with `logo_url: "https://..."` → 200; GET settings returns same URL
**TC-23-02** — PUT with `logo_url: ""` (clear logo) → 200; logo_url null or empty in response
**TC-23-03** — `GET /api/display/board` after logo set → vendor entry includes `logo_url`

---

## Task #24 — Vendor Order Detail Modal

### GET `/api/vendor/orders/:orderId`
**Auth:** Bearer (vendor_owner)

**Expected response:**
```ts
{
  id: string
  token_number: number
  status: string
  total: number
  created_at: string
  items: Array<{
    id: string
    item_name: string
    quantity: number
    unit_price: number
    total_price: number
    status: string
    modifiers: Array<{ name: string; price: number }>
    special_instructions: string | null
  }>
}
```

**TC-24-01** — valid order belonging to vendor → 200 with items + modifiers
**TC-24-02** — order belonging to different vendor → 404
**TC-24-03** — non-existent orderId → 404

---

## Task #25 — Vendor Revenue Sparkline Chart

### GET `/api/vendor/revenue/weekly`
**Auth:** Bearer (vendor_owner)

**Expected response:**
```ts
Array<{
  date: string        // "YYYY-MM-DD"
  revenue: number
  orders: number
}>
// Always 7 entries (today and 6 days prior)
```

**TC-25-01** — returns exactly 7 entries
**TC-25-02** — dates are in ascending order (oldest first)
**TC-25-03** — revenue for days with no orders is `0` (not null)
**TC-25-04** — unauthenticated → 401

---

## Task #26 — Browser Push Notifications on New Order

> Frontend-only (Notification API + WS). Validated via order creation triggering WS event.

**TC-26-01** — create order via `POST /api/orders` → WS `new_order` event fires to vendor room
**TC-26-02** — `GET /api/kds/orders` immediately after order creation includes new order

---

## Task #27 — Staff PIN Management

### GET `/api/vendor/staff-pins`
**Auth:** Bearer (vendor_owner)

**Expected response:**
```ts
Array<{
  id: string
  label: string
  role: string
  is_active: boolean
  created_at: string
}>
```

**TC-27-01** — returns list (pin_hash NOT included in response)
**TC-27-02** — unauthenticated → 401

### POST `/api/vendor/staff-pins`
**Auth:** Bearer (vendor_owner)

**Request body:**
```ts
{ pin: string; label: string; role?: string }
```

**TC-27-03** — create PIN `"5678"` → 201 with id, label, role; no pin_hash in response
**TC-27-04** — `pin` shorter than 4 chars → 400
**TC-27-05** — duplicate label for same vendor → should succeed (labels are not unique-constrained)

### POST `/api/auth/pin-login`
**Auth:** Public

**Request body:**
```ts
{ pin: string; vendor_id: string }
```

**Expected response:**
```ts
{ access_token: string; role: string }
```

**TC-27-06** — correct PIN + vendor_id → 200 with JWT
**TC-27-07** — wrong PIN → 401
**TC-27-08** — PIN for inactive staff → 401

### PATCH `/api/vendor/staff-pins/:id/toggle`
**Auth:** Bearer (vendor_owner)

**TC-27-09** — toggle active PIN → `{ is_active: false }`; subsequent toggle → `{ is_active: true }`
**TC-27-10** — PIN belonging to different vendor → 404

### DELETE `/api/vendor/staff-pins/:id`
**Auth:** Bearer (vendor_owner)

**TC-27-11** — delete own PIN → 200
**TC-27-12** — delete PIN belonging to different vendor → 404

---

## Task #28 — Vendor Payout Summary

### GET `/api/vendor/payout/summary`
**Auth:** Bearer (vendor_owner)

**Expected response:**
```ts
{
  revenue_this_month: number
  deductions_this_month: number
  net_this_month: number
  all_time_revenue: number
  deductions: Array<{
    id: string
    type: string
    month: string
    amount: number | null
    is_paid: boolean
    due_date: string | null
  }>
}
```

**TC-28-01** — GET payout → 200 with all fields; `deductions` is array
**TC-28-02** — `revenue_this_month` ≥ 0; `net_this_month` = revenue − deductions
**TC-28-03** — unauthenticated → 401

---

## Task #29 — Menu Item Duplication

### POST `/api/vendor/menu-items/:id/duplicate`
**Auth:** Bearer (vendor_owner)

**Expected response:**
```ts
{ id: string; name: string }
```

**TC-29-01** — duplicate item → new item name is `"<original> (Copy)"`; `is_available: false`
**TC-29-02** — GET `/api/vendor/menu` after duplicate → copy appears in same category
**TC-29-03** — duplicate item belonging to different vendor → 404
**TC-29-04** — deleted item → 404

---

## Task #30 — Customer Rating (1–5 Stars)

### POST `/api/orders/:orderId/rate`
**Auth:** Public

**Request body:**
```ts
{
  rating: number    // 1–5, REQUIRED
  comment?: string
}
```

**Expected response:**
```ts
{
  id: string
  order_id: string
  vendor_id: string
  rating: number
  comment: string | null
  created_at: string
}
```

**TC-30-01** — rate with `{ rating: 5, comment: "Excellent!" }` → 201
**TC-30-02** — rate same order again → upserts; same `id`, updated `rating`
**TC-30-03** — `rating: 0` → 400 `Rating must be 1-5`
**TC-30-04** — `rating: 6` → 400 `Rating must be 1-5`
**TC-30-05** — non-existent orderId → 404
**TC-30-06** — rate without `comment` → 201; `comment` is null in response

### GET `/api/orders/:orderId/rating`
**Auth:** Public

**Expected response:** same shape as POST response, or `null` if not yet rated

**TC-30-07** — GET before any rating → null or 404
**TC-30-08** — GET after POST rate → returns rating object with correct values

---

## Summary Table

| Task | # Test Cases | Has API | Endpoint(s) |
|------|-------------|---------|-------------|
| Auth | 3 | ✅ | POST /auth/login |
| #01–03 | 6 | ✅ | GET /vendors, GET /menu |
| #04 | 2 | ✅ | POST /orders (idempotency) |
| #05 | 4 | ✅ | GET /orders/:id/status |
| #06 | 4 | ✅ | POST /promos/validate |
| #07 | 2 | ✅ | GET /menu-items/:id |
| #08 | 6 | ✅ | POST /orders |
| #09 | 2 | ✅ | GET /vendors/:id/menu |
| #10 | 2 | ✅ | GET /display/board |
| #11 | 6 | ✅ | GET /kds/orders, PATCH /kds/items/:id/accept |
| #12 | 2 | ✅ | GET /kds/orders (fields) |
| #13 | 2 | ✅ | GET /kds/orders (after order) |
| #14 | 3 | ✅ | PATCH /kds/items/:id/ready + preparing |
| #15 | 2 | ✅ | GET /kds/orders (fields) |
| #16 | 3 | ✅ | GET /kds/queue-stats |
| #17 | 4 | ✅ | PATCH /vendor/status |
| #18 | 2 | ✅ | POST /orders (special_notes) |
| #19 | 4 | ✅ | GET + PUT /vendor/settings |
| #20 | 2 | ✅ | GET /vendor/dashboard |
| #21 | 6 | ✅ | POST + DELETE /vendor/categories |
| #22 | 4 | ✅ | PATCH /vendor/categories/:id/bulk-availability |
| #23 | 3 | ✅ | PUT /vendor/settings (logo_url) |
| #24 | 3 | ✅ | GET /vendor/orders/:orderId |
| #25 | 4 | ✅ | GET /vendor/revenue/weekly |
| #26 | 2 | ✅ | POST /orders → WS event |
| #27 | 12 | ✅ | CRUD /vendor/staff-pins + POST /auth/pin-login |
| #28 | 3 | ✅ | GET /vendor/payout/summary |
| #29 | 4 | ✅ | POST /vendor/menu-items/:id/duplicate |
| #30 | 8 | ✅ | POST + GET /orders/:id/rate |
| #32 | 3 | ✅ | GET /vendor/reports/sales |
| #33 | 3 | ✅ | GET /vendor/reports/top-items |
| #34 | 3 | ✅ | GET /vendor/reports/peak-hours |
| #35 | 2 | ✅ | GET /vendor/payout/summary |
| #36 | 4 | ✅ | GET + POST + PUT /admin/users |
| #37 | 3 | ✅ | GET + PUT /admin/settings |
| #38 | 3 | ✅ | GET /admin/vendors/:id/detail |
| #39 | 3 | ✅ | POST /admin/vendors/:id/staff |
| #40 | 2 | ✅ | GET /admin/finance/export |
| #41 | 2 | ✅ | GET /admin/orders/export |
| #42 | 2 | ✅ | GET /admin/promotions/:id/stats |
| #43 | N/A | — | Frontend/UI only |
| #44 | 2 | ✅ | GET /display/board?vendor_id= |
| #45 | N/A | — | Frontend/UI only |
| #46 | N/A | — | Frontend/UI only |
| #47 | 3 | ✅ | GET /orders/by-token/:token |
| #48 | N/A | — | Frontend/localStorage only |
| #49 | 3 | ✅ | POST /orders (special_instructions per item) |
| #50 | 2 | ✅ | GET /orders/:id/status (shareable) |
| #51 | N/A | — | Frontend/UI only |
| #52 | 2 | ✅ | HTTP response headers check |
| #53 | 3 | ✅ | Rate limit (429 after burst) |
| #54 | N/A | — | Frontend/UI only |
| #55 | N/A | — | Frontend/PWA only |
| #56 | N/A | — | Frontend/UI only |
| #57 | N/A | — | Frontend/UI only |
| #58 | N/A | — | Frontend/UI only |
| #59 | 2 | ✅ | GET /vendor/orders?page= pagination |
| #60 | 2 | ✅ | GET /admin/audit (expand metadata) |
| #61 | N/A | — | Frontend/UI only |
| **Total** | **≥ 166** | | |

---

## Environment Variables for Postman

```json
{
  "base_url": "http://localhost:3001/api",
  "admin_token": "{{set via login}}",
  "vendor_token": "{{set via login booth11}}",
  "vendor_id": "{{food-port vendor UUID}}",
  "table_id": "1",
  "order_id": "{{set after POST /orders}}",
  "item_id": "{{set from menu fetch}}",
  "category_id": "{{set from categories fetch}}"
}
```

---

# Tasks #32–#61 — New Feature Test Cases

---

## Task #32 — Vendor Sales Report

### GET `/api/vendor/reports/sales`
**Auth:** vendor_token (booth11)
**Query params:** `from`, `to` (YYYY-MM-DD)

**TC-32-01** — GET without date params → 200; response has `daily` array, each entry has `date`, `orders`, `revenue`, `avg_order_value`
**TC-32-02** — GET with `from=2024-01-01&to=2024-01-31` → 200; `daily` array length ≤ 31
**TC-32-03** — GET as admin token (wrong role) → 403

---

## Task #33 — Vendor Top Items Report

### GET `/api/vendor/reports/top-items`
**Auth:** vendor_token (booth11)
**Query params:** `from`, `to`, `limit`

**TC-33-01** — GET → 200; response is array, each item has `menu_item_id`, `item_name`, `quantity_sold`, `revenue`
**TC-33-02** — GET with `limit=3` → response array length ≤ 3
**TC-33-03** — items sorted descending by `quantity_sold`

---

## Task #34 — Vendor Peak Hours Heatmap

### GET `/api/vendor/reports/peak-hours`
**Auth:** vendor_token (booth11)
**Query params:** `from`, `to`

**TC-34-01** — GET → 200; response is array of 7 objects (one per weekday), each has `day` and `hours` array of 24 entries
**TC-34-02** — each hour entry has `hour` (0–23) and `order_count` (integer ≥ 0)
**TC-34-03** — GET as unauthenticated → 401

---

## Task #35 — Vendor Wallet / Balance Page

### GET `/api/vendor/payout/summary`
**Auth:** vendor_token (booth11)

**TC-35-01** — GET → 200; response has `total_revenue`, `total_paid_out`, `balance` (all numeric); `balance = total_revenue - total_paid_out`
**TC-35-02** — GET as admin token → 403 (vendor-only endpoint)

---

## Task #36 — Admin User Management

### GET `/api/admin/users`
**Auth:** admin_token
**Query params:** `role`, `page`, `limit`

**TC-36-01** — GET → 200; response has `users` array and `total`; each user has `id`, `email`, `role`, `created_at`
**TC-36-02** — GET with `role=vendor_owner` → all returned users have `role: "vendor_owner"`

### POST `/api/admin/users`
**Auth:** admin_token

**Request body:**
```json
{ "email": "newstaff@test.com", "password": "pass1234", "role": "admin", "name": "Test Admin" }
```

**TC-36-03** — POST valid body → 201; response has `id`, `email`, `role`
**TC-36-04** — POST duplicate email → 409

### PUT `/api/admin/users/:id`
**Auth:** admin_token

**TC-36-05** — PUT with `{ "role": "admin" }` on existing user → 200; returned user has updated role
**TC-36-06** — PUT on non-existent id → 404

---

## Task #37 — Admin System Settings

### GET `/api/admin/settings`
**Auth:** admin_token

**TC-37-01** — GET → 200; response has `food_village_name`, `tax_rate`, `currency`, `timezone`
**TC-37-02** — GET as vendor_token → 403

### PUT `/api/admin/settings`
**Auth:** admin_token (super_admin only)

**Request body:**
```json
{ "tax_rate": 0.08, "food_village_name": "Test Village" }
```

**TC-37-03** — PUT valid body → 200; GET settings afterward reflects new values

---

## Task #38 — Admin Vendor Detail Page

### GET `/api/admin/vendors/:id/detail`
**Auth:** admin_token

**TC-38-01** — GET valid vendor id → 200; response has `id`, `name`, `staffPins` array, `menu_categories` array, `stats` object with `orders_today`, `revenue_today`
**TC-38-02** — GET non-existent id → 404
**TC-38-03** — `staffPins` array entries have `id`, `label`, `role`, `is_active`

---

## Task #39 — Admin Create Staff for Vendor

### POST `/api/admin/vendors/:id/staff`
**Auth:** admin_token

**Request body:**
```json
{ "email": "kitchen1@test.com", "password": "pass1234", "name": "Kitchen Staff" }
```

**TC-39-01** — POST valid body → 201; response has `id`, `email`, `role: "vendor_kitchen"`; user is associated with vendor
**TC-39-02** — POST duplicate email → 409
**TC-39-03** — POST to non-existent vendor id → 404

---

## Task #40 — Finance CSV Export

### GET `/api/admin/finance/export`
**Auth:** admin_token
**Query params:** `from`, `to`

**TC-40-01** — GET → 200; `Content-Type` header is `text/csv`; `Content-Disposition` contains `attachment; filename=`
**TC-40-02** — GET with `from=2024-01-01&to=2024-01-31` → CSV first line is header row with `date,total_orders,gross_revenue,tax_collected,net_revenue`

---

## Task #41 — Orders CSV Export

### GET `/api/admin/orders/export`
**Auth:** admin_token
**Query params:** `status`, `from`, `to`

**TC-41-01** — GET → 200; `Content-Type: text/csv`; body has header row with `token_number,table,status,total,created_at`
**TC-41-02** — GET with `status=completed` → all data rows have status `completed`

---

## Task #42 — Admin Promotion Stats Modal

### GET `/api/admin/promotions/:id/stats`
**Auth:** admin_token

**TC-42-01** — GET valid promotion id → 200; response has `total_uses`, `total_discount_given`, `unique_orders`
**TC-42-02** — GET non-existent id → 404

---

## Task #43 — KDS Fullscreen Toggle

> Frontend-only. No API endpoint. Validated by UI interaction.

**TC-43-01** — N/A (frontend): KDS page has fullscreen button; clicking triggers `document.documentElement.requestFullscreen()`
**TC-43-02** — N/A (frontend): button label toggles between Enter Fullscreen / Exit Fullscreen based on `document.fullscreenElement`

---

## Task #44 — Display Board Vendor Filter

### GET `/api/display/board`
**Auth:** Public

**TC-44-01** — GET without params → 200; returns all active vendor sections with orders
**TC-44-02** — GET with `vendor_id={{vendor_id}}` → response contains only that vendor's section

---

## Task #45 — Display Board Auto-Reconnect Overlay

> Frontend WebSocket handling only. No API endpoint.

**TC-45-01** — N/A (frontend/WS): when WS disconnects, overlay banner appears within 3 s
**TC-45-02** — N/A (frontend/WS): on reconnect, overlay disappears and board refreshes

---

## Task #46 — KDS Print Ticket

> Frontend-only trigger (ESC/POS simulation via `window.print` or receipt formatting).

**TC-46-01** — N/A (frontend): Print Ticket button present on KDS order card; clicking opens print dialog or triggers `window.print()`
**TC-46-02** — N/A (frontend): printed content includes token number, item list, vendor name, timestamp

---

## Task #47 — Customer Order Lookup by Token

### GET `/api/orders/by-token/:token`
**Auth:** Public

**TC-47-01** — GET with valid token number → 200; response has `id`, `token_number`, `status`, `created_at`
**TC-47-02** — GET with token number that doesn't exist → 404
**TC-47-03** — GET with non-numeric token (e.g. `abc`) → 400 or 404 (not 500)

---

## Task #48 — Customer Saved / Recent Orders

> Frontend-only (localStorage). No API endpoint.

**TC-48-01** — N/A (frontend): after order placed, order id is stored in localStorage `recent-orders` key
**TC-48-02** — N/A (frontend): revisiting `/order/lookup` shows recently tracked order ids as quick-links

---

## Task #49 — Special Instructions per Cart Item

### POST `/api/orders`
**Auth:** Public

**Request body includes `special_instructions` on a cart item:**
```json
{
  "session_id": "{{session_id}}",
  "table_id": "1",
  "idempotency_key": "test-si-01",
  "items": [
    {
      "menu_item_id": "{{item_id}}",
      "vendor_id": "{{vendor_id}}",
      "quantity": 1,
      "modifiers": [],
      "special_instructions": "No onions please"
    }
  ]
}
```

**TC-49-01** — POST with `special_instructions` → 201; `GET /orders/:id` response item has `special_instructions: "No onions please"`
**TC-49-02** — POST with `special_instructions` exceeding 200 chars → 400 (MaxLength validation)
**TC-49-03** — POST without `special_instructions` → 201; item `special_instructions` is `null`

---

## Task #50 — Order Tracking Shareable Link

### GET `/api/orders/:orderId/status`
**Auth:** Public

**TC-50-01** — GET with valid order id (no auth header) → 200; response has `status`, `token_number`, `items` array with per-item status
**TC-50-02** — GET with non-existent order id → 404; confirms public tracking endpoint returns 404 not 403

---

## Task #51 — Customer Accessibility Improvements

> Frontend-only. No API endpoint.

**TC-51-01** — N/A (frontend): all interactive buttons/links have visible focus ring and `aria-label` or descriptive text
**TC-51-02** — N/A (frontend): color contrast for status badges meets WCAG AA (4.5:1 minimum)

---

## Task #52 — Next.js Security Headers

### GET `http://localhost:3000/` (frontend)
**Auth:** none

**TC-52-01** — HEAD or GET `/` → response includes `X-Frame-Options: DENY` or `SAMEORIGIN` header
**TC-52-02** — response includes `X-Content-Type-Options: nosniff` and `Referrer-Policy` headers

---

## Task #53 — NestJS Rate Limiting (Throttler)

### POST `/api/auth/login` — burst test
**Auth:** Public

**TC-53-01** — send 10 POST login requests within 1 second with wrong credentials → at least one response returns 429 with `Retry-After` or `Too Many Requests` message
**TC-53-02** — after rate limit window resets (60 s), same IP can successfully POST login again → 401 (not 429)
**TC-53-03** — admin endpoints decorated with `@SkipThrottle` (e.g. `GET /admin/overview`) do not return 429 even under burst

---

## Task #54 — Global Error Boundary Improvement

> Frontend React error boundary. No API endpoint.

**TC-54-01** — N/A (frontend): triggering a JS throw in a child component renders the error boundary UI (not a blank screen)
**TC-54-02** — N/A (frontend): error boundary shows "Something went wrong" message and a Reload button

---

## Task #55 — PWA Manifest + Icons

### GET `http://localhost:3000/manifest.json`
**Auth:** none

**TC-55-01** — N/A (frontend/PWA): GET `/manifest.json` → 200; JSON has `name`, `short_name`, `icons` array (at least one 192×192 and one 512×512 entry), `display: "standalone"`
**TC-55-02** — N/A (frontend/PWA): `<link rel="manifest">` present in `<head>` of `/` page

---

## Task #56 — Vendor Mobile-Optimized KDS Layout

> Frontend responsive layout. No API endpoint.

**TC-56-01** — N/A (frontend): at viewport 375px wide, KDS order cards stack vertically; no horizontal overflow
**TC-56-02** — N/A (frontend): action buttons (Accept, Ready) are ≥ 44px tap target on mobile viewport

---

## Task #57 — Admin Dark Mode Toggle

> Frontend UI preference. No API endpoint.

**TC-57-01** — N/A (frontend): admin layout has a dark/light toggle button; clicking changes `data-theme` attribute on root element
**TC-57-02** — N/A (frontend): preference is persisted to localStorage so it survives page refresh

---

## Task #58 — Vendor Menu Search / Filter

> Frontend client-side filter. No new API endpoint needed.

**TC-58-01** — N/A (frontend): typing in menu search input filters displayed items to only those whose name contains the query (case-insensitive)
**TC-58-02** — N/A (frontend): clearing search input restores full item list for active category

---

## Task #59 — Vendor Orders Pagination / Infinite Scroll

### GET `/api/vendor/orders`
**Auth:** vendor_token (booth11)
**Query params:** `page`, `limit`

**TC-59-01** — GET `?page=1&limit=5` → 200; response has `orders` array (length ≤ 5), `total`, `page: 1`, `pages`
**TC-59-02** — GET `?page=2&limit=5` with enough orders → `orders` array contains different order ids than page 1

---

## Task #60 — Admin Audit Log Detail / Expand

### GET `/api/admin/audit`
**Auth:** admin_token
**Query params:** `from`, `to`, `actor_id`, `action`, `page`, `limit`

**TC-60-01** — GET → 200; response has `logs` array; each log entry has `id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`
**TC-60-02** — `metadata` field is a JSON object (not null string); contains change details (e.g. `{ before: {...}, after: {...} }`)

---

## Task #61 — Keyboard Shortcuts for KDS

> Frontend-only. No API endpoint.

**TC-61-01** — N/A (frontend): pressing `A` key when a KDS card is focused calls Accept action for that item
**TC-61-02** — N/A (frontend): pressing `R` key when a KDS card is focused calls Ready action; pressing `F` triggers fullscreen toggle
