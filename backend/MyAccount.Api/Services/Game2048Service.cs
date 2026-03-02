namespace MyAccount.Api.Services;

using MyAccount.Api.Models;

public class Game2048Service
{
    private readonly Dictionary<string, Game2048State> _gameStates = new();
    private readonly Dictionary<string, Stack<Game2048State>> _undoStacks = new();
    private readonly Random _random = new();
    private const int MaxUndos = 3;

    public Game2048State StartNewGame()
    {
        var grid = new int[4][];
        for (int i = 0; i < 4; i++)
        {
            grid[i] = new int[4];
        }

        var state = new Game2048State
        {
            Grid = grid,
            Score = 0,
            BestScore = 0,
            GameOver = false,
            Won = false
        };

        // Add two initial tiles
        AddRandomTile(state);
        AddRandomTile(state);

        return state;
    }

    public void SaveState(string sessionId, Game2048State state)
    {
        _gameStates[sessionId] = CloneState(state);
    }

    public Game2048State? GetState(string sessionId)
    {
        return _gameStates.TryGetValue(sessionId, out var state) ? state : null;
    }

    public Game2048MoveResponse MakeMove(string sessionId, string direction)
    {
        if (!_gameStates.TryGetValue(sessionId, out var state))
        {
            throw new Exception("Game session not found");
        }

        if (state.GameOver)
        {
            return new Game2048MoveResponse
            {
                Grid = state.Grid,
                Score = state.Score,
                GameOver = true,
                Won = state.Won,
                ValidMove = false
            };
        }

        // Save state for undo
        SaveUndoState(sessionId, state);

        var previousScore = state.Score;
        var moved = false;

        switch (direction.ToLower())
        {
            case "up":
                moved = MoveUp(state);
                break;
            case "down":
                moved = MoveDown(state);
                break;
            case "left":
                moved = MoveLeft(state);
                break;
            case "right":
                moved = MoveRight(state);
                break;
        }

        if (moved)
        {
            AddRandomTile(state);
            
            // Check for win condition (2048 tile)
            if (!state.Won && HasTile(state, 2048))
            {
                state.Won = true;
            }

            // Check for game over
            if (!CanMove(state))
            {
                state.GameOver = true;
            }
        }

        return new Game2048MoveResponse
        {
            Grid = state.Grid,
            Score = state.Score,
            MoveDelta = state.Score - previousScore,
            GameOver = state.GameOver,
            Won = state.Won,
            ValidMove = moved
        };
    }

    public bool Undo(string sessionId)
    {
        if (!_undoStacks.TryGetValue(sessionId, out var stack) || stack.Count == 0)
        {
            return false;
        }

        var previousState = stack.Pop();
        _gameStates[sessionId] = previousState;
        return true;
    }

    public int GetUndoCount(string sessionId)
    {
        return _undoStacks.TryGetValue(sessionId, out var stack) ? stack.Count : 0;
    }

    private void SaveUndoState(string sessionId, Game2048State state)
    {
        if (!_undoStacks.ContainsKey(sessionId))
        {
            _undoStacks[sessionId] = new Stack<Game2048State>();
        }

        var stack = _undoStacks[sessionId];
        
        // Limit undo history
        if (stack.Count >= MaxUndos)
        {
            var temp = new Stack<Game2048State>(stack.Reverse().Skip(1));
            _undoStacks[sessionId] = new Stack<Game2048State>(temp.Reverse());
            stack = _undoStacks[sessionId];
        }

        stack.Push(CloneState(state));
    }

    private void AddRandomTile(Game2048State state)
    {
        var emptyCells = new List<(int row, int col)>();
        
        for (int i = 0; i < 4; i++)
        {
            for (int j = 0; j < 4; j++)
            {
                if (state.Grid[i][j] == 0)
                {
                    emptyCells.Add((i, j));
                }
            }
        }

        if (emptyCells.Count > 0)
        {
            var (row, col) = emptyCells[_random.Next(emptyCells.Count)];
            state.Grid[row][col] = _random.Next(10) < 9 ? 2 : 4; // 90% chance of 2, 10% chance of 4
        }
    }

    private bool MoveLeft(Game2048State state)
    {
        bool moved = false;
        
        for (int i = 0; i < 4; i++)
        {
            var row = state.Grid[i];
            var newRow = new int[4];
            int pos = 0;
            int lastMerged = -1;

            for (int j = 0; j < 4; j++)
            {
                if (row[j] != 0)
                {
                    if (pos > 0 && newRow[pos - 1] == row[j] && lastMerged != pos - 1)
                    {
                        newRow[pos - 1] *= 2;
                        state.Score += newRow[pos - 1];
                        lastMerged = pos - 1;
                        moved = true;
                    }
                    else
                    {
                        newRow[pos] = row[j];
                        if (pos != j) moved = true;
                        pos++;
                    }
                }
            }

            state.Grid[i] = newRow;
        }

        return moved;
    }

