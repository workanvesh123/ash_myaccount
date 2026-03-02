import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageQueueService } from '../../../core/services/message-queue.service';
import { MessageType } from '../../../core/models/message.model';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notification-container">
      @for (message of messageQueue.messages(); track message.id) {
        <div 
          class="notification" 
          [class.success]="message.type === MessageType.Success"
          [class.error]="message.type === MessageType.Error"
          [class.info]="message.type === MessageType.Info"
          [class.warning]="message.type === MessageType.Warning">
          <span class="message-text">{{ message.text }}</span>
          <button 
            class="close-btn" 
            (click)="messageQueue.remove(message.id)"
            aria-label="Close notification">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .notification {
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideIn 0.3s ease-out;
      background: white;
      border-left: 4px solid;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification.success {
      border-left-color: #10b981;
      background: #f0fdf4;
    }

    .notification.error {
      border-left-color: #ef4444;
      background: #fef2f2;
    }

    .notification.info {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }

    .notification.warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }

    .message-text {
      flex: 1;
      font-size: 14px;
      color: #1f2937;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      margin-left: 12px;
      line-height: 1;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: #1f2937;
    }
  `]
})
export class NotificationComponent {
  messageQueue = inject(MessageQueueService);
  MessageType = MessageType;
}
