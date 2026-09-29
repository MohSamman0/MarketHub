using MarketHub.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MarketHub.Infrastructure;

public static class SeedData
{
    public static async Task Initialize(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
            return;
        var vendors = new[] {
            new Vendor { NameEn = "Form & Function", NameAr = "فورم آند فنكشن", City = "Riyadh" },
            new Vendor { NameEn = "Sound Society", NameAr = "ساوند سوسايتي", City = "Jeddah" },
            new Vendor { NameEn = "Everyday Objects", NameAr = "إيفري داي", City = "Dammam" },
            new Vendor { NameEn = "Palm Studio", NameAr = "استوديو النخيل", Approved = false }
        };
        db.Vendors.AddRange(vendors);
        User MakeUser(string name, string email, string role, Guid? vendor = null)
        {
            var u = new User { Name = name, Email = email, Role = role, VendorId = vendor };
            u.PasswordHash = new PasswordHasher<User>().HashPassword(u, "MarketHub!2026");
            return u;
        }
        var customer = MakeUser("Mohammad Samman", "customer@markethub.demo", "Customer");
        db.Users.AddRange(customer, MakeUser("Noura Al-Rashid", "vendor@markethub.demo", "Vendor", vendors[0].Id),
            MakeUser("Omar Khalid", "vendor2@markethub.demo", "Vendor", vendors[1].Id),
            MakeUser("Sarah Ahmed", "admin@markethub.demo", "Admin"));
        var rows = new (string En, string Ar, string Cat, string Image, int Price, int Stock, int Vendor)[] {
            ("Arc wireless headphones", "سماعات آرك اللاسلكية", "Audio", "headphones", 34900, 42, 1),
            ("Linea desk lamp", "مصباح مكتب لينيا", "Workspace", "lamp", 18900, 28, 0),
            ("Everyday carry backpack", "حقيبة الظهر اليومية", "Lifestyle", "bag", 27900, 35, 2),
            ("Studio mechanical keyboard", "لوحة مفاتيح ستوديو", "Workspace", "keyboard", 42900, 18, 0),
            ("Pebble portable speaker", "مكبر صوت بيبل المحمول", "Audio", "speaker", 22900, 56, 1),
            ("Orbit everyday watch", "ساعة أوربت اليومية", "Accessories", "watch", 59900, 12, 2),
            ("Terra insulated bottle", "قارورة تيرا المعزولة", "Lifestyle", "bottle", 8900, 72, 2),
            ("Precision wireless mouse", "فأرة بريسيجن اللاسلكية", "Workspace", "mouse", 15900, 9, 0),
            ("The daily notebook", "دفتر الملاحظات اليومي", "Accessories", "notebook", 5900, 84, 2),
            ("Fold charging station", "قاعدة شحن فولد", "Accessories", "charger", 19900, 31, 0),
            ("Oak standing desk", "مكتب أوك القابل للرفع", "Workspace", "desk", 129900, 7, 0),
            ("Forma ergonomic chair", "كرسي فورما المريح", "Workspace", "chair", 89900, 0, 0)
        };
        var products = rows.Select(r => new Product
        {
            NameEn = r.En,
            NameAr = r.Ar,
            Category = r.Cat,
            Image = r.Image,
            Price = r.Price,
            Stock = r.Stock,
            VendorId = vendors[r.Vendor].Id,
            DescriptionEn = $"Meet the {r.En.ToLowerInvariant()}. Considered design, dependable materials, and thoughtful details that make your everyday a little better. Carefully selected by {vendors[r.Vendor].NameEn}. Includes a one-year seller warranty and recyclable packaging.",
            DescriptionAr = $"اكتشف {r.Ar}. تصميم متقن وخامات موثوقة وتفاصيل مدروسة تجعل يومك أفضل. اختيار بعناية من {vendors[r.Vendor].NameAr}. يشمل ضمان البائع لمدة عام وتغليفاً قابلاً لإعادة التدوير."
        }).ToArray();
        db.Products.AddRange(products);
        for (var i = 0; i < 18; i++)
        {
            var p = products[i % 11];
            var q = i % 3 + 1;
            var subtotal = p.Price * q;
            var totals = CommerceRules.Calculate(subtotal);
            db.Orders.Add(new Order
            {
                Number = $"MH-{1041 + i}",
                UserId = customer.Id,
                IdempotencyKey = $"seed-{i}",
                RequestHash = "seed",
                Recipient = customer.Name,
                Phone = "+966500000000",
                Address = "King Fahd Road, Al Olaya, Building 24",
                City = "Riyadh",
                Subtotal = subtotal,
                Shipping = totals.Shipping,
                Tax = totals.Tax,
                Total = totals.Total,
                PaymentStatus = "Paid",
                CreatedAt = DateTime.UtcNow.AddDays(-i * 2),
                Items = [new OrderItem { ProductId = p.Id, VendorId = p.VendorId, NameEn = p.NameEn, NameAr = p.NameAr, Image = p.Image, Quantity = q, UnitPrice = p.Price, Status = i < 2 ? "Processing" : i < 5 ? "Shipped" : "Delivered" }]
            });
        }
        db.AuditEvents.Add(new AuditEvent { ActorId = customer.Id, Action = "Workspace initialized", Detail = "Development sample catalog and order history" });
        await db.SaveChangesAsync();
    }
}
