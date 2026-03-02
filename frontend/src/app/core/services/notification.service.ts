import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from './signalr.service';

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  getNotifications(unreadOnly: boolean = false): Observable<NotificationListResponse> {
    const params = new HttpParams().set('unreadOnly', unreadOnly.toString());
    return this.http.get<NotificationListResponse>(this.apiUrl, { params });
  }

  markAsRead(notificationId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/mark-read`, { notificationId });
  }

  markAllAsRead(): Observable<{ message: string; count: number }> {
    return this.http.post<{ message: string; count: number }>(`${this.apiUrl}/mark-all-read`, {});
  }
}
