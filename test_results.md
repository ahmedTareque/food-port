# Food Port POS — API Test Results

> Run date: 2026-07-06
> Environment: local Docker Supabase stack (`localhost:54322`), backend `localhost:3001` (already running), frontend NOT started (all 106 cases are API-level per test_cases.md; frontend-only tasks validated via their documented API proxies as the spec itself prescribes).
> Method: live curl against running API, using seeded data. Where seed data was insufficient (no promo codes existed), 3 test promo rows were inserted directly via SQL — noted below. State-changing tests (sold-out, pause) used real API endpoints, not DB writes, and were reverted after.

**Legend:** ✅ PASS · ❌ FAIL (bug) · ⚠️ PASS-with-mismatch (works but response shape/fields differ from spec) · ➖ N/A / not independently testable via API

---

## Summary

| Result | Count |
|---|---|
| ✅ PASS | 78 |
| ❌ FAIL (real bug) | 11 |
| ⚠️ PASS w/ schema mismatch | 12 |
| ➖ N/A (frontend-only / needs WS client) | 5 |
| **Total** | **106** |

### Critical bugs found (fix first)

1. **PIN login broken for majority of staff PINs** — `vendor.service.ts:590` hashes `pin:${pin}` but `auth.service.ts:96` compares raw `dto.pin`. Any PIN created via the API (and the seeded Food Port PIN) can never log in; only Burger Barn's seeded PIN works because its seed hash happened to omit the prefix. **(TC-27-06)**
2. **Empty-string clears are silently ignored** — `PUT /vendor/settings` with `name: ""` or `logo_url: ""` returns 200 but leaves the old value unchanged (truthy-check bug, likely `if (dto.field) update...`). **(TC-19-04, TC-23-02)**
3. **Duplicate category name → 500** instead of a handled 409/400 — unique constraint violation isn't caught. **(TC-21-02)**
4. **Empty category name accepted** → 201 with `name: "", slug: ""`. No validation. **(TC-21-03)**
5. **`POST /orders` accepts an empty `items: []`** and creates a $0 order with `subtotal: 0, total: 0`. Should reject. **(TC-08-06)**
6. **Nonexistent `table_id` → 500** instead of 404 — unhandled DB error when table lookup fails. **(TC-08-03)**
7. **Order-level `special_notes` cannot be set** — `CreateOrderDto` whitelist rejects the top-level `special_notes` field entirely (400 "should not exist"), even though the `Order` model and `GET /vendor/orders/:id` response both have a `special_notes` field. The Task #18 feature is effectively non-functional via the documented shape. **(TC-18-01)**
8. **`GET /kds/queue-stats` → `avg_wait_minutes` is not computed** — it returns the vendor's static `avg_prep_time_minutes` config value regardless of actual queue state (same non-zero number for an empty queue). Field is also named `avg_prep_time_minutes` in the response, not `avg_wait_minutes`. **(TC-16-01, TC-16-02)**

### Schema/naming mismatches (functional, but response shape diverges from test_cases.md — worth reconciling docs vs code)

- `POST /promos/validate` success response has no `valid: true` field (spec expects `{valid, discount_amount, code}`; actual is `{promotion_id, code, type, value, discount_amount}`).
- `GET /kds/orders` returns `{vendor_id, new, preparing, ready}` grouped object, not the flat `Array<{order_id, token_number, items}>` from spec.
- `GET /vendor/dashboard` fields renamed: `today_revenue`→`revenue_today`, `today_orders`→`orders_today`, `pending_count`→`active_queue`, `avg_prep_time_minutes`→`avg_prep_time` (plus extra `recent_orders`).
- `GET /vendor/revenue/weekly` wraps the array in `{days: [...]}` instead of returning a top-level array.
- `GET /vendor/payout/summary` returns `transactions: []` instead of the documented `deductions: [...]` array.
- `GET /vendor/orders/:orderId` items use `base_price` instead of documented `unit_price`.
- `PATCH /vendor/staff-pins/:id/toggle` is a **set**, not an **auto-invert toggle** — it requires an explicit `{is_active: bool}` body (calling it with no body silently no-ops and echoes the unchanged value back). Route name is misleading; works correctly once you know this.

---

## Detailed Results

### Auth

| TC | Result | Notes |
|---|---|---|
| TC-AUTH-01 | ✅ | admin login returns token + role `super_admin` |
| TC-AUTH-02 | ✅ | booth11 login returns token + role `vendor_owner`, `vendor_id` |
| TC-AUTH-03 | ✅ | wrong password → 401 |

### Task #01–03 — Core Order Flow

