# ChatGPT Handoff Prompt - Mini MyAccount Learning Project

## 🎯 Your Role

You are an expert full-stack developer helping me build a learning project called "Mini MyAccount". Your job is to:
1. Generate complete, production-ready code files
2. Provide exact commands to run
3. Fix any issues I report
4. Explain patterns when I ask

**Important:** I want to minimize my effort. You write the code, I test it.

---

## 📚 Project Overview

### Purpose
Build a simplified user account management system to learn:
- **Frontend:** Angular 20, Nx monorepo, RxJS, Signals, OnPush, SSR
- **Backend:** .NET 8, .NET Aspire, minimal APIs, AutoMapper
- **Patterns:** MyAccount interceptor workflows, session management

### Timeline
20-28 hours total (can be done in 3-4 focused days or one weekend)

### Core Features
1. **User Profile Management** - View/edit personal details with reactive forms
2. **Two-Factor Authentication** - Enable/verify 2FA with interceptor pattern (KEY LEARNING!)
3. **Document Upload** - KYC simulation with file handling
4. **Session & State Management** - Login/logout with persistence

---

## 🏗️ Architecture

### Project Structure
```
mini-myaccount-learning/
├── backend/
│   ├── AppHost/                    # .NET Aspire orchestrator
│   │   ├── AppHost.csproj
│   │   ├── Program.cs
│   │   └── appsettings.json
│   ├── MyAccount.Api/              # Main API
│   │   ├── Features/
│   │   │   ├── PersonalDetails/   # Profile endpoints
│   │   │   ├── TwoFactorAuth/     # 2FA endpoints
│   │   │   ├── DocumentUpload/    # Upload endpoints
│   │   │   └── Authentication/    # Login/logout
│   │   ├── Models/                 # DTOs
│   │   ├── Repositories/           # In-memory data
│   │   ├── MyAccount.Api.csproj
│   │   └── Program.cs
│   ├── Shared/                     # Shared contracts
│   └── MiniMyAccount.sln
└── frontend/
    ├── apps/
    │   └── myaccount/              # Main app
    ├── libs/
    │   ├── core/                   # Core services
    │   ├── features/               # Feature modules
    │   └── shared/                 # Shared components
    ├── nx.json
    ├── package.json
    └── tsconfig.base.json
```

### Technology Stack

**Backend:**
- .NET 8.0
- .NET Aspire (orchestration)
- Minimal APIs (no controllers)
- AutoMapper (DTO mapping)
- In-memory repositories (no database)
- Swagger/OpenAPI

**Frontend:**
- Angular 20
- Nx monorepo
- Standalone components (no NgModules)
- Signals + OnPush change detection
- SSR (Server-Side Rendering)
- RxJS for async operations
- Reactive forms

---

## 🔑 Key Patterns to Implement

### Pattern 1: Interceptor-Based Workflow (MOST IMPORTANT!)

**Concept:** After login, if user requires 2FA, redirect to verification page before completing login.

**Flow:**
```
1. User submits login form
   ↓
2. POST /api/auth/login
   ↓
3. API returns:
   {
     "isCompleted": false,              ← Key flag!
     "redirectUrl": "/en/myaccount/2fa-verify",
     "postLoginValues": {
       "errorcode": 118                 ← 118 = forced, 122 = optional
     },
     "claims": { "sessionToken": "..." }
   }
   ↓
4. LoginResponseHandlerService checks isCompleted
   ↓
5. Store postLoginValues in LoginStoreService
   ↓
6. Redirect to /en/myaccount/2fa-verify
   ↓
7. TwoFaVerifyComponent reads workflow state from SessionStoreService
   ↓
8. User enters OTP code
   ↓
9. POST /api/2fa/verify
   ↓
10. Clear session state, redirect to profile
```

**Key Services:**
- `LoginResponseHandlerService` - Handles login response, checks isCompleted
- `LoginStoreService` - Stores PostLoginValues
- `SessionStoreService` - Persists workflow state in sessionStorage
- `TwoFaVerifyComponent` - Interceptor page that verifies OTP

