using System.Security.Claims;
using MarketHub.Application;
using MarketHub.Domain;
using MarketHub.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketHub.Api.Controllers;

[ApiController, Authorize(Roles = "Vendor"), Route("api/vendor")]
public sealed class VendorController(AppDbContext db) : ControllerBase
{
    private Guid VendorId => Guid.Parse(User.FindFirstValue("vendorId")!);
    private Guid ActorId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet("products")]
    public async Task<IActionResult> Products(CancellationToken ct) => Ok((await db.Products.AsNoTracking().Include(x => x.Vendor).Where(x => x.VendorId == VendorId).OrderByDescending(x => x.CreatedAt).ToListAsync(ct)).Select(x => x.ToDto()));
    [HttpPost("products")]
    public async Task<IActionResult> Create(ProductRequest request, CancellationToken ct)
    {
        await CheckApproved(ct);
        var p = new Product { VendorId = VendorId };
        Apply(p, request);
        db.Products.Add(p);
        await Save("Product created", p.NameEn, ct);
        await db.Entry(p).Reference(x => x.Vendor).LoadAsync(ct);
        return Created($"/api/products/{p.Id}", p.ToDto());
    }
    [HttpPut("products/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, ProductRequest request, CancellationToken ct)
    {
        await CheckApproved(ct);
        var p = await db.Products.Include(x => x.Vendor).SingleOrDefaultAsync(x => x.Id == id && x.VendorId == VendorId, ct);
        if (p == null)
            return NotFound();
        if (p.Version != request.Version)
            throw new BusinessException(409, "concurrent_change", "This product was updated. Refresh before editing.");
        Apply(p, request);
        p.Version++;
        await Save("Product updated", p.NameEn, ct);
        return Ok(p.ToDto());
    }
    [HttpGet("orders")]
    public async Task<IActionResult> Orders(CancellationToken ct) => Ok(await db.OrderItems.AsNoTracking().Where(x => x.VendorId == VendorId && x.Order.PaymentStatus == "Paid").OrderByDescending(x => x.Order.CreatedAt).Select(x => new { x.Id, x.OrderId, x.Order.Number, x.Order.CreatedAt, x.Order.Recipient, x.Order.City, x.Order.Address, x.Order.Phone, x.NameEn, x.NameAr, x.Image, x.Quantity, x.UnitPrice, x.Status, x.Version }).Take(100).ToListAsync(ct));
    [HttpPatch("orders/{id:guid}")]
    public async Task<IActionResult> Status(Guid id, StatusRequest request, CancellationToken ct)
    {
        await CheckApproved(ct);
        var item = await db.OrderItems.Include(x => x.Order).SingleOrDefaultAsync(x => x.Id == id && x.VendorId == VendorId, ct);
        if (item == null)
            return NotFound();
        if (item.Version != request.Version || item.Order.PaymentStatus != "Paid" || !CommerceRules.CanTransition(item.Status, request.Status))
            throw new BusinessException(409, "invalid_transition", "Refresh the order and choose the next fulfillment step.");
        item.Status = request.Status;
        item.Version++;
        await Save("Fulfillment updated", $"{item.Order.Number}: {item.Status}", ct);
        return NoContent();
    }
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken ct)
    {
        var lines = await db.OrderItems.AsNoTracking().Where(x => x.VendorId == VendorId && x.Order.PaymentStatus == "Paid").Select(x => new { x.OrderId, x.UnitPrice, x.Quantity, x.Status, x.Order.CreatedAt }).ToListAsync(ct);
        var products = await db.Products.Where(x => x.VendorId == VendorId).ToListAsync(ct);
        var today = DateTime.UtcNow.Date;
        return Ok(new
        {
            revenue = lines.Sum(x => (long)x.UnitPrice * x.Quantity),
            orders = lines.Select(x => x.OrderId).Distinct().Count(),
            products = products.Count,
            lowStock = products.Count(x => x.Stock < 10),
            pending = lines.Count(x => x.Status == "Processing"),
            series = Enumerable.Range(0, 7).Select(i => { var d = today.AddDays(-6 + i); return new { date = d, amount = lines.Where(x => x.CreatedAt.Date == d).Sum(x => (long)x.UnitPrice * x.Quantity) }; }),
            topProducts = products.OrderBy(x => x.Stock).Take(4).Select(x => new { x.NameEn, x.NameAr, x.Stock, x.Image })
        });
    }
    private async Task CheckApproved(CancellationToken ct)
    {
        if (!await db.Vendors.AnyAsync(x => x.Id == VendorId && x.Approved, ct))
            throw new BusinessException(403, "vendor_suspended", "Your store is awaiting approval.");
    }
    private async Task Save(string action, string detail, CancellationToken ct)
    {
        db.AuditEvents.Add(new AuditEvent { ActorId = ActorId, Action = action, Detail = detail });
        await db.SaveChangesAsync(ct);
    }
    private static void Apply(Product p, ProductRequest r)
    {
        p.NameEn = r.NameEn.Trim();
        p.NameAr = r.NameAr.Trim();
        p.DescriptionEn = r.DescriptionEn.Trim();
        p.DescriptionAr = r.DescriptionAr.Trim();
        p.Category = r.Category;
        p.Image = r.Image;
        p.Price = r.Price;
        p.Stock = r.Stock;
        p.Active = r.Active;
    }
}
