import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../../core/models/auth.model';
import { LoginResponseHandlerService } from '../../core/services/login-response-handler.service';
import { MessageQueueService } from '../../core/services/message-queue.service';
import { LoginStoreService } from '../../core/services/login-store.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private loginHandler = inject(LoginResponseHandlerService);
  private messageQueue = inject(MessageQueueService);
  private loginStore = inject(LoginStoreService);

  isLoading = signal(false);
  lastVisitor = this.loginStore.lastVisitor;

  loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    try {
      const credentials = this.loginForm.getRawValue();
      
      const response = await this.http.post<LoginResponse>(
        `${environment.apiUrl}/auth/login`,
        credentials
      ).toPromise();

      if (response) {
        // Store last visitor username
        this.loginStore.setLastVisitor(credentials.username);
        
        // Handle login response (2FA interceptor logic)
        await this.loginHandler.handle(response);
      }
    } catch (error: any) {
      this.messageQueue.addError(
        error?.error?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  fillTestUser(username: string, password: string): void {
    this.loginForm.patchValue({ username, password });
  }
}