**Code Example (LoginResponseHandlerService):**
```typescript
async handle(response: LoginResponse): Promise<void> {
  // Store PostLoginValues for interceptor
  this.loginStore.setPostLoginValues(response.postLoginValues);
  
  // Update user state
  this.userService.setAuthenticated(response.user?.isAuthenticated ?? false);
  
  // Store session token
  sessionStorage.setItem('sessionToken', response.claims.sessionToken);
  
  // Check if login is completed
  if (!response.isCompleted) {
    // Redirect to interceptor (2FA verify)
    await this.router.navigateByUrl(response.redirectUrl);
    return;
  }
  
  // Login completed - redirect to profile
  await this.router.navigate(['/myaccount/profile']);
}
```



**Code Example (TwoFaVerifyComponent):**
```typescript
@Component({
  selector: 'app-two-fa-verify',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoFaVerifyComponent implements OnInit {
  private sessionService = inject(SessionStoreService);
  private loginStore = inject(LoginStoreService);
  
  otpCode = signal('');
  flowType = signal<'forced' | 'optional' | null>(null);
  
  ngOnInit(): void {
    // Check session storage first (for page refresh)
    const sessionFlow = this.sessionService.get<{ errorcode: number }>('two-fa-flowtype');
    
    if (sessionFlow) {
      this.setFlowType(sessionFlow.errorcode);
      return;
    }
    
    // Check PostLoginValues from login response
    const postLoginValues = this.loginStore.PostLoginValues();
    
    if (!postLoginValues) {
      // Error: workflow state missing
      return;
    }
    
    // Store in session for page refresh
    this.sessionService.set('two-fa-flowtype', { errorcode: postLoginValues.errorcode });
    this.setFlowType(postLoginValues.errorcode);
  }
  
  private setFlowType(errorcode: number): void {
    if (errorcode === 118) {
      this.flowType.set('forced');   // User MUST complete 2FA
    } else if (errorcode === 122) {
      this.flowType.set('optional'); // User CAN skip 2FA
    }
  }
  
  verifyOtp(): void {
    this.twoFaService.verify2FA(this.otpCode()).subscribe({
      next: () => {
        // Clear session state
        this.sessionService.remove('two-fa-flowtype');
        
        // Complete login - redirect to profile
        this.router.navigate(['/myaccount/profile']);
      }
    });
  }
}
```

---

### Pattern 2: Session Management

**Concept:** Store workflow state in sessionStorage to persist across page refreshes.

**SessionStoreService:**
```typescript
@Injectable({ providedIn: 'root' })
export class SessionStoreService {
  set<T>(key: string, value: T): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  get<T>(key: string): T | null {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  remove(key: string): void {
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }
}
```

**Usage:**
```typescript
// Store workflow state
this.sessionService.set('two-fa-flowtype', { errorcode: 118 });

// Retrieve workflow state (survives page refresh)
const flowState = this.sessionService.get<{ errorcode: number }>('two-fa-flowtype');

// Clear on logout
this.sessionService.remove('two-fa-flowtype');
```

---

### Pattern 3: Message Queue for Notifications

**Concept:** Centralized notification system using signals.

