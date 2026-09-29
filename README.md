# MarketHub

A bilingual multi-vendor marketplace built with Angular 22, NgRx SignalStore, ASP.NET Core 10, and Entity Framework Core. This is a working application with a persistent database, not a frontend mockup.

## Run the interview demo

**Double-click `Start-Demo.cmd`, then open http://127.0.0.1:5080.**

The downloadable complete demo archive includes a Windows x64 package containing the .NET runtime, compiled Angular application, product artwork, and fonts. No SDK, Node installation, database server, or internet connection is required to present that package. The first launch creates the local SQLite database and development signing key. Subsequent launches preserve your changes.

**Cloned this repository?** Generated executables are excluded from Git. Follow **Develop from source** below, or **Publish a new Windows demo** to create `demo/windows` before using the launcher.

If PowerShell asks you to inspect the script, its readable source is `Start-Demo.ps1`. It starts only the bundled MarketHub executable on loopback, saves its process ID, and opens your browser. `Stop-Demo.ps1` stops only the matching launcher-managed executable and preserves the database.

Alternative port: `powershell -File .\Start-Demo.ps1 -Port 5082`.

### Sample accounts

On the sign-in page, select **Customer**, **Vendor**, or **Admin** to fill the credentials, then press **Sign in**.

- Customer: `customer@markethub.demo`
- Vendor: `vendor@markethub.demo` — Form & Function
- Second vendor: `vendor2@markethub.demo` — Sound Society
- Administrator: `admin@markethub.demo`
- Shared sample password: `MarketHub!2026`

These fictional `.demo` accounts are seeded only in Development. Payments in the default demo are explicitly simulated and never charge money.

## What works

- English/Arabic switch, persistent language preference, RTL/LTR layout, localized money and dates.
- Responsive catalog, bilingual search, category filters, price sorting, server pagination, stock indicators, product details.
- Persistent shopping bag with quantity controls, sign-in return navigation, validated delivery details.
- Server-priced checkout, 15% illustrative VAT, delivery threshold, inventory reservations, idempotent order creation.
- Successful/declined demo payments, paid order history, item-by-item fulfillment tracking.
- Seller overview with database-backed revenue, order metrics, low-stock alerts, bilingual product creation/editing, publish/hide controls, stock management, shipping and delivery transitions.
- Admin overview, vendor approval/suspension, audit history.
- Customer registration, password hashing, short-lived JWT access tokens, rotating refresh sessions, login throttling and account lockout.
- API-enforced roles, seller ownership, customer order ownership, optimistic concurrency, structured errors, relational constraints and provider-specific migrations.
- A Stripe **test-mode** hosted-checkout adapter with signature-checked webhooks and total/currency verification. Requires your own Stripe test credentials; not required for the local demo.

## Repository map

```text
MarketHub.slnx
backend/
  MarketHub.Domain/                Entities and pure commerce rules
  MarketHub.Application/           Request/response contracts and payment interface
  MarketHub.Infrastructure/        EF context, checkout orchestration, payment adapters, seed data
  MarketHub.Migrations.SqlServer/  SQL Server-specific migrations
  MarketHub.Api/                   HTTP controllers, JWT setup, error handling, reservation worker
frontend/
  src/app/core/                    API client, authentication, i18n, NgRx shopping bag
  src/app/shared/                  Reusable icons and product cards
  src/app/features/                Lazy-loaded feature pages
  src/environments/               Same-origin API configuration
  public/                         Local product artwork and fonts
  e2e/                            Playwright browser tests
tests/
  MarketHub.Tests/                 xUnit tests using relational in-memory SQLite
  api-smoke.mjs                    Real HTTP integration checks
docs/                             Interview, architecture and operational guides
```

## Develop from source

Use Node 24.15+ and the .NET 10 SDK. Angular and TypeScript versions are pinned in `frontend/package-lock.json`.

```powershell
dotnet restore MarketHub.slnx
dotnet tool restore
cd frontend
npm ci
npm start
```

In a second terminal, from the repository root:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:ASPNETCORE_URLS = 'http://127.0.0.1:5080'
$env:PublicOrigin = 'http://127.0.0.1:4200'
cd backend/MarketHub.Api
dotnet run --no-launch-profile
```

Open http://127.0.0.1:4200. Angular proxies `/api` to port 5080. For a same-origin published build, set `PublicOrigin` to that host instead. Use **127.0.0.1 consistently**; mixing it with `localhost` changes cookie origins.

The API automatically applies migrations and seeds sample data in Development. It does neither in Production. No credentials or signing keys are committed; the sample password is public demonstration data.

### Build and test

```powershell
dotnet build MarketHub.slnx
dotnet test tests/MarketHub.Tests
cd frontend
npm run build
npx playwright install chromium
npm run test:e2e
```

The API must already be running in Development on port 5080 for browser tests and the following HTTP checks:

```powershell
node tests/api-smoke.mjs http://127.0.0.1:5080
```

Tests create development records; run them against a disposable development database, not customer data. See `docs/VERIFICATION.md` for exactly what was executed locally.

### Publish a new Windows demo

```powershell
cd frontend
npm ci
npm run build
cd ..
New-Item -ItemType Directory -Force backend/MarketHub.Api/wwwroot
Copy-Item frontend/dist/markethub/browser/* backend/MarketHub.Api/wwwroot -Recurse -Force
dotnet publish backend/MarketHub.Api -c Release -r win-x64 --self-contained true -o demo/windows
```

Stop the existing demo before replacing executable files. Build into a fresh package directory for a release so obsolete hashed frontend assets do not accumulate. Keep the current database outside a replacement release directory when deploying a real service.

## SQL Server and operations

SQLite makes the presentation self-contained. SQL Server uses the same EF model with a separate migration assembly. `docker-compose.yml` provides a local SQL Server option; it has not been exercised on this machine. See `docs/OPERATIONS.md` for setup and payment configuration.

This is a complete interview demonstrator for the implemented workflows. A public commerce launch still requires operational services and business integrations: email verification/recovery, a shipping carrier, refunds/returns, merchant onboarding and payouts, tax/invoice compliance, monitoring, backups, and external security/load testing. The Stripe adapter deliberately rejects live keys. It does not implement Stripe Connect seller payouts.

Read `docs/INTERVIEW-GUIDE.md` first if your interview is today.
