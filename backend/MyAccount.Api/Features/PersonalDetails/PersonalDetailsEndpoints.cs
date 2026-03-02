using MyAccount.Api.Models;
using MyAccount.Api.Repositories;
using Serilog;

namespace MyAccount.Api.Features.PersonalDetails;

public static class PersonalDetailsEndpoints
{
    public static void MapPersonalDetailsEndpoints(this RouteGroupBuilder group)
    {
        var endpoints = group.MapGroup("/user")
            .WithTags("Personal Details")
            .WithOpenApi();

        endpoints.MapGet("/profile", GetProfile)
            .WithName("GetProfile")
            .WithSummary("Get user profile")
            .WithDescription("Retrieves the authenticated user's profile information including personal details and 2FA status")
            .Produces<UserProfile>(200)
            .Produces(401)
            .Produces(404);

        endpoints.MapPut("/profile", UpdateProfile)
            .WithName("UpdateProfile")
            .WithSummary("Update user profile")
            .WithDescription("Updates the authenticated user's personal details (first name, last name, email, phone)")
            .Produces<UserProfile>(200)
            .Produces(400)
            .Produces(401)
            .Produces(404);
    }

    private static async Task<IResult> GetProfile(
        IUserRepository userRepository,
        HttpContext context)
    {
        var userId = GetUserIdFromToken(context);
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();

        var user = await userRepository.GetUserAsync(userId);

        if (user == null)
            return Results.NotFound(new { Message = "User not found" });

        return Results.Ok(user);
    }

    private static async Task<IResult> UpdateProfile(
        UpdateProfileRequest request,
        IUserRepository userRepository,
        HttpContext context)
    {
        var logger = Log.ForContext(typeof(PersonalDetailsEndpoints));
        var userId = GetUserIdFromToken(context);
        
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();

        // Input validation
        if (string.IsNullOrWhiteSpace(request.FirstName))
        {
            logger.Warning("Update profile failed for user {UserId} - First name is required", userId);
            return Results.BadRequest(new { Message = "First name is required" });
        }

        if (string.IsNullOrWhiteSpace(request.LastName))
        {
            logger.Warning("Update profile failed for user {UserId} - Last name is required", userId);
            return Results.BadRequest(new { Message = "Last name is required" });
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains("@"))
        {
            logger.Warning("Update profile failed for user {UserId} - Valid email is required", userId);
            return Results.BadRequest(new { Message = "Valid email is required" });
        }

        if (string.IsNullOrWhiteSpace(request.Phone))
        {
            logger.Warning("Update profile failed for user {UserId} - Phone is required", userId);
            return Results.BadRequest(new { Message = "Phone is required" });
        }

        try
        {
            var user = await userRepository.UpdateUserAsync(userId, request);
            logger.Information("Profile updated successfully for user: {UserId}", userId);
            return Results.Ok(user);
        }
        catch (KeyNotFoundException)
        {
            return Results.NotFound(new { Message = "User not found" });
        }
    }

    private static string GetUserIdFromToken(HttpContext context)
    {
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authHeader))
            return string.Empty;

        // Simple token extraction (Bearer token is the userId)
        return authHeader.Replace("Bearer ", "");
    }
}
