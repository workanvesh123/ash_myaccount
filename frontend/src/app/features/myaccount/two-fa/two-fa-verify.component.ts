import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TwoFaService } from './two-fa.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';
import { SessionStoreService } from '../../../core/services/session-store.service';
import { LoginStoreService } from '../../../core/services/login-store.service';

@Component({
  selector: 'app-two-fa-verify',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './two-fa-verify.component.html',
  styleUrls: ['./two-fa-verify.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoFaVerifyComponent implements OnInit {
  private twoFaService = inject(TwoFaService);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);
  private sessionStore = inject(SessionStoreService);
  private loginStore = inject(LoginStoreService);

  otpCode = signal('');
  isVerifying = signal(false);
  errorCode = signal<number | null>(null);

  ngOnInit(): void {
    // Check if we have PostLoginValues (from login interceptor)
    const flowState = this.sessionStore.get<{ errorcode: number }>('two-fa-flowtype');
    if (flowState) {
      this.errorCode.set(flowState.errorcode);
    }

    // If no flow state, redirect to login
    if (!flowState) {
      this.messageQueue.addError('Invalid 2FA flow. Please login again.');
      this.router.navigate(['/login']);
    }
  }

  updateOtpCode(value: string): void {
    this.otpCode.set(value);
  }

  async verifyOTP(): Promise<void> {
    if (this.otpCode().length !== 6) {
      this.messageQueue.addError('Please enter a 6-digit code');
      return;
    }

    this.isVerifying.set(true);

    try {
      const response = await this.twoFaService.verify({ code: this.otpCode() }).toPromise();
      
      if (response?.success) {
        // Clear flow state
        this.sessionStore.remove('two-fa-flowtype');
        this.loginStore.setPostLoginValues(null);
        
        this.messageQueue.addSuccess('Login successful!');
        await this.router.navigate(['/en/myaccount/profile']);
      }
    } catch (error: any) {
      this.messageQueue.addError(
        error?.error?.message || 'Invalid or expired OTP'
      );
      this.otpCode.set(''); // Clear the input
    } finally {
      this.isVerifying.set(false);
    }
  }

  cancel(): void {
    // Clear session and redirect to login
    this.sessionStore.clear();
    this.loginStore.clear();
    this.router.navigate(['/login']);
  }
}
