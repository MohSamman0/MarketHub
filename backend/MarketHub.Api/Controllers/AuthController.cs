using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using MarketHub.Application;
using MarketHub.Domain;
using MarketHub.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace MarketHub.Api.Controllers;

[ApiController, Route("api/auth"), EnableRateLimiting("auth")]
public sealed class AuthController(AppDbContext db, IConfiguration config, IWebHostEnvironment env) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(x => x.Email == email, ct);
        if (user?.LockedUntil > DateTime.UtcNow)
            throw new BusinessException(429, "account_locked", "Too many attempts. Try again in 15 minutes.");
        if (user == null || new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
        {
            if (user != null)
            {
                user.FailedLogins++;
                if (user.FailedLogins >= 5)
                {
                    user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
                    user.FailedLogins = 0;
                }
                await db.SaveChangesAsync(ct);
            }
            throw new BusinessException(401, "invalid_credentials", "Email or password is incorrect.");
        }
        user.FailedLogins = 0;
        user.LockedUntil = null;
        return await Issue(user, ct);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(x => x.Email == email, ct))
            throw new BusinessException(409, "email_taken", "This email is already registered.");
        var user = new User { Name = request.Name.Trim(), Email = email };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, request.Password);
        db.Users.Add(user); // Role cannot be supplied by the client.
        return await Issue(user, ct);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        if (!Request.Cookies.TryGetValue("mh_refresh", out var token))
            return Unauthorized();
        var hash = Hash(token);
        var session = await db.RefreshSessions.Include(x => x.User).SingleOrDefaultAsync(x => x.TokenHash == hash, ct);
        if (session == null || session.Revoked || session.ExpiresAt <= DateTime.UtcNow)
            return Unauthorized();
        session.Revoked = true;
        return await Issue(session.User, ct);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        if (Request.Cookies.TryGetValue("mh_refresh", out var token))
        {
            var hash = Hash(token);
            await db.RefreshSessions.Where(x => x.TokenHash == hash).ExecuteUpdateAsync(x => x.SetProperty(s => s.Revoked, true), ct);
        }
        Response.Cookies.Delete("mh_refresh", CookieOptions());
        return NoContent();
    }

    [Authorize, HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct) => Ok((await db.Users.SingleAsync(x => x.Id == Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!), ct)).ToDto());

    private async Task<IActionResult> Issue(User user, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, user.Id.ToString()), new(ClaimTypes.Name, user.Name), new(ClaimTypes.Role, user.Role), new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) };
        if (user.VendorId != null)
            claims.Add(new("vendorId", user.VendorId.ToString()!));
        var token = new JwtSecurityToken(config["Jwt:Issuer"], config["Jwt:Audience"], claims, now, now.AddMinutes(15), new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256));
        var refresh = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        db.RefreshSessions.Add(new RefreshSession { UserId = user.Id, TokenHash = Hash(refresh), ExpiresAt = now.AddDays(7) });
        await db.SaveChangesAsync(ct);
        Response.Cookies.Append("mh_refresh", refresh, CookieOptions());
        return Ok(new
        {
            accessToken = new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt = now.AddMinutes(15),
            user = user.ToDto()
        });
    }
    private CookieOptions CookieOptions() => new() { HttpOnly = true, Secure = !env.IsDevelopment(), SameSite = SameSiteMode.Strict, Path = "/api/auth", MaxAge = TimeSpan.FromDays(7), IsEssential = true };
    private static string Hash(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
