namespace MyAccount.Api.Services;

using MyAccount.Api.Models;

public interface ISudokuService
{
    Task<StartSudokuResponse> StartGameAsync(string userId, StartSudokuRequest request);
    Task<SetCellValueResponse> SetCellValueAsync(string sessionId, SetCellValueRequest request);
    Task<GetHintResponse> GetHintAsync(string sessionId);
    Task<SudokuGameState?> GetGameStateAsync(string sessionId);
    Task<ValidateBoardResponse> ValidateBoardAsync(string sessionId);
    Task<bool> ToggleNoteAsync(string sessionId, ToggleNoteRequest request);
}
