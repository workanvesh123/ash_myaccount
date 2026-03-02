import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  averageDuration: number;
  difficulty: string[];
  isActive: boolean;
}

export interface GameSession {
  sessionId: string;
  gameId: string;
  userId: string;
  difficulty: string;
  startedAt: string;
  completedAt?: string;
  duration: number;
  score: number;
  isCompleted: boolean;
  gameState: any;
  status: string;
}

export interface StartGameResponse {
  sessionId: string;
  gameId: string;
  userId: string;
  difficulty: string;
  startedAt: string;
  gameState: any;
  status: string;
}

export interface CompleteGameResponse {
  success: boolean;
  isCorrect: boolean;
  score: number;
  breakdown: {
    baseScore: number;
    timeBonus: number;
    penalty: number;
    finalScore: number;
  };
  achievements: any[];
  newRank: number;
  personalBest: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  
  games = signal<Game[]>([]);
  currentSession = signal<StartGameResponse | null>(null);
  
  async getAllGames(): Promise<Game[]> {
    const response = await firstValueFrom(
      this.http.get<{ games: Game[] }>(`${environment.apiUrl}/games`)
    );
    this.games.set(response.games);
    return response.games;
  }
  
  async getGameById(gameId: string): Promise<Game> {
    return firstValueFrom(
      this.http.get<Game>(`${environment.apiUrl}/games/${gameId}`)
    );
  }
  
  async startGame(gameId: string, difficulty: string, options: any = {}): Promise<StartGameResponse> {
    const response = await firstValueFrom(
      this.http.post<StartGameResponse>(`${environment.apiUrl}/games/${gameId}/start`, {
        difficulty,
        options
      })
    );
    this.currentSession.set(response);
    return response;
  }
  
  async saveGameState(sessionId: string, gameState: any): Promise<void> {
    await firstValueFrom(
      this.http.put(`${environment.apiUrl}/games/sessions/${sessionId}/state`, {
        gameState
      })
    );
  }
  
  async completeGame(sessionId: string, data: {
    completedState: any;
    elapsedTime: number;
    stats: Record<string, number>;
  }): Promise<CompleteGameResponse> {
    return firstValueFrom(
      this.http.post<CompleteGameResponse>(
        `${environment.apiUrl}/games/sessions/${sessionId}/complete`,
        data
      )
    );
  }
  
  async getGameHistory(page: number = 1, pageSize: number = 20, gameId?: string): Promise<any> {
    const params: any = { page: page.toString(), pageSize: pageSize.toString() };
    if (gameId) params.gameId = gameId;
    
    return firstValueFrom(
      this.http.get(`${environment.apiUrl}/games/history`, { params })
    );
  }
  
  clearCurrentSession(): void {
    this.currentSession.set(null);
  }
}
