import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface SudokuCell {
  row: number;
  col: number;
  value: number;
  userValue: number | null;
  isFixed: boolean;
  isValid: boolean;
  notes: number[];
}

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sudoku.component.html',
  styleUrl: './sudoku.component.css'
})
export class SudokuComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private gameService = inject(GameService);
  private router = inject(Router);
  
  // Game state
  sessionId = signal<string | null>(null);
  cells = signal<SudokuCell[]>([]);
  selectedCell = signal<{ row: number; col: number } | null>(null);
  mistakes = signal(0);
  hintsUsed = signal(0);
  elapsedTime = signal(0);
  
  // Settings
  difficulty = signal<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');
  
  // UI state
  isStarted = signal(false);
  isCompleted = signal(false);
  showSettings = signal(true);
  noteMode = signal(false);
  
  // Timer
  private timerInterval: any;
  
  // Computed
  maxHints = 3;
  hintsRemaining = computed(() => this.maxHints - this.hintsUsed());
  
  filledCells = computed(() => {
    return this.cells().filter(c => c.isFixed || c.userValue !== null).length;
  });
  
  progress = computed(() => {
    return Math.round((this.filledCells() / 81) * 100);
  });
  
  ngOnInit() {
    console.log('[Sudoku] Component initialized');
  }
  
  ngOnDestroy() {
    this.stopTimer();
  }
  
  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent) {
    if (!this.isStarted() || this.isCompleted()) return;
    
    const selected = this.selectedCell();
    if (!selected) return;
    
    // Number keys (1-9)
    if (event.key >= '1' && event.key <= '9') {
      event.preventDefault();
      this.setNumber(parseInt(event.key));
      return;
    }
    
    // Delete/Backspace to clear cell
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.clearCell();
      return;
    }
    
    // Arrow keys for navigation
    const cells = this.cells();
    let newRow = selected.row;
    let newCol = selected.col;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        newRow = Math.max(0, selected.row - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newRow = Math.min(8, selected.row + 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newCol = Math.max(0, selected.col - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newCol = Math.min(8, selected.col + 1);
        break;
      case 'n':
      case 'N':
        event.preventDefault();
        this.toggleNoteMode();
        return;
      case 'h':
      case 'H':
        event.preventDefault();
        this.getHint();
        return;
    }
    
    // Update selection if arrow key was pressed
    if (newRow !== selected.row || newCol !== selected.col) {
      this.selectCell(newRow, newCol);
    }
  }
  
  async startGame() {
    try {
      console.log('[Sudoku] Starting game:', this.difficulty());
      
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/sudoku/start`, {
          difficulty: this.difficulty()
        })
      );
      
      console.log('[Sudoku] Game started:', response);
      
      this.sessionId.set(response.sessionId);
      this.cells.set(response.gameState.cells);
      this.mistakes.set(0);
      this.hintsUsed.set(0);
      this.elapsedTime.set(0);
      this.isStarted.set(true);
      this.isCompleted.set(false);
      this.showSettings.set(false);
      this.selectedCell.set(null);
      
      this.startTimer();
      
    } catch (error) {
      console.error('[Sudoku] Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  }
  
  selectCell(row: number, col: number) {
    const cell = this.cells().find(c => c.row === row && c.col === col);
    if (cell && !cell.isFixed) {
      this.selectedCell.set({ row, col });
    }
  }
  
  async setNumber(num: number) {
    const selected = this.selectedCell();
    if (!selected) return;
    
    const cell = this.cells().find(c => c.row === selected.row && c.col === selected.col);
    if (!cell || cell.isFixed) return;
    
    if (this.noteMode()) {
      await this.toggleNote(selected.row, selected.col, num);
    } else {
      await this.setCellValue(selected.row, selected.col, num);
    }
  }
  
  async clearCell() {
    const selected = this.selectedCell();
    if (!selected) return;
    
    await this.setCellValue(selected.row, selected.col, null);
  }
  
  async setCellValue(row: number, col: number, value: number | null) {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/sudoku/sessions/${this.sessionId()}/set-cell`, {
          row,
          col,
          value
        })
      );
      
      // Update cell
      const updatedCells = this.cells().map(c => {
        if (c.row === row && c.col === col) {
          return { ...c, userValue: value, isValid: response.isValid, notes: [] };
        }
        return c;
      });
      
      this.cells.set(updatedCells);
      this.mistakes.set(response.mistakes);
      
      if (response.isCompleted) {
        this.completeGame();
      }
      
    } catch (error) {
      console.error('[Sudoku] Error setting cell value:', error);
    }
  }
  
  async toggleNote(row: number, col: number, note: number) {
    try {
      await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/sudoku/sessions/${this.sessionId()}/toggle-note`, {
          row,
          col,
          note
        })
      );
      
      // Update cell notes locally
      const updatedCells = this.cells().map(c => {
        if (c.row === row && c.col === col) {
          const notes = c.notes.includes(note)
            ? c.notes.filter(n => n !== note)
            : [...c.notes, note].sort();
          return { ...c, notes };
        }
        return c;
      });
      
      this.cells.set(updatedCells);
      
    } catch (error) {
      console.error('[Sudoku] Error toggling note:', error);
    }
  }
  
  async getHint() {
    if (this.hintsRemaining() <= 0) {
      alert('No hints remaining!');
      return;
    }
    
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/sudoku/sessions/${this.sessionId()}/hint`, {})
      );
      
      if (response.success) {
        // Update the cell with the hint
        const updatedCells = this.cells().map(c => {
          if (c.row === response.row && c.col === response.col) {
            return { ...c, userValue: response.value, isValid: true, notes: [] };
          }
          return c;
        });
        
        this.cells.set(updatedCells);
        this.hintsUsed.set(this.maxHints - response.hintsRemaining);
        
        // Select the hinted cell
        this.selectedCell.set({ row: response.row, col: response.col });
      } else {
        alert(response.message);
      }
      
    } catch (error) {
      console.error('[Sudoku] Error getting hint:', error);
    }
  }
  
  async completeGame() {
    this.stopTimer();
    this.isCompleted.set(true);
    
    try {
      const response = await this.gameService.completeGame(this.sessionId()!, {
        completedState: {
          cells: this.cells(),
          mistakes: this.mistakes(),
          hintsUsed: this.hintsUsed()
        },
        elapsedTime: this.elapsedTime(),
        stats: {
          mistakes: this.mistakes(),
          hintsUsed: this.hintsUsed(),
          time: this.elapsedTime()
        }
      });
      
      console.log('[Sudoku] Game completed:', response);
    } catch (error) {
      console.error('[Sudoku] Error completing game:', error);
    }
  }
  
  restartGame() {
    this.stopTimer();
    this.sessionId.set(null);
    this.cells.set([]);
    this.selectedCell.set(null);
    this.mistakes.set(0);
    this.hintsUsed.set(0);
    this.elapsedTime.set(0);
    this.isStarted.set(false);
    this.isCompleted.set(false);
    this.showSettings.set(true);
    this.noteMode.set(false);
  }
  
  backToLobby() {
    this.stopTimer();
    this.router.navigate(['/games']);
  }
  
  toggleNoteMode() {
    this.noteMode.update(mode => !mode);
  }
  
  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.elapsedTime.update(t => t + 1);
    }, 1000);
  }
  
  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  getCellValue(cell: SudokuCell): string {
    if (cell.isFixed) return cell.value.toString();
    if (cell.userValue) return cell.userValue.toString();
    return '';
  }
  
  getCellClass(cell: SudokuCell): string {
    const classes = ['cell'];
    
    if (cell.isFixed) classes.push('fixed');
    if (!cell.isValid) classes.push('invalid');
    
    const selected = this.selectedCell();
    if (selected && selected.row === cell.row && selected.col === cell.col) {
      classes.push('selected');
    }
    
    // Highlight same row, col, and box
    if (selected) {
      if (selected.row === cell.row || selected.col === cell.col) {
        classes.push('highlighted');
      }
      
      const selectedBox = { row: Math.floor(selected.row / 3), col: Math.floor(selected.col / 3) };
      const cellBox = { row: Math.floor(cell.row / 3), col: Math.floor(cell.col / 3) };
      if (selectedBox.row === cellBox.row && selectedBox.col === cellBox.col) {
        classes.push('highlighted');
      }
    }
    
    return classes.join(' ');
  }
  
  getGridNumbers(): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }
}
