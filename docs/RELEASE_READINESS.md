# Release readiness

Last updated: 2026-07-20

This document is the release evidence for the landing site, merchant client, admin panel,
and backend. A production build is not treated as proof that a workflow is correct.

## Current decision

**Not approved for an unmonitored public-production launch yet.** The repository compiles,
the automated financial/authentication/security checks below pass, and controlled database
rate-card mutations were verified with transaction rollback. Authenticated browser coverage
and real courier/payment/channel operations still need working browser control and provider
sandboxes.

The supplied Railway database was migrated for the additive invoice-preference fields and
seeded with the repository's idempotent demo environment plus Basic B2C provider rate cards.
The rate-card feature CRUD checker and rollback-based before/after pricing checker passed.

## Verified release gates

- Backend TypeScript production build
- Merchant client TypeScript/Vite production build
- Admin React production build
- Landing Vite production build
- Merchant client lint: zero errors (warnings remain documented in command output)
- Admin source lint: zero error-level findings
- Landing lint: zero findings
- Authentication configuration regression checks
- Demo OTP is displayed in the UI only; it is not written to backend or browser logs
- COD collectable-amount guards
- Prepaid and COD wallet debits, including GST and legacy stored-debit compatibility
- Wallet transaction AWB/order linking proof
- Order CSV columns and B2C action wiring proof
- Client and landing production dependency audits: zero known vulnerabilities
- Backend and admin production dependency audits: zero known vulnerabilities
- New OTP users receive wallet, profile, preferences, and Basic B2C/B2B plans idempotently
- Database rate-card/charge edits changed prepaid and COD/GST totals as expected, then rolled
  back and restored the original quote
- Rate-card feature CRUD and international quote checks against the Railway database
- Static client route integrity: 43 routes and 124 route references resolved
- Stored rich text is sanitized on write/read, with executable markup regression coverage

## Defects fixed during this audit

- Restored the missing admin merchant list and merchant-detail routes used by dashboard,
  invoice, wallet, COD, NDR, developer, and order links.
- Fixed undefined `selectedBusinessType` references in the legacy admin rate-card view.
- Fixed missing `Grid` and `FiSend` imports in Developer Logs.
- Fixed conditional Chakra hook calls that could change hook order at runtime.
- Removed demo OTP logging from both backend and browser code while retaining the onscreen
  demo panel.
- Removed database credentials as a fallback JWT-signing secret.
- Added authentication rate limits, security headers, a health endpoint, and JSON 404s.
- Updated non-breaking vulnerable dependencies and added CI release checks.
- Replaced the unmaintained vulnerable XLSX parser with `read-excel-file`.
- Replaced the vulnerable Draft.js editor chain and added server-side rich-text sanitization.
- Fixed dead merchant links for pickup management and COD remittance.

## Required transactional E2E matrix

Each scenario must verify database state, API response, visible UI, downloadable artifacts,
and rollback/cleanup. `Pending` means it has not been claimed as passed.

| Area | Required variants | Status |
| --- | --- | --- |
| Authentication | email OTP, resend, expiry, invalid OTP, suspended user, refresh, logout, admin login, rate limits | API lifecycle passed; browser/admin variants pending |
| Onboarding | every business type, required/optional fields, back/next, persistence, resume | Pending |
| B2C order | prepaid/COD, manual/channel order, weight boundaries, volumetric weight, every enabled courier, failed booking rollback | Pending |
| B2B order | prepaid/COD/FOD/FOP, piece counts, slabs, zones, ODA, ROV, diesel, holiday, green tax, handling, minimum charge | Pending |
| International order | saved/new pickup, documents, validation, rate and booking failure | Pending |
| Rate card | create/edit/import/export/delete, per plan/courier/mode/zone, slab boundaries and extra slabs | Feature CRUD passed; browser/import/export matrix pending |
| Rate propagation | rate edit before/after calculator, courier selection, prepaid wallet debit, COD charge, GST, label, invoice | DB quote and wallet math passed; browser/label/invoice pending |
| Additional charges | flat/percent/min/max, applicability conditions, enable/disable, before/after quote | DB CRUD and quote change passed; full variant matrix pending |
| Orders | search/filter/sort/paginate/export, manifest, label, invoice, tracking, status sync, cancel, NDR, RTO | Pending |
| Wallet | recharge, debit, refund/rollback, filters/export, AWB link, insufficient balance | Pending |
| Invoices | preferences, generation, download, disputes, payments, COD offsets, adjustments | Pending |
| COD remittance | payable report, CSV preview/confirm, manual settle, notes, export, duplicate protection | Pending |
| Weight reconciliation | discrepancy, accept/reject/bulk, dispute, admin approve/reject, wallet effect | Pending |
| Pickups | create/edit/import/export, provider registration success/failure, duplicate/default handling | Pending |
| Labels | every size/orientation/field/barcode/logo setting and bulk generation | Pending |
| Channels | Shopify/WooCommerce connect, import, webhook create/update/cancel, token failure, disconnect | Pending external sandboxes |
| Couriers | credentials, enable/disable, serviceability, priority, live rate, booking, cancel, tracking, POD | Pending provider sandboxes |
| Support | create/list/detail/update ticket and admin response/status/filter | Pending |
| Profile/KYC/bank/team | validation, upload, verification, permissions, suspend/reactivate | Pending |
| Public tools | tracking, rate calculator, policies, contact, landing calculators and responsive layouts | Pending browser pass |
| Admin configuration | plans, zones/mappings, couriers, payment options, billing preferences, holidays, diesel, static content | Pending |
| Developer operations | filters, assignment, resolve/reopen, retry, live logs, Shopify credentials | Pending |

## Route coverage inventory

Merchant/public routes include authentication, onboarding, dashboard/home, B2C/B2B/
international orders, pickup addresses, wallet, invoices, rate card/calculator, tracking,
labels, invoice preferences, team management, courier priority, API integration, channels,
profile/company/bank/KYC, reports, support, COD remittance, weight reconciliation, NDR/RTO,
policies, Shopify install, and public tracking.

Admin routes include dashboard, orders, merchant list/detail, NDR/RTO, rate cards and plans,
additional charges, diesel, holidays, couriers and credentials, service providers,
serviceability, zones/mappings, invoices and billing preferences, COD remittance, wallets,
weight discrepancies/disputes, rate calculators, tracking, API integration, static content,
support, payment options, password change, notifications, and developer operations.

## Known release blockers and residual risks

- Demo OTP currently defaults on by explicit product direction. Set
  `DEMO_AUTH_SHOW_OTP=false` before a public production launch.
- The admin and client bundles remain large and should be performance-tested on low-end/mobile
  devices.
- In-app Chrome control was unavailable during this run, so authenticated click-every-control
  browser evidence is incomplete even though static route and API checks passed.
- Live courier, payment, email, object-storage, Shopify, and WooCommerce checks require valid
  sandbox credentials and must not be executed against real merchant/provider accounts.
- Database migrations are split between Drizzle and standalone SQL/runtime compatibility DDL;
  migration order and a fresh-database restore must be rehearsed before release.

## Release rule

Do not tag, deploy, or describe the site as fully production-ready until every applicable row
in the transactional matrix has evidence and all blockers above are either fixed or explicitly
accepted by the release owner.
