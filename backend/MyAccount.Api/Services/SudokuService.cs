namespace MyAccount.Api.Services;

using MyAccount.Api.Models;

public class SudokuService : ISudokuService
{
    private readonly IGameService _gameService;
    private readonly Dictionary<string, SudokuGameState> _gameStates;
    private const int MaxHints = 3;
    
    public SudokuService(IGameService gameService)
    {
        _gameService = gameService;
        _gameStates = new Dictionary<string, SudokuGameState>();
    }
    
    public async Task<StartSudokuResponse> StartGameAsync(string userId, StartSudokuRequest request)
    {
        // Start base game session
        var baseRequest = new StartGameRequest
        {
            Difficulty = request.Difficulty,
            Options = new Dictionary<string, object>()
        };
        
        var baseResponse = await _gameService.StartGameAsync(userId, "sudoku", baseRequest);
        
        // Generate Sudoku puzzle
        var (puzzle, solution) = GeneratePuzzle(request.Difficulty);
        
        // Create game state
        var gameState = new SudokuGameState
        {
            Cells = puzzle,
            Solution = solution,
            Difficulty = request.Difficulty,
            Mistakes = 0,
            HintsUsed = 0,
            ElapsedTime = 0,
            IsCompleted = false
        };
        
        _gameStates[baseResponse.SessionId] = gameState;
        
        return new StartSudokuResponse
        {
            SessionId = baseResponse.SessionId,
            GameId = "sudoku",
            UserId = userId,
            Difficulty = request.Difficulty,
            StartedAt = baseResponse.StartedAt,
            GameState = gameState,
            Status = "InProgress"
        };
    }
    
    public Task<SetCellValueResponse> SetCellValueAsync(string sessionId, SetCellValueRequest request)
    {
        if (!_gameStates.ContainsKey(sessionId))
            throw new Exception("Game session not found");
        
        var gameState = _gameStates[sessionId];
        var cell = gameState.Cells.FirstOrDefault(c => c.Row == request.Row && c.Col == request.Col);
        
        if (cell == null)
            throw new Exception("Cell not found");
        
        if (cell.IsFixed)
            throw new Exception("Cannot modify fixed cell");
        
        // Set or clear the value
        cell.UserValue = request.Value;
        
        // Validate the move
        var correctValue = gameState.Solution[request.Row][request.Col];
        var isValid = request.Value == null || request.Value == correctValue;
        
        if (!isValid && request.Value != null)
        {
            gameState.Mistakes++;
        }
        
        cell.IsValid = isValid || request.Value == null;
        
        // Check if puzzle is completed
        var isCompleted = CheckCompletion(gameState);
        gameState.IsCompleted = isCompleted;
        
        return Task.FromResult(new SetCellValueResponse
        {
            Success = true,
            IsValid = isValid,
            IsCompleted = isCompleted,
            Mistakes = gameState.Mistakes,
            AffectedCells = new List<SudokuCell> { cell }
        });
    }
    
    public Task<GetHintResponse> GetHintAsync(string sessionId)
    {
        if (!_gameStates.ContainsKey(sessionId))
            throw new Exception("Game session not found");
        
        var gameState = _gameStates[sessionId];
        
        if (gameState.HintsUsed >= MaxHints)
        {
            return Task.FromResult(new GetHintResponse
            {
                Success = false,
                Message = "No hints remaining",
                HintsRemaining = 0
            });
        }
        
        // Find an empty cell
        var emptyCell = gameState.Cells
            .Where(c => !c.IsFixed && c.UserValue == null)
            .OrderBy(_ => Random.Shared.Next())
            .FirstOrDefault();
        
        if (emptyCell == null)
        {
            return Task.FromResult(new GetHintResponse
            {
                Success = false,
                Message = "No empty cells to hint",
                HintsRemaining = MaxHints - gameState.HintsUsed
            });
        }
        
        var correctValue = gameState.Solution[emptyCell.Row][emptyCell.Col];
        emptyCell.UserValue = correctValue;
        emptyCell.IsValid = true;
        gameState.HintsUsed++;
        
        return Task.FromResult(new GetHintResponse
        {
            Success = true,
            Row = emptyCell.Row,
            Col = emptyCell.Col,
            Value = correctValue,
            HintsRemaining = MaxHints - gameState.HintsUsed,
            Message = $"Hint used! {MaxHints - gameState.HintsUsed} remaining"
        });
    }
    
    public Task<SudokuGameState?> GetGameStateAsync(string sessionId)
    {
        _gameStates.TryGetValue(sessionId, out var gameState);
        return Task.FromResult(gameState);
    }
    
    public Task<ValidateBoardResponse> ValidateBoardAsync(string sessionId)
    {
        if (!_gameStates.ContainsKey(sessionId))
            throw new Exception("Game session not found");
        
        var gameState = _gameStates[sessionId];
        var errors = new List<string>();
        
        // Validate all filled cells
        foreach (var cell in gameState.Cells.Where(c => c.UserValue != null))
        {
            var correctValue = gameState.Solution[cell.Row][cell.Col];
            if (cell.UserValue != correctValue)
            {
                errors.Add($"Cell ({cell.Row + 1}, {cell.Col + 1}) is incorrect");
                cell.IsValid = false;
            }
            else
            {
                cell.IsValid = true;
            }
        }
        
        return Task.FromResult(new ValidateBoardResponse
        {
            IsValid = errors.Count == 0,
            Errors = errors,
            Mistakes = gameState.Mistakes
        });
    }
    
