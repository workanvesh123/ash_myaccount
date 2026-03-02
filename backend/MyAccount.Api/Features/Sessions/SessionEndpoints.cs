using Microsoft.AspNetCore.Mvc;
using MyAccount.Api.Models;
using MyAccount.Api.Services;
using MyAccount.Shared.Logging;

namespace MyAccount.Api.Features.Sessions;

public static class SessionEndpoints
{
    public static void MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/sessions")
            .WithTags("Sessions")
            .WithOpenApi();

        group.MapGet("/", GetSessions)
            .WithName("GetSessions")
            .WithSummary("Get all user sessions");

        group.MapPost("/revoke", RevokeSession)
            .WithName("RevokeSession")
            .WithSummary("Revoke a specific session");

        group.MapPost("/revoke-all", RevokeAllSessions)
            .WithName("RevokeAllSessions")
            .WithSummary("Revoke all user sessions");
    }

    private static async Task<IResult> GetSessions(
        [FromHeader(Name = "Authorization")] string authorization,
        [FromHeader(Name = "X-Session-Id")] string? sessionId,
        ISessionService sessionService,
        ILoggerAdapterFactory loggerFactory)
    {
        try
        {
            var logger = loggerFactory.CreateLogger<Program>();
            var userId = authorization.Replace("Bearer ", "");

            logger.Information("Fetching sessions for user {UserId}", userId);

            var response = await sessionService.GetUserSessionsAsync(userId, sessionId);

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            var logger = loggerFactory.CreateLogger<Program>();
            logger.Error(ex, "Error fetching sessions");
            return Results.Problem(
                title: "Error fetching sessions",
                statusCode: 500,
                detail: ex.Message
            );
        }
    }

    private static async Task<IResult> RevokeSession(
        [FromHeader(Name = "Authorization")] string authorization,
        [FromBody] RevokeSessionRequest request,
        ISessionService sessionService,
        IActivityLogService activityLogService,
        ILoggerAdapterFactory loggerFactory)
    {
        try
        {
            var logger = loggerFactory.CreateLogger<Program>();
            var userId = authorization.Replace("Bearer ", "");

            logger.Information("Revoking session {SessionId} for user {UserId}",
                request.SessionId, userId);

            var revoked = await sessionService.RevokeSessionAsync(request.SessionId);

            if (revoked)
            {
                await activityLogService.LogActivityAsync(
                    userId,
                    ActivityType.SessionRevoked,
                    $"Session {request.SessionId} was revoked"
                );

                return Results.Ok(new { message = "Session revoked successfully" });
            }

            return Results.NotFound(new { message = "Session not found" });
        }
        catch (Exception ex)
        {
            var logger = loggerFactory.CreateLogger<Program>();
            logger.Error(ex, "Error revoking session");
            return Results.Problem(
                title: "Error revoking session",
                statusCode: 500,
                detail: ex.Message
            );
        }
    }

    private static async Task<IResult> RevokeAllSessions(
        [FromHeader(Name = "Authorization")] string authorization,
        [FromHeader(Name = "X-Session-Id")] string? currentSessionId,
        [FromBody] RevokeAllSessionsRequest request,
        ISessionService sessionService,
        IActivityLogService activityLogService,
        ILoggerAdapterFactory loggerFactory)
    {
        try
        {
            var logger = loggerFactory.CreateLogger<Program>();
            var userId = authorization.Replace("Bearer ", "");

            logger.Information("Revoking all sessions for user {UserId}, excludeCurrent: {ExcludeCurrent}",
                userId, request.ExcludeCurrent);

            var count = await sessionService.RevokeAllUserSessionsAsync(
                userId,
                request.ExcludeCurrent,
                currentSessionId
            );

            await activityLogService.LogActivityAsync(
                userId,
                ActivityType.SessionRevoked,
                $"Revoked {count} session(s)"
            );

            return Results.Ok(new { message = $"Revoked {count} session(s)", count });
        }
        catch (Exception ex)
        {
            var logger = loggerFactory.CreateLogger<Program>();
            logger.Error(ex, "Error revoking all sessions");
            return Results.Problem(
                title: "Error revoking all sessions",
                statusCode: 500,
                detail: ex.Message
            );
        }
    }
}
