import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { MemoryMatchComponent } from '../memory-match/memory-match.component';
import { SudokuComponent } from '../sudoku/sudoku.component';
import { Game2048Component } from '../game-2048/game-2048.component';

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MemoryMatchComponent, SudokuComponent, Game2048Component],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-page">
      @if (gameId() === 'memory-match') {
        <app-memory-match />
      } @else if (gameId() === 'sudoku') {
        <app-sudoku />
      } @else if (gameId() === '2048') {
        <app-game-2048 />
      } @else {
        <div class="game-header">
          <button class="back-btn" routerLink="/games">
            ← Back to Lobby
          </button>
        </div>
        
        <div class="game-content">
          <div class="coming-soon">
            <div class="icon">🎮</div>
            <h2>{{ gameId() }}</h2>
            <p>This game is coming soon!</p>
            <p class="hint">We're working on implementing this game. Check back later!</p>
            <button class="lobby-btn" routerLink="/games">
              Return to Game Lobby
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
      min-height: calc(100vh - 200px);
    }
    
    .game-header {
      margin-bottom: 2rem;
    }
    
    .back-btn {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: 0.9rem;
      text-decoration: none;
      display: inline-block;
    }
    
    .back-btn:hover {
      background: var(--color-bg-tertiary);
      border-color: var(--color-primary);
    }
    
    .game-content {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
    
    .coming-soon {
      text-align: center;
      padding: 3rem 2rem;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 1rem;
      max-width: 500px;
    }
    
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    
    h2 {
      font-size: 2rem;
      color: var(--color-text-primary);
      margin: 0 0 1rem 0;
      text-transform: capitalize;
    }
    
    p {
      color: var(--color-text-secondary);
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }
    
    .hint {
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    
    .lobby-btn {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--transition-fast);
      font-size: 1rem;
    }
    
    .lobby-btn:hover {
      background: var(--color-primary-hover);
    }
  `]
})
export class GamePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private gameService = inject(GameService);
  
  gameId = () => this.route.snapshot.paramMap.get('gameId') || 'unknown';
  
  ngOnInit() {
    console.log('[GamePage] Loading game:', this.gameId());
  }
}
