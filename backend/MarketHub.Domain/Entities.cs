namespace MarketHub.Domain;

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "Customer";
    public Guid? VendorId
    {
        get; set;
    }
    public Vendor? Vendor
    {
        get; set;
    }
    public int FailedLogins
    {
        get; set;
    }
    public DateTime? LockedUntil
    {
        get; set;
    }
}

public sealed class Vendor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string NameEn { get; set; } = "";
    public string NameAr { get; set; } = "";
    public string City { get; set; } = "Riyadh";
    public bool Approved { get; set; } = true;
}

public sealed class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VendorId
    {
        get; set;
    }
    public Vendor Vendor { get; set; } = null!;
    public string NameEn { get; set; } = "";
    public string NameAr { get; set; } = "";
    public string DescriptionEn { get; set; } = "";
    public string DescriptionAr { get; set; } = "";
    public string Category { get; set; } = "Workspace";
    public string Image { get; set; } = "desk";
    // Monetary amounts are integer halalas, never floating point.
    public int Price
    {
        get; set;
    }
    public int Stock
    {
        get; set;
    }
    public bool Active { get; set; } = true;
    public int Version { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Number { get; set; } = "";
    public Guid UserId
    {
        get; set;
    }
    public User User { get; set; } = null!;
    public string IdempotencyKey { get; set; } = "";
    public string RequestHash { get; set; } = "";
    public string Recipient { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public int Subtotal
    {
        get; set;
    }
    public int Shipping
    {
        get; set;
    }
    public int Tax
    {
        get; set;
    }
    public int Total
    {
        get; set;
    }
    public string PaymentStatus { get; set; } = "Pending";
    public string PaymentProvider { get; set; } = "Demo";
    public string? PaymentSessionId
    {
        get; set;
    }
    public string? PaymentUrl
    {
        get; set;
    }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
    public List<OrderItem> Items { get; set; } = [];
}

public sealed class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId
    {
        get; set;
    }
    public Order Order { get; set; } = null!;
    public Guid ProductId
    {
        get; set;
    }
    public Product Product { get; set; } = null!;
    public Guid VendorId
    {
        get; set;
    }
    public string NameEn { get; set; } = "";
    public string NameAr { get; set; } = "";
    public string Image { get; set; } = "";
    public int Quantity
    {
        get; set;
    }
    public int UnitPrice
    {
        get; set;
    }
    public string Status { get; set; } = "Processing";
    public int Version { get; set; } = 1;
}

public sealed class RefreshSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId
    {
        get; set;
    }
    public User User { get; set; } = null!;
    public string TokenHash { get; set; } = "";
    public DateTime ExpiresAt
    {
        get; set;
    }
    public bool Revoked
    {
        get; set;
    }
}

public sealed class AuditEvent
{
    public long Id
    {
        get; set;
    }
    public Guid ActorId
    {
        get; set;
    }
    public string Action { get; set; } = "";
    public string Detail { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public static class CommerceRules
{
    public static (int Shipping, int Tax, int Total) Calculate(int subtotal)
    {
        var shipping = subtotal >= 50000 ? 0 : 2500;
        var tax = (int)Math.Round((subtotal + shipping) * 0.15m, MidpointRounding.AwayFromZero);
        return (shipping, tax, checked(subtotal + shipping + tax));
    }
    public static bool CanTransition(string from, string to) =>
        (from, to) is ("Processing", "Shipped") or ("Shipped", "Delivered");
}
