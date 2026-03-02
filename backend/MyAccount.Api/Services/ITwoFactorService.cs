namespace MyAccount.Api.Services;

public interface ITwoFactorService
{
    string GenerateOTP();
    void StoreOTP(string userId, string otp, TimeSpan expiry);
    bool ValidateOTP(string userId, string otp);
}
