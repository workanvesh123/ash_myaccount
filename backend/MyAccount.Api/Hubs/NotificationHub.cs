using Microsoft.AspNetCore.SignalR;
using MyAccount.Api.Models;
using MyAccount.Shared.Logging;

namespace MyAccount.Api.Hubs;

public class NotificationHub : Hub
{
    private readonly ILoggerAdapter _logger;

    public NotificationHub(ILoggerAdapterFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<NotificationHub>();
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.GetHttpContext()?.Request.Headers["X-User-Id"].ToString();
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Add user to their personal group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
            _logger.Information("User {UserId} connected to notification hub with connection {ConnectionId}", 
                userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.GetHttpContext()?.Request.Headers["X-User-Id"].ToString();
        
        if (!string.IsNullOrEmpty(userId))
        {
            _logger.Information("User {UserId} disconnected from notification hub", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // Client can call this to join their user group explicitly
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        _logger.Information("User {UserId} joined their notification group", userId);
    }
}
