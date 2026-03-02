import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityLogService, ActivityLogEntry } from '../../../core/services/activity-log.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityLogComponent implements OnInit {
  private activityLogService = inject(ActivityLogService);
  private messageQueue = inject(MessageQueueService);

  activities = signal<ActivityLogEntry[]>([]);
  isLoading = signal(true);
  currentPage = signal(1);
  pageSize = signal(20);
  totalCount = signal(0);
  totalPages = signal(0);

  async ngOnInit(): Promise<void> {
    await this.loadActivities();
  }

  async loadActivities(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this.activityLogService.getActivities(
        this.currentPage(),
        this.pageSize()
      ).toPromise();

      if (response) {
        this.activities.set(response.activities);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(Math.ceil(response.totalCount / this.pageSize()));
      }
    } catch (error: any) {
      this.messageQueue.addError('Failed to load activity log');
    } finally {
      this.isLoading.set(false);
    }
  }

  async goToPage(page: number): Promise<void> {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    await this.loadActivities();
  }

  async nextPage(): Promise<void> {
    await this.goToPage(this.currentPage() + 1);
  }

  async previousPage(): Promise<void> {
    await this.goToPage(this.currentPage() - 1);
  }

  getActivityIcon(activityType: string): string {
    switch (activityType) {
      case 'Login': return '🔓';
      case 'Logout': return '🔒';
      case 'LoginFailed': return '❌';
      case 'ProfileUpdated': return '✏️';
      case 'PasswordChanged': return '🔑';
      case 'TwoFactorEnabled': return '🛡️';
      case 'TwoFactorDisabled': return '🚫';
      case 'TwoFactorVerified': return '✅';
      case 'DocumentUploaded': return '📄';
      case 'DocumentDeleted': return '🗑️';
      case 'SessionRevoked': return '⛔';
      case 'PasswordResetRequested': return '🔄';
      case 'PasswordResetCompleted': return '✔️';
      default: return '📋';
    }
  }

  getActivityClass(activityType: string): string {
    if (activityType.includes('Failed')) return 'activity-failed';
    if (activityType.includes('Deleted') || activityType.includes('Revoked') || activityType.includes('Disabled')) return 'activity-warning';
    if (activityType.includes('Enabled') || activityType.includes('Verified') || activityType.includes('Completed')) return 'activity-success';
    return 'activity-info';
  }
}
