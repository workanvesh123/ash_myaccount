using MyAccount.Api.Models;
using System.Collections.Concurrent;

namespace MyAccount.Api.Services;

public interface IActivityLogService
{
    Task LogActivityAsync(string userId, ActivityType activityType, string description, 
        string? ipAddress = null, string? userAgent = null, Dictionary<string, string>? metadata = null);
    Task<ActivityLogResponse> GetUserActivitiesAsync(string userId, int page = 1, int pageSize = 20);
}

public class ActivityLogService : IActivityLogService
{
    // In-memory storage for demo purposes
    private static readonly ConcurrentBag<ActivityLogEntry> _activities = new();

    public Task LogActivityAsync(string userId, ActivityType activityType, string description,
        string? ipAddress = null, string? userAgent = null, Dictionary<string, string>? metadata = null)
    {
        var device = ParseDevice(userAgent);
        var browser = ParseBrowser(userAgent);

        var entry = new ActivityLogEntry(
            Id: Guid.NewGuid().ToString(),
            UserId: userId,
            ActivityType: activityType.ToString(),
            Description: description,
            Timestamp: DateTime.UtcNow,
            IpAddress: ipAddress,
            UserAgent: userAgent,
            Device: device,
            Browser: browser,
            Metadata: metadata
        );

        _activities.Add(entry);
        return Task.CompletedTask;
    }

    public Task<ActivityLogResponse> GetUserActivitiesAsync(string userId, int page = 1, int pageSize = 20)
    {
        var userActivities = _activities
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .ToList();

        var totalCount = userActivities.Count;
        var pagedActivities = userActivities
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var response = new ActivityLogResponse(
            Activities: pagedActivities,
            TotalCount: totalCount,
            Page: page,
            PageSize: pageSize
        );

        return Task.FromResult(response);
    }

    private static string ParseDevice(string? userAgent)
    {
        if (string.IsNullOrEmpty(userAgent)) return "Unknown";

        if (userAgent.Contains("Mobile", StringComparison.OrdinalIgnoreCase))
            return "Mobile";
        if (userAgent.Contains("Tablet", StringComparison.OrdinalIgnoreCase))
            return "Tablet";
        return "Desktop";
    }

    private static string ParseBrowser(string? userAgent)
    {
        if (string.IsNullOrEmpty(userAgent)) return "Unknown";

        if (userAgent.Contains("Edg")) return "Edge";
        if (userAgent.Contains("Chrome")) return "Chrome";
        if (userAgent.Contains("Firefox")) return "Firefox";
        if (userAgent.Contains("Safari")) return "Safari";
        return "Unknown";
    }
}
