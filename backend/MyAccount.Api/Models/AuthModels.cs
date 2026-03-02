namespace MyAccount.Api.Models;

public record LoginRequest(
    string Username,
    string Password
);

public record LoginResponse(
    bool IsCompleted,
    string? RedirectUrl,
    string? Action,
    LoginClaims? Claims,
    PostLoginValues? PostLoginValues,
    UserInfo? User
);

public record LoginClaims(
    string Username,
    string AccountId,
    string SessionToken
);

public record PostLoginValues(
    int Errorcode,
    int Suberror
);

public record UserInfo(
    bool IsAuthenticated
);

public record LogoutResponse(
    bool Success
);
