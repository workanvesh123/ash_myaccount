# 🎮 Gaming Platform - Game Logic & Algorithms

## 🔢 Sudoku

### Sudoku Generator Algorithm

**Difficulty Levels:**
- Easy: 4x4 grid, 8 clues
- Medium: 6x6 grid, 18 clues
- Hard: 9x9 grid, 30 clues

**Generation Steps:**

1. **Create Complete Grid**
```csharp
public class SudokuGenerator
{
    public int[][] GenerateCompleteGrid(int size)
    {
        var grid = new int[size][];
        for (int i = 0; i < size; i++)
            grid[i] = new int[size];
        
        FillGrid(grid, 0, 0, size);
        return grid;
    }
    
    private bool FillGrid(int[][] grid, int row, int col, int size)
    {
        if (row == size) return true;
        if (col == size) return FillGrid(grid, row + 1, 0, size);
        
        var numbers = Enumerable.Range(1, size).OrderBy(_ => Random.Shared.Next()).ToList();
        
        foreach (var num in numbers)
        {
            if (IsValid(grid, row, col, num, size))
            {
                grid[row][col] = num;
                if (FillGrid(grid, row, col + 1, size))
                    return true;
                grid[row][col] = 0;
            }
        }
        
        return false;
    }
}
```

2. **Remove Numbers to Create Puzzle**
```csharp
public int[][] CreatePuzzle(int[][] complete, int clues)
{
    var puzzle = complete.Select(row => row.ToArray()).ToArray();
    var size = puzzle.Length;
    var cellsToRemove = (size * size) - clues;
    
    var positions = new List<(int, int)>();
    for (int i = 0; i < size; i++)
        for (int j = 0; j < size; j++)
            positions.Add((i, j));
    
    positions = positions.OrderBy(_ => Random.Shared.Next()).ToList();
    
    for (int i = 0; i < cellsToRemove && i < positions.Count; i++)
    {
        var (row, col) = positions[i];
        puzzle[row][col] = 0;
    }
    
    return puzzle;
}
```

3. **Validation**
```csharp
public bool IsValid(int[][] grid, int row, int col, int num, int size)
{
    // Check row
    for (int x = 0; x < size; x++)
        if (grid[row][x] == num) return false;
    
    // Check column
    for (int x = 0; x < size; x++)
        if (grid[x][col] == num) return false;
    
    // Check box
    int boxSize = (int)Math.Sqrt(size);
    int startRow = row - row % boxSize;
    int startCol = col - col % boxSize;
    
    for (int i = 0; i < boxSize; i++)
        for (int j = 0; j < boxSize; j++)
            if (grid[i + startRow][j + startCol] == num)
                return false;
    
    return true;
}
```

### Hint System

```csharp
public (int row, int col, int value)? GetHint(int[][] puzzle, int[][] solution)
{
    var emptyCells = new List<(int, int)>();
    
    for (int i = 0; i < puzzle.Length; i++)
        for (int j = 0; j < puzzle[i].Length; j++)
            if (puzzle[i][j] == 0)
                emptyCells.Add((i, j));
    
    if (emptyCells.Count == 0) return null;
    
    var (row, col) = emptyCells[Random.Shared.Next(emptyCells.Count)];
    return (row, col, solution[row][col]);
}
```

### Scoring

```csharp
public int CalculateScore(SudokuSession session)
{
    var baseScore = session.Difficulty switch
    {
        "Easy" => 100,
        "Medium" => 250,
        "Hard" => 500,
        _ => 0
    };
    
    var hintPenalty = session.HintsUsed * (session.Difficulty switch
    {
        "Easy" => 5,
        "Medium" => 10,
        "Hard" => 20,
        _ => 0
    });
    
    var mistakePenalty = session.MistakesMade * (session.Difficulty switch
    {
        "Easy" => 10,
        "Medium" => 20,
        "Hard" => 40,
        _ => 0
    });
    
    var parTime = session.Difficulty switch
    {
        "Easy" => 300,   // 5 minutes
        "Medium" => 600,  // 10 minutes
        "Hard" => 1200,   // 20 minutes
        _ => 0
    };
    
    var timeBonus = Math.Max(0, parTime - session.ElapsedTime);
    
    return Math.Max(0, baseScore - hintPenalty - mistakePenalty + timeBonus);
}
```

