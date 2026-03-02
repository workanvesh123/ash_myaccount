namespace MyAccount.Api.Models;

public record Enable2FARequest(
    string Method // "email" or "sms"
);

public record Enable2FAResponse(
    bool Success,
    string Message,
    int ExpiresIn
);

public record Verify2FARequest(
    string Code
);

public record Verify2FAResponse(
    bool Success,
    string Message
);

public record Disable2FAResponse(
    bool Success,
    string Message
);
