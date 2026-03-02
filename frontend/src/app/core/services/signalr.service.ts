import { Injectable, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { SessionStoreService } from './session-store.service';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private sessionStore = inject(SessionStoreService);
  
  private hubConnection: signalR.HubConnection | null = null;
  
  isConnected = signal(false);
  connectionStatus = signal<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  async startConnection(): Promise<void> {
    const userId = this.sessionStore.get<string>('sessionToken');
    if (!userId) {
      console.warn('[SignalR] No userId found, cannot connect');
      return;
    }

    if (this.hubConnection) {
      console.log('[SignalR] Connection already exists');
      return;
    }

    this.connectionStatus.set('connecting');

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api/v1', '')}/hubs/notifications`, {
        accessTokenFactory: () => userId,
        headers: { 'X-User-Id': userId }
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Handle incoming notifications
    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      console.log('[SignalR] Received notification:', notification);
      this.notifications.update(notifications => [notification, ...notifications]);
      this.unreadCount.update(count => count + 1);
    });

    // Handle connection events
    this.hubConnection.onclose(() => {
      console.log('[SignalR] Connection closed');
      this.isConnected.set(false);
      this.connectionStatus.set('disconnected');
    });

    this.hubConnection.onreconnecting(() => {
      console.log('[SignalR] Reconnecting...');
      this.connectionStatus.set('reconnecting');
    });

    this.hubConnection.onreconnected(() => {
      console.log('[SignalR] Reconnected');
      this.isConnected.set(true);
      this.connectionStatus.set('connected');
    });

    try {
      await this.hubConnection.start();
      console.log('[SignalR] Connected successfully');
      this.isConnected.set(true);
      this.connectionStatus.set('connected');

      // Join user group
      await this.hubConnection.invoke('JoinUserGroup', userId);
    } catch (error) {
      console.error('[SignalR] Connection failed:', error);
      this.connectionStatus.set('disconnected');
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
      this.isConnected.set(false);
      this.connectionStatus.set('disconnected');
      console.log('[SignalR] Connection stopped');
    }
  }

  clearNotifications(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  markAsRead(notificationId: string): void {
    this.notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    this.unreadCount.update(count => Math.max(0, count - 1));
  }

  markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true }))
    );
    this.unreadCount.set(0);
  }
}
