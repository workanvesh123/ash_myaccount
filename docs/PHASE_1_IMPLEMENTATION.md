# 🎮 Phase 1: Core Game Infrastructure - Step-by-Step Guide

## 🎯 Goal

Build the foundation for the gaming platform:
- Backend game models and services
- Frontend game lobby
- Game routing
- Basic game infrastructure

**Time Estimate:** 4-6 hours

---

## 📋 Checklist

- [ ] Backend: Create game models
- [ ] Backend: Create game service interface
- [ ] Backend: Implement game service
- [ ] Backend: Create game endpoints
- [ ] Backend: Register services in Program.cs
- [ ] Frontend: Create game service
- [ ] Frontend: Create game-state service
- [ ] Frontend: Create game lobby component
- [ ] Frontend: Create game card component
- [ ] Frontend: Update routing
- [ ] Frontend: Update header navigation
- [ ] Test: Verify game lobby loads
- [ ] Test: Verify navigation works

---

## 🔨 Step-by-Step Implementation

### Step 1: Backend Models (30 minutes)

Create `backend/MyAccount.Api/Models/GameModels.cs`:

```csharp
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
    public int HintPenalty { get; set; }
    public int MistakePenalty { get; set; }
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
    public int HintsUsed { get; set; }
    public int MistakesMade { get; set; }
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
```

---

### Step 2: Backend Service Interface (15 minutes)

Create `backend/MyAccount.Api/Services/IGameService.cs`:

```csharp
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
```

---

### Step 3: Backend Service Implementation (45 minutes)

Create `backend/MyAccount.Api/Services/GameService.cs`:

```csharp
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
        var hintPenalty = request.HintsUsed * 10;
        var mistakePenalty = request.MistakesMade * 20;
        var finalScore = Math.Max(0, baseScore + timeBonus - hintPenalty - mistakePenalty);
        
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
                HintPenalty = hintPenalty,
                MistakePenalty = mistakePenalty,
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
```

---

### Step 4: Backend Endpoints (30 minutes)

Create `backend/MyAccount.Api/Features/Games/GameEndpoints.cs`:

```csharp
namespace MyAccount.Api.Features.Games;

using Microsoft.AspNetCore.Mvc;
using MyAccount.Api.Models;
using MyAccount.Api.Services;
using MyAccount.Shared.Logging;

public static class GameEndpoints
{
    public static void MapGameEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/games").WithTags("Games");
        
        group.MapGet("/", GetAllGames);
        group.MapGet("/{gameId}", GetGameById);
        group.MapPost("/{gameId}/start", StartGame);
        group.MapPut("/sessions/{sessionId}/state", SaveGameState);
        group.MapPost("/sessions/{sessionId}/complete", CompleteGame);
        group.MapGet("/history", GetGameHistory);
    }
    
    private static async Task<IResult> GetAllGames(
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("GameEndpoints");
        logger.Information("Getting all games");
        
        var games = await gameService.GetAllGamesAsync();
        return Results.Ok(new { games });
    }
    
    private static async Task<IResult> GetGameById(
        string gameId,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("GameEndpoints");
        logger.Information("Getting game {GameId}", gameId);
        
        var game = await gameService.GetGameByIdAsync(gameId);
        if (game == null)
            return Results.NotFound(new { error = "Game not found" });
        
        return Results.Ok(game);
    }
    
    private static async Task<IResult> StartGame(
        string gameId,
        [FromBody] StartGameRequest request,
        [FromHeader(Name = "Authorization")] string authorization,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("GameEndpoints");
        var userId = authorization.Replace("Bearer ", "");
        
        logger.Information("User {UserId} starting game {GameId}", userId, gameId);
        
        var response = await gameService.StartGameAsync(userId, gameId, request);
        return Results.Ok(response);
    }
    
    private static async Task<IResult> SaveGameState(
        string sessionId,
        [FromBody] SaveGameStateRequest request,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("GameEndpoints");
        logger.Information("Saving game state for session {SessionId}", sessionId);
        
        var success = await gameService.SaveGameStateAsync(sessionId, request);
        if (!success)
            return Results.NotFound(new { error = "Session not found" });
        
        return Results.Ok(new { success = true, savedAt = DateTime.UtcNow });
    }
    
    private static async Task<IResult> CompleteGame(
        string sessionId,
        [FromBody] CompleteGameRequest request,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("GameEndpoints");
        logger.Information("Completing game session {SessionId}", sessionId);
        
        var response = await gameService.CompleteGameAsync(sessionId, request);
        return Results.Ok(response);
    }
    
    private static async Task<IResult> GetGameHistory(
        [FromHeader(Name = "Authorization")] string authorization,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? gameId = null,
        IGameService gameService,
        ILoggerAdapterFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger("GameEndpoints");
        var userId = authorization.Replace("Bearer ", "");
        
        logger.Information("Getting game history for user {UserId}", userId);
        
        var response = await gameService.GetGameHistoryAsync(userId, page, pageSize, gameId);
        return Results.Ok(response);
    }
}
```

