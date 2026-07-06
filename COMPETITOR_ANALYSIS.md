# Competitor Analysis — Food Village POS vs Market

Scope: food-court / multi-vendor kiosk ordering + KDS + admin back-office space. 3 real competitors picked (public feature docs, not reverse-engineered from private code):

1. **Toast POS** (restaurant/food-court POS, market leader US)
2. **Square for Restaurants** (POS + KDS + online ordering)
3. **Grubhub Campus / ORDR-style multi-vendor food hall kiosk platforms** (closest direct comp — multi-vendor food hall kiosk model, e.g. Ordermark/Owner.com food-hall deployments) — represented generically as **"Food Hall Kiosk Platform (FHKP)"** since no single vendor publishes a full public feature/screen list for this niche.

---

## 1. Toast POS

### Features (30+)
1. Order entry (counter/table)
2. Menu management w/ modifiers
3. KDS (Kitchen Display System)
4. Online ordering
5. Toast Mobile Order & Pay
6. Kiosk self-order
7. Payment processing (Toast Pay)
8. Split checks
9. Tipping/tip pooling
10. Gift cards
11. Loyalty program
12. Inventory management
13. Recipe/ingredient costing
14. Multi-location management
15. Franchise reporting
16. Labor management/scheduling
17. Time clock
18. Payroll integration
19. Table management/floor plan
20. Reservations
21. Delivery integration (DoorDash, UberEats)
22. Catering module
23. Handheld POS devices
24. Customer-facing display
25. Digital menu boards
26. Marketing/email campaigns
27. Analytics dashboard (xtraCHEF)
28. Vendor/supplier ordering
29. Offline mode
30. Multi-currency (intl)
31. Role-based staff permissions
32. Audit trail
33. Third-party API/integrations marketplace

### Screens (30+)
1. POS order entry grid
2. Menu item modifier picker
3. Split check screen
4. Payment/tender screen
5. Tip selection screen
6. Receipt/email receipt screen
7. KDS ticket board
8. KDS bump/recall screen
9. Kiosk welcome screen
10. Kiosk menu browse
11. Kiosk cart/checkout
12. Kiosk payment screen
13. Kiosk order confirmation
14. Online ordering storefront
15. Online cart/checkout
16. Table/floor plan view
17. Reservation calendar
18. Staff login/clock-in
19. Staff scheduling calendar
20. Payroll summary
21. Inventory count screen
22. Recipe cost builder
23. Supplier order form
24. Multi-location switcher
25. Sales dashboard (daily/weekly)
26. Item sales report
27. Labor cost report
28. Customer-facing order display
29. Digital menu board editor
30. Loyalty enrollment screen
31. Gift card issue/redeem screen
32. Admin settings/permissions
33. Audit log viewer

---

## 2. Square for Restaurants

### Features (30+)
1. Order entry (QSR/full-service)
2. Menu builder w/ modifiers, combos
3. KDS
4. Square Online ordering
5. Self-service kiosk
6. Contactless/tap-to-pay
7. Split/merge checks
8. Tipping
9. Square Loyalty
10. Square Gift Cards
11. Inventory tracking
12. Low-stock alerts
13. Multi-location dashboard
14. Team management (staff roles)
15. Timecards
16. Payroll (Square Payroll)
17. Table/course management
18. Open tabs/bar mode
19. Delivery marketplace integration
20. Catering/pre-orders
21. Handheld terminals (Square Terminal)
22. Customer display screen
23. Digital receipts + feedback capture
24. Email/SMS marketing
25. Analytics/reporting suite
26. Vendor/purchase orders
27. Offline payments mode
28. Multi-currency
29. API/developer platform
30. Third-party app marketplace
31. QR-code table ordering
32. Virtual waitlist
33. Cash drawer management

### Screens (30+)
1. POS order grid
2. Modifier/combo selector
3. Bar tab/open tickets view
4. Split check screen
5. Card/cash tender screen
6. Digital receipt/feedback screen
7. KDS ticket queue
8. KDS bump screen
9. Kiosk home/start screen
10. Kiosk category browse
11. Kiosk item customize screen
12. Kiosk cart review
13. Kiosk tap-to-pay screen
14. Kiosk order-number confirmation
15. QR table-ordering menu
16. Online storefront home
17. Online checkout
18. Waitlist/queue screen
19. Table/floor layout editor
20. Staff login/PIN screen
21. Timecard clock-in screen
22. Payroll run screen
23. Inventory count/adjust screen
24. Low-stock alert list
25. Multi-location switcher
26. Sales summary dashboard
27. Item/category performance report
28. Labor report
29. Customer-facing order display
30. Loyalty points screen
31. Gift card balance/redeem screen
32. Marketing campaign builder
33. Settings/roles/permissions
34. App marketplace browse

---

