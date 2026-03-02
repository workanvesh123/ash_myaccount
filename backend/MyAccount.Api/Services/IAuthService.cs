using MyAccount.Api.Models;

namespace MyAccount.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(string username, string password);
    string GenerateSessionToken();
}
