namespace MyAccount.Api.Models;

public record EmailRequest(
    string To,
    string Subject,
    string Body,
    bool IsHtml = true
);

public record EmailTemplate
{
    public static string WelcomeEmail(string userName) => $@"
        <h1>Welcome to MyAccount, {userName}!</h1>
        <p>Your account has been successfully created.</p>
        <p>You can now access all features of your account.</p>
    ";

    public static string PasswordResetEmail(string userName, string resetToken, string resetLink) => $@"
        <h1>Password Reset Request</h1>
        <p>Hi {userName},</p>
        <p>You requested to reset your password. Use the link below:</p>
        <p><a href=""{resetLink}"">Reset Password</a></p>
        <p>Or use this token: <strong>{resetToken}</strong></p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
    ";

    public static string TwoFactorOtpEmail(string userName, string otpCode) => $@"
        <h1>Two-Factor Authentication Code</h1>
        <p>Hi {userName},</p>
        <p>Your verification code is:</p>
        <h2 style=""font-size: 32px; letter-spacing: 5px;"">{otpCode}</h2>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this, please secure your account immediately.</p>
    ";

    public static string PasswordChangedEmail(string userName) => $@"
        <h1>Password Changed</h1>
        <p>Hi {userName},</p>
        <p>Your password was successfully changed.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
    ";

    public static string SecurityAlertEmail(string userName, string alertType, string details) => $@"
        <h1>Security Alert</h1>
        <p>Hi {userName},</p>
        <p><strong>{alertType}</strong></p>
        <p>{details}</p>
        <p>If this wasn't you, please secure your account immediately.</p>
    ";

    public static string DocumentStatusEmail(string userName, string documentName, string status) => $@"
        <h1>Document Status Update</h1>
        <p>Hi {userName},</p>
        <p>Your document <strong>{documentName}</strong> status has been updated to: <strong>{status}</strong></p>
    ";
}
