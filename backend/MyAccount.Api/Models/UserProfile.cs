namespace MyAccount.Api.Models;

public record UserProfile(
    string UserId,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    DateTime DateOfBirth,
    Address Address,
    bool TwoFactorEnabled
);

public record Address(
    string Street,
    string City,
    string State,
    string ZipCode,
    string Country
);

public record UpdateProfileRequest(
    string FirstName,
    string LastName,
    string Email,
    string Phone
);
