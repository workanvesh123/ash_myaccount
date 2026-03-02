import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { GameCardComponent } from '../../../shared/components/game-card/game-card.component';

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [CommonModule, RouterLink, GameCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-lobby">
      <header class="lobby-header">
        <div class="header-content">
          <div class="title-section">
            <h1>🎮 Game Lobby</h1>
            <p>Choose a game and start playing!</p>
          </div>
          <button class="history-btn" routerLink="/games/history">
            📊 View History
          </button>
        </div>
      </header>
      
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading games...</p>
        </div>
      } @else if (gameService.games().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🎲</div>
          <h3>No games available</h3>
          <p>Check back soon for new games!</p>
        </div>
      } @else {
        <div class="games-grid">
          @for (game of gameService.games(); track game.id) {
            <app-game-card [game]="game" />
          }
        </div>
        
        <div class="lobby-footer">
          <p>More games coming soon! 🚀</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .game-lobby {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
      min-height: calc(100vh - 200px);
    }
    
    .lobby-header {
      margin-bottom: 3rem;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .title-section {
      flex: 1;
    }
    
    .lobby-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      color: var(--color-text-primary);
      font-weight: 700;
    }
    
    .lobby-header p {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    
    .history-btn {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .history-btn:hover {
      background: var(--color-primary-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    
    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .loading {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--color-text-secondary);
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto 1rem;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
    }
    
    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    
    .empty-state h3 {
      font-size: 1.5rem;
      color: var(--color-text-primary);
      margin: 0 0 0.5rem 0;
    }
    
    .empty-state p {
      color: var(--color-text-secondary);
      margin: 0;
    }
    
    .lobby-footer {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--color-text-secondary);
      border-top: 1px solid var(--color-border-light);
    }
    
    .lobby-footer p {
      margin: 0;
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .game-lobby {
        padding: 1.5rem 1rem;
      }
      
      .lobby-header h1 {
        font-size: 2rem;
      }
      
      .lobby-header p {
        font-size: 1rem;
      }
      
      .games-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
    }
    
    @media (max-width: 480px) {
      .games-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GameLobbyComponent implements OnInit {
  gameService = inject(GameService);
  loading = signal(false);
  
  async ngOnInit() {
    this.loading.set(true);
    try {
      await this.gameService.getAllGames();
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