    public Task<bool> ToggleNoteAsync(string sessionId, ToggleNoteRequest request)
    {
        if (!_gameStates.ContainsKey(sessionId))
            return Task.FromResult(false);
        
        var gameState = _gameStates[sessionId];
        var cell = gameState.Cells.FirstOrDefault(c => c.Row == request.Row && c.Col == request.Col);
        
        if (cell == null || cell.IsFixed)
            return Task.FromResult(false);
        
        if (cell.Notes.Contains(request.Note))
            cell.Notes.Remove(request.Note);
        else
            cell.Notes.Add(request.Note);
        
        return Task.FromResult(true);
    }
    
    private bool CheckCompletion(SudokuGameState gameState)
    {
        // Check if all cells are filled correctly
        foreach (var cell in gameState.Cells)
        {
            var expectedValue = gameState.Solution[cell.Row][cell.Col];
            var actualValue = cell.IsFixed ? cell.Value : cell.UserValue;
            
            if (actualValue == null || actualValue != expectedValue)
                return false;
        }
        
        return true;
    }
    
    private (List<SudokuCell> puzzle, List<int[]> solution) GeneratePuzzle(string difficulty)
    {
        // Generate a complete valid Sudoku board
        var solution = GenerateCompleteSudoku();
        
        // Determine how many cells to remove based on difficulty
        var cellsToRemove = difficulty switch
        {
            "Easy" => 35,      // ~39% filled
            "Medium" => 45,    // ~50% filled
            "Hard" => 52,      // ~58% filled
            "Expert" => 58,    // ~64% filled
            _ => 45
        };
        
        // Create puzzle by removing cells
        var puzzle = new List<SudokuCell>();
        var cellsRemoved = 0;
        var attempts = 0;
        var maxAttempts = 100;
        
        // First, add all cells as fixed
        for (int row = 0; row < 9; row++)
        {
            for (int col = 0; col < 9; col++)
            {
                puzzle.Add(new SudokuCell
                {
                    Row = row,
                    Col = col,
                    Value = solution[row][col],
                    IsFixed = true,
                    IsValid = true
                });
            }
        }
        
        // Remove cells randomly
        while (cellsRemoved < cellsToRemove && attempts < maxAttempts)
        {
            var row = Random.Shared.Next(9);
            var col = Random.Shared.Next(9);
            var cell = puzzle.First(c => c.Row == row && c.Col == col);
            
            if (!cell.IsFixed)
            {
                attempts++;
                continue;
            }
            
            cell.IsFixed = false;
            cell.Value = 0;
            cellsRemoved++;
            attempts = 0;
        }
        
        return (puzzle, solution);
    }
    
    private List<int[]> GenerateCompleteSudoku()
    {
        var board = new int[9][];
        for (int i = 0; i < 9; i++)
            board[i] = new int[9];
        
        // Fill diagonal 3x3 boxes first (they don't affect each other)
        FillDiagonalBoxes(board);
        
        // Fill remaining cells
        SolveSudoku(board, 0, 0);
        
        return board.ToList();
    }
    
    private void FillDiagonalBoxes(int[][] board)
    {
        for (int box = 0; box < 9; box += 3)
        {
            FillBox(board, box, box);
        }
    }
    
    private void FillBox(int[][] board, int row, int col)
    {
        var numbers = Enumerable.Range(1, 9).OrderBy(_ => Random.Shared.Next()).ToList();
        var index = 0;
        
        for (int i = 0; i < 3; i++)
        {
            for (int j = 0; j < 3; j++)
            {
                board[row + i][col + j] = numbers[index++];
            }
        }
    }
    
    private bool SolveSudoku(int[][] board, int row, int col)
    {
        if (row == 9)
            return true;
        
        if (col == 9)
            return SolveSudoku(board, row + 1, 0);
        
        if (board[row][col] != 0)
            return SolveSudoku(board, row, col + 1);
        
        var numbers = Enumerable.Range(1, 9).OrderBy(_ => Random.Shared.Next()).ToList();
        
        foreach (var num in numbers)
        {
            if (IsSafe(board, row, col, num))
            {
                board[row][col] = num;
                
                if (SolveSudoku(board, row, col + 1))
                    return true;
                
                board[row][col] = 0;
            }
        }
        
        return false;
    }
    
    private bool IsSafe(int[][] board, int row, int col, int num)
    {
        // Check row
        for (int x = 0; x < 9; x++)
            if (board[row][x] == num)
                return false;
        
        // Check column
        for (int x = 0; x < 9; x++)
            if (board[x][col] == num)
                return false;
        
        // Check 3x3 box
        int startRow = row - row % 3;
        int startCol = col - col % 3;
        
        for (int i = 0; i < 3; i++)
            for (int j = 0; j < 3; j++)
                if (board[i + startRow][j + startCol] == num)
                    return false;
        
        return true;
    }
}