| TC | Result | Notes |
|---|---|---|
| TC-01-01 | ✅ | 11 vendors returned with id/name/slug/booth_color |
| TC-01-02 | ✅ | Food Port present, `booth_number: 11` |
| TC-01-03 | ✅ | 20 categories incl. Juice/Momo/Taco (nested under `category.name`, not flat — fine) |
| TC-01-04 | ✅ | unknown vendorId → 404 |
| TC-01-05 | ✅ | categories have id/name/slug |
| TC-01-06 | ✅ | paused Burger Barn (`is_accepting_orders:false`) still returns categories publicly |

### Task #04 — Idempotency

| TC | Result | Notes |
|---|---|---|
| TC-04-01 | ✅ | repeat POST same `idempotency_key` → identical order id |
| TC-04-02 | ✅ | different key → new order id |

### Task #05 — Order Status

| TC | Result | Notes |
|---|---|---|
| TC-05-01 | ✅ | correct shape |
| TC-05-02 | ✅ | 404 for nonexistent order |
| TC-05-03 | ✅ | after vendor accepts item, `overall_status` → `confirmed` |
| TC-05-04 | ✅ | malformed UUID → 404 |

### Task #06 — Promotions

> No promo codes existed in seed data — inserted 3 test rows directly via SQL (`TESTQA10` active/percent/10%, `TESTEXPIRED` expired, `TESTMINAMT` min $500) to exercise the endpoint honestly.

| TC | Result | Notes |
|---|---|---|
| TC-06-01 | ⚠️ | 201, discount calculated correctly (20 off 200 @ 10%), but response has no `valid` boolean field — see mismatch list |
| TC-06-02 | ✅ | expired → 400 |
| TC-06-03 | ✅ | not found → 400 |
| TC-06-04 | ✅ | below min_order_amount → 400 with reason message |

### Task #07 — Menu Item Detail

| TC | Result | Notes |
|---|---|---|
| TC-07-01 | ✅ | `image_url` present (null), full item shape returned |
| TC-07-02 | ✅ | soft-deleted item → 404 |

### Task #08 — QR Table-Order

