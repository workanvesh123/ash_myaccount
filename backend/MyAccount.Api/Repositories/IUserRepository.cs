using MyAccount.Api.Models;

namespace MyAccount.Api.Repositories;

public interface IUserRepository
{
    Task<UserProfile?> GetUserAsync(string userId);
    Task<UserProfile> UpdateUserAsync(string userId, UpdateProfileRequest request);
    Task<bool> Enable2FAAsync(string userId);
    Task<bool> Disable2FAAsync(string userId);
}
