import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserSession {
  sessionId: string;
  userId: string;
  deviceName: string;
  browser: string;
  operatingSystem: string;
  ipAddress: string;
  location?: string;
  createdAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

export interface SessionListResponse {
  sessions: UserSession[];
  totalCount: number;
}

export interface RevokeSessionRequest {
  sessionId: string;
}

export interface RevokeAllSessionsRequest {
  excludeCurrent: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sessions`;

  getSessions(): Observable<SessionListResponse> {
    return this.http.get<SessionListResponse>(this.apiUrl);
  }

  revokeSession(sessionId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/revoke`, { sessionId });
  }

  revokeAllSessions(excludeCurrent: boolean = false): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>(`${this.apiUrl}/revoke-all`, { excludeCurrent });
  }
}