---

### Step 5: Register Services (10 minutes)

Update `backend/MyAccount.Api/Program.cs`:

```csharp
// Add this line with other service registrations
builder.Services.AddSingleton<IGameService, GameService>();

// Add this line with other endpoint mappings
v1Group.MapGameEndpoints();
```

Add using statement at top:
```csharp
using MyAccount.Api.Features.Games;
```

---

### Step 6: Test Backend (10 minutes)

1. Run backend: `dotnet run` in `backend/MyAccount.Api`
2. Open Swagger: `http://localhost:5000/swagger`
3. Test GET `/api/v1/games` - should return 5 games
4. Test POST `/api/v1/games/sudoku/start` - should create session

---

### Step 7: Frontend Game Service (30 minutes)

Create `frontend/src/app/core/services/game.service.ts`:

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  averageDuration: number;
  difficulty: string[];
  isActive: boolean;
}

export interface GameSession {
  sessionId: string;
  gameId: string;
  userId: string;
  difficulty: string;
  startedAt: string;
  gameState: any;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  
  games = signal<Game[]>([]);
  currentSession = signal<GameSession | null>(null);
  
  async getAllGames(): Promise<Game[]> {
    const response = await firstValueFrom(
      this.http.get<{ games: Game[] }>(`${environment.apiUrl}/games`)
    );
    this.games.set(response.games);
    return response.games;
  }
  
  async getGameById(gameId: string): Promise<Game> {
    return firstValueFrom(
      this.http.get<Game>(`${environment.apiUrl}/games/${gameId}`)
    );
  }
  
  async startGame(gameId: string, difficulty: string): Promise<GameSession> {
    const response = await firstValueFrom(
      this.http.post<GameSession>(`${environment.apiUrl}/games/${gameId}/start`, {
        difficulty,
        options: {}
      })
    );
    this.currentSession.set(response);
    return response;
  }
  
  async saveGameState(sessionId: string, gameState: any): Promise<void> {
    await firstValueFrom(
      this.http.put(`${environment.apiUrl}/games/sessions/${sessionId}/state`, {
        gameState
      })
    );
  }
  
