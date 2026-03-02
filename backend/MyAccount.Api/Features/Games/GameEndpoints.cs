namespace MyAccount.Api.Features.Games;

using Microsoft.AspNetCore.Mvc;
using MyAccount.Api.Models;
using MyAccount.Api.Services;
using MyAccount.Shared.Logging;

public static class GameEndpoints
{
    public static void MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/games").WithTags("Games");
        
        group.MapGet("/", GetAllGames);
        group.MapGet("/{gameId}", GetGameById);
        group.MapPost("/{gameId}/start", StartGame);
        group.MapPut("/sessions/{sessionId}/state", SaveGameState);
        group.MapPost("/sessions/{sessionId}/complete", CompleteGame);
        group.MapGet("/history", GetGameHistory);
    }
    
    private static async Task<IResult> GetAllGames(
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(GameEndpoints));
        logger.Information("Getting all games");
        
        var games = await gameService.GetAllGamesAsync();
        return Results.Ok(new { games });
    }
    
    private static async Task<IResult> GetGameById(
        string gameId,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(GameEndpoints));
        logger.Information("Getting game {GameId}", gameId);
        
        var game = await gameService.GetGameByIdAsync(gameId);
        if (game == null)
            return Results.NotFound(new { error = "Game not found" });
        
        return Results.Ok(game);
    }
    
    private static async Task<IResult> StartGame(
        string gameId,
        [FromBody] StartGameRequest request,
        [FromHeader(Name = "Authorization")] string authorization,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(GameEndpoints));
        var userId = authorization.Replace("Bearer ", "");
        
        logger.Information("User {UserId} starting game {GameId} with difficulty {Difficulty}", 
            userId, gameId, request.Difficulty);
        
        var response = await gameService.StartGameAsync(userId, gameId, request);
        return Results.Ok(response);
    }
    
    private static async Task<IResult> SaveGameState(
        string sessionId,
        [FromBody] SaveGameStateRequest request,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(GameEndpoints));
        logger.Information("Saving game state for session {SessionId}", sessionId);
        
        var success = await gameService.SaveGameStateAsync(sessionId, request);
        if (!success)
            return Results.NotFound(new { error = "Session not found" });
        
        return Results.Ok(new { success = true, savedAt = DateTime.UtcNow });
    }
    
    private static async Task<IResult> CompleteGame(
        string sessionId,
        [FromBody] CompleteGameRequest request,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(GameEndpoints));
        logger.Information("Completing game session {SessionId}", sessionId);
        
        try
        {
            var response = await gameService.CompleteGameAsync(sessionId, request);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error completing game session {SessionId}", sessionId);
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    
    private static async Task<IResult> GetGameHistory(
        [FromHeader(Name = "Authorization")] string authorization,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? gameId = null)
    {
        var logger = loggerFactory.CreateLogger(typeof(GameEndpoints));
        var userId = authorization.Replace("Bearer ", "");
        
        logger.Information("Getting game history for user {UserId}, page {Page}", userId, page);
        
        var response = await gameService.GetGameHistoryAsync(userId, page, pageSize, gameId);
        return Results.Ok(response);
    }
}
