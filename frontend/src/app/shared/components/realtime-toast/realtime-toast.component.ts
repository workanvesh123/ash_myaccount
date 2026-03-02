import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService, Notification } from '../../../core/services/signalr.service';

@Component({
  selector: 'app-realtime-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realtime-toast.component.html',
  styleUrls: ['./realtime-toast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealtimeToastComponent implements OnInit, OnDestroy {
  private signalRService = inject(SignalRService);
  
  activeToasts = signal<Notification[]>([]);
  private toastTimeouts = new Map<string, any>();

  ngOnInit(): void {
    // Subscribe to new notifications
    // We'll use a simple approach: watch the notifications signal
    // In a real app, you might use RxJS or a more sophisticated approach
  }

  ngOnDestroy(): void {
    // Clear all timeouts
    this.toastTimeouts.forEach(timeout => clearTimeout(timeout));
    this.toastTimeouts.clear();
  }

  showToast(notification: Notification): void {
    // Add to active toasts
    this.activeToasts.update(toasts => [...toasts, notification]);

    // Auto-remove after 5 seconds
    const timeout = setTimeout(() => {
      this.removeToast(notification.id);
    }, 5000);

    this.toastTimeouts.set(notification.id, timeout);
  }

  removeToast(notificationId: string): void {
    this.activeToasts.update(toasts => 
      toasts.filter(t => t.id !== notificationId)
    );

    const timeout = this.toastTimeouts.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(notificationId);
    }
  }

  getToastIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'security': return '🔒';
      case 'info':
      default: return 'ℹ️';
    }
  }

  getToastClass(type: string): string {
    return `toast-${type.toLowerCase()}`;
  }
}
