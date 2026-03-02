---
title: Word Search Game Implementation
status: draft
priority: high
estimated_hours: 4-6
created: 2026-03-02
---

# Word Search Game - Requirements Specification

## 🎯 Overview

Implement a Word Search puzzle game as the 4th game in the gaming platform. This adds word-based gameplay to complement the existing memory, logic, and puzzle games.

## 📋 User Stories

### US-1: Start Word Search Game
**As a** player  
**I want to** start a new word search game with difficulty selection  
**So that** I can play at my skill level

**Acceptance Criteria:**
- [ ] User can select difficulty: Easy (10x10), Medium (15x15), Hard (20x20)
- [ ] User can select category: Animals, Countries, Food, Technology, Mixed
- [ ] Game generates a grid with hidden words
- [ ] Word list is displayed on the side/bottom
- [ ] Timer starts when game begins
- [ ] Game state is saved automatically

### US-2: Find Words in Grid
**As a** player  
**I want to** select words by clicking/dragging across letters  
**So that** I can find hidden words

**Acceptance Criteria:**
- [ ] User can click start letter and drag to end letter (horizontal, vertical, diagonal)
- [ ] User can select in any direction (left-to-right, right-to-left, top-to-bottom, bottom-to-top, diagonals)
- [ ] Selected word highlights if correct
- [ ] Found words are marked in the word list
- [ ] Invalid selections show brief feedback
- [ ] Found words remain highlighted on grid

### US-3: Use Hints
**As a** player  
**I want to** use hints when stuck  
**So that** I can progress in the game

**Acceptance Criteria:**
- [ ] Hint button available (max 3 hints per game)
- [ ] Hint reveals first letter of an unfound word
- [ ] Hint count decreases with each use
- [ ] Score penalty for using hints (-10 points per hint)
- [ ] Hint button disabled when no hints remain

### US-4: Complete Game
**As a** player  
**I want to** see my results when all words are found  
**So that** I can track my performance

**Acceptance Criteria:**
- [ ] Game completes when all words found
- [ ] Completion modal shows: time, score, words found, hints used
- [ ] Score is calculated: base points - time penalty - hint penalty
- [ ] Best time is saved per difficulty
- [ ] Option to play again or return to lobby
- [ ] Game is saved to history

### US-5: Keyboard Controls
**As a** player  
**I want to** use keyboard shortcuts  
**So that** I can play efficiently

**Acceptance Criteria:**
- [ ] H key - Use hint
- [ ] N key - New game
- [ ] ESC key - Pause game
- [ ] Arrow keys - Navigate grid (optional enhancement)

## 🎨 UI/UX Requirements

### Game Layout
```
┌─────────────────────────────────────────┐
│  ← Back    Word Search - Medium    [⏸]  │
├─────────────────────────────────────────┤
│  Category: Animals                       │
│  ⏱️ 02:45    💡 Hints: 3    📊 Score: 180│
│                                          │
│  ┌──────────────────┐  Words to Find:   │
│  │ C A T D O G B I  │  ✓ CAT            │
│  │ O E L E P H A N  │  ✓ DOG            │
│  │ W L I O N T R D  │  □ ELEPHANT       │
│  │ T I G E R A B A  │  □ LION           │
│  │ Z E B R A E E R  │  □ TIGER          │
│  │ G I R A F F E K  │  □ ZEBRA          │
│  │ M O N K E Y P O  │  □ GIRAFFE        │
│  │ P A N D A R A B  │  □ MONKEY         │
│  └──────────────────┘  □ PANDA          │
│                         □ BEAR           │
│  [💡 Hint] [🔄 New Game]                │
└─────────────────────────────────────────┘
```

### Visual Design
- Grid cells: 40x40px (desktop), 30x30px (mobile)
- Found words: Highlighted with color overlay
- Current selection: Different color while dragging
- Word list: Checkmarks for found words, gray for remaining
- Responsive: Stack word list below grid on mobile

## 🔧 Technical Requirements

