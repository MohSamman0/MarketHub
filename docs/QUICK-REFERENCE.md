# Before your interview

1. Double-click **Start-Demo.cmd**. Open **http://127.0.0.1:5080**.
2. Click **Sign in**, choose a demo role, then click **Sign in** again.
3. Use **Customer** to shop, **Vendor** to manage Form & Function, and **Admin** for seller approvals.
4. The shared demo password is **MarketHub!2026**. Account emails appear when you click a role.
5. Show **العربية** to demonstrate Arabic and right-to-left layout.
6. Checkout phone: **+966500000000**. Address: **King Fahd Road, Al Olaya, Building 24**. These are fictional demo delivery details.
7. Select **Simulate successful payment** to finish checkout. No money moves.

## The explanation to remember

**Angular screen → API service → JWT interceptor → ASP.NET controller → EF-backed order service → relational database.**

- The client sends product IDs and quantities, not trusted prices.
- The backend checks stock and seller approval, snapshots prices, calculates totals, and reserves inventory in a transaction.
- Repeating the same checkout key returns the same order.
- Each seller can only change their own products and fulfillment lines.
- A failed demo payment restores stock exactly once.
- Short-lived access tokens live in memory; a hashed, rotated refresh session restores login after reload.

## What to call this version

“A working, production-style implementation of the marketplace workflows, with an offline demo environment.”

Do not call it a live commercial deployment. Stripe test-mode configuration and SQL Server migrations are included, but external Stripe and SQL Server execution were not verified here. Read `INTERVIEW-GUIDE.md` for the deeper explanation and `VERIFICATION.md` for the test record.
