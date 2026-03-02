using MyAccount.Api.Models;
using MyAccount.Api.Repositories;
using MyAccount.Api.Services;

namespace MyAccount.Api.Features.TwoFactorAuth;

public static class TwoFactorAuthEndpoints
{
    public static void MapTwoFactorAuthEndpoints(this RouteGroupBuilder group)
    {
        var endpoints = group.MapGroup("/2fa")
            .WithTags("Two-Factor Authentication")
            .WithOpenApi();

        endpoints.MapPost("/enable", Enable2FA)
            .WithName("Enable2FA")
            .WithSummary("Enable two-factor authentication")
            .WithDescription("Generates and sends an OTP code to enable 2FA for the authenticated user")
            .Produces<Enable2FAResponse>(200)
            .Produces(401);

        endpoints.MapPost("/verify", Verify2FA)
            .WithName("Verify2FA")
            .WithSummary("Verify OTP code")
            .WithDescription("Verifies the OTP code to complete 2FA enablement or login verification")
            .Produces<Verify2FAResponse>(200)
            .Produces(400)
            .Produces(401);

        endpoints.MapPost("/disable", Disable2FA)
            .WithName("Disable2FA")
            .WithSummary("Disable two-factor authentication")
            .WithDescription("Disables 2FA for the authenticated user")
            .Produces<Disable2FAResponse>(200)
            .Produces(401);
    }

    private static async Task<IResult> Enable2FA(
        Enable2FARequest request,
        ITwoFactorService twoFactorService,
        IUserRepository userRepository,
        IEmailService emailService,
        IActivityLogService activityLogService,
        HttpContext context)
    {
        var userId = GetUserIdFromToken(context);
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();

        var otp = twoFactorService.GenerateOTP();

        // Store OTP with 5 minute expiry
        twoFactorService.StoreOTP(userId, otp, TimeSpan.FromMinutes(5));

        // Get user info for email
        var user = await userRepository.GetUserAsync(userId);
        if (user != null)
        {
            // Send OTP via email
            await emailService.SendTwoFactorOtpEmailAsync(user.Email, user.FirstName, otp);
        }

        // Log activity
        await activityLogService.LogActivityAsync(
            userId,
            ActivityType.TwoFactorEnabled,
            "2FA enablement initiated, OTP sent"
        );

        // Also log to console for testing
        Console.WriteLine($"[2FA] OTP for user {userId}: {otp}");

        return Results.Ok(new Enable2FAResponse(
            Success: true,
            Message: $"OTP sent to your {request.Method}",
            ExpiresIn: 300
        ));
    }

    private static async Task<IResult> Verify2FA(
        Verify2FARequest request,
        ITwoFactorService twoFactorService,
        IUserRepository userRepository,
        IActivityLogService activityLogService,
        HttpContext context)
    {
        var userId = GetUserIdFromToken(context);
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();

        if (!twoFactorService.ValidateOTP(userId, request.Code))
        {
            await activityLogService.LogActivityAsync(
                userId,
                ActivityType.LoginFailed,
                "Invalid 2FA code entered"
            );
            return Results.BadRequest(new { Message = "Invalid or expired OTP" });
        }

        // Enable 2FA for user
        await userRepository.Enable2FAAsync(userId);

        // Log activity
        await activityLogService.LogActivityAsync(
            userId,
            ActivityType.TwoFactorVerified,
            "2FA successfully enabled and verified"
        );

        return Results.Ok(new Verify2FAResponse(
            Success: true,
            Message: "2FA enabled successfully"
        ));
    }

    private static async Task<IResult> Disable2FA(
        IUserRepository userRepository,
        IActivityLogService activityLogService,
        HttpContext context)
    {
        var userId = GetUserIdFromToken(context);
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();

        await userRepository.Disable2FAAsync(userId);

        // Log activity
        await activityLogService.LogActivityAsync(
            userId,
            ActivityType.TwoFactorDisabled,
            "2FA disabled"
        );

        return Results.Ok(new Disable2FAResponse(
            Success: true,
            Message: "2FA disabled successfully"
        ));
    }

    private static string GetUserIdFromToken(HttpContext context)
    {
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authHeader))
            return string.Empty;

        return authHeader.Replace("Bearer ", "");
    }
}
