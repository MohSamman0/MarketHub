# Verification record

Verified locally on Windows and in GitHub Actions on 29 September 2026.

## Executed and passed

- Angular optimized production build with strict TypeScript and strict Angular templates. Initial JavaScript/CSS total: approximately 322 kB raw, 88 kB estimated compressed. Feature pages are separate lazy-loaded chunks.
- ASP.NET Core build: zero errors and zero warnings.
- Windows x64 self-contained publish, including the runtime and local frontend assets.
- Launch through `Start-Demo.ps1` on a separate port, with a newly created persistent SQLite database.
- Final packaged application restarted successfully at `http://127.0.0.1:5080`; health returned 200, anonymous orders returned 401 Problem Details, and an unknown API route returned 404 Problem Details.
- **18 xUnit test cases** against relational in-memory SQLite: currency arithmetic, delivery threshold, valid/invalid fulfillment transitions, price snapshots, stock reservations, idempotency, changed-payload conflicts, duplicate lines, suspended-store checkout rejection, payment retries, stock restoration, stale-write concurrency, and the loaded native SQLite version meeting the CVE-2025-6965 fix threshold.
- **22 real HTTP integration checks**, also repeated against the self-contained release: catalog data, authentication, roles, seller ownership, customer ownership, Origin rejection, checkout totals, idempotency, nested input validation, stock reservation/restoration, English/Arabic search, refresh-token rotation, replay rejection, logout, and admin audit data.
- **4 Playwright browser tests** passed in the complete [GitHub Actions run](https://github.com/MohSamman0/MarketHub/actions/runs/36535409085): Arabic/mobile layout persistence, customer checkout and reload, seller product editing, and protected administration navigation. Angular build, backend tests, API build, and HTTP checks also passed in that run.
- Updated native SQLite to `SQLitePCLRaw.lib.e_sqlite3` 2.1.13 and OpenAPI to `Microsoft.OpenApi` 2.7.5. The full-solution NuGet audit, including transitive dependencies, reported no known vulnerable packages from nuget.org. Warnings remain errors; no audit warnings were suppressed.
- Rebuilt the self-contained Windows demo with the patched dependencies; verified API checks and OpenAPI document generation, then restarted the presentation demo while preserving its database.

## Browser workflows exercised

- English desktop catalog and product artwork.
- Arabic language switching and reload persistence.
- Arabic storefront at 390 × 844; no document-level horizontal overflow.
- Arabic seller dashboard at 390 × 844; no document-level horizontal overflow. Preview images are saved in `docs/screenshots`.
- Seller sign-in, database-backed dashboard, inventory table, bilingual product edit, successful stock save and confirmation.
- Customer shopping bag, protected checkout redirect, sign-in return URL, delivery-form validation, order creation, successful simulated payment, and paid-order/session persistence after reload.
- Administration sign-in and overview, vendor controls, and audit trail.
- Explicitly approved suspension and re-approval of the fictional Sound Society seller; the admin UI showed both state changes and both audit events. The seller was restored to Approved.

## Included but not claimed as executed

- SQL Server runtime and Docker Compose. Provider-specific migrations are included; local persistence testing used SQLite.
- The SQL Server idempotent schema script was generated successfully, but not executed against SQL Server.
- External Stripe test sessions/webhooks with real provider credentials. The default demo adapter was tested instead.
- Internet-facing deployment, penetration testing, distributed load testing, formal WCAG conformance, disaster recovery, live payments, and seller payouts.

Development integration tests create sample orders. Do not run them against a live customer database.
