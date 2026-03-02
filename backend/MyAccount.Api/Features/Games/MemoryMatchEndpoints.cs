namespace MyAccount.Api.Features.Games;

using Microsoft.AspNetCore.Mvc;
using MyAccount.Api.Models;
using MyAccount.Api.Services;
using MyAccount.Shared.Logging;

public static class MemoryMatchEndpoints
{
    public static void MapMemoryMatchEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/games/memory-match").WithTags("Memory Match");
        
        group.MapPost("/start", StartGame);
        group.MapPost("/sessions/{sessionId}/flip", FlipCard);
        group.MapGet("/sessions/{sessionId}/state", GetGameState);
    }
    
    private static async Task<IResult> StartGame(
        [FromBody] StartMemoryMatchRequest request,
        [FromHeader(Name = "Authorization")] string authorization,
        IMemoryMatchService memoryMatchService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(MemoryMatchEndpoints));
        var userId = authorization.Replace("Bearer ", "");
        
        logger.Information("User {UserId} starting Memory Match game with difficulty {Difficulty} and theme {Theme}", 
            userId, request.Difficulty, request.Theme);
        
        try
        {
            var response = await memoryMatchService.StartGameAsync(userId, request);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error starting Memory Match game for user {UserId}", userId);
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    
    private static async Task<IResult> FlipCard(
        string sessionId,
        [FromBody] FlipCardRequest request,
        IMemoryMatchService memoryMatchService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(MemoryMatchEndpoints));
        logger.Information("Flipping card {CardId} in session {SessionId}", request.CardId, sessionId);
        
        try
        {
            var response = await memoryMatchService.FlipCardAsync(sessionId, request.CardId);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error flipping card in session {SessionId}", sessionId);
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    
    private static async Task<IResult> GetGameState(
        string sessionId,
        IMemoryMatchService memoryMatchService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(MemoryMatchEndpoints));
        logger.Information("Getting game state for session {SessionId}", sessionId);
        
        var gameState = await memoryMatchService.GetGameStateAsync(sessionId);
        if (gameState == null)
            return Results.NotFound(new { error = "Game session not found" });
        
        return Results.Ok(gameState);
    }
}