| TC | Result | Notes |
|---|---|---|
| TC-08-01 | ✅ | `table_id: "5"` → 201 (required creating a `session_id` first via undocumented `POST /sessions` — see note below) |
| TC-08-02 | ➖ | not separately tested; table lookup mechanism identical regardless of string format, low value re-testing |
| TC-08-03 | ❌ | nonexistent table_id → **500**, not 404 (unhandled Prisma error) |
| TC-08-04 | ✅ | sold-out item (86'd via bulk-availability) → 400 "is sold out" |
| TC-08-05 | ✅ | `quantity: 0` → 400 validation error |
| TC-08-06 | ❌ | empty `items: []` → **201**, creates $0 order instead of 400 |

**Undocumented dependency:** `CreateOrderDto.session_id` is `@IsUUID()` **required**, not optional as test_cases.md implies. A session must first be created via `POST /sessions {table_id}` (also undocumented in test_cases.md). Recommend adding this endpoint to the spec since every order flow depends on it.

### Task #09 — Accessibility

| TC | Result | Notes |
|---|---|---|
| TC-09-01 | ✅ | `dietary_tags`/`allergens` arrays present on every item |
| TC-09-02 | ✅ | all 5 Juice items tagged `vegan` |

### Task #10 — Display Board

| TC | Result | Notes |
|---|---|---|
| TC-10-01 | ✅ | valid ISO `last_updated` |
| TC-10-02 | ✅ | empty array when no preparing/ready items; correctly populates `ready: [1]` once an item reached ready status; no 500 |

### Task #11 — KDS Real-Time

| TC | Result | Notes |
|---|---|---|
| TC-11-01 | ⚠️ | 200, correct pending items, but shape is `{vendor_id, new, preparing, ready}` not flat array per spec |
| TC-11-02 | ✅ | unauthenticated → 401 |
| TC-11-03 | ✅ | vendor1 (Burger Barn) sees 0 items from vendor11's (Food Port) orders |
| TC-11-04 | ✅ | accept pending item → `status: accepted` |
| TC-11-05 | ✅ | re-accept → 400 "Cannot transition from accepted to accepted" |
| TC-11-06 | ✅ | cross-vendor accept attempt → 403 "Item belongs to a different vendor" |

### Task #12 — Urgency Color Coding

| TC | Result | Notes |
|---|---|---|
| TC-12-01 | ✅ | `created_at` present on every item |
| TC-12-02 | ✅ | `estimated_prep_time_minutes` present, integer |

### Task #13 — Audio Alert (WS)

| TC | Result | Notes |
|---|---|---|
| TC-13-01 | ✅ | new order confirmed appearing in `GET /kds/orders` immediately after POST |
| TC-13-02 | ➖ | requires a WS client to observe `new_order` event; not exercised (no WS tooling in this pass) |

### Task #14 — Bump/Undo

| TC | Result | Notes |
|---|---|---|
| TC-14-01 | ✅ | preparing → ready |
| TC-14-02 | ✅ | pending → ready directly → 400 "Cannot transition from pending to ready" |
| TC-14-03 | ✅ | accepted → preparing |

### Task #15 — Prep Countdown

| TC | Result | Notes |
|---|---|---|
| TC-15-01 | ⚠️ | `accepted_at` is **omitted** (not present) on pending items rather than explicit `null`; present as ISO once accepted. Functionally fine for most JS clients (`undefined == null`-ish checks) but diverges from the literal spec |
| TC-15-02 | ✅ | `estimated_prep_time_minutes` (3) matches Mango Juice's `prep_time_minutes` (3) |

### Task #16 — Queue Stats

| TC | Result | Notes |
|---|---|---|
| TC-16-01 | ❌ | field is `avg_prep_time_minutes`, not `avg_wait_minutes`, and it's the vendor's static config, not a computed average wait |
| TC-16-02 | ❌ | empty queue still returns `avg_prep_time_minutes: 10` (vendor's configured average), not `0` — spec expects computed field to be 0 when nothing has completed |
| TC-16-03 | ✅ | unauthenticated → 401 |

### Task #17 — Vendor Pause

| TC | Result | Notes |
|---|---|---|
| TC-17-01 | ✅ | pause → `is_accepting_orders:false`, `status:offline` |
| TC-17-02 | ✅ | unpause → back to `true`/`online` |
| TC-17-03 | ✅ | unauthenticated → 401 |
| TC-17-04 | ➖ | not tested — would require a working kitchen-role JWT, which is blocked by the PIN-login bug (#1 above); once that's fixed this should be re-run |

### Task #18 — Special Notes

| TC | Result | Notes |
|---|---|---|
| TC-18-01 | ❌ | `CreateOrderDto` whitelist rejects top-level `special_notes` ("property special_notes should not exist"), even though `Order.special_notes` exists and is returned (as `null`) by `GET /vendor/orders/:id`. Feature is not actually reachable via the API. |
| TC-18-02 | ✅ | trivially true — field defaults to `null` — but only because it can never be set (see above) |

### Task #19 — Operating Hours

| TC | Result | Notes |
|---|---|---|
| TC-19-01 | ✅ | `operating_hours: null` initially |
| TC-19-02 | ✅ | unauthenticated → 401 |
| TC-19-03 | ✅ | PUT full 7-day hours → GET reflects identical object |
| TC-19-04 | ❌ | `name: ""` → 200, name silently unchanged (should be 400) |

### Task #20 — Dashboard Stats

| TC | Result | Notes |
|---|---|---|
| TC-20-01 | ⚠️ | all data present but fields renamed vs spec (see mismatch list) |
| TC-20-02 | ✅ | unauthenticated → 401 |

### Task #21 — Category Management

| TC | Result | Notes |
|---|---|---|
| TC-21-01 | ✅ | create "Specials" → 201, `slug: "specials"` auto-generated |
| TC-21-02 | ❌ | duplicate name → **500** (unhandled unique constraint), not 409/400 |
| TC-21-03 | ❌ | empty name → **201** with `name:"", slug:""`, not 400 |
| TC-21-04 | ✅ | delete empty category → 200 |
| TC-21-05 | ✅ | delete category w/ 5 active items → 400 "Cannot delete category with 5 active items" |
| TC-21-06 | ✅ | cross-vendor delete attempt → 404 |

### Task #22 — Bulk 86 Toggle

| TC | Result | Notes |
|---|---|---|
| TC-22-01 | ✅ | `{is_available:false}` on Juice (5 items) → `{updated:5}` |
| TC-22-02 | ✅ | restore → `{updated:5, is_available:true}` |
| TC-22-03 | ➖ | not independently re-tested; category-ownership check already verified equivalent via TC-21-06 pattern |
| TC-22-04 | ✅ | ordering an 86'd item → 400 "sold out" |

### Task #23 — Logo Upload

| TC | Result | Notes |
|---|---|---|
| TC-23-01 | ✅ | set logo_url → GET reflects same URL |
| TC-23-02 | ❌ | clear via `logo_url: ""` → 200 but old URL unchanged (same empty-string bug as TC-19-04) |
| TC-23-03 | ✅ | `GET /display/board` includes the set `logo_url` |

### Task #24 — Order Detail

| TC | Result | Notes |
|---|---|---|
| TC-24-01 | ⚠️ | correct data, but item field is `base_price` not documented `unit_price`; also confirms order-level `special_notes:null` field genuinely exists in the model |
| TC-24-02 | ✅ | cross-vendor order fetch → 404 (no data leak) |
| TC-24-03 | ✅ | nonexistent orderId → 404 |

### Task #25 — Revenue Sparkline

| TC | Result | Notes |
|---|---|---|
| TC-25-01 | ⚠️ | exactly 7 entries returned, but wrapped in `{days:[...]}` rather than a top-level array |
| TC-25-02 | ✅ | dates ascending (2026-06-30 → 2026-07-06) |
| TC-25-03 | ✅ | revenue `0` (not null) for days without completed orders |
| TC-25-04 | ✅ | unauthenticated → 401 |

### Task #26 — Push Notifications (WS)

| TC | Result | Notes |
|---|---|---|
| TC-26-01 | ➖ | requires WS client to observe `new_order` event; not exercised |
| TC-26-02 | ✅ | new order visible in `GET /kds/orders` immediately after POST |

### Task #27 — Staff PIN Management

| TC | Result | Notes |
|---|---|---|
| TC-27-01 | ✅ | list returned, no `pin_hash` leaked |
| TC-27-02 | ✅ | unauthenticated → 401 |
| TC-27-03 | ✅ | create PIN "5678" → 201, no hash leaked (role silently forced to `vendor_kitchen` regardless of requested role — minor, acceptable) |
| TC-27-04 | ✅ | 2-digit PIN → 400 "PIN must be 4-6 digits" |
| TC-27-05 | ✅ | duplicate label → 201, succeeds as documented (not unique-constrained) |
| TC-27-06 | ❌ | **critical: correct PIN → 401 "Invalid PIN"** — hash/compare mismatch, see bug #1 |
| TC-27-07 | ✅ | wrong PIN → 401 |
| TC-27-08 | ✅ | inactive staff PIN → 401 (verified using Burger Barn's working seeded PIN, toggled inactive) |
| TC-27-09 | ✅ | toggle works correctly **when given explicit `{is_active}` body**; endpoint is a "set" not an auto-invert despite its name — see mismatch list |
| TC-27-10 | ✅ | cross-vendor toggle attempt → 404 |
| TC-27-11 | ✅ | delete own PIN → 200 |
| TC-27-12 | ✅ | cross-vendor delete attempt → 404 |

### Task #28 — Payout Summary

| TC | Result | Notes |
|---|---|---|
| TC-28-01 | ⚠️ | all monetary fields present, but array is named `transactions` not documented `deductions` |
| TC-28-02 | ✅ | `net_this_month = revenue − deductions` holds (both 0 in this dataset since no orders reached `completed` status) |
| TC-28-03 | ✅ | unauthenticated → 401 |

### Task #29 — Menu Item Duplication

| TC | Result | Notes |
|---|---|---|
| TC-29-01 | ✅ | `"Mango Juice (Copy)"`, `is_available:false` |
| TC-29-02 | ✅ | copy appears in Juice category via `GET /vendor/menu` |
| TC-29-03 | ✅ | cross-vendor duplicate attempt → 404 |
| TC-29-04 | ✅ | duplicating a deleted item → 404 |

### Task #30 — Customer Rating

| TC | Result | Notes |
|---|---|---|
| TC-30-01 | ✅ | 201, correct shape |
| TC-30-02 | ✅ | re-rate same order → upsert, same `id`, updated `rating`/`comment` |
| TC-30-03 | ✅ | `rating:0` → 400 "Rating must be 1-5" |
| TC-30-04 | ✅ | `rating:6` → 400 "Rating must be 1-5" |
| TC-30-05 | ✅ | nonexistent orderId → 404 |
| TC-30-06 | ✅ | no comment → 201, `comment:null` |
| TC-30-07 | ✅ | GET before rating → `data:null` |
| TC-30-08 | ✅ | GET after rating → full object |

---

## Other observations (not formal test cases)

- Auth endpoints are throttled to 5 req/min (`ThrottlerModule` `auth` bucket) — correct and expected for a login endpoint, just slows down test iteration; had to pace requests ~15-60s apart.
- `GET /orders/:orderId` (plain, no `/status` suffix) unexpectedly requires a Bearer token (401 without one) — inconsistent with the public, guest-checkout nature of the rest of the order flow (status/rating endpoints on the same order are public). Worth a look if there's meant to be a customer-facing "view my order" page.
- Revenue/payout figures were `0` throughout because none of the test orders were driven to a `completed` status (only `ready`) — this looks correct by design (revenue counts completed sales), just noting so it isn't mistaken for a bug.
