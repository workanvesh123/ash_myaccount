import { Component, inject, signal, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GameService } from '../../../core/services/game.service';

interface GameHistoryItem {
  sessionId: string;
  gameId: string;
  gameName: string;
  difficulty: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  score: number;
  isCompleted: boolean;
  stats: any;
}

@Component({
  selector: 'app-game-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-history.component.html',
  styleUrl: './game-history.component.css'
})
export class GameHistoryComponent implements OnInit {
  private gameService = inject(GameService);
  
  history = signal<GameHistoryItem[]>([]);
  isLoading = signal(true);
  selectedGame = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  totalGames = signal(0);
  
  filteredHistory = computed(() => {
    const selected = this.selectedGame();
    if (!selected) return this.history();
    return this.history().filter(h => h.gameId === selected);
  });
  
  stats = computed(() => {
    const items = this.filteredHistory();
    const completed = items.filter(h => h.isCompleted);
    
    return {
      totalGames: items.length,
      completedGames: completed.length,
      totalTime: completed.reduce((sum, h) => sum + h.duration, 0),
      averageScore: completed.length > 0 
        ? Math.round(completed.reduce((sum, h) => sum + h.score, 0) / completed.length)
        : 0,
      bestScore: completed.length > 0
        ? Math.max(...completed.map(h => h.score))
        : 0
    };
  });
  
  async ngOnInit() {
    await this.loadHistory();
  }
  
  async loadHistory() {
    try {
      this.isLoading.set(true);
      const response = await this.gameService.getGameHistory(
        this.currentPage(),
        20,
        this.selectedGame() || undefined
      );
      
      this.history.set(response.sessions || []);
      this.totalPages.set(response.totalPages || 1);
      this.totalGames.set(response.totalCount || 0);
    } catch (error) {
      console.error('[GameHistory] Error loading history:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  async filterByGame(gameId: string | null) {
    this.selectedGame.set(gameId);
    this.currentPage.set(1);
    await this.loadHistory();
  }
  
  async nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      await this.loadHistory();
    }
  }
  
  async previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      await this.loadHistory();
    }
  }
  
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getGameIcon(gameId: string): string {
    const icons: Record<string, string> = {
      'memory-match': '🃏',
      'sudoku': '🔢',
      '2048': '🎯',
      'word-search': '🔤',
      'tic-tac-toe': '⭕'
    };
    return icons[gameId] || '🎮';
  }
  
  getDifficultyColor(difficulty: string): string {
    const colors: Record<string, string> = {
      'Easy': 'success',
      'Medium': 'warning',
      'Hard': 'danger'
    };
    return colors[difficulty] || 'info';
  }
}
