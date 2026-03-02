using Serilog;

namespace MyAccount.Shared.Logging;

/// <summary>
/// Adapter implementation for Serilog ILogger
/// </summary>
public class SerilogAdapter : ILoggerAdapter
{
    private readonly ILogger _logger;

    public SerilogAdapter(ILogger logger)
    {
        _logger = logger;
    }

    public void Information(string messageTemplate, params object[] propertyValues)
    {
        _logger.Information(messageTemplate, propertyValues);
    }

    public void Warning(string messageTemplate, params object[] propertyValues)
    {
        _logger.Warning(messageTemplate, propertyValues);
    }

    public void Error(Exception exception, string messageTemplate, params object[] propertyValues)
    {
        _logger.Error(exception, messageTemplate, propertyValues);
    }

    public void Debug(string messageTemplate, params object[] propertyValues)
    {
        _logger.Debug(messageTemplate, propertyValues);
    }
}
