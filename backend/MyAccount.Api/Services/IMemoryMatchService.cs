namespace MyAccount.Api.Services;

using MyAccount.Api.Models;

public interface IMemoryMatchService
{
    Task<StartMemoryMatchResponse> StartGameAsync(string userId, StartMemoryMatchRequest request);
    Task<FlipCardResponse> FlipCardAsync(string sessionId, int cardId);
    Task<MemoryMatchGameState?> GetGameStateAsync(string sessionId);
}
