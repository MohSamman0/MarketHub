using System.Net.Http.Headers;
using System.Text.Json;
using MarketHub.Application;
using MarketHub.Domain;
using Microsoft.Extensions.Configuration;

namespace MarketHub.Infrastructure;

public sealed class DemoPaymentGateway : IPaymentGateway
{
    public string Provider => "Demo";
    public Task<PaymentResult> CreateSession(Order order, CancellationToken ct) => Task.FromResult(new PaymentResult(null, $"demo_{order.Id:N}"));
}

// Hosted checkout keeps card information out of MarketHub's servers.
// This adapter intentionally accepts only Stripe test keys.
public sealed class StripePaymentGateway(HttpClient http, IConfiguration config) : IPaymentGateway
{
    public string Provider => "Stripe";
    public async Task<PaymentResult> CreateSession(Order order, CancellationToken ct)
    {
        var key = config["Stripe:SecretKey"] ?? "";
        if (!key.StartsWith("sk_test_", StringComparison.Ordinal))
            throw new BusinessException(503, "payment_unavailable", "Configure a Stripe test secret key.");
        var origin = config["PublicOrigin"]!.TrimEnd('/');
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.stripe.com/v1/checkout/sessions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
        request.Headers.Add("Idempotency-Key", order.Id.ToString());
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["mode"] = "payment",
            ["success_url"] = $"{origin}/orders/{order.Id}?payment=returned",
            ["cancel_url"] = $"{origin}/orders/{order.Id}",
            ["metadata[orderId]"] = order.Id.ToString(),
            ["expires_at"] = new DateTimeOffset(order.CreatedAt.AddMinutes(31)).ToUnixTimeSeconds().ToString(),
            ["line_items[0][price_data][currency]"] = "sar",
            ["line_items[0][price_data][unit_amount]"] = order.Total.ToString(),
            ["line_items[0][price_data][product_data][name]"] = $"MarketHub {order.Number}",
            ["line_items[0][quantity]"] = "1"
        });
        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            throw new BusinessException(502, "payment_unavailable", "The payment provider is unavailable. Retry payment from your order.");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        return new PaymentResult(json.RootElement.GetProperty("url").GetString(), json.RootElement.GetProperty("id").GetString());
    }
}
