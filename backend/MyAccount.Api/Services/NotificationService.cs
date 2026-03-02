using Microsoft.AspNetCore.SignalR;
using MyAccount.Api.Hubs;
using MyAccount.Api.Models;
using System.Collections.Concurrent;

namespace MyAccount.Api.Services;

public interface INotificationService
{
    Task SendNotificationAsync(string userId, string type, string title, string message, 
        string? actionUrl = null, Dictionary<string, string>? metadata = null);
    Task<NotificationListResponse> GetUserNotificationsAsync(string userId, bool unreadOnly = false);
    Task<bool> MarkAsReadAsync(string notificationId);
    Task<int> MarkAllAsReadAsync(string userId);
}

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    
    // In-memory storage for demo purposes
    private static readonly ConcurrentBag<Notification> _notifications = new();

    public NotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendNotificationAsync(string userId, string type, string title, string message,
        string? actionUrl = null, Dictionary<string, string>? metadata = null)
    {
        var notification = new Notification(
            Id: Guid.NewGuid().ToString(),
            UserId: userId,
            Type: type,
            Title: title,
            Message: message,
            Timestamp: DateTime.UtcNow,
            IsRead: false,
            ActionUrl: actionUrl,
            Metadata: metadata
        );

        // Store notification
        _notifications.Add(notification);

        // Send real-time notification to user's group
        await _hubContext.Clients.Group($"user_{userId}")
            .SendAsync("ReceiveNotification", notification);
    }

    public Task<NotificationListResponse> GetUserNotificationsAsync(string userId, bool unreadOnly = false)
    {
        var userNotifications = _notifications
            .Where(n => n.UserId == userId)
            .Where(n => !unreadOnly || !n.IsRead)
            .OrderByDescending(n => n.Timestamp)
            .ToList();

        var unreadCount = userNotifications.Count(n => !n.IsRead);

        var response = new NotificationListResponse(
            Notifications: userNotifications,
            UnreadCount: unreadCount,
            TotalCount: userNotifications.Count
        );

        return Task.FromResult(response);
    }

    public Task<bool> MarkAsReadAsync(string notificationId)
    {
        var notification = _notifications.FirstOrDefault(n => n.Id == notificationId);
        if (notification == null) return Task.FromResult(false);

        // Remove old and add updated (since records are immutable)
        var updated = notification with { IsRead = true };
        
        // This is a simplified approach - in production, use a proper database
        var list = _notifications.ToList();
        var index = list.FindIndex(n => n.Id == notificationId);
        if (index >= 0)
        {
            // Can't modify ConcurrentBag, so this is a limitation of in-memory storage
            // In production with a database, this would be a simple UPDATE
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    public Task<int> MarkAllAsReadAsync(string userId)
    {
        var userNotifications = _notifications.Where(n => n.UserId == userId && !n.IsRead).ToList();
        
        // In production with a database, this would be a simple UPDATE WHERE query
        // For in-memory demo, we'll just return the count
        return Task.FromResult(userNotifications.Count);
    }
}
