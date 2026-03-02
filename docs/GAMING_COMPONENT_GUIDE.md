# 🎮 Gaming Platform - Component Guide

## 📦 Component Architecture

### Component Hierarchy

```
App
├── Header (existing)
├── Router Outlet
│   ├── GameLobbyComponent
│   │   ├── GameCardComponent (multiple)
│   │   ├── DailyChallengeCardComponent
│   │   └── QuickStatsComponent
│   ├── GamePageComponent (base)
│   │   ├── SudokuComponent
│   │   │   ├── SudokuBoardComponent
│   │   │   ├── NumberPadComponent
│   │   │   └── GameControlsComponent
│   │   ├── MemoryMatchComponent
│   │   │   ├── CardGridComponent
│   │   │   └── CardComponent (multiple)
│   │   ├── WordSearchComponent
│   │   │   ├── WordGridComponent
│   │   │   └── WordListComponent
│   │   ├── Game2048Component
│   │   │   └── TileGridComponent
│   │   └── TicTacToeComponent
│   │       ├── GameBoardComponent
│   │       └── ChatPanelComponent
│   ├── StatsD
ashboardComponent
│   │   ├── StatsOverviewComponent
│   │   ├── GameStatsCardComponent (multiple)
│   │   └── ActivityChartComponent
│   ├── AchievementsComponent
│   │   ├── AchievementBadgeComponent (multiple)
│   │   └── ProgressBarComponent
│   ├── LeaderboardComponent
│   │   ├── LeaderboardTableComponent
│   │   └── LeaderboardFilterComponent
│   └── FriendsComponent
│       ├── FriendListComponent
│       └── ChallengeCardComponent
└── Footer (existing)
```

---

## 🎯 Core Components

### 1. GameLobbyComponent

**Location:** `frontend/src/app/features/games/game-lobby/`

**Purpose:** Main landing page showing all available games

**Template Structure:**
```html
<div class="game-lobby">
  <section class="daily-challenge">
    <app-daily-challenge-card />
  </section>
  
  <section class="quick-stats">
    <app-quick-stats />
  </section>
  
  <section class="games-grid">
    @for (game of games(); track game.id) {
      <app-game-card [game]="game" />
    }
  </section>
  
  <section class="leaderboard-preview">
    <app-leaderboard-table [limit]="5" />
  </section>
</div>
```

**Component Class:**
```typescript
export class GameLobbyComponent implements OnInit {
  private gameService = inject(GameService);
  
  games = signal<Game[]>([]);
  loading = signal(false);
  
  async ngOnInit() {
    this.loading.set(true);
    const games = await this.gameService.getAllGames();
    this.games.set(games);
    this.loading.set(false);
  }
}
```

---

### 2. GameCardComponent

**Location:** `frontend/src/app/shared/components/game-card/`

**Purpose:** Display game preview with play button

**Inputs:**
- `game: Game` - Game data

**Template:**
```html
<div class="game-card" [routerLink]="['/games', game.id]">
  <div class="game-icon">{{ game.icon }}</div>
  <h3>{{ game.name }}</h3>
  <p>{{ game.description }}</p>
  <div class="game-stats">
    <span>🎮 {{ game.totalPlays }}</span>
    <span>⭐ {{ game.averageRating }}</span>
  </div>
  <button class="play-btn">Play Now</button>
</div>
```

---

### 3. SudokuComponent

**Location:** `frontend/src/app/features/games/sudoku/`

**Purpose:** Main Sudoku game component

