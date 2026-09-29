using MarketHub.Application;
using MarketHub.Domain;
using MarketHub.Infrastructure;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MarketHub.Tests;

public sealed class CommerceTests : IAsyncLifetime
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    private AppDbContext db = null!;
    private OrderService service = null!;
    private User user = null!;
    private Product product = null!;
    public async Task InitializeAsync()
    {
        await connection.OpenAsync();
        db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        var vendor = new Vendor { NameEn = "Test seller", NameAr = "بائع تجريبي" };
        user = new User { Name = "Test customer", Email = "test@example.com" };
        product = new Product { Vendor = vendor, NameEn = "Desk lamp", NameAr = "مصباح", Price = 18900, Stock = 10 };
        db.Users.Add(user); db.Products.Add(product); await db.SaveChangesAsync();
        service = new OrderService(db, new DemoPaymentGateway());
    }
    public async Task DisposeAsync() { await db.DisposeAsync(); await connection.DisposeAsync(); }
    private CheckoutRequest Request(int quantity = 1) => new("Test customer", "+966500000000", "Test Street Building 12", "Riyadh", [new(product.Id, quantity)]);

    [Fact]
    public async Task Native_sqlite_is_new_enough_to_fix_CVE_2025_6965()
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT sqlite_version()";
        var version = Version.Parse((string)(await command.ExecuteScalarAsync())!);
        Assert.True(version >= new Version(3, 50, 2), $"Loaded vulnerable SQLite {version}");
    }

    [Theory]
    [InlineData(10000, 2500, 1875, 14375)]
    [InlineData(49999, 2500, 7875, 60374)]
    [InlineData(50000, 0, 7500, 57500)]
    public void Totals_use_minor_units_and_shipping_threshold(int subtotal, int shipping, int tax, int total) => Assert.Equal((shipping, tax, total), CommerceRules.Calculate(subtotal));

    [Theory]
    [InlineData("Processing", "Shipped", true)]
    [InlineData("Shipped", "Delivered", true)]
    [InlineData("Processing", "Delivered", false)]
    [InlineData("Delivered", "Processing", false)]
    [InlineData("Cancelled", "Shipped", false)]
    public void Fulfillment_cannot_skip_or_reverse_steps(string from, string to, bool allowed) => Assert.Equal(allowed, CommerceRules.CanTransition(from, to));

    [Fact]
    public async Task Checkout_reserves_stock_and_snapshots_server_price()
    {
        var order = await service.Checkout(user.Id, Request(2), "checkout-key-one", default);
        Assert.Equal(8, product.Stock); Assert.Equal(37800, order.Subtotal);
        Assert.Equal(46345, order.Total); Assert.Equal("Pending", order.PaymentStatus);
        product.Price = 100; Assert.Equal(18900, order.Items[0].UnitPrice);
    }
    [Fact]
    public async Task Repeated_checkout_is_idempotent()
    {
        var a = await service.Checkout(user.Id, Request(), "checkout-key-one", default);
        var b = await service.Checkout(user.Id, Request(), "checkout-key-one", default);
        Assert.Equal(a.Id, b.Id); Assert.Equal(9, product.Stock); Assert.Equal(1, await db.Orders.CountAsync());
    }
    [Fact]
    public async Task Same_key_with_different_request_is_rejected()
    {
        await service.Checkout(user.Id, Request(), "checkout-key-one", default);
        var error = await Assert.ThrowsAsync<BusinessException>(() => service.Checkout(user.Id, Request(2), "checkout-key-one", default));
        Assert.Equal("idempotency_conflict", error.Code);
    }
    [Fact]
    public async Task Overselling_is_rejected_without_creating_an_order()
    {
        var error = await Assert.ThrowsAsync<BusinessException>(() => service.Checkout(user.Id, Request(11), "checkout-key-one", default));
        Assert.Equal("insufficient_stock", error.Code); Assert.Equal(0, await db.Orders.CountAsync());
        Assert.Equal(10, product.Stock);
    }
    [Fact]
    public async Task Duplicate_lines_are_rejected()
    {
        var request = Request() with { Items = [new(product.Id, 1), new(product.Id, 2)] };
        var error = await Assert.ThrowsAsync<BusinessException>(() => service.Checkout(user.Id, request, "checkout-key-one", default));
        Assert.Equal("duplicate_product", error.Code);
    }
    [Fact]
    public async Task Suspended_vendor_cannot_sell()
    {
        product.Vendor.Approved = false; await db.SaveChangesAsync();
        var error = await Assert.ThrowsAsync<BusinessException>(() => service.Checkout(user.Id, Request(), "checkout-key-one", default));
        Assert.Equal("product_unavailable", error.Code);
    }
    [Fact]
    public async Task Decline_restores_inventory_exactly_once()
    {
        var order = await service.Checkout(user.Id, Request(2), "checkout-key-one", default);
        await service.Complete(order, false, user.Id, default);
        await service.Complete(order, false, user.Id, default);
        Assert.Equal("Cancelled", order.PaymentStatus); Assert.Equal(10, product.Stock);
    }
    [Fact]
    public async Task Successful_payment_cannot_be_cancelled_by_replayed_failure()
    {
        var order = await service.Checkout(user.Id, Request(), "checkout-key-one", default);
        await service.Complete(order, true, user.Id, default);
        await service.Complete(order, false, user.Id, default);
        Assert.Equal("Paid", order.PaymentStatus); Assert.Equal(9, product.Stock);
    }
    [Fact]
    public async Task Stale_inventory_update_is_rejected_by_database()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        await using var other = new AppDbContext(options);
        var stale = await other.Products.SingleAsync();
        product.Stock = 8; product.Version++; await db.SaveChangesAsync();
        stale.Stock = 9; stale.Version++;
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => other.SaveChangesAsync());
    }
}
