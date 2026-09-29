using MarketHub.Domain;
using Microsoft.EntityFrameworkCore;

namespace MarketHub.Infrastructure;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<RefreshSession> RefreshSessions => Set<RefreshSession>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(x => x.Email).IsUnique();
        b.Entity<User>().Property(x => x.Email).HasMaxLength(200);
        b.Entity<Product>().HasIndex(x => new { x.Category, x.Active });
        b.Entity<Product>().Property(x => x.Version).IsConcurrencyToken();
        b.Entity<Order>().Property(x => x.Version).IsConcurrencyToken();
        b.Entity<OrderItem>().Property(x => x.Version).IsConcurrencyToken();
        b.Entity<RefreshSession>().Property(x => x.Revoked).IsConcurrencyToken();
        b.Entity<Order>().Property(x => x.IdempotencyKey).HasMaxLength(80);
        b.Entity<Order>().HasIndex(x => new { x.UserId, x.IdempotencyKey }).IsUnique();
        b.Entity<Order>().HasIndex(x => x.Number).IsUnique();
        b.Entity<Order>().Property(x => x.Number).HasMaxLength(32);
        b.Entity<RefreshSession>().Property(x => x.TokenHash).HasMaxLength(64);
        b.Entity<RefreshSession>().HasIndex(x => x.TokenHash).IsUnique();
        b.Entity<OrderItem>().HasOne(x => x.Product).WithMany().OnDelete(DeleteBehavior.Restrict);
        foreach (var fk in b.Model.GetEntityTypes().SelectMany(t => t.GetForeignKeys()))
            fk.DeleteBehavior = DeleteBehavior.Restrict;
    }
}
