import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface TwoFaEnableRequest {
  method: 'email' | 'sms';
}

export interface TwoFaEnableResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface TwoFaVerifyRequest {
  code: string;
}

export interface TwoFaVerifyResponse {
  success: boolean;
  message: string;
}

export interface TwoFaDisableResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TwoFaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/2fa`;

  enable(data: TwoFaEnableRequest): Observable<TwoFaEnableResponse> {
    return this.http.post<TwoFaEnableResponse>(`${this.apiUrl}/enable`, data);
  }

  verify(data: TwoFaVerifyRequest): Observable<TwoFaVerifyResponse> {
    return this.http.post<TwoFaVerifyResponse>(`${this.apiUrl}/verify`, data);
  }

  disable(): Observable<TwoFaDisableResponse> {
    return this.http.post<TwoFaDisableResponse>(`${this.apiUrl}/disable`, {});
  }
}