## 3. Food Hall Kiosk Platform (FHKP) — generic multi-vendor food-hall model

Closest structural comp to Food Village POS: many independent vendor booths under one roof, one shared customer kiosk, one shared kitchen/TV board, one central admin.

### Features (30+)
1. Multi-vendor booth catalog on single kiosk
2. Unified cart across vendors (order from N booths in one checkout)
3. Per-vendor menu management (vendor self-serve)
4. Shared KDS routed per-vendor
5. Central admin oversees all vendors
6. Token/queue number generation
7. TV order-status board
8. Vendor commission/revenue split tracking
9. Vendor payout reports
10. Vendor onboarding workflow
11. Central menu approval workflow
12. Promotions/discounts (platform-wide or per-vendor)
13. Order history per customer
14. Guest checkout (no account needed)
15. Kitchen PIN login (fast staff switch)
16. Vendor operating hours/availability toggle
17. Item 86'd (sold out) toggle
18. Real-time order status sync (WS/polling)
19. Admin analytics (cross-vendor sales)
20. Admin finance dashboard
21. Admin audit log
22. Booth/location management
23. Image upload for menu items
24. Role-based access (super admin/vendor/kitchen)
25. Cash-only or mixed payment support
26. Order confirmation w/ animation/receipt
27. Refund/void workflow
28. Peak-hour load management
29. Multi-language kiosk support
30. Session/device management for kiosks
31. Reporting export (CSV)
32. Notification system (order ready alerts)

### Screens (30+)
1. Kiosk welcome/idle screen
2. Vendor booth grid/browse
3. Vendor menu detail screen
4. Item customize/modifier screen
5. Unified cart screen
6. Checkout/payment screen
7. Order confirmation w/ token screen
8. TV display board (all orders)
9. Vendor login screen
10. Vendor dashboard (orders overview)
11. Vendor menu editor list
12. Vendor menu item add/edit form
13. Vendor order queue screen
14. Kitchen PIN login screen
15. Kitchen KDS ticket board
16. Kitchen ticket detail/bump screen
17. Vendor settings/hours screen
18. Vendor operations toggle (open/closed, 86 items)
19. Admin login screen
20. Admin dashboard/overview
21. Admin vendor list/manage screen
22. Admin vendor detail/edit screen
23. Admin orders list (all vendors)
24. Admin order detail screen
25. Admin finance/revenue screen
26. Admin analytics/charts screen
27. Admin promotions manager
28. Admin audit log viewer
29. Admin settings/roles screen
30. Guest order-tracking screen
31. Refund/void confirmation modal
32. Notification/toast alerts overlay

---

## What Food Village POS (this repo) actually has

Derived from repo structure (`backend/src/modules`, `frontend/app`), not assumption.

### Backend modules
`auth`, `menu`, `orders`, `kds`, `vendor`, `vendor-operations`, `sessions`, `admin`

### Frontend routes/screens (18 confirmed)
1. `/order` — vendor browse (kiosk home)
2. `/order/vendors` — vendor list
3. `/order/vendors/[vendorId]` — vendor menu detail
4. `/order/cart` — cart
5. `/order/confirmation` — confirmation
6. `/order/confirmation/[orderId]` — order confirmation w/ token
7. `/vendor/login`
8. `/vendor/dashboard`
9. `/vendor/menu`
10. `/vendor/orders`
11. `/vendor/kitchen` — KDS board
12. `/vendor/operations` — hours/86 toggle
13. `/vendor/settings`
14. `/admin/login`
15. `/admin/dashboard`
16. `/admin/vendors`
17. `/admin/orders`
18. `/admin/finance`
19. `/admin/analytics`
20. `/admin/promotions`
21. `/admin/audit`
22. `/display` — TV board

### Feature count reality check
~22-25 features present (multi-vendor kiosk, unified cart, KDS, token+animation, vendor self-serve menu, admin finance/analytics/promotions/audit, TV board, PIN kitchen login, Supabase auth+storage). **No payment processing** (cash-only by design), **no loyalty**, **no delivery integration**, **no labor/payroll**, **no inventory/recipe costing**, **no table management** (kiosk-only, no dine-in floor plan) — these are deliberate scope cuts vs Toast/Square, which are full-service restaurant suites.

---

## Feature Comparison Matrix