**State Management:**
```typescript
export class SudokuComponent implements OnInit, OnDestroy {
  private gameService = inject(GameService);
  private gameStateService = inject(GameStateService);
  
  // Game state
  sessionId = signal<string | null>(null);
  board = signal<number[][]>([]);
  solution = signal<number[][]>([]);
  selectedCell = signal<{row: number, col: number} | null>(null);
  
  // Game stats
  elapsedTime = signal(0);
  hintsRemaining = signal(3);
  mistakeCount = signal(0);
  
  // UI state
  isPaused = signal(false);
  isCompleted = signal(false);
  difficulty = signal<'Easy' | 'Medium' | 'Hard'>('Medium');
  
  async ngOnInit() {
    await this.startNewGame();
    this.startTimer();
  }
  
  async startNewGame() {
    const session = await this.gameService.startGame('sudoku', {
      difficulty: this.difficulty()
    });
    
    this.sessionId.set(session.sessionId);
    this.board.set(session.gameState.board);
    this.solution.set(session.gameState.solution);
  }
  
  selectCell(row: number, col: number) {
    this.selectedCell.set({ row, col });
  }
  
  enterNumber(value: number) {
    const cell = this.selectedCell();
    if (!cell) return;
    
    const newBoard = [...this.board()];
    newBoard[cell.row][cell.col] = value;
    this.board.set(newBoard);
    
    // Auto-save
    this.gameStateService.saveState(this.sessionId()!, {
      board: newBoard,
      elapsedTime: this.elapsedTime()
    });
    
    // Check if correct
    if (value !== this.solution()[cell.row][cell.col]) {
      this.mistakeCount.update(c => c + 1);
    }
    
    // Check if completed
    if (this.isGameComplete()) {
      this.completeGame();
    }
  }
}
```

---

### 4. SudokuBoardComponent

**Location:** `frontend/src/app/features/games/sudoku/sudoku-board/`

**Purpose:** Render Sudoku grid

**Inputs:**
- `board: number[][]` - Current board state
- `solution: number[][]` - Solution (for validation)
- `selectedCell: {row, col} | null` - Currently selected cell

**Outputs:**
- `cellSelected: EventEmitter<{row, col}>` - Cell click event

**Template:**
```html
<div class="sudoku-board">
  @for (row of board; track $index; let r = $index) {
    <div class="sudoku-row">
      @for (cell of row; track $index; let c = $index) {
        <div 
          class="sudoku-cell"
          [class.selected]="isSelected(r, c)"
          [class.filled]="cell !== 0"
          [class.error]="isError(r, c)"
          (click)="onCellClick(r, c)">
          {{ cell || '' }}
        </div>
      }
    </div>
  }
</div>
```

---

### 5. NumberPadComponent

**Location:** `frontend/src/app/shared/components/number-pad/`

**Purpose:** Number input for Sudoku

**Outputs:**
- `numberSelected: EventEmitter<number>` - Number click event

**Template:**
```html
<div class="number-pad">
  @for (num of numbers; track num) {
    <button 
      class="number-btn"
      (click)="selectNumber(num)">
      {{ num }}
    </button>
  }
  <button class="clear-btn" (click)="selectNumber(0)">
    Clear
  </button>
</div>
```

---

### 6. GameControlsComponent

**Location:** `frontend/src/app/shared/components/game-controls/`

**Purpose:** Pause, hint, undo buttons

**Inputs:**
- `hintsRemaining: number`
- `canUndo: boolean`
- `isPaused: boolean`

**Outputs:**
- `pause: EventEmitter<void>`
- `hint: EventEmitter<void>`
- `undo: EventEmitter<void>`
- `newGame: EventEmitter<void>`

---

### 7. TimerComponent

**Location:** `frontend/src/app/shared/components/timer/`

**Purpose:** Display elapsed time

**Inputs:**
- `elapsedSeconds: number`
- `isPaused: boolean`

**Template:**
```html
<div class="timer">
  <span class="timer-icon">⏱️</span>
  <span class="timer-value">{{ formattedTime() }}</span>
</div>
```

**Component:**
```typescript
export class TimerComponent {
  elapsedSeconds = input.required<number>();
  isPaused = input.required<boolean>();
  
  formattedTime = computed(() => {
    const seconds = this.elapsedSeconds();
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  });
}
```

---

### 8. MemoryMatchComponent

**Location:** `frontend/src/app/features/games/memory-match/`

**Purpose:** Memory card matching game

**State:**
```typescript
export class MemoryMatchComponent {
  cards = signal<Card[]>([]);
  flippedCards = signal<number[]>([]);
  matchedCards = signal<number[]>([]);
  moves = signal(0);
  
  flipCard(index: number) {
    if (this.flippedCards().length === 2) return;
    if (this.matchedCards().includes(index)) return;
    
    this.flippedCards.update(cards => [...cards, index]);
    
    if (this.flippedCards().length === 2) {
      setTimeout(() => this.checkMatch(), 1000);
    }
  }
  
  checkMatch() {
    const [first, second] = this.flippedCards();
    const cards = this.cards();
    
    if (cards[first].value === cards[second].value) {
      this.matchedCards.update(m => [...m, first, second]);
    }
    
    this.flippedCards.set([]);
    this.moves.update(m => m + 1);
    
    if (this.matchedCards().length === cards.length) {
      this.completeGame();
    }
  }
}
```

