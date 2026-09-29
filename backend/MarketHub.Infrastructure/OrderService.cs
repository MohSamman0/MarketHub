using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MarketHub.Application;
using MarketHub.Domain;
using Microsoft.EntityFrameworkCore;

namespace MarketHub.Infrastructure;

public sealed class OrderService(AppDbContext db, IPaymentGateway payments)
{
    public async Task<Order> Checkout(Guid userId, CheckoutRequest request, string key, CancellationToken ct)
    {
        if (key.Length is < 8 or > 80)
            throw new BusinessException(400, "idempotency_required", "An Idempotency-Key of 8–80 characters is required.");
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(request))));
        var existing = await db.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.UserId == userId && x.IdempotencyKey == key, ct);
        if (existing != null)
        {
            if (existing.RequestHash != hash)
                throw new BusinessException(409, "idempotency_conflict", "This checkout key belongs to a different request.");
            return existing;
        }
        if (request.Items.Select(x => x.ProductId).Distinct().Count() != request.Items.Count)
            throw new BusinessException(400, "duplicate_product", "Each product must appear only once.");
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var ids = request.Items.Select(x => x.ProductId).ToArray();
        var products = await db.Products.Include(p => p.Vendor).Where(x => ids.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);
        var order = new Order
        {
            UserId = userId,
            Number = $"MH-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}",
            IdempotencyKey = key,
            RequestHash = hash,
            Recipient = request.Recipient.Trim(),
            Phone = request.Phone.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            PaymentProvider = payments.Provider
        };
        foreach (var line in request.Items)
        {
            if (!products.TryGetValue(line.ProductId, out var p) || !p.Active || !p.Vendor.Approved)
                throw new BusinessException(409, "product_unavailable", "A product is no longer available.");
            if (line.Quantity is < 1 or > 20 || p.Stock < line.Quantity)
                throw new BusinessException(409, "insufficient_stock", $"Insufficient stock for {p.NameEn}.");
            p.Stock -= line.Quantity;
            p.Version++;
            order.Items.Add(new OrderItem { ProductId = p.Id, VendorId = p.VendorId, NameEn = p.NameEn, NameAr = p.NameAr, Image = p.Image, UnitPrice = p.Price, Quantity = line.Quantity });
        }
        var subtotal = order.Items.Sum(x => (long)x.UnitPrice * x.Quantity);
        if (subtotal > 100000000)
            throw new BusinessException(400, "order_limit", "The order exceeds the supported transaction limit.");
        order.Subtotal = (int)subtotal;
        (order.Shipping, order.Tax, order.Total) = CommerceRules.Calculate(order.Subtotal);
        db.Orders.Add(order);
        db.AuditEvents.Add(new AuditEvent { ActorId = userId, Action = "Order created", Detail = order.Number });
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return order;
    }

    public async Task<PaymentResult> StartPayment(Order order, CancellationToken ct)
    {
        if (order.PaymentStatus != "Pending")
            throw new BusinessException(409, "payment_state", "This order is no longer awaiting payment.");
        if (order.PaymentSessionId == null && order.CreatedAt < DateTime.UtcNow.AddMinutes(-30))
            throw new BusinessException(409, "payment_expired", "The payment reservation has expired. Place a new order.");
        if (order.PaymentUrl != null)
            return new PaymentResult(order.PaymentUrl, order.PaymentSessionId);
        var session = await payments.CreateSession(order, ct);
        order.PaymentSessionId = session.SessionId;
        order.PaymentUrl = session.Url;
        order.Version++;
        await db.SaveChangesAsync(ct);
        return session;
    }

    public async Task Complete(Order order, bool success, Guid actorId, CancellationToken ct)
    {
        if (order.PaymentStatus != "Pending")
            return; // webhook and demo retries are idempotent
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        order.PaymentStatus = success ? "Paid" : "Cancelled";
        order.Version++;
        if (!success)
        {
            foreach (var item in order.Items)
            {
                var p = await db.Products.SingleAsync(x => x.Id == item.ProductId, ct);
                p.Stock += item.Quantity;
                p.Version++;
                item.Status = "Cancelled";
                item.Version++;
            }
        }
        db.AuditEvents.Add(new AuditEvent { ActorId = actorId, Action = success ? "Payment confirmed" : "Reservation released", Detail = order.Number });
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }
}
