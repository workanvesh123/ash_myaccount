namespace MyAccount.Api.Models;

/// <summary>
/// Error codes used in PostLoginValues for workflow interceptors
/// </summary>
public static class ErrorCodes
{
    /// <summary>
    /// User must complete 2FA verification (forced)
    /// </summary>
    public const int Forced2FA = 118;

    /// <summary>
    /// User can optionally complete 2FA verification
    /// </summary>
    public const int Optional2FA = 122;
}
