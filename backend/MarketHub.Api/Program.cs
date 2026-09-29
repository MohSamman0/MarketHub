using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using MarketHub.Application;
using MarketHub.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();
Directory.CreateDirectory("App_Data");
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo("App_Data/keys"));
if (builder.Environment.IsDevelopment() && string.IsNullOrWhiteSpace(builder.Configuration["Jwt:Key"]))
{
    const string keyFile = "App_Data/development-signing-key";
    if (!File.Exists(keyFile))
        File.WriteAllText(keyFile, Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)));
    builder.Configuration["Jwt:Key"] = File.ReadAllText(keyFile);
}
if ((builder.Configuration["Jwt:Key"]?.Length ?? 0) < 48) throw new InvalidOperationException("Set Jwt__Key to a randomly generated secret of at least 48 characters.");
if (!builder.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("SeedDemoData")) throw new InvalidOperationException("Demo seeding is only permitted in Development.");
if (!builder.Environment.IsDevelopment() && builder.Configuration["Payments:Provider"] != "Stripe") throw new InvalidOperationException("The demo payment provider is only permitted in Development.");
builder.Services.AddDbContext<AppDbContext>(o =>
{
    if (builder.Configuration["Database:Provider"] == "SqlServer")
        o.UseSqlServer(builder.Configuration.GetConnectionString("Default"), sql => sql.MigrationsAssembly("MarketHub.Migrations.SqlServer"));
    else
        o.UseSqlite(builder.Configuration.GetConnectionString("Default"));
});
builder.Services.AddScoped<OrderService>();
if (builder.Configuration["Payments:Provider"] == "Stripe")
    builder.Services.AddHttpClient<IPaymentGateway, StripePaymentGateway>();
else
    builder.Services.AddScoped<IPaymentGateway, DemoPaymentGateway>();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        ClockSkew = TimeSpan.FromSeconds(20)
    };
});
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "local", _ => new FixedWindowRateLimiterOptions { PermitLimit = 30, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddHostedService<ReservationWorker>();
var app = builder.Build();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    if (context.Request.Path.StartsWithSegments("/api"))
        context.Response.Headers.CacheControl = "no-store";
    // Refresh credentials are cookies. A required custom header + strict Origin allowlist
    // prevents cross-site requests; no cross-origin CORS policy is enabled.
    if (context.Request.Path.StartsWithSegments("/api/auth") && context.Request.Method == "POST")
    {
        var origin = context.Request.Headers.Origin.ToString();
        if (context.Request.Headers["X-MarketHub"] != "web" || (origin.Length > 0 && origin != app.Configuration["PublicOrigin"]))
        {
            await Results.Problem(statusCode: 403, title: "Request origin rejected", extensions: new Dictionary<string, object?> { ["code"] = "origin_rejected" }).ExecuteAsync(context);
            return;
        }
    }
    try
    {
        await next(context);
    }
    catch (Exception ex)
    {
        var status = ex is BusinessException b ? b.Status : ex is DbUpdateConcurrencyException ? 409 : ex is DbUpdateException ? 409 : 500;
        var code = ex is BusinessException be ? be.Code : status == 409 ? "concurrent_change" : "server_error";
        if (status == 500)
            app.Logger.LogError(ex, "Request {TraceId} failed", context.TraceIdentifier);
        await Results.Problem(statusCode: status, title: ex is BusinessException ? ex.Message : status == 409 ? "The record changed. Refresh and try again." : "An unexpected error occurred.", extensions: new Dictionary<string, object?> { ["code"] = code, ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
    }
});
if (!app.Environment.IsDevelopment()) { app.UseHsts(); app.UseHttpsRedirection(); }
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseStatusCodePages(async status =>
{
    if (status.HttpContext.Request.Path.StartsWithSegments("/api"))
        await Results.Problem(statusCode: status.HttpContext.Response.StatusCode,
            title: status.HttpContext.Response.StatusCode switch
            {
                401 => "Authentication required",
                403 => "Access denied",
                404 => "Resource not found",
                429 => "Too many requests",
                _ => "Request failed"
            },
            extensions: new Dictionary<string, object?> { ["traceId"] = status.HttpContext.TraceIdentifier }).ExecuteAsync(status.HttpContext);
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/api/health", async (AppDbContext db) => await db.Database.CanConnectAsync() ? Results.Ok(new { status = "healthy", service = "MarketHub API" }) : Results.StatusCode(503));
app.MapGet("/api/config", () => new { paymentProvider = app.Configuration["Payments:Provider"], demo = app.Environment.IsDevelopment() });
if (app.Environment.IsDevelopment()) app.MapOpenApi();
app.MapFallback("/api/{**path}", () => Results.Problem(statusCode: 404, title: "API endpoint not found"));
app.MapFallbackToFile("index.html");
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (app.Environment.IsDevelopment())
    {
        await db.Database.MigrateAsync();
        if (app.Configuration.GetValue<bool>("SeedDemoData"))
            await SeedData.Initialize(db);
    }
}
await app.RunAsync();
public partial class Program;
