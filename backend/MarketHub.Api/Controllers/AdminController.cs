using System.Security.Claims;
using MarketHub.Domain;
using MarketHub.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketHub.Api.Controllers;

[ApiController, Authorize(Roles = "Admin"), Route("api/admin")]
public sealed class AdminController(AppDbContext db) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> Overview(CancellationToken ct) => Ok(new { customers = await db.Users.CountAsync(x => x.Role == "Customer", ct), orders = await db.Orders.CountAsync(ct), revenue = await db.Orders.Where(x => x.PaymentStatus == "Paid").SumAsync(x => (long)x.Total, ct), vendors = await db.Vendors.AsNoTracking().ToListAsync(ct), audit = await db.AuditEvents.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(30).ToListAsync(ct) });
    [HttpPatch("vendors/{id:guid}")]
    public async Task<IActionResult> Approve(Guid id, ApprovalRequest request, CancellationToken ct)
    {
        var v = await db.Vendors.FindAsync([id], ct);
        if (v == null)
            return NotFound();
        v.Approved = request.Approved;
        db.AuditEvents.Add(new AuditEvent { ActorId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), Action = request.Approved ? "Vendor approved" : "Vendor suspended", Detail = v.NameEn });
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
    public sealed record ApprovalRequest(bool Approved);
}