**MessageQueueService:**
```typescript
export enum MessageType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning'
}

export enum MessageLifetime {
  Single = 'single',      // Auto-dismiss after 5s
  Persistent = 'persistent' // Manual dismiss
}

export interface Message {
  id: string;
  text: string;
  type: MessageType;
  lifetime: MessageLifetime;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class MessageQueueService {
  private messagesSignal = signal<Message[]>([]);
  messages = this.messagesSignal.asReadonly();

  add(text: string, type: MessageType, lifetime: MessageLifetime): void {
    const message: Message = {
      id: crypto.randomUUID(),
      text,
      type,
      lifetime,
      timestamp: Date.now()
    };
    this.messagesSignal.update(msgs => [...msgs, message]);

    if (lifetime === MessageLifetime.Single) {
      setTimeout(() => this.remove(message.id), 5000);
    }
  }

  addError(text: string, lifetime = MessageLifetime.Single): void {
    this.add(text, MessageType.Error, lifetime);
  }

  remove(id: string): void {
    this.messagesSignal.update(msgs => msgs.filter(m => m.id !== id));
  }

  clear(options?: { clearPersistent?: boolean }): void {
    if (options?.clearPersistent) {
      this.messagesSignal.set([]);
    } else {
      this.messagesSignal.update(msgs => 
        msgs.filter(m => m.lifetime === MessageLifetime.Persistent)
      );
    }
  }
}
```

**Usage:**
```typescript
// Success message
this.messageQueue.add(
  'Profile updated successfully',
  MessageType.Success,
  MessageLifetime.Single
);

// Error message
this.messageQueue.addError('Failed to save profile');

// Clear all messages
this.messageQueue.clear({ clearPersistent: true });
```

---

### Pattern 4: Signals + OnPush Change Detection

**Concept:** Use signals for reactive state, OnPush for performance.

**Component Example:**
```typescript
@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush, // ← Required!
  imports: [ReactiveFormsModule]
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  
  // State as signals
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
  // Computed values
  displayName = computed(() => {
    const p = this.profile();
    return p ? `${p.firstName} ${p.lastName}` : '';
  });
  
  ngOnInit(): void {
    this.loadProfile();
  }
  
  private loadProfile(): void {
    this.profileService.getProfile()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load profile');
          this.loading.set(false);
        }
      });
  }
}
```

**Template:**
```html
@if (loading()) {
  <loading-spinner />
} @else if (error()) {
  <div class="error">{{ error() }}</div>
} @else if (profile()) {
  <div class="profile-card">
    <h2>{{ displayName() }}</h2>
    <p>Email: {{ profile()!.email }}</p>
    <p>Phone: {{ profile()!.phone }}</p>
  </div>
}
```

**Key Rules:**
- All components use `ChangeDetectionStrategy.OnPush`
- State managed with `signal()`, derived state with `computed()`
- Convert observables with `toSignal()`, never use `async` pipe
- Call signals with `()` in templates: `{{ profile() }}`

---

### Pattern 5: Reactive Forms with Signals

**Concept:** Use reactive forms with signal-based validation state.

**Component:**
```typescript
@Component({
  selector: 'app-profile-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule]
})
export class ProfileEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  
  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, this.phoneValidator()]]
  });
  
  // Convert form state to signals
  formValid = toSignal(this.form.statusChanges.pipe(
    map(() => this.form.valid)
  ));
  
  formDirty = toSignal(this.form.statusChanges.pipe(
    map(() => this.form.dirty)
  ));
  
  // Computed signal for save button state
  canSave = computed(() => this.formValid() && this.formDirty());
  
  saving = signal(false);
  
  save(): void {
    if (!this.canSave()) return;
    
    this.saving.set(true);
    this.profileService.updateProfile(this.form.value).subscribe({
      next: () => {
        this.messageQueue.add(
          'Profile updated successfully',
          MessageType.Success,
          MessageLifetime.Single
        );
        this.router.navigate(['/myaccount/profile']);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
  
  private phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(control.value) ? null : { invalidPhone: true };
    };
  }
}
```

**Template:**
```html
<form [formGroup]="form" (ngSubmit)="save()">
  <div class="form-field">
    <label for="firstName">First Name</label>
    <input id="firstName" formControlName="firstName" />
    @if (form.controls.firstName.invalid && form.controls.firstName.touched) {
      <span class="error">First name is required (min 2 characters)</span>
    }
  </div>
  
  <!-- More fields... -->
  
  <div class="form-actions">
    <button type="submit" [disabled]="!canSave() || saving()">
      {{ saving() ? 'Saving...' : 'Save' }}
    </button>
    <button type="button" (click)="cancel()">Cancel</button>
  </div>
</form>
```