  async completeGame(sessionId: string, data: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${environment.apiUrl}/games/sessions/${sessionId}/complete`, data)
    );
  }
  
  async getGameHistory(page: number = 1, pageSize: number = 20): Promise<any> {
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/games/history`, {
        params: { page: page.toString(), pageSize: pageSize.toString() }
      })
    );
  }
}
```

---

### Step 8: Frontend Game State Service (20 minutes)

Create `frontend/src/app/core/services/game-state.service.ts`:

```typescript
import { Injectable, inject } from '@angular/core';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private gameService = inject(GameService);
  private autoSaveInterval: any;
  
  startAutoSave(sessionId: string, getState: () => any, intervalMs: number = 30000) {
    this.stopAutoSave();
    
    this.autoSaveInterval = setInterval(async () => {
      const state = getState();
      await this.gameService.saveGameState(sessionId, state);
      console.log('[GameState] Auto-saved at', new Date().toLocaleTimeString());
    }, intervalMs);
  }
  
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
  
  async saveState(sessionId: string, state: any) {
    await this.gameService.saveGameState(sessionId, state);
  }
}
```

---

### Step 9: Game Card Component (30 minutes)

Create `frontend/src/app/shared/components/game-card/game-card.component.ts`:

```typescript
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../../../core/services/game.service';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-card" [routerLink]="['/games', game().id]">
      <div class="game-icon">{{ game().icon }}</div>
      <h3>{{ game().name }}</h3>
      <p>{{ game().description }}</p>
      <div class="game-meta">
        <span class="category">{{ game().category }}</span>
        <span class="duration">⏱️ ~{{ formatDuration(game().averageDuration) }}</span>
      </div>
      <button class="play-btn">Play Now</button>
    </div>
  `,
  styles: [`
    .game-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .game-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary);
    }
    
    .game-icon {
      font-size: 3rem;
      text-align: center;
    }
    
    h3 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--color-text-primary);
      text-align: center;
    }
    
    p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      text-align: center;
      flex-grow: 1;
    }
    
    .game-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }
    
    .category {
      background: var(--color-primary);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }
    
    .play-btn {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    
    .play-btn:hover {
      background: var(--color-primary-hover);
    }
  `]
})
export class GameCardComponent {
  game = input.required<Game>();
  
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  }
}
```

---

### Step 10: Game Lobby Component (30 minutes)

Create `frontend/src/app/features/games/game-lobby/game-lobby.component.ts`:

```typescript
import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../core/services/game.service';
import { GameCardComponent } from '../../../shared/components/game-card/game-card.component';

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [CommonModule, GameCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-lobby">
      <header class="lobby-header">
        <h1>🎮 Game Lobby</h1>
        <p>Choose a game to play</p>
      </header>
      
      @if (loading()) {
        <div class="loading">Loading games...</div>
      } @else {
        <div class="games-grid">
          @for (game of gameService.games(); track game.id) {
            <app-game-card [game]="game" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .game-lobby {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    
    .lobby-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    
    .lobby-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      color: var(--color-text-primary);
    }
    
    .lobby-header p {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    
    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--color-text-secondary);
    }
    
    @media (max-width: 768px) {
      .games-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }
    }
  `]
})
export class GameLobbyComponent implements OnInit {
  gameService = inject(GameService);
  loading = signal(false);
  
  async ngOnInit() {
    this.loading.set(true);
    await this.gameService.getAllGames();
    this.loading.set(false);
  }
}
```

---

### Step 11: Update Routing (15 minutes)

Update `frontend/src/app/app.routes.ts`:

```typescript
// Add this import
import { GameLobbyComponent } from './features/games/game-lobby/game-lobby.component';

// Add this route
{
  path: 'games',
  component: GameLobbyComponent
},
```

---

### Step 12: Update Header Navigation (10 minutes)

Update `frontend/src/app/shared/components/header/header.component.ts`:

Add "Games" link to navigation:

```typescript
<a routerLink="/games" class="nav-link">Games</a>
```

---

### Step 13: Test Frontend (15 minutes)

1. Run frontend: `npm start` in `frontend`
2. Navigate to `http://localhost:4200/games`
3. Should see 5 game cards
4. Click a game card (will show 404 for now - that's OK!)

---

## ✅ Phase 1 Complete!

You now have:
- ✅ Backend game infrastructure
- ✅ Frontend game lobby
- ✅ Game cards displaying
- ✅ Navigation working
- ✅ Auto-save service ready

**Next:** Move to Phase 2 to implement your first game (Sudoku recommended)

---

## 🐛 Troubleshooting

**Issue:** Games not loading
- Check backend is running
- Check browser console for errors
- Verify API URL in environment.ts

**Issue:** Game cards not displaying
- Check gameService.games() signal
- Verify component imports
- Check CSS variables are defined

**Issue:** Navigation not working
- Verify routes are registered
- Check RouterLink imports
- Verify header component updated

---

**Time to build your first game!** 🎮

