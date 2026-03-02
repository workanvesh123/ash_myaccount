import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PasswordStrengthService } from '../../../core/services/password-strength.service';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (password()) {
      <div class="password-strength">
        <div class="strength-bars">
          @for (bar of [0, 1, 2, 3, 4]; track bar) {
            <div 
              class="strength-bar" 
              [class.active]="bar <= strength().score"
              [style.background-color]="bar <= strength().score ? strength().color : 'var(--color-border)'"
            ></div>
          }
        </div>
        <div class="strength-info">
          <span class="strength-label" [style.color]="strength().color">
            {{ strength().label }}
          </span>
          @if (strength().suggestions.length > 0) {
            <ul class="strength-suggestions">
              @for (suggestion of strength().suggestions; track suggestion) {
                <li>{{ suggestion }}</li>
              }
            </ul>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .password-strength {
      margin-top: 0.5rem;
    }

    .strength-bars {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .strength-bar {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: var(--color-border);
      transition: background-color var(--transition-fast);
    }

    .strength-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .strength-label {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .strength-suggestions {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.8rem;
      color: var(--color-text-secondary);
    }

    .strength-suggestions li {
      margin-bottom: 0.25rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordStrengthComponent {
  private passwordStrengthService = inject(PasswordStrengthService);
  
  password = input<string>('');
  
  strength = computed(() => {
    return this.passwordStrengthService.checkStrength(this.password());
  });
}