---

## 🃏 Memory Match

### Card Generation

```csharp
public class MemoryMatchGenerator
{
    public List<Card> GenerateCards(string difficulty, string theme)
    {
        var pairCount = difficulty switch
        {
            "Easy" => 8,    // 4x4 grid
            "Medium" => 18,  // 6x6 grid
            "Hard" => 32,    // 8x8 grid
            _ => 8
        };
        
        var icons = GetThemeIcons(theme);
        var selectedIcons = icons.OrderBy(_ => Random.Shared.Next())
                                 .Take(pairCount)
                                 .ToList();
        
        var cards = new List<Card>();
        int id = 0;
        
        foreach (var icon in selectedIcons)
        {
            cards.Add(new Card { Id = id++, Value = icon, Icon = icon });
            cards.Add(new Card { Id = id++, Value = icon, Icon = icon });
        }
        
        return cards.OrderBy(_ => Random.Shared.Next()).ToList();
    }
    
    private List<string> GetThemeIcons(string theme)
    {
        return theme switch
        {
            "Animals" => new List<string> { "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔" },
            "Emojis" => new List<string> { "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰" },
            "Flags" => new List<string> { "🇺🇸", "🇬🇧", "🇫🇷", "🇩🇪", "🇮🇹", "🇪🇸", "🇨🇦", "🇦🇺", "🇯🇵", "🇨🇳", "🇰🇷", "🇧🇷", "🇮🇳", "🇷🇺", "🇲🇽", "🇿🇦" },
            _ => new List<string> { "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼" }
        };
    }
}
```

### Scoring

```csharp
public int CalculateScore(MemoryMatchSession session)
{
    var baseScore = session.Difficulty switch
    {
        "Easy" => 100,
        "Medium" => 250,
        "Hard" => 500,
        _ => 0
    };
    
    var minimumMoves = session.TotalPairs;
    var movePenalty = Math.Max(0, session.Moves - minimumMoves) * (session.Difficulty switch
    {
        "Easy" => 2,
        "Medium" => 3,
        "Hard" => 5,
        _ => 0
    });
    
    var parTime = session.Difficulty switch
    {
        "Easy" => 60,
        "Medium" => 120,
        "Hard" => 180,
        _ => 0
    };
    
    var timeBonus = Math.Max(0, parTime - session.ElapsedTime);
    
    return Math.Max(0, baseScore - movePenalty + timeBonus);
}
```

---

## 📝 Word Search

### Word Placement Algorithm

```csharp
public class WordSearchGenerator
{
    public char[][] GenerateGrid(List<string> words, int size)
    {
        var grid = new char[size][];
        for (int i = 0; i < size; i++)
        {
            grid[i] = new char[size];
            for (int j = 0; j < size; j++)
                grid[i][j] = ' ';
        }
        
        foreach (var word in words)
        {
            PlaceWord(grid, word.ToUpper(), size);
        }
        
        FillEmptyCells(grid, size);
        return grid;
    }
    
    private bool PlaceWord(char[][] grid, string word, int size)
    {
        var directions = new[]
        {
            (0, 1),   // Horizontal
            (1, 0),   // Vertical
            (1, 1),   // Diagonal down-right
            (1, -1),  // Diagonal down-left
            (0, -1),  // Horizontal backwards
            (-1, 0),  // Vertical backwards
            (-1, -1), // Diagonal up-left
            (-1, 1)   // Diagonal up-right
        };
        
        var attempts = 0;
        var maxAttempts = 100;
        
        while (attempts < maxAttempts)
        {
            var row = Random.Shared.Next(size);
            var col = Random.Shared.Next(size);
            var (dr, dc) = directions[Random.Shared.Next(directions.Length)];
            
            if (CanPlaceWord(grid, word, row, col, dr, dc, size))
            {
                PlaceWordAt(grid, word, row, col, dr, dc);
                return true;
            }
            
            attempts++;
        }
        
        return false;
    }
    
    private bool CanPlaceWord(char[][] grid, string word, int row, int col, int dr, int dc, int size)
    {
        for (int i = 0; i < word.Length; i++)
        {
            var r = row + i * dr;
            var c = col + i * dc;
            
            if (r < 0 || r >= size || c < 0 || c >= size)
                return false;
            
            if (grid[r][c] != ' ' && grid[r][c] != word[i])
                return false;
        }
        
        return true;
    }
    
    private void PlaceWordAt(char[][] grid, string word, int row, int col, int dr, int dc)
    {
        for (int i = 0; i < word.Length; i++)
        {
            grid[row + i * dr][col + i * dc] = word[i];
        }
    }
    
    private void FillEmptyCells(char[][] grid, int size)
    {
        var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        
        for (int i = 0; i < size; i++)
        {
            for (int j = 0; j < size; j++)
            {
                if (grid[i][j] == ' ')
                {
                    grid[i][j] = letters[Random.Shared.Next(letters.Length)];
                }
            }
        }
    }
}
```

