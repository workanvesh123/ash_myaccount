import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./features/login/login.routes').then(m => m.LOGIN_ROUTES)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/password-reset/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/password-reset/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: ':culture/myaccount',
    canActivate: [authGuard],
    loadChildren: () => import('./features/myaccount/myaccount.routes').then(m => m.MYACCOUNT_ROUTES)
  },
  {
    path: 'games',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/games/game-lobby/game-lobby.component').then(m => m.GameLobbyComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./features/games/game-history/game-history.component').then(m => m.GameHistoryComponent)
      },
      {
        path: ':gameId',
        loadComponent: () => import('./features/games/game-page/game-page.component').then(m => m.GamePageComponent)
      }
    ]
  }
];

