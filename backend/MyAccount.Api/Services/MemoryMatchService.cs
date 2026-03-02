namespace MyAccount.Api.Services;

using MyAccount.Api.Models;
using System.Text.Json;

public class MemoryMatchService : IMemoryMatchService
{
    private readonly IGameService _gameService;
    private readonly Dictionary<string, MemoryMatchGameState> _gameStates;
    
    public MemoryMatchService(IGameService gameService)
    {
        _gameService = gameService;
        _gameStates = new Dictionary<string, MemoryMatchGameState>();
    }
    
    public async Task<StartMemoryMatchResponse> StartGameAsync(string userId, StartMemoryMatchRequest request)
    {
        // Start base game session
        var baseRequest = new StartGameRequest
        {
            Difficulty = request.Difficulty,
            Options = new Dictionary<string, object> { { "theme", request.Theme } }
        };
        
        var baseResponse = await _gameService.StartGameAsync(userId, "memory-match", baseRequest);
        
        // Generate cards
        var cards = GenerateCards(request.Difficulty, request.Theme);
        
        // Create game state
        var gameState = new MemoryMatchGameState
        {
            Cards = cards,
            FlippedCardIds = new List<int>(),
            MatchedCardIds = new List<int>(),
            Moves = 0,
            ElapsedTime = 0,
            Theme = request.Theme,
            Difficulty = request.Difficulty
        };
        
        _gameStates[baseResponse.SessionId] = gameState;
        
        return new StartMemoryMatchResponse
        {
            SessionId = baseResponse.SessionId,
            GameId = "memory-match",
            UserId = userId,
            Difficulty = request.Difficulty,
            Theme = request.Theme,
            StartedAt = baseResponse.StartedAt,
            GameState = gameState,
            Status = "InProgress"
        };
    }
    
    public Task<FlipCardResponse> FlipCardAsync(string sessionId, int cardId)
    {
        if (!_gameStates.ContainsKey(sessionId))
            throw new Exception("Game session not found");
        
        var gameState = _gameStates[sessionId];
        var card = gameState.Cards.FirstOrDefault(c => c.Id == cardId);
        
        if (card == null)
            throw new Exception("Card not found");
        
        if (card.IsMatched || gameState.FlippedCardIds.Contains(cardId))
            throw new Exception("Card already flipped or matched");
        
        // Flip the card
        card.IsFlipped = true;
        gameState.FlippedCardIds.Add(cardId);
        
        var response = new FlipCardResponse
        {
            Success = true,
            Card = card,
            IsMatch = false,
            MatchedCardIds = new List<int>(gameState.MatchedCardIds),
            Moves = gameState.Moves,
            IsGameComplete = false
        };
        
        // Check if we have 2 flipped cards
        if (gameState.FlippedCardIds.Count == 2)
        {
            gameState.Moves++;
            response.Moves = gameState.Moves;
            
            var firstCard = gameState.Cards.First(c => c.Id == gameState.FlippedCardIds[0]);
            var secondCard = gameState.Cards.First(c => c.Id == gameState.FlippedCardIds[1]);
            
            // Check for match
            if (firstCard.Value == secondCard.Value)
            {
                // Match found!
                firstCard.IsMatched = true;
                secondCard.IsMatched = true;
                gameState.MatchedCardIds.Add(firstCard.Id);
                gameState.MatchedCardIds.Add(secondCard.Id);
                
                response.IsMatch = true;
                response.MatchedCardIds = new List<int>(gameState.MatchedCardIds);
                
                // Check if game is complete
                if (gameState.MatchedCardIds.Count == gameState.Cards.Count)
                {
                    response.IsGameComplete = true;
                }
            }
            
            // Reset flipped cards (client will handle the delay)
            gameState.FlippedCardIds.Clear();
        }
        
        return Task.FromResult(response);
    }
    
    public Task<MemoryMatchGameState?> GetGameStateAsync(string sessionId)
    {
        _gameStates.TryGetValue(sessionId, out var gameState);
        return Task.FromResult(gameState);
    }
    
    private List<Card> GenerateCards(string difficulty, string theme)
    {
        var pairCount = difficulty switch
        {
            "Easy" => 8,    // 4x4 grid
            "Medium" => 18,  // 6x6 grid
            "Hard" => 32,    // 8x8 grid
            _ => 18
        };
        
        var icons = GetThemeIcons(theme);
        var selectedIcons = icons.OrderBy(_ => Random.Shared.Next())
                                 .Take(pairCount)
                                 .ToList();
        
        var cards = new List<Card>();
        int id = 0;
        
        foreach (var icon in selectedIcons)
        {
            cards.Add(new Card { Id = id++, Value = icon, Icon = icon, IsFlipped = false, IsMatched = false });
            cards.Add(new Card { Id = id++, Value = icon, Icon = icon, IsFlipped = false, IsMatched = false });
        }
        
        // Shuffle cards
        return cards.OrderBy(_ => Random.Shared.Next()).ToList();
    }
    
    private List<string> GetThemeIcons(string theme)
    {
        return theme switch
        {
            "Animals" => new List<string> { "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗" },
            "Emojis" => new List<string> { "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏" },
            "Flags" => new List<string> { "🇺🇸", "🇬🇧", "🇫🇷", "🇩🇪", "🇮🇹", "🇪🇸", "🇨🇦", "🇦🇺", "🇯🇵", "🇨🇳", "🇰🇷", "🇧🇷", "🇮🇳", "🇷🇺", "🇲🇽", "🇿🇦", "🇦🇷", "🇨🇱", "🇨🇴", "🇵🇪", "🇻🇪", "🇪🇨", "🇧🇴", "🇵🇾", "🇺🇾", "🇬🇾", "🇸🇷", "🇬🇫", "🇧🇿", "🇬🇹", "🇭🇳", "🇸🇻" },
            "Food" => new List<string> { "🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🧇", "🥞", "🧈", "🍞", "🥐", "🥨", "🥯", "🥖", "🧀", "🥗", "🥙", "🥪", "🌮", "🌯", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🍤" },
            _ => new List<string> { "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔" }
        };
    }
}
