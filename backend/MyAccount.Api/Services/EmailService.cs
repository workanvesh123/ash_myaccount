using MyAccount.Api.Models;
using MyAccount.Shared.Logging;

namespace MyAccount.Api.Services;

public interface IEmailService
{
    Task SendEmailAsync(EmailRequest request);
    Task SendWelcomeEmailAsync(string email, string userName);
    Task SendPasswordResetEmailAsync(string email, string userName, string resetToken, string resetLink);
    Task SendTwoFactorOtpEmailAsync(string email, string userName, string otpCode);
    Task SendPasswordChangedEmailAsync(string email, string userName);
    Task SendSecurityAlertEmailAsync(string email, string userName, string alertType, string details);
    Task SendDocumentStatusEmailAsync(string email, string userName, string documentName, string status);
}

public class EmailService : IEmailService
{
    private readonly ILoggerAdapter _logger;
    private readonly IConfiguration _configuration;
    private readonly bool _emailEnabled;

    public EmailService(ILoggerAdapterFactory loggerFactory, IConfiguration configuration)
    {
        _logger = loggerFactory.CreateLogger<EmailService>();
        _configuration = configuration;
        _emailEnabled = _configuration.GetValue<bool>("Email:Enabled", false);
    }

    public async Task SendEmailAsync(EmailRequest request)
    {
        if (!_emailEnabled)
        {
            _logger.Information("[EMAIL DISABLED] Would send to {To}: {Subject}", request.To, request.Subject);
            _logger.Information("[EMAIL BODY]\n{Body}", request.Body);
            return;
        }

        // TODO: Implement actual email sending with SendGrid/AWS SES
        // For now, just log
        _logger.Information("Sending email to {To}: {Subject}", request.To, request.Subject);
        
        await Task.Delay(100); // Simulate async operation
    }

    public async Task SendWelcomeEmailAsync(string email, string userName)
    {
        var request = new EmailRequest(
            To: email,
            Subject: "Welcome to MyAccount!",
            Body: EmailTemplate.WelcomeEmail(userName)
        );
        await SendEmailAsync(request);
    }

    public async Task SendPasswordResetEmailAsync(string email, string userName, string resetToken, string resetLink)
    {
        var request = new EmailRequest(
            To: email,
            Subject: "Password Reset Request",
            Body: EmailTemplate.PasswordResetEmail(userName, resetToken, resetLink)
        );
        await SendEmailAsync(request);
    }

    public async Task SendTwoFactorOtpEmailAsync(string email, string userName, string otpCode)
    {
        var request = new EmailRequest(
            To: email,
            Subject: "Your Two-Factor Authentication Code",
            Body: EmailTemplate.TwoFactorOtpEmail(userName, otpCode)
        );
        await SendEmailAsync(request);
    }

    public async Task SendPasswordChangedEmailAsync(string email, string userName)
    {
        var request = new EmailRequest(
            To: email,
            Subject: "Password Changed Successfully",
            Body: EmailTemplate.PasswordChangedEmail(userName)
        );
        await SendEmailAsync(request);
    }

    public async Task SendSecurityAlertEmailAsync(string email, string userName, string alertType, string details)
    {
        var request = new EmailRequest(
            To: email,
            Subject: $"Security Alert: {alertType}",
            Body: EmailTemplate.SecurityAlertEmail(userName, alertType, details)
        );
        await SendEmailAsync(request);
    }

    public async Task SendDocumentStatusEmailAsync(string email, string userName, string documentName, string status)
    {
        var request = new EmailRequest(
            To: email,
            Subject: "Document Status Update",
            Body: EmailTemplate.DocumentStatusEmail(userName, documentName, status)
        );
        await SendEmailAsync(request);
    }
}
