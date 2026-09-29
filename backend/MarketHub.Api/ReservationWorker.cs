using MarketHub.Infrastructure;
using Microsoft.EntityFrameworkCore;

public sealed class ReservationWorker(IServiceScopeFactory scopes, ILogger<ReservationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var service = scope.ServiceProvider.GetRequiredService<OrderService>();
                // Created Stripe sessions are released only by signed expiry webhooks.
                // Abandoned orders that never started a payment session can expire locally.
                var cutoff = DateTime.UtcNow.AddMinutes(-30);
                var stale = await db.Orders.Include(x => x.Items).Where(x => x.PaymentStatus == "Pending" && (x.PaymentProvider == "Demo" || x.PaymentSessionId == null) && x.CreatedAt < cutoff).Take(100).ToListAsync(stoppingToken);
                foreach (var order in stale)
                    await service.Complete(order, false, Guid.Empty, stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested) { logger.LogWarning(ex, "Could not expire reservations; will retry."); }
        }
    }
}