---

### 9. CardComponent

**Location:** `frontend/src/app/features/games/memory-match/card/`

**Purpose:** Single memory card with flip animation

**Inputs:**
- `card: Card`
- `isFlipped: boolean`
- `isMatched: boolean`

**Outputs:**
- `cardClicked: EventEmitter<void>`

**Template:**
```html
<div 
  class="card"
  [class.flipped]="isFlipped"
  [class.matched]="isMatched"
  (click)="onClick()">
  <div class="card-inner">
    <div class="card-front">?</div>
    <div class="card-back">{{ card.icon }}</div>
  </div>
</div>
```

**Styles:**
```css
.card {
  perspective: 1000px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
```

---

### 10. AchievementBadgeComponent

**Location:** `frontend/src/app/shared/components/achievement-badge/`

**Purpose:** Display achievement badge

**Inputs:**
- `achievement: Achievement`
- `unlocked: boolean`
- `progress?: number`

**Template:**
```html
<div 
  class="achievement-badge"
  [class.unlocked]="unlocked"
  [class.locked]="!unlocked">
  <div class="badge-icon">{{ achievement.icon }}</div>
  <div class="badge-info">
    <h4>{{ achievement.name }}</h4>
    <p>{{ achievement.description }}</p>
    @if (!unlocked && progress !== undefined) {
      <div class="progress-bar">
        <div 
          class="progress-fill"
          [style.width.%]="progress">
        </div>
      </div>
      <span class="progress-text">{{ progress }}%</span>
    }
    @if (unlocked) {
      <span class="unlocked-date">
        Unlocked {{ achievement.unlockedAt | date }}
      </span>
    }
  </div>
</div>
```

---

## 🎨 Shared Components

### ScoreDisplayComponent
Shows current score with animations

### LeaderboardTableComponent
Displays leaderboard with rankings

### ProgressBarComponent
Generic progress bar for achievements

### GameStatsCardComponent
Shows stats for a specific game

### DailyChallengeCardComponent
Displays today's daily challenge

### QuickStatsComponent
Shows user's quick stats (games played, achievements, etc.)

---

## 🔄 State Management Pattern

All components use Signals for reactive state:

```typescript
// ✅ Good - Using Signals
score = signal(0);
isLoading = signal(false);
games = signal<Game[]>([]);

// Computed values
totalScore = computed(() => 
  this.games().reduce((sum, g) => sum + g.score, 0)
);

// Update state
this.score.update(s => s + 100);
```

---

## 📱 Responsive Design

All components should be mobile-friendly:

```css
/* Desktop */
.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

/* Tablet */
@media (max-width: 768px) {
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 480px) {
  .game-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## ♿ Accessibility

All components must be accessible:

```html
<!-- Keyboard navigation -->
<button 
  (click)="selectCell()"
  (keydown.enter)="selectCell()"
  (keydown.space)="selectCell()"
  tabindex="0">
</button>

<!-- ARIA labels -->
<div 
  role="button"
  [attr.aria-label]="'Select cell ' + row + ', ' + col"
  [attr.aria-pressed]="isSelected">
</div>

<!-- Screen reader text -->
<span class="sr-only">Current score: {{ score() }}</span>
```

---

## 🧪 Component Testing

Example test for GameCardComponent:

```typescript
describe('GameCardComponent', () => {
  it('should display game name', () => {
    const fixture = TestBed.createComponent(GameCardComponent);
    fixture.componentRef.setInput('game', {
      id: 'sudoku',
      name: 'Sudoku',
      description: 'Number puzzle'
    });
    fixture.detectChanges();
    
    const name = fixture.nativeElement.querySelector('h3');
    expect(name.textContent).toBe('Sudoku');
  });
});
```

---

**Component Guide Complete!** 🎉

