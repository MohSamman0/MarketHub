using MarketHub.Application;
using MarketHub.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketHub.Api.Controllers;

[ApiController, Route("api/products")]
public sealed class CatalogController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(string? search, string? category, string? sort, int page = 1, int pageSize = 12, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 48);
        var query = db.Products.AsNoTracking().Include(x => x.Vendor).Where(x => x.Active && x.Vendor.Approved);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => x.NameEn.ToLower().Contains(term) || x.NameAr.Contains(term) || x.Vendor.NameEn.ToLower().Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(category) && category != "All")
            query = query.Where(x => x.Category == category);
        var total = await query.CountAsync(ct);
        query = sort switch
        {
            "price-low" => query.OrderBy(x => x.Price).ThenBy(x => x.Id),
            "price-high" => query.OrderByDescending(x => x.Price).ThenBy(x => x.Id),
            _ => query.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id)
        };
        var products = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return Ok(new PagedResult<ProductDto>(products.Select(x => x.ToDto()).ToArray(), total, page, pageSize));
    }
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var p = await db.Products.AsNoTracking().Include(x => x.Vendor).FirstOrDefaultAsync(x => x.Id == id && x.Active && x.Vendor.Approved, ct);
        return p == null ? NotFound() : Ok(p.ToDto());
    }
}
