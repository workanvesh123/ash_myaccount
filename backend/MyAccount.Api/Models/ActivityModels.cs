namespace MyAccount.Api.Models;

public record ActivityLogEntry(
    string Id,
    string UserId,
    string ActivityType,
    string Description,
    DateTime Timestamp,
    string? IpAddress,
    string? UserAgent,
    string? Device,
    string? Browser,
    Dictionary<string, string>? Metadata
);

public record ActivityLogResponse(
    List<ActivityLogEntry> Activities,
    int TotalCount,
    int Page,
    int PageSize
);

public enum ActivityType
{
    Login,
    Logout,
    LoginFailed,
    ProfileUpdated,
    PasswordChanged,
    TwoFactorEnabled,
    TwoFactorDisabled,
    TwoFactorVerified,
    DocumentUploaded,
    DocumentDeleted,
    SessionRevoked,
    PasswordResetRequested,
    PasswordResetCompleted
}
