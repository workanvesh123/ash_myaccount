using MyAccount.Api.Models;

namespace MyAccount.Api.Repositories;

public class InMemoryUserRepository : IUserRepository
{
    private readonly Dictionary<string, UserProfile> _users = new()
    {
        ["user123"] = new UserProfile(
            "user123",
            "John",
            "Doe",
            "john.doe@example.com",
            "+1234567890",
            new DateTime(1990, 1, 1),
            new Address("123 Main St", "New York", "NY", "10001", "USA"),
            false
        ),
        ["user456"] = new UserProfile(
            "user456",
            "Jane",
            "Smith",
            "jane.smith@example.com",
            "+0987654321",
            new DateTime(1985, 5, 15),
            new Address("456 Oak Ave", "Los Angeles", "CA", "90001", "USA"),
            true
        )
    };

    public Task<UserProfile?> GetUserAsync(string userId)
    {
        _users.TryGetValue(userId, out var user);
        return Task.FromResult(user);
    }

    public Task<UserProfile> UpdateUserAsync(string userId, UpdateProfileRequest request)
    {
        if (!_users.TryGetValue(userId, out var user))
            throw new KeyNotFoundException("User not found");

        var updated = user with
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone
        };

        _users[userId] = updated;
        return Task.FromResult(updated);
    }

    public Task<bool> Enable2FAAsync(string userId)
    {
        if (!_users.TryGetValue(userId, out var user))
            return Task.FromResult(false);

        _users[userId] = user with { TwoFactorEnabled = true };
        return Task.FromResult(true);
    }

    public Task<bool> Disable2FAAsync(string userId)
    {
        if (!_users.TryGetValue(userId, out var user))
            return Task.FromResult(false);

        _users[userId] = user with { TwoFactorEnabled = false };
        return Task.FromResult(true);
    }
}
