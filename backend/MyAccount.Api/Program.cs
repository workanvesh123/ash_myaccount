using MyAccount.Api.Features.PersonalDetails;
using MyAccount.Api.Features.TwoFactorAuth;
using MyAccount.Api.Features.DocumentUpload;
using MyAccount.Api.Features.Authentication;
using MyAccount.Api.Features.ActivityLog;
using MyAccount.Api.Features.Sessions;
using MyAccount.Api.Features.Notifications;
using MyAccount.Api.Features.Games;
using MyAccount.Api.Hubs;
using MyAccount.Api.Repositories;
using MyAccount.Api.Services;
using MyAccount.Api.Configuration;
using MyAccount.Shared.Logging;
using MyAccount.Shared.Middleware;
using Serilog;
using Asp.Versioning;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.SwaggerGen;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.ConfigureSerilog();

// Add API Versioning
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version"));
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddTransient<IConfigureOptions<SwaggerGenOptions>, ConfigureSwaggerOptions>();
builder.Services.AddSwaggerGen();

// Register logging factory for DI
builder.Services.AddSingleton<ILoggerAdapterFactory, LoggerAdapterFactory>();

// Configure CORS from appsettings
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add SignalR
builder.Services.AddSignalR();

// Add feature services
builder.Services.AddSingleton<IUserRepository, InMemoryUserRepository>();
builder.Services.AddSingleton<ITwoFactorService, TwoFactorService>();
builder.Services.AddSingleton<IDocumentRepository, InMemoryDocumentRepository>();
builder.Services.AddSingleton<IAuthService, AuthService>();
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddSingleton<IActivityLogService, ActivityLogService>();
builder.Services.AddSingleton<ISessionService, SessionService>();
builder.Services.AddSingleton<INotificationService, NotificationService>();
builder.Services.AddSingleton<IGameService, GameService>();
builder.Services.AddSingleton<IMemoryMatchService, MemoryMatchService>();
builder.Services.AddSingleton<ISudokuService, SudokuService>();
builder.Services.AddSingleton<Game2048Service>();

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Add middleware
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<LoggingMiddleware>();

// Configure Swagger - only in Development for security
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        var descriptions = app.DescribeApiVersions();
        foreach (var description in descriptions)
        {
            var url = $"/swagger/{description.GroupName}/swagger.json";
            var name = description.GroupName.ToUpperInvariant();
            options.SwaggerEndpoint(url, name);
        }
    });
}

app.UseCors();

// Map SignalR hub
app.MapHub<NotificationHub>("/hubs/notifications");

// Create versioned API groups
var v1 = app.NewVersionedApi("MyAccount API");
var v1Group = v1.MapGroup("/api/v{version:apiVersion}").HasApiVersion(1, 0);

// Map endpoints to v1
v1Group.MapPersonalDetailsEndpoints();
v1Group.MapTwoFactorAuthEndpoints();
v1Group.MapDocumentUploadEndpoints();
v1Group.MapAuthenticationEndpoints();
v1Group.MapActivityLogEndpoints();
v1Group.MapSessionEndpoints();
v1Group.MapNotificationEndpoints();
v1Group.MapGameEndpoints();
v1Group.MapMemoryMatchEndpoints();
v1Group.MapSudokuEndpoints();
v1Group.MapGame2048Endpoints();

app.MapHealthChecks("/health");

Log.Information("MyAccount API configured, starting server...");
app.Run();
Log.Information("MyAccount API shut down gracefully");
