import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TwoFaService } from './two-fa.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';
import { ProfileService } from '../profile/profile.service';

@Component({
  selector: 'app-two-fa-enable',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './two-fa-enable.component.html',
  styleUrls: ['./two-fa-enable.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoFaEnableComponent {
  private twoFaService = inject(TwoFaService);
  private profileService = inject(ProfileService);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);

  isLoading = signal(false);
  otpSent = signal(false);
  otpCode = signal('');
  isVerifying = signal(false);
  isDisabling = signal(false);
  twoFactorEnabled = signal(false);

  async ngOnInit(): Promise<void> {
    await this.checkTwoFactorStatus();
  }

  async checkTwoFactorStatus(): Promise<void> {
    try {
      const profile = await this.profileService.getProfile().toPromise();
      if (profile) {
        this.twoFactorEnabled.set(profile.twoFactorEnabled);
      }
    } catch (error) {
      // Ignore error
    }
  }

  async sendOTP(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await this.twoFaService.enable({ method: 'email' }).toPromise();
      
      if (response?.success) {
        this.otpSent.set(true);
        this.messageQueue.addSuccess('OTP sent! Check your console/email.');
      }
    } catch (error: any) {
      this.messageQueue.addError(
        error?.error?.message || 'Failed to send OTP'
      );
    } finally {
      this.isLoading.set(false);
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
        this.messageQueue.addSuccess('2FA enabled successfully!');
        await this.router.navigate(['/en/myaccount/profile']);
      }
    } catch (error: any) {
      this.messageQueue.addError(
        error?.error?.message || 'Invalid or expired OTP'
      );
    } finally {
      this.isVerifying.set(false);
    }
  }

  async disable2FA(): Promise<void> {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication?')) {
      return;
    }

    this.isDisabling.set(true);

    try {
      const response = await this.twoFaService.disable().toPromise();
      
      if (response?.success) {
        this.messageQueue.addSuccess('2FA disabled successfully');
        await this.router.navigate(['/en/myaccount/profile']);
      }
    } catch (error: any) {
      this.messageQueue.addError(
        error?.error?.message || 'Failed to disable 2FA'
      );
    } finally {
      this.isDisabling.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/en/myaccount/profile']);
  }
}