### Word Categories

```csharp
public Dictionary<string, List<string>> GetWordCategories()
{
    return new Dictionary<string, List<string>>
    {
        ["Animals"] = new List<string> { "DOG", "CAT", "ELEPHANT", "TIGER", "LION", "BEAR", "WOLF", "FOX" },
        ["Countries"] = new List<string> { "USA", "CANADA", "MEXICO", "BRAZIL", "FRANCE", "GERMANY", "ITALY", "SPAIN" },
        ["Food"] = new List<string> { "PIZZA", "BURGER", "PASTA", "SUSHI", "TACO", "SALAD", "SOUP", "BREAD" },
        ["Tech"] = new List<string> { "COMPUTER", "PHONE", "TABLET", "LAPTOP", "MOUSE", "KEYBOARD", "MONITOR", "PRINTER" }
    };
}
```

---

## 🎯 2048

### Game Logic

```csharp
public class Game2048
{
    private int[][] board;
    private int score;
    
    public void Move(Direction direction)
    {
        var moved = false;
        
        switch (direction)
        {
            case Direction.Up:
                moved = MoveUp();
                break;
            case Direction.Down:
                moved = MoveDown();
                break;
            case Direction.Left:
                moved = MoveLeft();
                break;
            case Direction.Right:
                moved = MoveRight();
                break;
        }
        
        if (moved)
        {
            AddRandomTile();
        }
    }
    
    private bool MoveLeft()
    {
        var moved = false;
        
        for (int i = 0; i < 4; i++)
        {
            var row = board[i];
            var newRow = new int[4];
            var pos = 0;
            var merged = false;
            
            for (int j = 0; j < 4; j++)
            {
                if (row[j] == 0) continue;
                
                if (pos > 0 && newRow[pos - 1] == row[j] && !merged)
                {
                    newRow[pos - 1] *= 2;
                    score += newRow[pos - 1];
                    merged = true;
                    moved = true;
                }
                else
                {
                    newRow[pos] = row[j];
                    if (pos != j) moved = true;
                    pos++;
                    merged = false;
                }
            }
            
            board[i] = newRow;
        }
        
        return moved;
    }
    
    private void AddRandomTile()
    {
        var emptyCells = new List<(int, int)>();
        
        for (int i = 0; i < 4; i++)
            for (int j = 0; j < 4; j++)
                if (board[i][j] == 0)
                    emptyCells.Add((i, j));
        
        if (emptyCells.Count == 0) return;
        
        var (row, col) = emptyCells[Random.Shared.Next(emptyCells.Count)];
        board[row][col] = Random.Shared.Next(10) < 9 ? 2 : 4;
    }
    
    public bool IsGameOver()
    {
        // Check for empty cells
        for (int i = 0; i < 4; i++)
            for (int j = 0; j < 4; j++)
                if (board[i][j] == 0)
                    return false;
        
        // Check for possible merges
        for (int i = 0; i < 4; i++)
        {
            for (int j = 0; j < 3; j++)
            {
                if (board[i][j] == board[i][j + 1])
                    return false;
                if (board[j][i] == board[j + 1][i])
                    return false;
            }
        }
        
        return true;
    }
}
```

