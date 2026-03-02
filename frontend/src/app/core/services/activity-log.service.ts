import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ActivityLogEntry {
  id: string;
  userId: string;
  activityType: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  metadata?: Record<string, string>;
}

export interface ActivityLogResponse {
  activities: ActivityLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/activity`;

  getActivities(page: number = 1, pageSize: number = 20): Observable<ActivityLogResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ActivityLogResponse>(this.apiUrl, { params });
  }
}
