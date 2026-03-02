using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Serilog;
using Serilog.Events;

namespace MyAccount.Shared.Logging;

public class LoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger _logger;

    public LoggingMiddleware(RequestDelegate next)
    {
        _next = next;
        _logger = Log.ForContext<LoggingMiddleware>();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = Guid.NewGuid().ToString("N")[..8];
        context.Items["CorrelationId"] = correlationId;

        var stopwatch = Stopwatch.StartNew();
        var request = context.Request;

        _logger.Information(
            "[{CorrelationId}] HTTP {Method} {Path} started",
            correlationId,
            request.Method,
            request.Path);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var response = context.Response;

            var logLevel = response.StatusCode >= 500 
                ? LogEventLevel.Error 
                : response.StatusCode >= 400 
                    ? LogEventLevel.Warning 
                    : LogEventLevel.Information;

            _logger.Write(
                logLevel,
                "[{CorrelationId}] HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
                correlationId,
                request.Method,
                request.Path,
                response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
    }
}
