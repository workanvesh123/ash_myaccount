import { Component, ChangeDetectionStrategy, Input, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar" [class.small]="size() === 'small'" [class.large]="size() === 'large'">
      @if (src()) {
        <img [src]="src()!" [alt]="alt()" />
      } @else {
        <div class="avatar-initials">{{ initials() }}</div>
      }
    </div>
  `,
  styles: [`
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary);
      color: white;
      font-weight: 600;
      border: 2px solid var(--color-border);
      transition: all var(--transition-fast);
    }

    .avatar.small {
      width: 32px;
      height: 32px;
      font-size: 0.75rem;
    }

    .avatar.large {
      width: 80px;
      height: 80px;
      font-size: 1.5rem;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      user-select: none;
    }

    .avatar:hover {
      transform: scale(1.05);
      box-shadow: var(--shadow-md);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  src = input<string | null>(null);
  initials = input<string>('??');
  alt = input<string>('User avatar');
  size = input<'small' | 'medium' | 'large'>('medium');
}
