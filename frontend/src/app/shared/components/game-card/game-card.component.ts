import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game } from '../../../core/services/game.service';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="game-card" [routerLink]="['/games', game().id]">
      <div class="game-icon">{{ game().icon }}</div>
      <h3>{{ game().name }}</h3>
      <p>{{ game().description }}</p>
      <div class="game-meta">
        <span class="category">{{ game().category }}</span>
        <span class="duration">⏱️ ~{{ formatDuration(game().averageDuration) }}</span>
      </div>
      <div class="difficulty-badges">
        @for (diff of game().difficulty; track diff) {
          <span class="difficulty-badge">{{ diff }}</span>
        }
      </div>
      <button class="play-btn">Play Now</button>
    </div>
  `,
  styles: [`
    .game-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      height: 100%;
    }
    
    .game-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary);
    }
    
    .game-icon {
      font-size: 3.5rem;
      text-align: center;
      margin-bottom: 0.5rem;
    }
    
    h3 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--color-text-primary);
      text-align: center;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      text-align: center;
      flex-grow: 1;
      line-height: 1.5;
    }
    
    .game-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-border-light);
    }
    
    .category {
      background: var(--color-primary);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: 500;
    }
    
    .duration {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .difficulty-badges {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .difficulty-badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      background: var(--color-bg-tertiary);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border-light);
    }
    
    .play-btn {
      background: var(--color-primary);
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--transition-fast);
      font-size: 0.9rem;
    }
    
    .play-btn:hover {
      background: var(--color-primary-hover);
    }
    
    @media (max-width: 768px) {
      .game-card {
        padding: 1.25rem;
      }
      
      .game-icon {
        font-size: 3rem;
      }
      
      h3 {
        font-size: 1.1rem;
      }
    }
  `]
})
export class GameCardComponent {
  game = input.required<Game>();
  
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) {
      return `${mins}m`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
}
