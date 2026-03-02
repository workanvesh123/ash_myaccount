using MyAccount.Api.Models;
using System.Collections.Concurrent;

namespace MyAccount.Api.Services;

public interface ISessionService
{
    Task<string> CreateSessionAsync(string userId, string deviceName, string browser, 
        string os, string ipAddress, string? location = null);
    Task<SessionListResponse> GetUserSessionsAsync(string userId, string? currentSessionId = null);
    Task<bool> RevokeSessionAsync(string sessionId);
    Task<int> RevokeAllUserSessionsAsync(string userId, bool excludeCurrent = false, string? currentSessionId = null);
    Task UpdateSessionActivityAsync(string sessionId);
    Task<bool> IsSessionValidAsync(string sessionId);
}

public class SessionService : ISessionService
{
    // In-memory storage for demo purposes
    private static readonly ConcurrentDictionary<string, UserSession> _sessions = new();

    public Task<string> CreateSessionAsync(string userId, string deviceName, string browser,
        string os, string ipAddress, string? location = null)
    {
        var sessionId = Guid.NewGuid().ToString();
        var now = DateTime.UtcNow;

        var session = new UserSession(
            SessionId: sessionId,
            UserId: userId,
            DeviceName: deviceName,
            Browser: browser,
            OperatingSystem: os,
            IpAddress: ipAddress,
            Location: location,
            CreatedAt: now,
            LastActivityAt: now,
            IsCurrent: false
        );

        _sessions[sessionId] = session;
        return Task.FromResult(sessionId);
    }

    public Task<SessionListResponse> GetUserSessionsAsync(string userId, string? currentSessionId = null)
    {
        var userSessions = _sessions.Values
            .Where(s => s.UserId == userId)
            .Select(s => s with { IsCurrent = s.SessionId == currentSessionId })
            .OrderByDescending(s => s.LastActivityAt)
            .ToList();

        var response = new SessionListResponse(
            Sessions: userSessions,
            TotalCount: userSessions.Count
        );

        return Task.FromResult(response);
    }

    public Task<bool> RevokeSessionAsync(string sessionId)
    {
        var removed = _sessions.TryRemove(sessionId, out _);
        return Task.FromResult(removed);
    }

    public Task<int> RevokeAllUserSessionsAsync(string userId, bool excludeCurrent = false, string? currentSessionId = null)
    {
        var sessionsToRevoke = _sessions.Values
            .Where(s => s.UserId == userId)
            .Where(s => !excludeCurrent || s.SessionId != currentSessionId)
            .ToList();

        var count = 0;
        foreach (var session in sessionsToRevoke)
        {
            if (_sessions.TryRemove(session.SessionId, out _))
                count++;
        }

        return Task.FromResult(count);
    }

    public Task UpdateSessionActivityAsync(string sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            var updatedSession = session with { LastActivityAt = DateTime.UtcNow };
            _sessions[sessionId] = updatedSession;
        }
        return Task.CompletedTask;
    }

    public Task<bool> IsSessionValidAsync(string sessionId)
    {
        return Task.FromResult(_sessions.ContainsKey(sessionId));
    }
}
