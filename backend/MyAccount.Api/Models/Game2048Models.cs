namespace MyAccount.Api.Models;

public class Game2048State
{
    public int[][] Grid { get; set; } = new int[4][];
    public int Score { get; set; }
    public int BestScore { get; set; }
    public bool GameOver { get; set; }
    public bool Won { get; set; }
}

public class Game2048MoveRequest
{
    public string Direction { get; set; } = string.Empty; // "up", "down", "left", "right"
}

public class Game2048MoveResponse
{
    public int[][] Grid { get; set; } = new int[4][];
    public int Score { get; set; }
    public int MoveDelta { get; set; }
    public bool GameOver { get; set; }
    public bool Won { get; set; }
    public bool ValidMove { get; set; }
}

public class Game2048UndoRequest
{
    // Empty for now - undo will restore previous state
}

public class Game2048StartResponse
{
    public string SessionId { get; set; } = string.Empty;
    public Game2048State GameState { get; set; } = new();
}
