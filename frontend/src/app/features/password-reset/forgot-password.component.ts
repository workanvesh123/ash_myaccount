import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageQueueService } from '../../core/services/message-queue.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);

  isSubmitting = signal(false);
  emailSent = signal(false);

  forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const email = this.forgotPasswordForm.value.email!;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real app, call backend API
      // await this.authService.forgotPassword(email).toPromise();
      
      this.emailSent.set(true);
      this.messageQueue.addSuccess('Password reset link sent to your email');
      
      // For demo, show reset token in console
      const resetToken = this.generateResetToken();
      console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
      console.log(`[Password Reset] Link: http://localhost:4200/reset-password?token=${resetToken}`);
      
    } catch (error: any) {
      this.messageQueue.addError('Failed to send reset email. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
