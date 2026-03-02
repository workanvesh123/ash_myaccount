using Microsoft.AspNetCore.Http;
using Serilog;

namespace MyAccount.Shared.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger _logger;

    public ErrorHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
        _logger = Log.ForContext<ErrorHandlingMiddleware>();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (KeyNotFoundException ex)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString() ?? "unknown";
            _logger.Warning(ex, "[{CorrelationId}] Resource not found: {Message}", correlationId, ex.Message);
            
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new { Message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString() ?? "unknown";
            _logger.Warning(ex, "[{CorrelationId}] Bad request: {Message}", correlationId, ex.Message);
            
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            var correlationId = context.Items["CorrelationId"]?.ToString() ?? "unknown";
            _logger.Error(ex, "[{CorrelationId}] Unhandled exception: {Message}", correlationId, ex.Message);
            
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new { Message = "An unexpected error occurred" });
        }
    }
}
