import { Component, ChangeDetectionStrategy, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SignalRService, Notification } from '../../../core/services/signalr.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  signalRService = inject(SignalRService);
  private notificationService = inject(NotificationService);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);

  isOpen = signal(false);
  isLoading = signal(false);

  async ngOnInit(): Promise<void> {
    // Load existing notifications
    await this.loadNotifications();
  }

  ngOnDestroy(): void {
    // Don't stop connection here, let it persist
  }

  async loadNotifications(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this.notificationService.getNotifications().toPromise();
      if (response) {
        this.signalRService.notifications.set(response.notifications);
        this.signalRService.unreadCount.set(response.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  togglePanel(): void {
    this.isOpen.update(open => !open);
  }

  async markAsRead(notification: Notification): Promise<void> {
    if (notification.isRead) return;

    try {
      await this.notificationService.markAsRead(notification.id).toPromise();
      this.signalRService.markAsRead(notification.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.notificationService.markAllAsRead().toPromise();
      this.signalRService.markAllAsRead();
      this.messageQueue.addSuccess('All notifications marked as read');
    } catch (error) {
      this.messageQueue.addError('Failed to mark all as read');
    }
  }

  async onNotificationClick(notification: Notification): Promise<void> {
    await this.markAsRead(notification);
    
    if (notification.actionUrl) {
      this.isOpen.set(false);
      await this.router.navigateByUrl(notification.actionUrl);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'security': return '🔒';
      case 'info':
      default: return 'ℹ️';
    }
  }

  getNotificationClass(type: string): string {
    return `notification-${type.toLowerCase()}`;
  }

  getTimeSince(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
}
