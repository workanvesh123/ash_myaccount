namespace MyAccount.Api.Features.Games;

using Microsoft.AspNetCore.Mvc;
using MyAccount.Api.Models;
using MyAccount.Api.Services;
using MyAccount.Shared.Logging;

public static class SudokuEndpoints
{
    public static void MapSudokuEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/games/sudoku").WithTags("Sudoku");
        
        group.MapPost("/start", StartSudoku);
        group.MapPost("/sessions/{sessionId}/set-cell", SetCellValue);
        group.MapPost("/sessions/{sessionId}/hint", GetHint);
        group.MapPost("/sessions/{sessionId}/validate", ValidateBoard);
        group.MapPost("/sessions/{sessionId}/toggle-note", ToggleNote);
        group.MapGet("/sessions/{sessionId}/state", GetGameState);
    }
    
    private static async Task<IResult> StartSudoku(
        [FromBody] StartSudokuRequest request,
        [FromHeader(Name = "Authorization")] string authorization,
        ISudokuService sudokuService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(SudokuEndpoints));
        var userId = authorization.Replace("Bearer ", "");
        
        logger.Information("User {UserId} starting Sudoku with difficulty {Difficulty}", 
            userId, request.Difficulty);
        
        try
        {
            var response = await sudokuService.StartGameAsync(userId, request);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error starting Sudoku game");
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    
    private static async Task<IResult> SetCellValue(
        string sessionId,
        [FromBody] SetCellValueRequest request,
        ISudokuService sudokuService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(SudokuEndpoints));
        logger.Information("Setting cell value for session {SessionId}: ({Row}, {Col}) = {Value}", 
            sessionId, request.Row, request.Col, request.Value);
        
        try
        {
            var response = await sudokuService.SetCellValueAsync(sessionId, request);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error setting cell value");
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    
    private static async Task<IResult> GetHint(
        string sessionId,
        ISudokuService sudokuService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(SudokuEndpoints));
        logger.Information("Getting hint for session {SessionId}", sessionId);
        
        try
        {
            var response = await sudokuService.GetHintAsync(sessionId);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error getting hint");
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    
    private static async Task<IResult> ValidateBoard(
        string sessionId,
        ISudokuService sudokuService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(SudokuEndpoints));
        logger.Information("Validating board for session {SessionId}", sessionId);
        
        try
        {
            var response = await sudokuService.ValidateBoardAsync(sessionId);
            return Results.Ok(response);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error validating board");
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    
    private static async Task<IResult> ToggleNote(
        string sessionId,
        [FromBody] ToggleNoteRequest request,
        ISudokuService sudokuService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(SudokuEndpoints));
        logger.Information("Toggling note for session {SessionId}: ({Row}, {Col}) note {Note}", 
            sessionId, request.Row, request.Col, request.Note);
        
        try
        {
            var success = await sudokuService.ToggleNoteAsync(sessionId, request);
            return Results.Ok(new { success });
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error toggling note");
            return Results.BadRequest(new { error = ex.Message });
        }
    }
    
    private static async Task<IResult> GetGameState(
        string sessionId,
        ISudokuService sudokuService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger(typeof(SudokuEndpoints));
        logger.Information("Getting game state for session {SessionId}", sessionId);
        
        try
        {
            var gameState = await sudokuService.GetGameStateAsync(sessionId);
            if (gameState == null)
                return Results.NotFound(new { error = "Game session not found" });
            
            return Results.Ok(gameState);
        }
        catch (Exception ex)
        {
            logger.Error(ex, "Error getting game state");
            return Results.BadRequest(new { error = ex.Message });
        }
    }
}
