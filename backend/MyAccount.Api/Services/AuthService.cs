using MyAccount.Api.Models;
using MyAccount.Api.Repositories;
using MyAccount.Shared.Logging;

namespace MyAccount.Api.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ILoggerAdapter _logger;
    private readonly Dictionary<string, string> _credentials = new()
    {
        ["john.doe"] = "password123",
        ["jane.smith"] = "password456"
    };

    private readonly Dictionary<string, string> _usernameToUserId = new()
    {
        ["john.doe"] = "user123",
        ["jane.smith"] = "user456"
    };

    public AuthService(IUserRepository userRepository, ILoggerAdapterFactory loggerFactory)
    {
        _userRepository = userRepository;
        _logger = loggerFactory.CreateLogger<AuthService>();
    }

    public async Task<LoginResponse?> LoginAsync(string username, string password)
    {
        _logger.Information("Login attempt for user: {Username}", username);
        
        // Validate credentials
        if (!_credentials.TryGetValue(username, out var storedPassword) || storedPassword != password)
        {
            _logger.Warning("Login failed for user: {Username} - Invalid credentials", username);
            return null;
        }

        // Get user ID
        if (!_usernameToUserId.TryGetValue(username, out var userId))
            return null;

        // Get user profile to check 2FA status
        var user = await _userRepository.GetUserAsync(userId);
        if (user == null)
            return null;

        var sessionToken = GenerateSessionToken();

        // If 2FA is enabled, return incomplete login with redirect
        if (user.TwoFactorEnabled)
        {
            _logger.Information("Login requires 2FA for user: {Username}", username);
            return new LoginResponse(
                IsCompleted: false,
                RedirectUrl: "/en/myaccount/2fa-verify",
                Action: "twoFactorAuth",
                Claims: new LoginClaims(username, userId, sessionToken),
                PostLoginValues: new PostLoginValues(ErrorCodes.Forced2FA, 0),
                User: new UserInfo(true)
            );
        }

        // If 2FA is not enabled, return completed login
        _logger.Information("Login successful for user: {Username}", username);
        return new LoginResponse(
            IsCompleted: true,
            RedirectUrl: null,
            Action: null,
            Claims: new LoginClaims(username, userId, sessionToken),
            PostLoginValues: null,
            User: new UserInfo(true)
        );
    }

    public string GenerateSessionToken()
    {
        return Guid.NewGuid().ToString("N");
    }
}