| Feature | Toast | Square | FHKP (generic) | Food Village POS (this repo) |
|---|---|---|---|---|
| Multi-vendor single kiosk | ❌ | ❌ | ✅ | ✅ |
| Unified cart across vendors | ❌ | ❌ | ✅ | ✅ |
| KDS | ✅ | ✅ | ✅ | ✅ |
| TV order board | partial | partial | ✅ | ✅ |
| Token number + animation | ❌ | ❌ | ✅ | ✅ |
| Vendor self-serve menu mgmt | ✅ (single biz) | ✅ (single biz) | ✅ | ✅ |
| PIN kitchen login | ❌ | ✅ | ✅ | ✅ |
| Payment processing | ✅ | ✅ | usually ✅ | ❌ (cash-only) |
| Loyalty | ✅ | ✅ | sometimes | ❌ |
| Delivery integration | ✅ | ✅ | sometimes | ❌ |
| Labor/payroll | ✅ | ✅ | rarely | ❌ |
| Inventory/recipe costing | ✅ | ✅ | rarely | ❌ |
| Table/floor management | ✅ | ✅ | ❌ | ❌ |
| Admin finance dashboard | ✅ | ✅ | ✅ | ✅ |
| Admin analytics | ✅ | ✅ | ✅ | ✅ |
| Promotions | ✅ | ✅ | sometimes | ✅ |
| Audit log | ✅ | ✅ | sometimes | ✅ |
| Vendor commission/payout tracking | ❌ (single biz) | ❌ (single biz) | ✅ | partial (finance module, not confirmed payout-specific) |
| Multi-location/multi-tenant | ✅ | ✅ | ✅ (booths=tenants) | ✅ (booths=tenants) |
| App marketplace/3rd-party integrations | ✅ | ✅ | rarely | ❌ |

**Verdict:** Food Village POS is architecturally closest to FHKP (food-hall multi-vendor kiosk), not Toast/Square (single-business full POS suites). It correctly skips payment/loyalty/delivery/payroll — those are out of scope for a cash-only internal food-court system — but matches or exceeds FHKP on kiosk UX (token animation), KDS, and admin tooling.

---

## Architecture Comparison

### Toast
- Proprietary cloud + on-prem hybrid (Toast terminals run local Android app, sync to cloud).
- Monolith-ish core POS + microservices for reporting/payroll/marketing (acquired products bolted on).
- Payment processing baked in at protocol level (own payment network, EMV certified hardware).
- Offline-first: local SQLite on terminal, syncs when online.

### Square
- Cloud-first, terminal + app hybrid.
- Square's own microservices platform (Square API is public — Catalog, Orders, Payments, Team, Labor, Inventory as separate API domains).
- Offline mode via local cache + Square Terminal firmware.
- Heavy platform-as-a-service angle: 3rd-party apps run via Square App Marketplace.

### FHKP (generic food-hall platforms)
- Usually cloud-only SaaS, multi-tenant DB (tenant = vendor booth) with row-level scoping.
- Single kiosk app talks to central order-routing service that fans out tickets to per-vendor KDS queues.
- Real-time layer (WebSocket/pub-sub) for kiosk→KDS→TV board sync.
- Central admin is a thin layer over the same multi-tenant DB (no separate service).

### Food Village POS (this repo)
- **Frontend:** Next.js 16 App Router (SSR/CSR hybrid), Zustand for client state, Framer Motion for kiosk animations. Single Next.js app serves all 4 portals (order/vendor/admin/display) via route segments — not separate apps.
- **Backend:** NestJS monolith, modular by domain (`auth`, `menu`, `orders`, `kds`, `vendor`, `vendor-operations`, `sessions`, `admin`) — modules are logical boundaries inside one deployable, not separate services.
- **DB:** PostgreSQL via Supabase, Prisma ORM — single schema, vendor scoping done via `vendorId` foreign keys (multi-tenant-by-column, not multi-tenant-by-schema).
- **Auth:** Supabase Auth (email/password) for admin/vendor; separate PIN-based auth for kitchen staff (`sessions` module) — two auth strategies coexisting, closer to FHKP's practical pattern than Toast's single hardware-bound auth.
- **Realtime:** likely polling or Supabase realtime channels for KDS/TV board sync (module `kds` + `display` route) — same category as FHKP's pub-sub layer but lighter weight (BaaS-provided vs custom pub-sub).
- **Storage:** Supabase Storage for menu images — comparable to Toast/Square's managed asset CDN, but via BaaS instead of proprietary CDN.

**Architecture verdict:** This repo is a **single-deployable modular monolith** (Nest backend + Next frontend, both monoliths) built on a **BaaS (Supabase)** instead of custom infra — closest in shape to FHKP's typical SaaS pattern, but simpler: one Postgres schema with FK-based tenancy instead of full multi-tenant isolation, no microservices split (Toast/Square split payroll/reporting/marketing into separate services). This is *appropriate* for scale (10 vendor booths, single food court) — Toast/Square's microservice split solves problems (multi-thousand-location scale, payment PCI isolation) this repo doesn't have.

---

## Flow Comparison

### Customer ordering flow

