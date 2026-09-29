# MarketHub interview walkthrough

## Your 60-second introduction

“MarketHub is a bilingual marketplace for independent sellers. Customers discover products, check out, and track each item. Sellers manage their own inventory and fulfillment. Administrators manage seller approval.

“I used Angular for feature-based screens and state management, and ASP.NET Core for authenticated APIs and business rules. Entity Framework Core persists the relationships. The local presentation uses SQLite so it is reliable offline; there is a SQL Server configuration with its own migrations.

“The important boundary is that the browser is never trusted for price, stock, role, or ownership. The API calculates totals, reserves inventory transactionally, and checks authorization on every protected action.”

Use this as a description of the code you are demonstrating. Be ready to explain the actual implementation rather than implying an unverified production history.

## A focused 8-minute demonstration

1. **Catalog, 1 minute.** Open MarketHub, filter Workspace, search for “lamp,” open a product. Switch to Arabic to show that layout, product content, dates, and amounts change together. Return to English.
2. **Checkout, 2 minutes.** Add the Linea lamp and Arc headphones. Open the bag. Sign in as Customer when checkout redirects you. Enter the fictional phone `+966500000000` and address `King Fahd Road, Al Olaya, Building 24`. Place the order. Point out that the confirmed total is calculated by the server. Click **Simulate successful payment**. Explain that it is a development payment adapter, not a real charge.
3. **Seller workflow, 2 minutes.** Sign out, then sign in as Vendor. Show the metrics and inventory. Edit the lamp stock or description, save, then show Orders. Mark the lamp item shipped. Explain that the seller sees only their own order lines even when an order includes other sellers.
4. **Tracking, 1 minute.** Return as Customer and open the latest order. Show the lamp’s updated state while the headphones remain in their own fulfillment state.
5. **Admin, 1 minute.** Sign in as Admin. Show vendor approvals and the audit trail. Suspending a seller hides their catalog and prevents new sales and seller writes. Re-enable the store after demonstrating.
6. **Architecture, 1 minute.** Open the files below and trace one checkout request. Mention the tests for stock, ownership, duplicate orders, and token rotation.

Keep a second browser tab on the seller dashboard if that helps, but use separate browser profiles for simultaneous roles: the HttpOnly session cookie is shared between tabs on the same origin.

## Five files to understand first

1. `frontend/src/app/core/auth.service.ts`: login, in-memory access token, refresh-cookie session restore, interceptor and route guards.
2. `frontend/src/app/features/checkout/checkout.page.ts`: reactive form, product IDs/quantities, and idempotency key sent to the API.
3. `backend/MarketHub.Api/Controllers/OrdersController.cs`: authenticated routes and current-user ownership.
4. `backend/MarketHub.Infrastructure/OrderService.cs`: server prices, transaction, stock reservation, snapshots, payment transitions.
5. `backend/MarketHub.Infrastructure/AppDbContext.cs`: relationships, unique indexes, and concurrency tokens.

## How does Angular communicate with ASP.NET?

Feature components call a typed `Api` service. It wraps Angular `HttpClient` and returns promises using RxJS `firstValueFrom`. The HTTP interceptor attaches the JWT to same-origin API requests. HTTP routes accept validated DTOs and return explicit response projections rather than exposing entity graphs or password hashes.

Each feature is a lazy-loaded standalone component. Most components use OnPush. Signals hold local view state. NgRx SignalStore owns the shopping bag and computed totals. The bag is cached locally for convenience; checkout always revalidates it on the server.

## How does authentication work?

1. The API checks a password using ASP.NET's PBKDF2-based `PasswordHasher`.
2. It issues a 15-minute signed JWT containing the user ID and role. Vendors also have a vendor ID claim.
3. Angular holds that access token only in memory.
4. A separate random refresh secret is stored in an HttpOnly, SameSite=Strict cookie. Only its SHA-256 hash is stored in the database.
5. Refresh revokes the old session token and issues a new one. Reloading the page restores the session through refresh.
6. The API verifies signature, issuer, audience, and expiration. Controllers also check role and resource ownership.
7. Logout revokes the refresh session and clears the cookie. Already issued access JWTs remain valid until their short expiration; immediate universal access-token revocation is a future enhancement.

The cookie endpoints require a custom header and reject foreign Origins. Production cookies require HTTPS. Client route guards improve navigation; server authorization is the actual security boundary.

## How is the database structured?

- **Users**: identity, password hash, role, optional vendor association, lockout information.
- **Vendors**: bilingual store name, city, approval status.
- **Products**: vendor association, bilingual content, category, artwork, integer price, stock, visibility, version.
- **Orders**: customer association, immutable checkout address and totals, payment state, idempotency key.
- **OrderItems**: product and seller references plus snapshots of names, unit prices and quantities. Each item has its own fulfillment state.
- **RefreshSessions**: hashed token, expiry, revocation state.
- **AuditEvents**: actor, operation, target detail, timestamp.

Historical order snapshots do not change when a seller edits a product. Prices use integer halalas to avoid floating-point rounding errors. A unique customer/idempotency-key index prevents duplicate checkout records. Version columns detect conflicting edits.

## Why this architecture?

It is a pragmatic layered monolith: one API and one relational database, separated into projects by responsibility. Domain and Application do not depend on EF or HTTP. Infrastructure contains EF-backed orchestration and adapters; the API composes everything.

This is intentionally not a strict ports-and-adapters implementation: read-only controllers query EF directly for concise projections, and checkout orchestration lives beside its EF transaction. That keeps this project's important rules visible without adding generic repositories, a mediator, microservices, or an event bus before they are needed.

## Good technical questions and honest answers

**What prevents overselling?** A transaction surrounds the stock check and reservation. The version column is also a concurrency token. A stale update fails instead of silently replacing the latest inventory. Multi-instance load and SQL Server contention still need load testing before launch.

**What if the user clicks checkout twice?** A checkout key identifies the request. The API stores a hash of its payload. The same key and body returns the same order; reusing the key for different details returns a conflict. The database enforces uniqueness too.

**What if payment fails?** The development adapter marks the order cancelled and restores stock in a transaction. Replaying the callback does not restore it twice. Successful payment cannot be overwritten by a later failure replay.

**What about Stripe?** The adapter uses hosted Checkout in test mode. A signed webhook validates timestamp, amount and currency before marking an order paid. A redirect alone cannot mark it paid. No real credentials were supplied, so an external Stripe session has not been exercised here.

**How does RTL work?** The language service changes the root `lang` and `dir`, and CSS uses logical spacing and alignment properties. Labels and product fields exist in both languages, and `Intl` formats dates and money. Some seller-entered names, addresses, and audit details remain in their original language.

**Why no virtual scrolling?** The storefront renders one server-paginated page of 12 products. Virtual scrolling adds little at that size. Seller lists are bounded for this demo; larger datasets should get server pagination rather than loading all rows.

**How does this relate to the CV's tooling?** This is a refreshed implementation of MarketHub's described workflows. It uses current standalone Angular routes and NgRx SignalStore. The included test tools are xUnit, HTTP integration checks, and Playwright, rather than the CV's Jasmine/Karma/Cypress stack. Do not claim those older test suites are present in this repository.

**What would you do next for production?** Email verification/recovery, a managed identity strategy, real vendor onboarding/payouts, refunds, delivery integration, compliant invoicing, background jobs with durable retries, rate limits at the edge, backups and observability. Scale only after profiling real demand.
