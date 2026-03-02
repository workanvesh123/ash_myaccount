import { Injectable, signal } from '@angular/core';
import { Message, MessageType, MessageLifetime } from '../models/message.model';

/**
 * Service for managing user notifications
 */
@Injectable({
  providedIn: 'root'
})
export class MessageQueueService {
  private messagesSignal = signal<Message[]>([]);
  
  /**
   * Read-only signal of current messages
   */
  readonly messages = this.messagesSignal.asReadonly();

  /**
   * Add a message to the queue
   */
  add(text: string, type: MessageType, lifetime: MessageLifetime = MessageLifetime.Single): void {
    const message: Message = {
      id: crypto.randomUUID(),
      text,
      type,
      lifetime,
      timestamp: Date.now()
    };

    this.messagesSignal.update(msgs => [...msgs, message]);

    // Auto-dismiss single-lifetime messages after 5 seconds
    if (lifetime === MessageLifetime.Single) {
      setTimeout(() => this.remove(message.id), 5000);
    }
  }

  /**
   * Add an error message (convenience method)
   */
  addError(text: string, lifetime: MessageLifetime = MessageLifetime.Single): void {
    this.add(text, MessageType.Error, lifetime);
  }

  /**
   * Add a success message (convenience method)
   */
  addSuccess(text: string, lifetime: MessageLifetime = MessageLifetime.Single): void {
    this.add(text, MessageType.Success, lifetime);
  }

  /**
   * Add an info message (convenience method)
   */
  addInfo(text: string, lifetime: MessageLifetime = MessageLifetime.Single): void {
    this.add(text, MessageType.Info, lifetime);
  }

  /**
   * Add a warning message (convenience method)
   */
  addWarning(text: string, lifetime: MessageLifetime = MessageLifetime.Single): void {
    this.add(text, MessageType.Warning, lifetime);
  }

  /**
   * Remove a specific message by ID
   */
  remove(id: string): void {
    this.messagesSignal.update(msgs => msgs.filter(m => m.id !== id));
  }

  /**
   * Clear all messages or only non-persistent ones
   */
  clear(options?: { clearPersistent?: boolean }): void {
    if (options?.clearPersistent) {
      this.messagesSignal.set([]);
    } else {
      this.messagesSignal.update(msgs => 
        msgs.filter(m => m.lifetime === MessageLifetime.Persistent)
      );
    }
  }
}
