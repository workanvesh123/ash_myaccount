using MyAccount.Api.Models;
using MyAccount.Api.Services;

namespace MyAccount.Api.Features.Authentication;

public static class AuthenticationEndpoints
{
    public static void MapAuthenticationEndpoints(this RouteGroupBuilder group)
    {
        var endpoints = group.MapGroup("/auth")
            .WithTags("Authentication")
            .WithOpenApi();

        endpoints.MapPost("/login", Login)
            .WithName("Login")
            .WithSummary("User login")
            .WithDescription("Authenticates user and returns login response. If 2FA is enabled, returns isCompleted=false with redirect URL.")
            .Produces<LoginResponse>(200)
            .Produces(401);

        endpoints.MapPost("/logout", Logout)
            .WithName("Logout")
            .WithSummary("User logout")
            .WithDescription("Logs out the authenticated user")
            .Produces<LogoutResponse>(200);
    }

    private static async Task<IResult> Login(
        LoginRequest request,
        IAuthService authService,
        IActivityLogService activityLogService,
        ISessionService sessionService,
        INotificationService notificationService,
        HttpContext httpContext)
    {
        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        var userAgent = httpContext.Request.Headers.UserAgent.ToString();

        var response = await authService.LoginAsync(request.Username, request.Password);

        if (response == null)
        {
            // Log failed login attempt
            await activityLogService.LogActivityAsync(
                request.Username,
                ActivityType.LoginFailed,
                $"Failed login attempt for username: {request.Username}",
                ipAddress,
                userAgent
            );
            return Results.Unauthorized();
        }

        // Create session
        var sessionId = await sessionService.CreateSessionAsync(
            response.Claims!.AccountId,
            "Desktop", // Could parse from userAgent
            ParseBrowser(userAgent),
            ParseOS(userAgent),
            ipAddress
        );

        // Log successful login
        await activityLogService.LogActivityAsync(
            response.Claims!.AccountId,
            ActivityType.Login,
            $"Successful login from {ipAddress}",
            ipAddress,
            userAgent,
            new Dictionary<string, string> { { "SessionId", sessionId } }
        );

        // Send real-time notification
        await notificationService.SendNotificationAsync(
            response.Claims!.AccountId,
            "Success",
            "Login Successful",
            $"You logged in from {ParseBrowser(userAgent)} on {ParseOS(userAgent)}",
            null,
            new Dictionary<string, string> 
            { 
                { "IpAddress", ipAddress },
                { "SessionId", sessionId }
            }
        );

        // Add session ID to response headers
        httpContext.Response.Headers.Append("X-Session-Id", sessionId);

        return Results.Ok(response);
    }

    private static async Task<IResult> Logout(
        HttpContext httpContext,
        IActivityLogService activityLogService,
        ISessionService sessionService)
    {
        var authorization = httpContext.Request.Headers.Authorization.ToString();
        var sessionId = httpContext.Request.Headers["X-Session-Id"].ToString();
        
        if (!string.IsNullOrEmpty(authorization))
        {
            var userId = authorization.Replace("Bearer ", "");
            
            // Revoke session
            if (!string.IsNullOrEmpty(sessionId))
            {
                await sessionService.RevokeSessionAsync(sessionId);
            }

            // Log logout
            await activityLogService.LogActivityAsync(
                userId,
                ActivityType.Logout,
                "User logged out"
            );
        }

        return Results.Ok(new LogoutResponse(Success: true));
    }

    private static string ParseBrowser(string userAgent)
    {
        if (string.IsNullOrEmpty(userAgent)) return "Unknown";
        if (userAgent.Contains("Edg")) return "Edge";
        if (userAgent.Contains("Chrome")) return "Chrome";
        if (userAgent.Contains("Firefox")) return "Firefox";
        if (userAgent.Contains("Safari")) return "Safari";
        return "Unknown";
    }

    private static string ParseOS(string userAgent)
    {
        if (string.IsNullOrEmpty(userAgent)) return "Unknown";
        if (userAgent.Contains("Windows")) return "Windows";
        if (userAgent.Contains("Mac")) return "macOS";
        if (userAgent.Contains("Linux")) return "Linux";
        if (userAgent.Contains("Android")) return "Android";
        if (userAgent.Contains("iOS")) return "iOS";
        return "Unknown";
    }
}
