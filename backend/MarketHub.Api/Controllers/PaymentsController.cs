using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MarketHub.Application;
using MarketHub.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketHub.Api.Controllers;

[ApiController, Route("api/payments")]
public sealed class PaymentsController(AppDbContext db, OrderService service, IConfiguration config) : ControllerBase
{
    [HttpPost("stripe/webhook"), RequestSizeLimit(262144)]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        var secret = config["Stripe:WebhookSecret"];
        if (string.IsNullOrEmpty(secret))
            return StatusCode(503);
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync(ct);
        var parts = Request.Headers["Stripe-Signature"].ToString().Split(',');
        var timestamp = parts.FirstOrDefault(x => x.StartsWith("t="))?[2..];
        if (!long.TryParse(timestamp, out var seconds) || Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - seconds) > 300)
            return BadRequest();
        var expected = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes($"{timestamp}.{body}"));
        var valid = parts.Where(x => x.StartsWith("v1=")).Any(x => { try { return CryptographicOperations.FixedTimeEquals(expected, Convert.FromHexString(x[3..])); } catch (FormatException) { return false; } });
        if (!valid)
            return BadRequest();
        using var json = JsonDocument.Parse(body);
        var type = json.RootElement.GetProperty("type").GetString();
        if (type is not ("checkout.session.completed" or "checkout.session.expired" or "checkout.session.async_payment_succeeded" or "checkout.session.async_payment_failed"))
            return Ok();
        var session = json.RootElement.GetProperty("data").GetProperty("object");
        if (!session.TryGetProperty("metadata", out var metadata) || !metadata.TryGetProperty("orderId", out var idValue) || !Guid.TryParse(idValue.GetString(), out var id))
            return BadRequest();
        var order = await db.Orders.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (order == null || order.PaymentProvider != "Stripe")
            return BadRequest();
        if (order.PaymentSessionId != null && order.PaymentSessionId != session.GetProperty("id").GetString())
            return BadRequest();
        if (type is "checkout.session.expired" or "checkout.session.async_payment_failed")
            await service.Complete(order, false, Guid.Empty, ct);
        else if (session.GetProperty("payment_status").GetString() == "paid")
        {
            if (session.GetProperty("amount_total").GetInt32() != order.Total || session.GetProperty("currency").GetString() != "sar")
                throw new BusinessException(400, "payment_mismatch", "Payment amount mismatch.");
            await service.Complete(order, true, Guid.Empty, ct);
        }
        return Ok();
    }
}
