import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProfileService, UserProfile } from './profile.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';
import { AvatarService } from '../../../core/services/avatar.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private messageQueue = inject(MessageQueueService);
  avatarService = inject(AvatarService);
  private router = inject(Router);

  profile = signal<UserProfile | null>(null);
  isLoading = signal(true);
  isUploadingAvatar = signal(false);

  userInitials = computed(() => {
    const p = this.profile();
    if (!p) return '??';
    return this.avatarService.getInitials(p.firstName, p.lastName);
  });

  async ngOnInit(): Promise<void> {
    await this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.isLoading.set(true);
    try {
      const profile = await this.profileService.getProfile().toPromise();
      if (profile) {
        this.profile.set(profile);
      }
    } catch (error: any) {
      this.messageQueue.addError('Failed to load profile');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onAvatarFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file
    if (!file.type.startsWith('image/')) {
      this.messageQueue.addError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.messageQueue.addError('Image must be less than 2MB');
      return;
    }

    this.isUploadingAvatar.set(true);

    try {
      await this.avatarService.setAvatarFromFile(file);
      this.messageQueue.addSuccess('Avatar updated successfully');
    } catch (error) {
      this.messageQueue.addError('Failed to upload avatar');
    } finally {
      this.isUploadingAvatar.set(false);
      // Clear input
      input.value = '';
    }
  }

  removeAvatar(): void {
    this.avatarService.clearAvatar();
    this.messageQueue.addSuccess('Avatar removed');
  }

  navigateToEdit(): void {
    this.router.navigate(['/en/myaccount/profile/edit']);
  }

  navigateTo2FA(): void {
    this.router.navigate(['/en/myaccount/2fa-enable']);
  }

  navigateToChangePassword(): void {
    this.router.navigate(['/en/myaccount/change-password']);
  }
}
