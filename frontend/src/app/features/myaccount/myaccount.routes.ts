import { Route } from '@angular/router';

export const MYACCOUNT_ROUTES: Route[] = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'profile/edit',
    loadComponent: () => import('./profile/profile-edit.component').then(m => m.ProfileEditComponent)
  },
  {
    path: '2fa-enable',
    loadComponent: () => import('./two-fa/two-fa-enable.component').then(m => m.TwoFaEnableComponent)
  },
  {
    path: '2fa-verify',
    loadComponent: () => import('./two-fa/two-fa-verify.component').then(m => m.TwoFaVerifyComponent)
  },
  {
    path: 'documents',
    loadComponent: () => import('./documents/document-list.component').then(m => m.DocumentListComponent)
  },
  {
    path: 'documents/upload',
    loadComponent: () => import('./documents/document-upload.component').then(m => m.DocumentUploadComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./settings/change-password.component').then(m => m.ChangePasswordComponent)
  },
  {
    path: 'activity',
    loadComponent: () => import('./activity/activity-log.component').then(m => m.ActivityLogComponent)
  },
  {
    path: 'sessions',
    loadComponent: () => import('./sessions/session-management.component').then(m => m.SessionManagementComponent)
  }
];
