namespace MyAccount.Api.Models;

public class Game
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int MinPlayers { get; set; } = 1;
    public int MaxPlayers { get; set; } = 1;
    public int AverageDuration { get; set; }
    public List<string> Difficulty { get; set; } = new();
    public bool IsActive { get; set; } = true;
}

public class GameSession
{
    public string SessionId { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string GameId { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public int Duration { get; set; }
    public int Score { get; set; }
    public bool IsCompleted { get; set; }
    public string GameState { get; set; } = "{}";
    public string Status { get; set; } = "InProgress";
}

public class GameScore
{
    public int BaseScore { get; set; }
    public int TimeBonus { get; set; }
    public int Penalty { get; set; }
    public int FinalScore { get; set; }
}

public class StartGameRequest
{
    public string Difficulty { get; set; } = "Medium";
    public Dictionary<string, object> Options { get; set; } = new();
}

public class StartGameResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string GameId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Difficulty { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public object GameState { get; set; } = new();
    public string Status { get; set; } = string.Empty;
}

public class SaveGameStateRequest
{
    public object GameState { get; set; } = new();
}

public class CompleteGameRequest
{
    public object CompletedState { get; set; } = new();
    public int ElapsedTime { get; set; }
    public Dictionary<string, int> Stats { get; set; } = new();
}

public class CompleteGameResponse
{
    public bool Success { get; set; }
    public bool IsCorrect { get; set; }
    public int Score { get; set; }
    public GameScore Breakdown { get; set; } = new();
    public List<object> Achievements { get; set; } = new();
    public int NewRank { get; set; }
    public bool PersonalBest { get; set; }
}

public class GameHistoryResponse
{
    public List<GameSession> Sessions { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
