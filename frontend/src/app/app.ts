import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { GlobalLoadingComponent } from './shared/components/global-loading/global-loading.component';

@Component({
  imports: [RouterModule, HeaderComponent, FooterComponent, NotificationComponent, GlobalLoadingComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected title = 'MyAccount';
}
