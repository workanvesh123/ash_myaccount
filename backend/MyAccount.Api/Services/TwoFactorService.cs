using MyAccount.Shared.Logging;

namespace MyAccount.Api.Services;

public class TwoFactorService : ITwoFactorService
{
    private readonly Dictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();
    private readonly ILoggerAdapter _logger;

    public TwoFactorService(ILoggerAdapterFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<TwoFactorService>();
        
        // Cleanup expired OTPs every minute
        Task.Run(async () =>
        {
            while (true)
            {
                await Task.Delay(TimeSpan.FromMinutes(1));
                CleanupExpiredOTPs();
            }
        });
    }

    private void CleanupExpiredOTPs()
    {
        var expired = _otpStore
            .Where(x => DateTime.UtcNow > x.Value.Expiry)
            .Select(x => x.Key)
            .ToList();

        if (expired.Any())
        {
            foreach (var key in expired)
                _otpStore.Remove(key);
            
            _logger.Information("Cleaned up {Count} expired OTP codes", expired.Count);
        }
    }

    public string GenerateOTP()
    {
        return Random.Shared.Next(100000, 999999).ToString();
    }

    public void StoreOTP(string userId, string otp, TimeSpan expiry)
    {
        _otpStore[userId] = (otp, DateTime.UtcNow.Add(expiry));
        _logger.Information("OTP stored for user: {UserId}, expires in {ExpirySeconds}s", userId, expiry.TotalSeconds);
    }

    public bool ValidateOTP(string userId, string otp)
    {
        if (!_otpStore.TryGetValue(userId, out var stored))
        {
            _logger.Warning("OTP validation failed for user: {UserId} - No OTP found", userId);
            return false;
        }

        if (DateTime.UtcNow > stored.Expiry)
        {
            _otpStore.Remove(userId);
            _logger.Warning("OTP validation failed for user: {UserId} - OTP expired", userId);
            return false;
        }

        if (stored.Otp != otp)
        {
            _logger.Warning("OTP validation failed for user: {UserId} - Invalid code", userId);
            return false;
        }

        _otpStore.Remove(userId);
        _logger.Information("OTP validated successfully for user: {UserId}", userId);
        return true;
    }
}