---

### Pattern 6: SSR-Safe Development

**Concept:** All code must work on both server and client.

**Rules:**
1. Never access `window` or `document` directly
2. Use injection tokens: `inject(WINDOW)`, `inject(DOCUMENT)`
3. Use `afterNextRender()` for browser-only code
4. Use `PLATFORM.runOnBrowser()` for conditional execution

**Example:**
```typescript
@Component({
  selector: 'app-my-component',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent implements OnInit {
  private window = inject(WINDOW);
  private document = inject(DOCUMENT);
  
  ngOnInit(): void {
    // ✅ Correct: Use afterNextRender for browser-only code
    afterNextRender(() => {
      const width = this.window.innerWidth;
      console.log('Window width:', width);
    });
  }
  
  // ❌ Wrong: Direct window access
  // ngOnInit(): void {
  //   const width = window.innerWidth; // Crashes on server!
  // }
}
```

**WINDOW Token:**
```typescript
// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: WINDOW,
      useFactory: () => {
        if (typeof window !== 'undefined') {
          return window;
        }
        return {} as Window; // Mock for server
      }
    }
  ]
};
```

---

## 📋 Implementation Phases

### Phase 1: Backend Setup (4-6 hours)

**Tasks:**
1. Create .NET solution structure
2. Set up .NET Aspire AppHost
3. Create MyAccount.Api project
4. Implement PersonalDetails feature (GET/PUT /api/user/profile)
5. Implement TwoFactorAuth feature (POST /api/2fa/enable, verify, disable)
6. Implement DocumentUpload feature (POST /api/documents/upload, GET, DELETE)
7. Implement Authentication feature (POST /api/auth/login, logout)
8. Add CORS, health checks, Swagger

**Deliverables:**
- All backend files created
- Swagger UI accessible at http://localhost:5000/swagger
- All endpoints testable

---

### Phase 2: Frontend Setup (2-3 hours)

**Tasks:**
1. Create Nx workspace with Angular 20
2. Configure SSR
3. Create core services (SessionStore, MessageQueue, LoginStore, UserService)
4. Create HTTP interceptors (Auth, Error)
5. Create route guards (AuthGuard)
6. Create app shell (header, footer, notification component)
7. Configure routing with culture support

**Deliverables:**
- Nx workspace created
- App runs with SSR: `nx serve myaccount`
- Core services available
- Routing configured

---

### Phase 3: Profile Feature (3-4 hours)

**Tasks:**
1. Create ProfileComponent (view profile)
2. Create ProfileEditComponent (edit with reactive forms)
3. Create ProfileService (API calls)
4. Add routing
5. Add unit tests

**Deliverables:**
- Can view profile at /en/myaccount/profile
- Can edit profile at /en/myaccount/profile/edit
- Form validation works
- Save/cancel works

---

### Phase 4: Two-Factor Auth Feature (4-5 hours)

**Tasks:**
1. Create TwoFaEnableComponent (enable 2FA from settings)
2. Create TwoFaVerifyComponent (interceptor page)
3. Create TwoFaService (API calls)
4. Implement LoginResponseHandlerService
5. Add routing
6. Test interceptor flow
7. Add unit tests

**Deliverables:**
- Can enable 2FA from profile
- Login redirects to 2FA verify if enabled
- OTP verification works
- Session state persists across refresh
- Completes login after verification

---

### Phase 5: Document Upload Feature (3-4 hours)

**Tasks:**
1. Create DocumentUploadComponent (file picker, preview, upload)
2. Create DocumentListComponent (list, delete)
3. Create DocumentsService (API calls)
4. Add routing
5. Add unit tests

**Deliverables:**
- Can upload documents at /en/myaccount/documents/upload
- Can view documents at /en/myaccount/documents
- File validation works (size, type)
- Preview works for images
- Delete works

---

