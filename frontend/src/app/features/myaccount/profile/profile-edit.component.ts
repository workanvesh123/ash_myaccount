import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService, UpdateProfileRequest } from './profile.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);

  isLoading = signal(true);
  isSaving = signal(false);

  profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]]
  });

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.isLoading.set(true);
    try {
      const profile = await this.profileService.getProfile().toPromise();
      if (profile) {
        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone
        });
      }
    } catch (error: any) {
      this.messageQueue.addError('Failed to load profile');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    try {
      const data: UpdateProfileRequest = this.profileForm.getRawValue();
      await this.profileService.updateProfile(data).toPromise();
      
      this.messageQueue.addSuccess('Profile updated successfully');
      await this.router.navigate(['/en/myaccount/profile']);
    } catch (error: any) {
      this.messageQueue.addError(
        error?.error?.message || 'Failed to update profile'
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/en/myaccount/profile']);
  }
}
