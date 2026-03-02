namespace MyAccount.Api.Models;

public record UserSession(
    string SessionId,
    string UserId,
    string DeviceName,
    string Browser,
    string OperatingSystem,
    string IpAddress,
    string? Location,
    DateTime CreatedAt,
    DateTime LastActivityAt,
    bool IsCurrent
);

public record SessionListResponse(
    List<UserSession> Sessions,
    int TotalCount
);

public record RevokeSessionRequest(
    string SessionId
);

public record RevokeAllSessionsRequest(
    bool ExcludeCurrent
);
