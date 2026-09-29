# Operations and configuration

## Local presentation

`Start-Demo.cmd` runs the self-contained Windows x64 release. Its SQLite data and locally generated development signing key live under `demo/windows/App_Data`. Keep that directory to preserve changes. The launcher writes logs under `demo/logs` and only binds to loopback.

If port 5080 is occupied, run `Start-Demo.ps1 -Port 5082`. If another MarketHub process is already healthy on the selected port, the launcher opens it instead of starting a duplicate. `Stop-Demo.ps1` can stop only the process started by the launcher, not an unrelated development server.

## Configuration keys

- `ASPNETCORE_ENVIRONMENT`: `Development` for the local demo; production disables the simulator and sample seeding.
- `ASPNETCORE_URLS`: bind address; local default is `http://127.0.0.1:5080`.
- `PublicOrigin`: exact frontend origin, without a trailing slash. Used for auth Origin checks and Stripe return URLs.
- `Database__Provider`: `Sqlite` or `SqlServer`.
- `ConnectionStrings__Default`: database connection string.
- `Jwt__Key`: random secret of at least 48 characters. Development generates one locally; Production fails startup when it is missing.
- `Jwt__Issuer` and `Jwt__Audience`: default `MarketHub` and `MarketHub.Web`.
- `Payments__Provider`: `Demo` or `Stripe`.
- `Stripe__SecretKey`: your `sk_test_…` key, never a live key.
- `Stripe__WebhookSecret`: your signing secret for the configured test webhook.
- `SeedDemoData`: only allowed in Development.
- `AllowedHosts`: set explicitly to the hostnames of any deployed environment.

Use environment variables or a secrets manager for secrets. Do not commit `.env`, credentials, databases, generated signing keys, or logs.

## SQL Server

The checked-in SQL Server migration assembly has SQL Server types and identity annotations. The SQLite migration assembly is separate; do not apply SQLite-generated migrations to SQL Server.

`sql-server-schema.sql` is an idempotent SQL script generated from the SQL Server migration. It is useful for reviewing tables, relationships, and indexes without a running SQL Server instance.

For the supplied local Docker option, copy `.env.example` to `.env` and choose strong local values, review the SQL Server image's terms, then run:

```sh
docker compose up --build
```

The API waits for SQL Server to be healthy. In Development it applies the SQL Server migrations and creates the sample catalog. The web port is bound to `127.0.0.1`; the database has no published host port. This configuration is for local evaluation, not a production deployment. Docker and SQL Server were not run on the author's local verification machine.

To apply production migrations deliberately, configure the target provider and connection string, restore the EF tool, then run:

```powershell
dotnet tool restore
$env:Database__Provider = 'SqlServer'
$env:ConnectionStrings__Default = '<your connection string>'
$env:Jwt__Key = '<your generated secret>'
$env:Payments__Provider = 'Stripe'
dotnet ef database update --project backend/MarketHub.Migrations.SqlServer --startup-project backend/MarketHub.Api
```

Review generated SQL and back up the target database before production schema changes. The running Production API does not auto-migrate or auto-seed. Provision the initial administrator through your controlled administrative provisioning process; public registration always creates a Customer.

## Stripe test mode

Run from source with `Payments__Provider=Stripe`, your test secret key, and a webhook signing secret. `Start-Demo.ps1` intentionally forces the simulator; it is for offline presentations.

Configure Stripe CLI forwarding or a reachable HTTPS test endpoint for `/api/payments/stripe/webhook`. Subscribe to:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Place an order and select **Open secure test checkout**. The API creates the hosted session using the already persisted server-calculated total and the order ID as Stripe's idempotency key. The browser never supplies a card number to MarketHub.

Webhook requests must pass a timestamped HMAC signature check. Paid events also verify the exact total and `sar` currency. Payment completion and stock restoration are idempotent through the stored payment state and database concurrency checks. Existing Stripe reservations are released on a signed expiry/failure event. Orders that never start payment expire locally after 30 minutes.

External Stripe execution requires credentials and was not verified in this delivery. This implementation has no Connect accounts, split transfers, seller payouts, refunds, or live-card processing. Do not switch it to live money without implementing and reviewing those business flows.

## Before a public launch

- Place the API behind correctly configured HTTPS hosting. Configure trusted proxies explicitly before enabling forwarded headers; do not trust arbitrary forwarding headers.
- Replace the Development environment, simulator, and seed accounts. Supply an external JWT secret; rotate keys through a planned session-expiration process.
- Use a least-privilege database account, backups, restore drills, and controlled migration deployment.
- Protect Data Protection keys using a deployment-appropriate encrypted store. The local demo stores them under `App_Data`.
- Add email verification and account recovery, operational monitoring, payment reconciliation, and durable jobs/outbox processing.
- Add request/body limits and abuse controls appropriate to traffic. Existing auth rate limiting is per-process/per-IP and is not a distributed limiter.
- Validate tax, invoicing, shipping and returns requirements with the actual business. The demonstration's fixed 15% tax and shipping threshold are illustrative rules.
- Conduct penetration, accessibility, load, failure-recovery, SQL Server, and payment-provider integration testing.

## API conventions

API routes are under `/api`. The catalog is public; orders require authentication; seller routes require Vendor; admin routes require Admin. Success returns typed JSON, creation returns 201 and a Location, and state updates return 204 where appropriate. Errors use Problem Details with a machine-readable `code` for business failures and a trace identifier for troubleshooting. Validation failures include field errors.

`GET /api/health` checks database connectivity. Development exposes the generated API contract at `/openapi/v1.json`. API responses use `Cache-Control: no-store`. No permissive cross-origin CORS policy is enabled.

## References

- Angular version compatibility: https://angular.dev/reference/versions
- Angular standalone routing: https://angular.dev/guide/routing
- ASP.NET Core authentication: https://learn.microsoft.com/aspnet/core/security/authentication/
- EF Core concurrency: https://learn.microsoft.com/ef/core/saving/concurrency
- Stripe hosted Checkout: https://docs.stripe.com/payments/checkout
- Stripe webhook signatures: https://docs.stripe.com/webhooks/signature