| Step | Toast | Square | FHKP | Food Village POS |
|---|---|---|---|---|
| 1 | Approach terminal/table | Approach kiosk/table | Approach shared kiosk | Approach kiosk → `/order` |
| 2 | Pick single restaurant menu | Pick single restaurant menu | Browse multiple booths | Browse vendors → `/order/vendors` |
| 3 | Add items, one vendor | Add items, one vendor | Add items across booths to ONE cart | Pick vendor → `/order/vendors/[vendorId]` → add items |
| 4 | Modifiers/customize | Modifiers/customize | Modifiers per booth | Modifiers per item |
| 5 | Single checkout | Single checkout | Unified checkout, tickets split per booth on backend | `/order/cart` → checkout (unified cart, backend splits by vendor via `orders`/`kds` modules) |
| 6 | Pay (card/cash/wallet) | Pay (card/cash/wallet) | Pay (varies) | **Cash only**, no payment step — order placed directly |
| 7 | Receipt + wait | Receipt + wait, buzzer/SMS | Token number issued | `/order/confirmation/[orderId]` — token + animation |
| 8 | Pickup at counter | Pickup at counter/table | Watch TV board, pickup at booth | Watch `/display` TV board, pickup at booth |

**Key difference:** Toast/Square flows are single-vendor per transaction (each restaurant is its own tenant, no cross-vendor cart). Food Village POS and FHKP both support **one cart, multiple vendor tickets** — this is the harder problem (order splitting, per-vendor KDS routing, unified token) and both solve it the same structural way. Food Village POS's cash-only path is actually *shorter* than all three competitors (skips payment step entirely) — fewer failure points, faster kiosk throughput, but requires physical cash handling at pickup/register which the others don't.

### Kitchen/vendor flow

| Step | Toast | Square | FHKP | Food Village POS |
|---|---|---|---|---|
| 1 | Staff badge/PIN login | Staff PIN login | Staff PIN login | PIN login → `/vendor/kitchen` |
| 2 | Ticket appears on KDS | Ticket appears on KDS | Ticket appears on booth's KDS queue | Ticket on KDS board (kds module) |
| 3 | Bump/mark in-progress | Bump/mark in-progress | Bump/mark in-progress | Bump on KDS board |
| 4 | Mark ready → customer notified (buzzer/SMS/screen) | Mark ready → notified | Mark ready → TV board updates | Mark ready → `/display` updates, token called |
| 5 | (separate) inventory/86 update | (separate) inventory/86 update | 86 items via vendor toggle | 86 items via `/vendor/operations` |
| 6 | Shift end → payroll clock-out | Shift end → timecard | Shift end (no payroll usually) | No payroll — PIN session ends (`sessions` module) |

**Key difference:** Toast/Square tie kitchen flow into payroll/labor systems (clock-in ties to wage tracking). Food Village POS and FHKP treat kitchen PIN login as pure session/access control, no labor-cost tracking attached — consistent with both being lighter-weight than full restaurant-suite POS.

### Admin/back-office flow

| Step | Toast | Square | FHKP | Food Village POS |
|---|---|---|---|---|
| 1 | Login → central dashboard | Login → dashboard | Login → central dashboard | `/admin/login` → `/admin/dashboard` |
| 2 | View sales across locations | View sales across locations | View sales across vendor booths | `/admin/orders`, `/admin/analytics` |
| 3 | Manage each location's staff/menu | Manage each location | Manage each vendor booth | `/admin/vendors` |
| 4 | Payroll run | Payroll run | (rare) payout run | `/admin/finance` (revenue, not payroll) |
| 5 | Marketing campaign | Marketing campaign | Promotions per vendor or platform-wide | `/admin/promotions` |
| 6 | Compliance/audit report | Compliance/audit report | Audit trail | `/admin/audit` |

**Key difference:** admin flow shape is nearly identical across all four — this is the most commoditized part of the product. Food Village POS's admin surface (dashboard/vendors/orders/finance/analytics/promotions/audit — 7 sections) matches FHKP's typical scope closely and covers the same ground as Toast/Square's admin minus payroll/labor and marketing-campaign-builder depth.

---

## Summary

Food Village POS is a **scoped-down, purpose-built food-hall kiosk system**, not a general restaurant POS. Compared to Toast/Square (broad, payment-processing, single-business suites with 30+ features each) it deliberately omits payment, loyalty, delivery, payroll, and inventory-costing — correct scope cuts for a cash-only 10-booth internal food court. Compared to the closest structural peer (generic multi-vendor Food Hall Kiosk Platforms), it matches core mechanics 1:1: unified cross-vendor cart, per-vendor KDS routing, token+TV board pickup flow, vendor self-serve menu management, and a 7-section admin back office. Architecturally it trades Toast/Square's microservice/proprietary-infra approach for a simpler two-monolith (Nest + Next) + BaaS (Supabase) stack — right-sized for current scale, with FK-based tenancy instead of full multi-tenant isolation.
