namespace MyAccount.Api.Models;

public record Notification(
    string Id,
    string UserId,
    string Type,
    string Title,
    string Message,
    DateTime Timestamp,
    bool IsRead,
    string? ActionUrl,
    Dictionary<string, string>? Metadata
);

public record NotificationListResponse(
    List<Notification> Notifications,
    int UnreadCount,
    int TotalCount
);

public record MarkAsReadRequest(
    string NotificationId
);

public record MarkAllAsReadRequest(
    string UserId
);

public enum NotificationType
{
    Info,
    Success,
    Warning,
    Error,
    Security
}
