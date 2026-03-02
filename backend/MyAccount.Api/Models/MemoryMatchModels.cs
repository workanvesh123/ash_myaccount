namespace MyAccount.Api.Models;

public class Card
{
    public int Id { get; set; }
    public string Value { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public bool IsFlipped { get; set; }
    public bool IsMatched { get; set; }
}

public class MemoryMatchGameState
{
    public List<Card> Cards { get; set; } = new();
    public List<int> FlippedCardIds { get; set; } = new();
    public List<int> MatchedCardIds { get; set; } = new();
    public int Moves { get; set; }
    public int ElapsedTime { get; set; }
    public string Theme { get; set; } = "Animals";
    public string Difficulty { get; set; } = "Medium";
}

public class StartMemoryMatchRequest
{
    public string Difficulty { get; set; } = "Medium";
    public string Theme { get; set; } = "Animals";
}

public class StartMemoryMatchResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string GameId { get; set; } = "memory-match";
    public string UserId { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public MemoryMatchGameState GameState { get; set; } = new();
    public string Status { get; set; } = "InProgress";
}

public class FlipCardRequest
{
    public int CardId { get; set; }
}

public class FlipCardResponse
{
    public bool Success { get; set; }
    public Card? Card { get; set; }
    public bool IsMatch { get; set; }
    public List<int> MatchedCardIds { get; set; } = new();
    public int Moves { get; set; }
    public bool IsGameComplete { get; set; }
}
