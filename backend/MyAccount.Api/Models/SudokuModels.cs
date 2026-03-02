namespace MyAccount.Api.Models;

public class SudokuCell
{
    public int Row { get; set; }
    public int Col { get; set; }
    public int Value { get; set; }
    public int? UserValue { get; set; }
    public bool IsFixed { get; set; }
    public bool IsValid { get; set; } = true;
    public List<int> Notes { get; set; } = new();
}

public class SudokuGameState
{
    public List<SudokuCell> Cells { get; set; } = new();
    public string Difficulty { get; set; } = "Medium";
    public int Mistakes { get; set; }
    public int HintsUsed { get; set; }
    public int ElapsedTime { get; set; }
    public bool IsCompleted { get; set; }
    public List<int[]> Solution { get; set; } = new();
}

public class StartSudokuRequest
{
    public string Difficulty { get; set; } = "Medium"; // Easy, Medium, Hard, Expert
}

public class StartSudokuResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string GameId { get; set; } = "sudoku";
    public string UserId { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Medium";
    public DateTime StartedAt { get; set; }
    public SudokuGameState GameState { get; set; } = new();
    public string Status { get; set; } = "InProgress";
}

public class SetCellValueRequest
{
    public int Row { get; set; }
    public int Col { get; set; }
    public int? Value { get; set; } // null to clear
}

public class SetCellValueResponse
{
    public bool Success { get; set; }
    public bool IsValid { get; set; }
    public bool IsCompleted { get; set; }
    public int Mistakes { get; set; }
    public List<SudokuCell> AffectedCells { get; set; } = new();
}

public class GetHintRequest
{
    // Empty - just needs session ID
}

public class GetHintResponse
{
    public bool Success { get; set; }
    public int Row { get; set; }
    public int Col { get; set; }
    public int Value { get; set; }
    public int HintsRemaining { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ToggleNoteRequest
{
    public int Row { get; set; }
    public int Col { get; set; }
    public int Note { get; set; }
}

public class ValidateBoardResponse
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public int Mistakes { get; set; }
}
