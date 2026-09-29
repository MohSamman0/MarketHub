using System.Security.Claims;
using MarketHub.Application;
using MarketHub.Domain;
using MarketHub.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketHub.Api.Controllers;

[ApiController, Authorize, Route("api/orders")]
public sealed class OrdersController(AppDbContext db, OrderService service, IWebHostEnvironment env) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok((await db.Orders.AsNoTracking().Include(x => x.Items).Where(x => x.UserId == UserId).OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync(ct)).Select(View));
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var order = await Own(id, ct);
        return Ok(View(order));
    }
    [HttpPost]
    public async Task<IActionResult> Create(CheckoutRequest request, CancellationToken ct)
    {
        var order = await service.Checkout(UserId, request, Request.Headers["Idempotency-Key"].ToString(), ct);
        return Created($"/api/orders/{order.Id}", View(order));
    }
    [HttpPost("{id:guid}/payment")]
    public async Task<IActionResult> Pay(Guid id, CancellationToken ct) => Ok(await service.StartPayment(await Own(id, ct), ct));
    [HttpPost("{id:guid}/demo-payment")]
    public async Task<IActionResult> DemoPay(Guid id, [FromQuery] bool success, CancellationToken ct)
    {
        var order = await Own(id, ct);
        if (!env.IsDevelopment() || order.PaymentProvider != "Demo")
            return NotFound();
        await service.Complete(order, success, UserId, ct);
        return Ok(View(order));
    }
    private async Task<Order> Own(Guid id, CancellationToken ct) => await db.Orders.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == id && x.UserId == UserId, ct) ?? throw new BusinessException(404, "not_found", "Order not found.");
    public static object View(Order o) => new
    {
        o.Id,
        o.Number,
        o.CreatedAt,
        o.Recipient,
        o.Phone,
        o.Address,
        o.City,
        o.Subtotal,
        o.Shipping,
        o.Tax,
        o.Total,
        o.PaymentStatus,
        o.PaymentProvider,
        items = o.Items.Select(x => new { x.Id, x.ProductId, x.NameEn, x.NameAr, x.Image, x.Quantity, x.UnitPrice, x.Status, x.Version })
    };
}
