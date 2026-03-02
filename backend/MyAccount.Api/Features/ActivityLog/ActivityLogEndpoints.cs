using Microsoft.AspNetCore.Mvc;
using MyAccount.Api.Models;
using MyAccount.Api.Services;
using MyAccount.Shared.Logging;

namespace MyAccount.Api.Features.ActivityLog;

public static class ActivityLogEndpoints
{
    public static void MapActivityLogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/activity")
            .WithTags("Activity Log")
            .WithOpenApi();

        group.MapGet("/", GetActivityLog)
            .WithName("GetActivityLog")
            .WithSummary("Get user activity log");
    }

    private static async Task<IResult> GetActivityLog(
        [FromHeader(Name = "Authorization")] string authorization,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        IActivityLogService activityLogService,
        ILoggerAdapterFactory loggerFactory)
    {
        try
        {
            var logger = loggerFactory.CreateLogger<Program>();
            var userId = authorization.Replace("Bearer ", "");
            
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

            logger.Information("Fetching activity log for user {UserId}, page {Page}, pageSize {PageSize}",
                userId, page, pageSize);

            var response = await activityLogService.GetUserActivitiesAsync(userId, page, pageSize);

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            var logger = loggerFactory.CreateLogger<Program>();
            logger.Error(ex, "Error fetching activity log");
            return Results.Problem(
                title: "Error fetching activity log",
                statusCode: 500,
                detail: ex.Message
            );
        }
    }
}
