import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-game-2048',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-2048.component.html',
  styleUrl: './game-2048.component.css'
})
export class Game2048Component implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private gameService = inject(GameService);
  private router = inject(Router);
  
  sessionId = signal<string | null>(null);
  grid = signal<number[][]>([]);
  score = signal(0);
  bestScore = signal(0);
  gameOver = signal(false);
  won = signal(false);
  undoCount = signal(0);
  isStarted = signal(false);
  showInstructions = signal(true);
  elapsedTime = signal(0);
  private timerInterval: any;
  maxUndos = 3;
  canUndo = computed(() => this.undoCount() > 0);
  
  ngOnInit() {
    console.log('[2048] Component initialized');
    const saved = localStorage.getItem('2048-best-score');
    if (saved) {
      this.bestScore.set(parseInt(saved));
    }
  }
  
  ngOnDestroy() {
    this.stopTimer();
  }
  
  @HostListener('window:keydown', ['$event'])
  handleKeyboardInput(event: KeyboardEvent) {
    if (!this.isStarted() || this.gameOver()) return;
    
    let direction: string | null = null;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        direction = 'up';
        break;
      case 'ArrowDown':
        event.preventDefault();
        direction = 'down';
        break;
      case 'ArrowLeft':
        event.preventDefault();
        direction = 'left';
        break;
      case 'ArrowRight':
        event.preventDefault();
        direction = 'right';
        break;
      case 'u':
      case 'U':
        event.preventDefault();
        this.undo();
        return;
    }
    
    if (direction) {
      this.makeMove(direction);
    }
  }
  
  async startGame() {
    try {
      console.log('[2048] Starting game');
      
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/2048/start`, {
          difficulty: 'Classic'
        })
      );
      
      console.log('[2048] Game started:', response);
      
      this.sessionId.set(response.sessionId);
      this.grid.set(response.gameState.grid);
      this.score.set(response.gameState.score);
      this.gameOver.set(false);
      this.won.set(false);
      this.isStarted.set(true);
      this.showInstructions.set(false);
      this.elapsedTime.set(0);
      this.undoCount.set(0);
      
      this.startTimer();
      
    } catch (error) {
      console.error('[2048] Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  }
  
  async makeMove(direction: string) {
    if (!this.sessionId() || this.gameOver()) return;
    
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/2048/sessions/${this.sessionId()}/move`, {
          direction
        })
      );
      
      if (response.validMove) {
        this.grid.set(response.grid);
        this.score.set(response.score);
        this.gameOver.set(response.gameOver);
        this.won.set(response.won);
        
        if (this.score() > this.bestScore()) {
          this.bestScore.set(this.score());
          localStorage.setItem('2048-best-score', this.score().toString());
        }
        
        if (response.gameOver) {
          this.stopTimer();
          await this.completeGame();
        }
      }
      
    } catch (error) {
      console.error('[2048] Error making move:', error);
    }
  }
  
  async undo() {
    if (!this.sessionId() || !this.canUndo()) return;
    
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/2048/sessions/${this.sessionId()}/undo`, {})
      );
      
      if (response.success) {
        this.grid.set(response.gameState.grid);
        this.score.set(response.gameState.score);
        this.gameOver.set(response.gameState.gameOver);
        this.won.set(response.gameState.won);
        this.undoCount.set(response.undoCount);
      }
      
    } catch (error) {
      console.error('[2048] Error undoing move:', error);
    }
  }
  
  async completeGame() {
    try {
      const response = await this.gameService.completeGame(this.sessionId()!, {
        completedState: {
          grid: this.grid(),
          score: this.score()
        },
        elapsedTime: this.elapsedTime(),
        stats: {
          finalScore: this.score(),
          won: this.won() ? 1 : 0
        }
      });
      
      console.log('[2048] Game completed:', response);
    } catch (error) {
      console.error('[2048] Error completing game:', error);
    }
  }
  
  restartGame() {
    this.stopTimer();
    this.sessionId.set(null);
    this.grid.set([]);
    this.score.set(0);
    this.gameOver.set(false);
    this.won.set(false);
    this.isStarted.set(false);
    this.showInstructions.set(true);
    this.elapsedTime.set(0);
    this.undoCount.set(0);
  }
  
  continueAfterWin() {
    this.won.set(false);
  }
  
  backToLobby() {
    this.stopTimer();
    this.router.navigate(['/games']);
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
  
  getTileClass(value: number): string {
    return `tile tile-${value}`;
  }
  
  getTileValue(value: number): string {
    return value === 0 ? '' : value.toString();
  }
}