### Phase 6: Login/Logout (2-3 hours)

**Tasks:**
1. Create LoginComponent (login form)
2. Create LoginService (API calls)
3. Add logout button to header
4. Test full auth flow
5. Add unit tests

**Deliverables:**
- Can login at /login
- Can logout from header
- Session persists across refresh
- Auth guard protects routes

---

### Phase 7: Polish & Testing (2-3 hours)

**Tasks:**
1. Add loading states to all async operations
2. Add error handling
3. Add success messages
4. Test SSR rendering
5. Create README with setup instructions
6. Final testing

**Deliverables:**
- All features work end-to-end
- SSR renders without errors
- Error messages display correctly
- Success messages display correctly
- Documentation complete

---

## 🚀 Working Protocol

### How to Request Work

**For each phase, I say:**
> "Implement Phase [X]: [Phase Name]. Generate all files for this phase with complete implementations."

**Example:**
> "Implement Phase 1: Backend Setup. Generate all files including AppHost, MyAccount.Api, all features, repositories, and models."

**You respond with:**
1. Complete file contents for all files
2. Exact commands to run
3. What to test and how

**I respond with:**
1. "Phase [X] works! Move to Phase [Y]."
   OR
2. "I'm getting this error: [paste error]. Fix it."

**You respond with:**
1. Fixed file contents
2. Explanation of what was wrong

### File Generation Format

**When generating files, use this format:**

```
File: backend/AppHost/Program.cs
```csharp
var builder = DistributedApplication.CreateBuilder(args);
// ... complete file contents ...
```

File: backend/MyAccount.Api/Program.cs
```csharp
var builder = WebApplication.CreateBuilder(args);
// ... complete file contents ...
```
```

**Important:**
- Provide COMPLETE file contents (not snippets)
- Include all necessary using statements
- Include all error handling
- Make code production-ready

---

## 📦 API Contracts

### Authentication

**POST /api/auth/login**
Request:
```json
{
  "username": "john.doe@example.com",
  "password": "password123"
}
```

Response (2FA required):
```json
{
  "isCompleted": false,
  "redirectUrl": "/en/myaccount/2fa-verify",
  "action": "twoFactorAuth",
  "claims": {
    "username": "john.doe@example.com",
    "accountId": "user123",
    "sessionToken": "abc123xyz"
  },
  "postLoginValues": {
    "errorcode": 118,
    "suberror": 0
  },
  "user": {
    "isAuthenticated": true
  }
}
```

Response (no 2FA):
```json
{
  "isCompleted": true,
  "claims": {
    "username": "john.doe@example.com",
    "accountId": "user123",
    "sessionToken": "abc123xyz"
  },
  "user": {
    "isAuthenticated": true
  }
}
```

---

### User Profile

**GET /api/user/profile**
Response:
```json
{
  "userId": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "twoFactorEnabled": false
}
```

**PUT /api/user/profile**
Request:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890"
}
```

Response: Same as GET

---

### Two-Factor Authentication

**POST /api/2fa/enable**
Request:
```json
{
  "method": "email"
}
```

Response:
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresIn": 300
}
```

**POST /api/2fa/verify**
Request:
```json
{
  "code": "123456"
}
```

Response:
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

**POST /api/2fa/disable**
Response:
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

---

### Document Upload

**POST /api/documents/upload**
Request: multipart/form-data
- `file`: File
- `documentType`: "id" | "proof_of_address"

Response:
```json
{
  "documentId": "doc123",
  "filename": "passport.pdf",
  "uploadDate": "2024-01-01T00:00:00Z",
  "status": "pending",
  "documentType": "id"
}
```

**GET /api/documents**
Response:
```json
{
  "documents": [
    {
      "documentId": "doc123",
      "filename": "passport.pdf",
      "uploadDate": "2024-01-01T00:00:00Z",
      "status": "pending",
      "documentType": "id"
    }
  ]
}
```

**DELETE /api/documents/{id}**
Response:
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## 🎯 Success Criteria

