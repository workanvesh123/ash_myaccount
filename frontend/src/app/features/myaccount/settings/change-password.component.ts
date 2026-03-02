import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageQueueService } from '../../../core/services/message-queue.service';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';
import { UserService } from '../../../core/services/user.service';
import { SessionStoreService } from '../../../core/services/session-store.service';
import { LoginStoreService } from '../../../core/services/login-store.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordStrengthComponent],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);
  private userService = inject(UserService);
  private sessionStore = inject(SessionStoreService);
  private loginStore = inject(LoginStoreService);

  isSubmitting = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  logoutAllSessions = signal(false);

  changePasswordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  async onSubmit(): Promise<void> {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;

    if (newPassword !== confirmPassword) {
      this.messageQueue.addError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      this.messageQueue.addError('New password must be different from current password');
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, call backend API
      // await this.authService.changePassword(currentPassword, newPassword).toPromise();
      
      this.messageQueue.addSuccess('Password changed successfully!');
      
      if (this.logoutAllSessions()) {
        // Clear all state and redirect to login
        this.userService.clear();
        this.loginStore.clear();
        this.sessionStore.clear();
        
        this.messageQueue.addInfo('Logged out from all devices');
        await this.router.navigate(['/login']);
      } else {
        // Just go back to profile
        await this.router.navigate(['/en/myaccount/profile']);
      }
      
    } catch (error: any) {
      this.messageQueue.addError('Failed to change password. Please check your current password.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  toggleLogoutAllSessions(): void {
    this.logoutAllSessions.set(!this.logoutAllSessions());
  }

  cancel(): void {
    this.router.navigate(['/en/myaccount/profile']);
  }
}