### Backend (.NET 9)

#### Models (`WordSearchModels.cs`)
```csharp
public class WordSearchState
{
    public Guid SessionId { get; set; }
    public string UserId { get; set; }
    public string Difficulty { get; set; } // Easy, Medium, Hard
    public string Category { get; set; }
    public char[,] Grid { get; set; }
    public List<WordPlacement> Words { get; set; }
    public List<string> FoundWords { get; set; }
    public int HintsUsed { get; set; }
    public int Score { get; set; }
    public DateTime StartedAt { get; set; }
    public bool IsCompleted { get; set; }
}

public class WordPlacement
{
    public string Word { get; set; }
    public int StartRow { get; set; }
    public int StartCol { get; set; }
    public int EndRow { get; set; }
    public int EndCol { get; set; }
    public string Direction { get; set; } // Horizontal, Vertical, Diagonal
}

public class WordSearchStartRequest
{
    public string Difficulty { get; set; }
    public string Category { get; set; }
}

public class WordSearchCheckRequest
{
    public int StartRow { get; set; }
    public int StartCol { get; set; }
    public int EndRow { get; set; }
    public int EndCol { get; set; }
}
```

#### Service (`WordSearchService.cs`)
**Methods:**
- `StartNewGame(difficulty, category)` - Generate grid with words
- `CheckWord(sessionId, startRow, startCol, endRow, endCol)` - Validate selection
- `UseHint(sessionId)` - Reveal first letter of unfound word
- `GetGameState(sessionId)` - Retrieve current state
- `CompleteGame(sessionId)` - Calculate final score

**Word Generation Algorithm:**
1. Select words from category (8-12 words based on difficulty)
2. Place words in grid (horizontal, vertical, diagonal, all directions)
3. Fill empty cells with random letters
4. Ensure no accidental words formed

**Scoring:**
- Easy: 100 base points, -1 per second, -10 per hint
- Medium: 250 base points, -2 per second, -15 per hint
- Hard: 500 base points, -3 per second, -20 per hint

#### Endpoints (`WordSearchEndpoints.cs`)
- `POST /api/v1/games/word-search/start` - Start new game
- `POST /api/v1/games/word-search/sessions/{sessionId}/check` - Check word selection
- `POST /api/v1/games/word-search/sessions/{sessionId}/hint` - Use hint
- `GET /api/v1/games/word-search/sessions/{sessionId}` - Get game state
- `POST /api/v1/games/word-search/sessions/{sessionId}/complete` - Complete game

### Frontend (Angular 20)

#### Component (`word-search.component.ts`)
**Properties:**
- `grid: string[][]` - Letter grid
- `words: string[]` - Word list
- `foundWords: Set<string>` - Found words
- `currentSelection: {start, end}` - Active selection
- `hintsRemaining: number` - Hint count
- `score: number` - Current score
- `timer: number` - Elapsed time

**Methods:**
- `startGame(difficulty, category)` - Initialize game
- `onCellMouseDown(row, col)` - Start selection
- `onCellMouseEnter(row, col)` - Update selection
- `onCellMouseUp()` - Complete selection, check word
- `useHint()` - Request hint from backend
- `isWordFound(word)` - Check if word found
- `getCellClass(row, col)` - Apply CSS classes

**Keyboard Handlers:**
- `@HostListener('keydown', ['$event'])` - Handle H, N, ESC keys

#### Styling (`word-search.component.css`)
- Grid layout with CSS Grid
- Cell hover effects
- Selection highlighting (semi-transparent overlay)
- Found word highlighting (solid color)
- Responsive breakpoints
- Touch-friendly on mobile

## 🧪 Testing Requirements

### Backend Tests
1. Word generation creates valid grid
2. All words are placed correctly
3. Word validation works in all directions
4. Hint system reveals correct letters
5. Score calculation is accurate
6. Game state persistence works

