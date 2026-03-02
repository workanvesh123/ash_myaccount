import { Component, inject, ChangeDetectionStrategy, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AvatarService } from '../../../core/services/avatar.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';
import { Router } from '@angular/router';
import { SessionStoreService } from '../../../core/services/session-store.service';
import { LoginStoreService } from '../../../core/services/login-store.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, NotificationCenterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div class="container">
        <div class="logo">
          <a routerLink="/">MyAccount</a>
        </div>
        
        <div class="header-actions">
          <button (click)="themeService.toggleTheme()" class="theme-toggle" title="Toggle theme">
            @if (themeService.theme() === 'light') {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            } @else {
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="5" stroke-width="2"/>
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-width="2" stroke-linecap="round"/>
              </svg>
            }
          </button>

          @if (userService.isAuthenticated()) {
            <app-notification-center />
            <nav class="nav">
              <a routerLink="/games" class="nav-link">Games</a>
              <a routerLink="/en/myaccount/profile" class="nav-link">Profile</a>
              <a routerLink="/en/myaccount/documents" class="nav-link">Documents</a>
              <a routerLink="/en/myaccount/profile" class="avatar-link" title="My Profile">
                <app-avatar 
                  [src]="avatarService.avatar()" 
                  [initials]="userInitials()"
                  size="small"
                />
              </a>
              <button (click)="logout()" class="logout-btn">Logout</button>
            </nav>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      padding: 1rem 0;
      box-shadow: var(--shadow-sm);
      border-bottom: 1px solid var(--color-border-light);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo a {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--color-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .logo a:hover {
      color: var(--color-primary-hover);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .theme-toggle {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      padding: 0.5rem;
      border-radius: 0.375rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }

    .theme-toggle:hover {
      background: var(--color-bg-tertiary);
      border-color: var(--color-primary);
    }

    .nav {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .nav-link {
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: color var(--transition-fast);
      font-weight: 500;
    }

    .nav-link:hover {
      color: var(--color-primary);
    }

    .avatar-link {
      display: flex;
      align-items: center;
      text-decoration: none;
    }

    .logout-btn {
      background: var(--color-danger);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background var(--transition-fast);
      font-weight: 500;
    }

    .logout-btn:hover {
      background: #c82333;
    }

    @media (max-width: 768px) {
      .nav {
        gap: 0.75rem;
      }

      .nav-link {
        font-size: 0.875rem;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  userService = inject(UserService);
  themeService = inject(ThemeService);
  avatarService = inject(AvatarService);
  private signalRService = inject(SignalRService);
  private router = inject(Router);
  private sessionStore = inject(SessionStoreService);
  private loginStore = inject(LoginStoreService);

  // Compute user initials (default if no profile loaded)
  userInitials = computed(() => {
    // In a real app, get from user profile
    return 'JD';
  });

  async ngOnInit(): Promise<void> {
    // Start SignalR connection if user is authenticated
    if (this.userService.isAuthenticated()) {
      await this.signalRService.startConnection();
    }
  }

  async ngOnDestroy(): Promise<void> {
    await this.signalRService.stopConnection();
  }

  async logout(): Promise<void> {
    // Stop SignalR connection
    await this.signalRService.stopConnection();
    
    // Clear all state
    this.userService.clear();
    this.loginStore.clear();
    this.sessionStore.clear();
    this.avatarService.clearAvatar();
    this.signalRService.clearNotifications();
    
    // Redirect to login
    this.router.navigate(['/login']);
  }
}
