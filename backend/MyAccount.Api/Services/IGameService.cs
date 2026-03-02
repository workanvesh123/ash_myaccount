namespace MyAccount.Api.Services;

using MyAccount.Api.Models;

public interface IGameService
{
    Task<List<Game>> GetAllGamesAsync();
    Task<Game?> GetGameByIdAsync(string gameId);
    Task<StartGameResponse> StartGameAsync(string userId, string gameId, StartGameRequest request);
    Task<bool> SaveGameStateAsync(string sessionId, SaveGameStateRequest request);
    Task<CompleteGameResponse> CompleteGameAsync(string sessionId, CompleteGameRequest request);
    Task<GameHistoryResponse> GetGameHistoryAsync(string userId, int page, int pageSize, string? gameId = null);
    Task<GameSession?> GetSessionAsync(string sessionId);
}