### Frontend Tests
1. Grid renders correctly for all difficulties
2. Mouse selection works (drag to select)
3. Touch selection works on mobile
4. Found words highlight correctly
5. Word list updates when words found
6. Hint button works and decrements count
7. Timer starts and updates
8. Completion modal shows correct data

### Manual Testing
1. Play through complete game on each difficulty
2. Test all word directions (8 directions)
3. Test hint system
4. Test keyboard shortcuts
5. Test on mobile (touch)
6. Test pause/resume
7. Verify score calculation
8. Check game history integration

## 📊 Word Lists

### Categories & Word Counts
- **Animals** (Easy: 8, Medium: 10, Hard: 12)
- **Countries** (Easy: 8, Medium: 10, Hard: 12)
- **Food** (Easy: 8, Medium: 10, Hard: 12)
- **Technology** (Easy: 8, Medium: 10, Hard: 12)
- **Mixed** (Random from all categories)

### Word Length Guidelines
- Easy: 3-6 letters
- Medium: 4-8 letters
- Hard: 5-10 letters

## 🔄 Integration Points

### Existing Systems
1. **Game Service** - Register Word Search game
2. **Game History** - Save completed games
3. **Activity Log** - Log game events
4. **Score Tracking** - Update user scores
5. **Game Lobby** - Add Word Search card

### Game Card Data
```typescript
{
  id: 'word-search',
  name: 'Word Search',
  description: 'Find hidden words in the grid',
  icon: '📝',
  difficulty: ['Easy', 'Medium', 'Hard'],
  category: 'Puzzle',
  estimatedTime: '5-15 min',
  route: '/games/word-search'
}
```

## 🚀 Implementation Plan

### Phase 1: Backend Foundation (2 hours)
1. Create models
2. Implement word generation algorithm
3. Create service with core methods
4. Add endpoints
5. Test word placement logic

### Phase 2: Frontend Core (2 hours)
1. Create component structure
2. Implement grid rendering
3. Add mouse/touch selection logic
4. Integrate with backend API
5. Add basic styling

### Phase 3: Features & Polish (1-2 hours)
1. Add hint system
2. Add keyboard controls
3. Add timer and score display
4. Add completion modal
5. Add animations and effects
6. Mobile optimization

### Phase 4: Testing & Integration (1 hour)
1. Manual testing all features
2. Test on mobile
3. Integrate with game lobby
4. Update game history
5. Update documentation

## ✅ Definition of Done

- [ ] Backend service generates valid word search grids
- [ ] All 8 word directions supported (H, V, 4 diagonals, reversed)
- [ ] Frontend renders grid correctly on all screen sizes
- [ ] Mouse and touch selection both work
- [ ] Hint system functional with score penalty
- [ ] Timer tracks game duration
- [ ] Score calculation accurate
- [ ] Completion modal shows all stats
- [ ] Game integrates with lobby and history
- [ ] Keyboard shortcuts work (H, N, ESC)
- [ ] Mobile responsive and touch-friendly
- [ ] No console errors or warnings
- [ ] Code follows project patterns
- [ ] Documentation updated

## 📝 Notes

### Algorithm Considerations
- Use backtracking for word placement to avoid conflicts
- Ensure minimum spacing between words (optional)
- Random letter fill should avoid creating accidental words
- Consider word overlap (allow or prevent)

### Performance
- Grid generation should be < 100ms
- Word validation should be instant
- Consider caching generated grids for same difficulty/category

### Future Enhancements
- Daily challenge with specific grid
- Timed mode (find all words in X minutes)
- Multiplayer (race to find words)
- Custom word lists
- Themes (different grid colors)
- Sound effects for found words

## 🔗 Related Documents

- `GAMING_PLATFORM_PLAN.md` - Overall gaming platform vision
- `NEXT_STEPS.md` - Roadmap and next features
- `docs/GAMING_API_REFERENCE.md` - API documentation patterns
- `docs/GAMING_GAME_LOGIC.md` - Game logic patterns

---

**Ready to implement?** This spec provides everything needed to build the Word Search game following the established patterns in the codebase.