After completing all phases, verify:

✅ **Backend:**
- All endpoints respond correctly in Swagger
- CORS allows frontend requests
- Health check returns 200
- Aspire dashboard shows service running

✅ **Frontend:**
- App runs with SSR: `nx serve myaccount`
- All pages render without console errors
- Can view profile
- Can edit profile (form validation works)
- Can enable 2FA (OTP flow works)
- Login redirects to 2FA verify if enabled
- Can upload documents
- Can view/delete documents
- Can login/logout
- Session persists across page refresh
- Error messages display via message queue
- Success messages display via message queue

✅ **Patterns:**
- 2FA interceptor redirects correctly
- Session state persists in sessionStorage
- All components use OnPush + signals
- No direct window/document access (SSR-safe)
- Reactive forms work with signal-based validation

---

## 🛠️ Commands Reference

### Backend
```bash
# Navigate to backend
cd backend

# Restore packages
dotnet restore

# Run Aspire AppHost
dotnet run --project AppHost

# Aspire dashboard: http://localhost:15888
# API Swagger: http://localhost:5000/swagger
# API base URL: http://localhost:5000
```

### Frontend
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Serve with SSR
nx serve myaccount

# App URL: http://localhost:4200

# Build for production
nx build myaccount --configuration=production

# Run tests
nx test myaccount

# Run linting
nx lint myaccount
```

---

## 📝 Important Notes

1. **Mock everything** - No real database, no real email/SMS, no real payment processing
2. **Keep it simple** - Focus on patterns, not production features
3. **Test frequently** - After each phase, test before moving on
4. **Use TypeScript strict mode** - Catch errors early
5. **Follow Angular style guide** - Consistent code style
6. **Use signals everywhere** - Modern Angular reactive patterns
7. **Make it SSR-safe** - All code must work on server and client
8. **Use OnPush always** - Performance best practice
9. **Validate forms properly** - Good UX
10. **Handle errors gracefully** - Show user-friendly messages

---

## 🚦 Ready to Start!

When I'm ready to begin, I'll say:

> "I'm ready to start. I've created the project folder at ~/repos/mini-myaccount-learning and initialized git. Implement Phase 1: Backend Setup. Generate all files."

Then you'll provide all the backend files with complete implementations, and I'll test them!

---

## 📚 Additional Context

**This project is based on patterns from a production iGaming platform's MyAccount product.** The key learning is the **interceptor pattern** used for post-login workflows like 2FA verification, KYC checks, and responsible gaming prompts.

**Reference architecture:**
- Production repo uses Nx monorepo with 9 products (sports, casino, bingo, poker, lottery, myaccount, promo, engagement, horseracing)
- Backend uses .NET with feature-based organization
- Frontend uses Angular 20 with standalone components, signals, and SSR
- MyAccount handles user profile, documents, 2FA, responsible gaming, and account settings

**Key files to reference (if available):**
- `packages/vanilla/lib/core/src/login/login-response-handler/login-response-handler.service.ts`
- `packages/myaccount/core-lib/src/lib/interceptors/two-fa/two-fa.component.ts`
- `backend/myaccount/Frontend.MyAccount.Api/Features/`

---

## 🎓 Learning Outcomes

After completing this project, I will understand:

1. **Interceptor Pattern** - How to redirect users to verification pages mid-login flow
2. **Session Management** - How to persist workflow state across page refreshes
3. **Signals + OnPush** - Modern Angular reactive patterns for performance
4. **SSR-Safe Development** - Building components that work on server and client
5. **Reactive Forms** - Complex form validation with signals
6. **.NET Aspire** - Service orchestration and health monitoring
7. **Feature-Based Architecture** - Organizing code by business domain
8. **Message Queue Pattern** - Centralized user notification management
9. **HTTP Interceptors** - Global request/response handling
10. **Route Guards** - Authentication and authorization

This knowledge is directly applicable to production Angular + .NET applications!
