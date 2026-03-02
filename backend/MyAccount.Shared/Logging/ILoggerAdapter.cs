namespace MyAccount.Shared.Logging;

/// <summary>
/// Adapter interface for Serilog ILogger to enable dependency injection
/// </summary>
public interface ILoggerAdapter
{
    void Information(string messageTemplate, params object[] propertyValues);
    void Warning(string messageTemplate, params object[] propertyValues);
    void Error(Exception exception, string messageTemplate, params object[] propertyValues);
    void Debug(string messageTemplate, params object[] propertyValues);
}
