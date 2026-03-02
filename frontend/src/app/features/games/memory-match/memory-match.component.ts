import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';
import { GameStateService } from '../../../core/services/game-state.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

interface Card {
  id: number;
  value: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryMatchGameState {
  cards: Card[];
  flippedCardIds: number[];
  matchedCardIds: number[];
  moves: number;
  elapsedTime: number;
  theme: string;
  difficulty: string;
}

@Component({
  selector: 'app-memory-match',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './memory-match.component.html',
  styleUrl: './memory-match.component.css'
})
export class MemoryMatchComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private gameService = inject(GameService);
  private gameStateService = inject(GameStateService);
  private router = inject(Router);
  
  // Game state
  sessionId = signal<string | null>(null);
  cards = signal<Card[]>([]);
  flippedCards = signal<number[]>([]);
  matchedCards = signal<number[]>([]);
  moves = signal(0);
  elapsedTime = signal(0);
  
  // Settings
  difficulty = signal<'Easy' | 'Medium' | 'Hard'>('Medium');
  theme = signal<'Animals' | 'Emojis' | 'Flags' | 'Food'>('Animals');
  
  // UI state
  isStarted = signal(false);
  isCompleted = signal(false);
  isFlipping = signal(false);
  showSettings = signal(true);
  
  // Timer
  private timerInterval: any;
  
  // Computed
  gridSize = computed(() => {
    switch (this.difficulty()) {
      case 'Easy': return 4;
      case 'Medium': return 6;
      case 'Hard': return 8;
      default: return 6;
    }
  });
  
  totalPairs = computed(() => {
    const size = this.gridSize();
    return (size * size) / 2;
  });
  
  progress = computed(() => {
    const matched = this.matchedCards().length / 2;
    const total = this.totalPairs();
    return Math.round((matched / total) * 100);
  });
  
  ngOnInit() {
    console.log('[MemoryMatch] Component initialized');
  }
  
  ngOnDestroy() {
    this.stopTimer();
    this.gameStateService.stopAutoSave();
  }
  
  async startGame() {
    try {
      console.log('[MemoryMatch] Starting game:', this.difficulty(), this.theme());
      
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/memory-match/start`, {
          difficulty: this.difficulty(),
          theme: this.theme()
        })
      );
      
      console.log('[MemoryMatch] Game started:', response);
      
      this.sessionId.set(response.sessionId);
      this.cards.set(response.gameState.cards);
      this.flippedCards.set([]);
      this.matchedCards.set([]);
      this.moves.set(0);
      this.elapsedTime.set(0);
      this.isStarted.set(true);
      this.isCompleted.set(false);
      this.showSettings.set(false);
      
      this.startTimer();
      
    } catch (error) {
      console.error('[MemoryMatch] Error starting game:', error);
      alert('Failed to start game. Please try again.');
    }
  }
  
  async flipCard(card: Card) {
    if (this.isFlipping() || card.isMatched || this.flippedCards().includes(card.id)) {
      return;
    }
    
    if (this.flippedCards().length >= 2) {
      return;
    }
    
    try {
      this.isFlipping.set(true);
      
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/games/memory-match/sessions/${this.sessionId()}/flip`, {
          cardId: card.id
        })
      );
      
      console.log('[MemoryMatch] Flip response:', response);
      
      // Update card state
      const updatedCards = this.cards().map(c => 
        c.id === card.id ? { ...c, isFlipped: true } : c
      );
      this.cards.set(updatedCards);
      
      // Update flipped cards
      const newFlipped = [...this.flippedCards(), card.id];
      this.flippedCards.set(newFlipped);
      
      // Update moves
      this.moves.set(response.moves);
      
      // Check if we have 2 flipped cards
      if (newFlipped.length === 2) {
        if (response.isMatch) {
          // Match found!
          console.log('[MemoryMatch] Match found!');
          this.matchedCards.set(response.matchedCardIds);
          
          // Update matched cards
          const matchedUpdated = this.cards().map(c =>
            response.matchedCardIds.includes(c.id) ? { ...c, isMatched: true } : c
          );
          this.cards.set(matchedUpdated);
          
          // Clear flipped cards immediately
          this.flippedCards.set([]);
          this.isFlipping.set(false);
          
          // Check if game is complete
          if (response.isGameComplete) {
            this.completeGame();
          }
        } else {
          // No match - flip back after delay
          console.log('[MemoryMatch] No match, flipping back...');
          setTimeout(() => {
            const resetCards = this.cards().map(c =>
              newFlipped.includes(c.id) && !c.isMatched ? { ...c, isFlipped: false } : c
            );
            this.cards.set(resetCards);
            this.flippedCards.set([]);
            this.isFlipping.set(false);
          }, 1000);
        }
      } else {
        this.isFlipping.set(false);
      }
      
    } catch (error) {
      console.error('[MemoryMatch] Error flipping card:', error);
      this.isFlipping.set(false);
    }
  }
  
  async completeGame() {
    this.stopTimer();
    this.isCompleted.set(true);
    
    try {
      const response = await this.gameService.completeGame(this.sessionId()!, {
        completedState: {
          cards: this.cards(),
          moves: this.moves(),
          elapsedTime: this.elapsedTime()
        },
        elapsedTime: this.elapsedTime(),
        stats: {
          moves: this.moves(),
          pairs: this.totalPairs()
        }
      });
      
      console.log('[MemoryMatch] Game completed:', response);
    } catch (error) {
      console.error('[MemoryMatch] Error completing game:', error);
    }
  }
  
  restartGame() {
    this.stopTimer();
    this.gameStateService.stopAutoSave();
    this.sessionId.set(null);
    this.cards.set([]);
    this.flippedCards.set([]);
    this.matchedCards.set([]);
    this.moves.set(0);
    this.elapsedTime.set(0);
    this.isStarted.set(false);
    this.isCompleted.set(false);
    this.showSettings.set(true);
  }
  
  backToLobby() {
    this.stopTimer();
    this.gameStateService.stopAutoSave();
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
}