    private bool MoveRight(Game2048State state)
    {
        bool moved = false;
        
        for (int i = 0; i < 4; i++)
        {
            var row = state.Grid[i];
            var newRow = new int[4];
            int pos = 3;
            int lastMerged = -1;

            for (int j = 3; j >= 0; j--)
            {
                if (row[j] != 0)
                {
                    if (pos < 3 && newRow[pos + 1] == row[j] && lastMerged != pos + 1)
                    {
                        newRow[pos + 1] *= 2;
                        state.Score += newRow[pos + 1];
                        lastMerged = pos + 1;
                        moved = true;
                    }
                    else
                    {
                        newRow[pos] = row[j];
                        if (pos != j) moved = true;
                        pos--;
                    }
                }
            }

            state.Grid[i] = newRow;
        }

        return moved;
    }

    private bool MoveUp(Game2048State state)
    {
        bool moved = false;
        
        for (int j = 0; j < 4; j++)
        {
            var col = new int[4];
            for (int i = 0; i < 4; i++)
            {
                col[i] = state.Grid[i][j];
            }

            var newCol = new int[4];
            int pos = 0;
            int lastMerged = -1;

            for (int i = 0; i < 4; i++)
            {
                if (col[i] != 0)
                {
                    if (pos > 0 && newCol[pos - 1] == col[i] && lastMerged != pos - 1)
                    {
                        newCol[pos - 1] *= 2;
                        state.Score += newCol[pos - 1];
                        lastMerged = pos - 1;
                        moved = true;
                    }
                    else
                    {
                        newCol[pos] = col[i];
                        if (pos != i) moved = true;
                        pos++;
                    }
                }
            }

            for (int i = 0; i < 4; i++)
            {
                state.Grid[i][j] = newCol[i];
            }
        }

        return moved;
    }

    private bool MoveDown(Game2048State state)
    {
        bool moved = false;
        
        for (int j = 0; j < 4; j++)
        {
            var col = new int[4];
            for (int i = 0; i < 4; i++)
            {
                col[i] = state.Grid[i][j];
            }

            var newCol = new int[4];
            int pos = 3;
            int lastMerged = -1;

            for (int i = 3; i >= 0; i--)
            {
                if (col[i] != 0)
                {
                    if (pos < 3 && newCol[pos + 1] == col[i] && lastMerged != pos + 1)
                    {
                        newCol[pos + 1] *= 2;
                        state.Score += newCol[pos + 1];
                        lastMerged = pos + 1;
                        moved = true;
                    }
                    else
                    {
                        newCol[pos] = col[i];
                        if (pos != i) moved = true;
                        pos--;
                    }
                }
            }

            for (int i = 0; i < 4; i++)
            {
                state.Grid[i][j] = newCol[i];
            }
        }

        return moved;
    }

    private bool CanMove(Game2048State state)
    {
        // Check for empty cells
        for (int i = 0; i < 4; i++)
        {
            for (int j = 0; j < 4; j++)
            {
                if (state.Grid[i][j] == 0)
                    return true;
            }
        }

        // Check for possible merges
        for (int i = 0; i < 4; i++)
        {
            for (int j = 0; j < 4; j++)
            {
                int current = state.Grid[i][j];
                
                // Check right
                if (j < 3 && state.Grid[i][j + 1] == current)
                    return true;
                
                // Check down
                if (i < 3 && state.Grid[i + 1][j] == current)
                    return true;
            }
        }

        return false;
    }

    private bool HasTile(Game2048State state, int value)
    {
        for (int i = 0; i < 4; i++)
        {
            for (int j = 0; j < 4; j++)
            {
                if (state.Grid[i][j] == value)
                    return true;
            }
        }
        return false;
    }

    private Game2048State CloneState(Game2048State state)
    {
        var newGrid = new int[4][];
        for (int i = 0; i < 4; i++)
        {
            newGrid[i] = new int[4];
            Array.Copy(state.Grid[i], newGrid[i], 4);
        }

        return new Game2048State
        {
            Grid = newGrid,
            Score = state.Score,
            BestScore = state.BestScore,
            GameOver = state.GameOver,
            Won = state.Won
        };
    }
}
