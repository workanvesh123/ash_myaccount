namespace MyAccount.Api.Features.Games;

using Microsoft.AspNetCore.Mvc;
using MyAccount.Api.Models;
using MyAccount.Api.Services;

public static class Game2048Endpoints
{
    public static void MapGame2048Endpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/games/2048")
            .WithTags("2048 Game")
            .WithOpenApi();

        // Start new game
        group.MapPost("/start", async (
            [FromBody] StartGameRequest request,
            [FromServices] IGameService gameService,
            [FromServices] Game2048Service game2048Service,
            HttpContext context) =>
        {
            var userId = context.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            
            // Create game session
            var session = await gameService.StartGameAsync(userId, "2048", request);
            
            // Initialize 2048 game
            var gameState = game2048Service.StartNewGame();
            game2048Service.SaveState(session.SessionId, gameState);
            
            return Results.Ok(new Game2048StartResponse
            {
                SessionId = session.SessionId,
                GameState = gameState
            });
        })
        .WithName("Start2048Game")
        .WithSummary("Start a new 2048 game");

        // Make a move
        group.MapPost("/sessions/{sessionId}/move", async (
            string sessionId,
            [FromBody] Game2048MoveRequest request,
            [FromServices] Game2048Service game2048Service) =>
        {
            try
            {
                var response = game2048Service.MakeMove(sessionId, request.Direction);
                return Results.Ok(response);
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("Make2048Move")
        .WithSummary("Make a move in 2048 game");

        // Undo last move
        group.MapPost("/sessions/{sessionId}/undo", (
            string sessionId,
            [FromServices] Game2048Service game2048Service) =>
        {
            var success = game2048Service.Undo(sessionId);
            
            if (!success)
            {
                return Results.BadRequest(new { error = "No moves to undo" });
            }

            var state = game2048Service.GetState(sessionId);
            return Results.Ok(new
            {
                success = true,
                gameState = state,
                undoCount = game2048Service.GetUndoCount(sessionId)
            });
        })
        .WithName("Undo2048Move")
        .WithSummary("Undo last move");

        // Get current game state
        group.MapGet("/sessions/{sessionId}", (
            string sessionId,
            [FromServices] Game2048Service game2048Service) =>
        {
            var state = game2048Service.GetState(sessionId);
            
            if (state == null)
            {
                return Results.NotFound(new { error = "Game session not found" });
            }

            return Results.Ok(new
            {
                gameState = state,
                undoCount = game2048Service.GetUndoCount(sessionId)
            });
        })
        .WithName("Get2048GameState")
        .WithSummary("Get current game state");
    }
}
