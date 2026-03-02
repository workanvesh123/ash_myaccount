import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 MyAccount Learning Platform. All rights reserved.</p>
        <p class="subtitle">Built with Angular 20 + .NET 9</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 2rem 0;
      margin-top: auto;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      text-align: center;
    }

    p {
      margin: 0.5rem 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .subtitle {
      font-size: 0.75rem;
      color: #9ca3af;
    }
  `]
})
export class FooterComponent {}