---

## ❌⭕ Tic-Tac-Toe

### AI Algorithm (Minimax)

```csharp
public class TicTacToeAI
{
    public (int row, int col) GetBestMove(char[][] board, char player)
    {
        var bestScore = int.MinValue;
        var bestMove = (-1, -1);
        
        for (int i = 0; i < 3; i++)
        {
            for (int j = 0; j < 3; j++)
            {
                if (board[i][j] == ' ')
                {
                    board[i][j] = player;
                    var score = Minimax(board, 0, false, player);
                    board[i][j] = ' ';
                    
                    if (score > bestScore)
                    {
                        bestScore = score;
                        bestMove = (i, j);
                    }
                }
            }
        }
        
        return bestMove;
    }
    
    private int Minimax(char[][] board, int depth, bool isMaximizing, char player)
    {
        var opponent = player == 'X' ? 'O' : 'X';
        var winner = CheckWinner(board);
        
        if (winner == player) return 10 - depth;
        if (winner == opponent) return depth - 10;
        if (IsBoardFull(board)) return 0;
        
        if (isMaximizing)
        {
            var bestScore = int.MinValue;
            
            for (int i = 0; i < 3; i++)
            {
                for (int j = 0; j < 3; j++)
                {
                    if (board[i][j] == ' ')
                    {
                        board[i][j] = player;
                        var score = Minimax(board, depth + 1, false, player);
                        board[i][j] = ' ';
                        bestScore = Math.Max(score, bestScore);
                    }
                }
            }
            
            return bestScore;
        }
        else
        {
            var bestScore = int.MaxValue;
            
            for (int i = 0; i < 3; i++)
            {
                for (int j = 0; j < 3; j++)
                {
                    if (board[i][j] == ' ')
                    {
                        board[i][j] = opponent;
                        var score = Minimax(board, depth + 1, true, player);
                        board[i][j] = ' ';
                        bestScore = Math.Min(score, bestScore);
                    }
                }
            }
            
            return bestScore;
        }
    }
    
    private char CheckWinner(char[][] board)
    {
        // Check rows and columns
        for (int i = 0; i < 3; i++)
        {
            if (board[i][0] != ' ' && board[i][0] == board[i][1] && board[i][1] == board[i][2])
                return board[i][0];
            
            if (board[0][i] != ' ' && board[0][i] == board[1][i] && board[1][i] == board[2][i])
                return board[0][i];
        }
        
        // Check diagonals
        if (board[0][0] != ' ' && board[0][0] == board[1][1] && board[1][1] == board[2][2])
            return board[0][0];
        
        if (board[0][2] != ' ' && board[0][2] == board[1][1] && board[1][1] == board[2][0])
            return board[0][2];
        
        return ' ';
    }
}
```

---

## 🏆 Achievement Triggers

```csharp
public class AchievementChecker
{
    public List<Achievement> CheckAchievements(User user, GameSession session)
    {
        var unlocked = new List<Achievement>();
        
        // First game
        if (user.TotalGames == 1)
            unlocked.Add(GetAchievement("first-game"));
        
        // Perfect game (no mistakes)
        if (session.MistakesMade == 0 && session.IsCompleted)
            unlocked.Add(GetAchievement("perfect-game"));
        
        // Speed demon (under 3 minutes)
        if (session.ElapsedTime < 180 && session.IsCompleted)
            unlocked.Add(GetAchievement("speed-demon"));
        
        // Game-specific milestones
        var gameCount = user.GetGameCount(session.GameId);
        if (gameCount == 10)
            unlocked.Add(GetAchievement($"{session.GameId}-novice"));
        if (gameCount == 50)
            unlocked.Add(GetAchievement($"{session.GameId}-master"));
        
        // Streak achievements
        if (user.CurrentStreak == 7)
            unlocked.Add(GetAchievement("week-streak"));
        if (user.CurrentStreak == 30)
            unlocked.Add(GetAchievement("month-streak"));
        
        return unlocked;
    }
}
```

---

**Game Logic Complete!** 🎮

