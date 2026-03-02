using Microsoft.AspNetCore.Mvc;
using MyAccount.Api.Models;
using MyAccount.Api.Services;
using MyAccount.Shared.Logging;

namespace MyAccount.Api.Features.Notifications;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/notifications")
            .WithTags("Notifications")
            .WithOpenApi();

        group.MapGet("/", GetNotifications)
            .WithName("GetNotifications")
            .WithSummary("Get user notifications");

        group.MapPost("/mark-read", MarkAsRead)
            .WithName("MarkNotificationAsRead")
            .WithSummary("Mark notification as read");

        group.MapPost("/mark-all-read", MarkAllAsRead)
            .WithName("MarkAllNotificationsAsRead")
            .WithSummary("Mark all notifications as read");
    }

    private static async Task<IResult> GetNotifications(
        [FromHeader(Name = "Authorization")] string authorization,
        [FromQuery] bool unreadOnly,
        INotificationService notificationService,
        ILoggerAdapterFactory loggerFactory)
    {
        try
        {
            var logger = loggerFactory.CreateLogger<Program>();
            var userId = authorization.Replace("Bearer ", "");

            logger.Information("Fetching notifications for user {UserId}, unreadOnly: {UnreadOnly}",
                userId, unreadOnly);

            var response = await notificationService.GetUserNotificationsAsync(userId, unreadOnly);

            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            var logger = loggerFactory.CreateLogger<Program>();
            logger.Error(ex, "Error fetching notifications");
            return Results.Problem(
                title: "Error fetching notifications",
                statusCode: 500,
                detail: ex.Message
            );
        }
    }

    private static async Task<IResult> MarkAsRead(
        [FromHeader(Name = "Authorization")] string authorization,
        [FromBody] MarkAsReadRequest request,
        INotificationService notificationService,
        ILoggerAdapterFactory loggerFactory)
    {
        try
        {
            var logger = loggerFactory.CreateLogger<Program>();
            var userId = authorization.Replace("Bearer ", "");

            logger.Information("Marking notification {NotificationId} as read for user {UserId}",
                request.NotificationId, userId);

            var success = await notificationService.MarkAsReadAsync(request.NotificationId);

            if (success)
            {
                return Results.Ok(new { message = "Notification marked as read" });
            }

            return Results.NotFound(new { message = "Notification not found" });
        }
        catch (Exception ex)
        {
            var logger = loggerFactory.CreateLogger<Program>();
            logger.Error(ex, "Error marking notification as read");
            return Results.Problem(
                title: "Error marking notification as read",
                statusCode: 500,
                detail: ex.Message
            );
        }
    }

    private static async Task<IResult> MarkAllAsRead(
        [FromHeader(Name = "Authorization")] string authorization,
        INotificationService notificationService,
        ILoggerAdapterFactory loggerFactory)
    {
        try
        {
            var logger = loggerFactory.CreateLogger<Program>();
            var userId = authorization.Replace("Bearer ", "");

            logger.Information("Marking all notifications as read for user {UserId}", userId);

            var count = await notificationService.MarkAllAsReadAsync(userId);

            return Results.Ok(new { message = $"Marked {count} notification(s) as read", count });
        }
        catch (Exception ex)
        {
            var logger = loggerFactory.CreateLogger<Program>();
            logger.Error(ex, "Error marking all notifications as read");
            return Results.Problem(
                title: "Error marking all notifications as read",
                statusCode: 500,
                detail: ex.Message
            );
        }
    }
}
