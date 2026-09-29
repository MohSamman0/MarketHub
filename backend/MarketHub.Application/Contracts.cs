using System.ComponentModel.DataAnnotations;
using MarketHub.Domain;

namespace MarketHub.Application;

public sealed record LoginRequest([Required, EmailAddress, MaxLength(200)] string Email, [Required, MaxLength(128)] string Password);
public sealed record RegisterRequest([Required, StringLength(80, MinimumLength = 2)] string Name, [Required, EmailAddress, MaxLength(200)] string Email, [Required, StringLength(128, MinimumLength = 12)] string Password);
public sealed record CartLine(Guid ProductId, [Range(1, 20)] int Quantity);
public sealed record CheckoutRequest(
    [Required, StringLength(80, MinimumLength = 2)] string Recipient,
    [Required, RegularExpression(@"^\+?[0-9]{9,15}$")] string Phone,
    [Required, StringLength(250, MinimumLength = 8)] string Address,
    [Required, StringLength(80, MinimumLength = 2)] string City,
    [Required, MinLength(1), MaxLength(30)] List<CartLine> Items);
public sealed record ProductRequest(
    [Required, StringLength(120, MinimumLength = 3)] string NameEn,
    [Required, StringLength(120, MinimumLength = 3)] string NameAr,
    [Required, StringLength(2000, MinimumLength = 10)] string DescriptionEn,
    [Required, StringLength(2000, MinimumLength = 10)] string DescriptionAr,
    [Required, RegularExpression("^(Workspace|Audio|Lifestyle|Accessories)$")] string Category,
    [Required, RegularExpression("^(desk|headphones|lamp|keyboard|bag|speaker|watch|bottle|mouse|notebook|charger|chair)$")] string Image,
    [Range(100, 100000000)] int Price, [Range(0, 100000)] int Stock, bool Active, int Version);
public sealed record StatusRequest([Required] string Status, int Version);
public sealed record UserDto(Guid Id, string Name, string Email, string Role, Guid? VendorId);
public sealed record ProductDto(Guid Id, Guid VendorId, string VendorEn, string VendorAr, string NameEn, string NameAr, string DescriptionEn, string DescriptionAr, string Category, string Image, int Price, int Stock, bool Active, int Version);
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);
public sealed record PaymentResult(string? Url, string? SessionId);
public interface IPaymentGateway
{
    string Provider
    {
        get;
    }
    Task<PaymentResult> CreateSession(Order order, CancellationToken ct);
}
public sealed class BusinessException(int status, string code, string message) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
}
public static class Mapping
{
    public static UserDto ToDto(this User u) => new(u.Id, u.Name, u.Email, u.Role, u.VendorId);
    public static ProductDto ToDto(this Product p) => new(p.Id, p.VendorId, p.Vendor.NameEn, p.Vendor.NameAr, p.NameEn, p.NameAr, p.DescriptionEn, p.DescriptionAr, p.Category, p.Image, p.Price, p.Stock, p.Active, p.Version);
}
