# Phase 2: Frontend Setup - Implementation Plan

## Overview
Create Angular 20 + Nx workspace with SSR and core infrastructure for MyAccount learning platform.

---

## ✅ Completed

### 1. Nx Workspace Created
```bash
npx create-nx-workspace@latest frontend
```

**Configuration:**
- Preset: angular-standalone
- App Name: myaccount
- Style: SCSS
- SSR: Enabled
- Routing: Enabled
- Standalone API: Yes
- Bundler: esbuild
- Test Runner: vitest-angular
- E2E: Playwright

**Structure:**
```
frontend/
├── src/
│   ├── app/
│   ├── main.ts
│   ├── main.server.ts
│   ├── server.ts
│   └── styles.scss
├── e2e/
├── node_modules/
└── package.json
```

---

## 📋 Next Steps (To Implement)

### Phase 2.1: Core Services (2-3 hours)
Create foundational services for state management and HTTP communication.

**Files to Create:**
1. `src/app/core/services/session-store.service.ts`
2. `src/app/core/services/message-queue.service.ts`
3. `src/app/core/services/login-store.service.ts`
4. `src/app/core/services/user.service.ts`
5. `src/app/core/services/login-response-handler.service.ts`

**Key Features:**
- SessionStoreService - Wrapper for sessionStorage
- MessageQueueService - Notification queue with signals
- LoginStoreService - PostLoginValues storage
- UserService - User state (isAuthenticated, accountId)
- LoginResponseHandlerService - Handle 2FA interceptor logic

---

### Phase 2.2: HTTP Interceptors (1 hour)
Create HTTP interceptors for authentication and error handling.

**Files to Create:**
1. `src/app/core/interceptors/auth.interceptor.ts`
2. `src/app/core/interceptors/error.interceptor.ts`

**Features:**
- Auth: Add Bearer token to requests
- Error: Global error handling with MessageQueue

---

### Phase 2.3: Route Guards (1 hour)
Create authentication guard.

**Files to Create:**
1. `src/app/core/guards/auth.guard.ts`

**Features:**
- Redirect to login if not authenticated
- Store intended URL for post-login redirect

---

### Phase 2.4: App Shell (1-2 hours)
Create header, footer, and notification components.

**Files to Create:**
1. `src/app/shared/components/header/header.component.ts`
2. `src/app/shared/components/footer/footer.component.ts`
3. `src/app/shared/components/notification/notification.component.ts`
4. `src/app/shared/components/loading-spinner/loading-spinner.component.ts`

**Features:**
- Header with logout button
- Footer with links
- Notification component (displays MessageQueue)
- Loading spinner

---

### Phase 2.5: Routing Configuration (1 hour)
Configure culture-based routing.

**Files to Modify:**
1. `src/app/app.routes.ts`
2. `src/app/app.config.ts`

**Route Structure:**
```
/:culture/myaccount
  /profile
  /profile/edit
  /2fa-enable
  /2fa-verify
  /documents
  /documents/upload
/login
```

---

### Phase 2.6: Environment Configuration (30 min)
Configure API base URL.

**Files to Create:**
1. `src/environments/environment.ts`
2. `src/environments/environment.development.ts`

**Configuration:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api/v1'
};
```

---

## Estimated Timeline

| Task | Hours | Description |
|------|-------|-------------|
| Core Services | 2-3 | Session, Message Queue, Login Store, User |
| HTTP Interceptors | 1 | Auth, Error |
| Route Guards | 1 | AuthGuard |
| App Shell | 1-2 | Header, Footer, Notification |
| Routing | 1 | Culture-based routes |
| Environment | 0.5 | API configuration |
| **Total** | **6.5-8.5** | **Phase 2 Complete** |

---

## Key Patterns to Implement

### 1. Signals + OnPush
All components use:
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  data = signal<Data | null>(null);
  loading = signal(false);
}
```

### 2. SessionStorage Wrapper
```typescript
export class SessionStoreService {
  set<T>(key: string, value: T): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  }
}
```

### 3. Message Queue with Signals
```typescript
export class MessageQueueService {
  private messagesSignal = signal<Message[]>([]);
  messages = this.messagesSignal.asReadonly();
  
  add(text: string, type: MessageType): void {
    const message = { id: crypto.randomUUID(), text, type };
    this.messagesSignal.update(msgs => [...msgs, message]);
  }
}
```

### 4. LoginResponseHandler Pattern
```typescript
async handle(response: LoginResponse): Promise<void> {
  this.loginStore.setPostLoginValues(response.postLoginValues);
  
  if (!response.isCompleted) {
    // Redirect to 2FA verify
    await this.router.navigateByUrl(response.redirectUrl);
    return;
  }
  
  // Login completed
  await this.router.navigate(['/myaccount/profile']);
}
```

---

## Success Criteria

After Phase 2:
- ✅ Core services created and registered
- ✅ HTTP interceptors working
- ✅ Auth guard protecting routes
- ✅ App shell with header/footer
- ✅ Notification system working
- ✅ Routing configured with culture support
- ✅ Environment configuration set up
- ✅ SSR-safe (no window/document access)

---

## Commands to Run

```bash
# Serve with SSR
cd frontend
nx serve myaccount

# Build for production
nx build myaccount --configuration=production

# Run tests
nx test myaccount

# Run E2E tests
nx e2e e2e
```

---

## Next Phase

**Phase 3: Profile Feature** (3-4 hours)
- ProfileComponent (view)
- ProfileEditComponent (edit with reactive forms)
- ProfileService (HTTP calls)

---

Ready to implement Phase 2.1: Core Services?
