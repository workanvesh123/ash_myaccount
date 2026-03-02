import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService, UserSession } from '../../../core/services/session.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';
import { SessionStoreService } from '../../../core/services/session-store.service';
import { LoginStoreService } from '../../../core/services/login-store.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-session-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-management.component.html',
  styleUrls: ['./session-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionManagementComponent implements OnInit {
  private sessionService = inject(SessionService);
  private messageQueue = inject(MessageQueueService);
  private sessionStore = inject(SessionStoreService);
  private loginStore = inject(LoginStoreService);
  private userService = inject(UserService);
  private router = inject(Router);

  sessions = signal<UserSession[]>([]);
  isLoading = signal(true);
  revokingSessionId = signal<string | null>(null);
  revokingAll = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this.sessionService.getSessions().toPromise();
      if (response) {
        this.sessions.set(response.sessions);
      }
    } catch (error: any) {
      this.messageQueue.addError('Failed to load sessions');
    } finally {
      this.isLoading.set(false);
    }
  }

  async revokeSession(sessionId: string, isCurrent: boolean): Promise<void> {
    if (!confirm('Are you sure you want to revoke this session?')) return;

    this.revokingSessionId.set(sessionId);
    try {
      await this.sessionService.revokeSession(sessionId).toPromise();
      this.messageQueue.addSuccess('Session revoked successfully');

      if (isCurrent) {
        // If revoking current session, logout
        this.userService.clear();
        this.loginStore.clear();
        this.sessionStore.clear();
        await this.router.navigate(['/login']);
      } else {
        // Reload sessions
        await this.loadSessions();
      }
    } catch (error: any) {
      this.messageQueue.addError('Failed to revoke session');
    } finally {
      this.revokingSessionId.set(null);
    }
  }

  async revokeAllSessions(): Promise<void> {
    if (!confirm('Are you sure you want to logout from all devices? You will be logged out from this device too.')) return;

    this.revokingAll.set(true);
    try {
      const response = await this.sessionService.revokeAllSessions(false).toPromise();
      this.messageQueue.addSuccess(`Revoked ${response?.count || 0} session(s)`);

      // Clear all state and redirect to login
      this.userService.clear();
      this.loginStore.clear();
      this.sessionStore.clear();
      await this.router.navigate(['/login']);
    } catch (error: any) {
      this.messageQueue.addError('Failed to revoke all sessions');
    } finally {
      this.revokingAll.set(false);
    }
  }

  getDeviceIcon(deviceName: string): string {
    const device = deviceName.toLowerCase();
    if (device.includes('mobile')) return '📱';
    if (device.includes('tablet')) return '📱';
    return '💻';
  }

  getBrowserIcon(browser: string): string {
    const b = browser.toLowerCase();
    if (b.includes('chrome')) return '🌐';
    if (b.includes('firefox')) return '🦊';
    if (b.includes('safari')) return '🧭';
    if (b.includes('edge')) return '🌊';
    return '🌐';
  }

  getOSIcon(os: string): string {
    const o = os.toLowerCase();
    if (o.includes('windows')) return '🪟';
    if (o.includes('mac')) return '🍎';
    if (o.includes('linux')) return '🐧';
    if (o.includes('android')) return '🤖';
    if (o.includes('ios')) return '📱';
    return '💻';
  }

  getTimeSince(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
}
