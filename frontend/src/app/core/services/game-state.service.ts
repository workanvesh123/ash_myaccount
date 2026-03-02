import { Injectable, inject } from '@angular/core';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private gameService = inject(GameService);
  private autoSaveInterval: any;
  
  startAutoSave(sessionId: string, getState: () => any, intervalMs: number = 30000) {
    this.stopAutoSave();
    
    this.autoSaveInterval = setInterval(async () => {
      try {
        const state = getState();
        await this.gameService.saveGameState(sessionId, state);
        console.log('[GameState] Auto-saved at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('[GameState] Auto-save failed:', error);
      }
    }, intervalMs);
    
    console.log('[GameState] Auto-save started (every', intervalMs / 1000, 'seconds)');
  }
  
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('[GameState] Auto-save stopped');
    }
  }
  
  async saveState(sessionId: string, state: any): Promise<void> {
    try {
      await this.gameService.saveGameState(sessionId, state);
      console.log('[GameState] Manual save successful');
    } catch (error) {
      console.error('[GameState] Manual save failed:', error);
      throw error;
    }
  }
}
