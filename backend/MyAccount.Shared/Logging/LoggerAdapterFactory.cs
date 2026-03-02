using Serilog;

namespace MyAccount.Shared.Logging;

/// <summary>
/// Factory for creating logger adapters with context
/// </summary>
public interface ILoggerAdapterFactory
{
    ILoggerAdapter CreateLogger<T>();
    ILoggerAdapter CreateLogger(Type type);
}

public class LoggerAdapterFactory : ILoggerAdapterFactory
{
    public ILoggerAdapter CreateLogger<T>()
    {
        return new SerilogAdapter(Log.ForContext<T>());
    }

    public ILoggerAdapter CreateLogger(Type type)
    {
        return new SerilogAdapter(Log.ForContext(type));
    }
}
