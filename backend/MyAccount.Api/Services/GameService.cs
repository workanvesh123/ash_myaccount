namespace MyAccount.Api.Services;

using MyAccount.Api.Models;
using System.Text.Json;

public class GameService : IGameService
{
    private readonly List<Game> _games;
    private readonly Dictionary<string, GameSession> _sessions;
    
    public GameService()
    {
        _games = InitializeGames();
        _sessions = new Dictionary<string, GameSession>();
    }
    
    private List<Game> InitializeGames()
    {
        return new List<Game>
        {
            new Game
            {
                Id = "memory-match",
                Name = "Memory Match",
                Description = "Find matching pairs of cards",
                Icon = "🃏",
                Category = "Memory",
                MinPlayers = 1,
                MaxPlayers = 1,
                AverageDuration = 180,
                Difficulty = new List<string> { "Easy", "Medium", "Hard" },
                IsActive = true
            },
            new Game
            {
                Id = "sudoku",
                Name = "Sudoku",
                Description = "Classic number puzzle game",
                Icon = "🔢",
                Category = "Logic",
                MinPlayers = 1,
                MaxPlayers = 1,
                AverageDuration = 600,
                Difficulty = new List<string> { "Easy", "Medium", "Hard" },
                IsActive = true
            },
            new Game
            {
                Id = "word-search",
                Name = "Word Search",
                Description = "Find hidden words in the grid",
                Icon = "📝",
                Category = "Word",
                MinPlayers = 1,
                MaxPlayers = 1,
                AverageDuration = 300,
                Difficulty = new List<string> { "Easy", "Medium", "Hard" },
                IsActive = true
            },
            new Game
            {
                Id = "2048",
                Name = "2048",
                Description = "Combine tiles to reach 2048",
                Icon = "🎯",
                Category = "Puzzle",
                MinPlayers = 1,
                MaxPlayers = 1,
                AverageDuration = 420,
                Difficulty = new List<string> { "Classic" },
                IsActive = true
            },
            new Game
            {
                Id = "tic-tac-toe",
                Name = "Tic-Tac-Toe",
                Description = "Classic X and O game",
                Icon = "❌",
                Category = "Strategy",
                MinPlayers = 2,
                MaxPlayers = 2,
                AverageDuration = 120,
                Difficulty = new List<string> { "Easy", "Medium", "Hard" },
                IsActive = true
            }
        };
    }
    
    public Task<List<Game>> GetAllGamesAsync()
    {
        return Task.FromResult(_games.Where(g => g.IsActive).ToList());
    }
    
    public Task<Game?> GetGameByIdAsync(string gameId)
    {
        return Task.FromResult(_games.FirstOrDefault(g => g.Id == gameId));
    }
    
    public Task<StartGameResponse> StartGameAsync(string userId, string gameId, StartGameRequest request)
    {
        var session = new GameSession
        {
            SessionId = Guid.NewGuid().ToString(),
            UserId = userId,
            GameId = gameId,
            Difficulty = request.Difficulty,
            StartedAt = DateTime.UtcNow,
            Status = "InProgress"
        };
        
        _sessions[session.SessionId] = session;
        
        var response = new StartGameResponse
        {
            SessionId = session.SessionId,
            GameId = session.GameId,
            UserId = session.UserId,
            Difficulty = session.Difficulty,
            StartedAt = session.StartedAt,
            GameState = new { message = "Game started - specific game state will be added per game" },
            Status = session.Status
        };
        
        return Task.FromResult(response);
    }
    
    public Task<bool> SaveGameStateAsync(string sessionId, SaveGameStateRequest request)
    {
        if (!_sessions.ContainsKey(sessionId))
            return Task.FromResult(false);
        
        _sessions[sessionId].GameState = JsonSerializer.Serialize(request.GameState);
        return Task.FromResult(true);
    }
    
    public Task<CompleteGameResponse> CompleteGameAsync(string sessionId, CompleteGameRequest request)
    {
        if (!_sessions.ContainsKey(sessionId))
            throw new Exception("Session not found");
        
        var session = _sessions[sessionId];
        session.IsCompleted = true;
        session.CompletedAt = DateTime.UtcNow;
        session.Duration = request.ElapsedTime;
        
        // Basic scoring (will be enhanced per game)
        var baseScore = 100;
        var timeBonus = Math.Max(0, 300 - request.ElapsedTime);
        var penalty = request.Stats.GetValueOrDefault("penalty", 0);
        var finalScore = Math.Max(0, baseScore + timeBonus - penalty);
        
        session.Score = finalScore;
        
        var response = new CompleteGameResponse
        {
            Success = true,
            IsCorrect = true,
            Score = finalScore,
            Breakdown = new GameScore
            {
                BaseScore = baseScore,
                TimeBonus = timeBonus,
                Penalty = penalty,
                FinalScore = finalScore
            },
            Achievements = new List<object>(),
            NewRank = 0,
            PersonalBest = false
        };
        
        return Task.FromResult(response);
    }
    
    public Task<GameHistoryResponse> GetGameHistoryAsync(string userId, int page, int pageSize, string? gameId = null)
    {
        var query = _sessions.Values.Where(s => s.UserId == userId);
        
        if (!string.IsNullOrEmpty(gameId))
            query = query.Where(s => s.GameId == gameId);
        
        var totalCount = query.Count();
        var sessions = query
            .OrderByDescending(s => s.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
        
        return Task.FromResult(new GameHistoryResponse
        {
            Sessions = sessions,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }
    
    public Task<GameSession?> GetSessionAsync(string sessionId)
    {
        _sessions.TryGetValue(sessionId, out var session);
        return Task.FromResult(session);
    }
}
