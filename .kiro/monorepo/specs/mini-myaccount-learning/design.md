# Mini MyAccount Learning Platform - Design Document

## 1. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Angular 20 App (SSR Enabled)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │  Profile   │  │   2FA      │  │ Documents  │    │  │
│  │  │  Feature   │  │  Feature   │  │  Feature   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │         │              │               │            │  │
│  │         └──────────────┴───────────────┘            │  │
│  │                        │                            │  │
│  │              ┌─────────▼─────────┐                  │  │
│  │              │   Core Services   │                  │  │
│  │              │  (Session, Auth)  │                  │  │
│  │              └─────────┬─────────┘                  │  │
│  └────────────────────────┼──────────────────────────┘  │
└─────────────────────────────┼──────────────────────────┘
                              │ HTTP/HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  .NET Aspire AppHost                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MyAccount.Api Service                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ Personal   │  │  TwoFactor │  │ Document   │    │  │
│  │  │  Details   │  │    Auth    │  │  Upload    │    │  │
│  │  │  Feature   │  │  Feature   │  │  Feature   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  │         │              │               │            │  │
│  │         └──────────────┴───────────────┘            │  │
│  │                        │                            │  │
│  │              ┌─────────▼─────────┐                  │  │
│  │              │  Mock POS API     │                  │  │
│  │              │  (In-Memory Data) │                  │  │
│  │              └───────────────────┘                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### Package Structure

```
mini-myaccount/
├── apps/
│   └── myaccount/
│       ├── src/
│       │   ├── app/
│       │   │   ├── app.component.ts
│       │   │   ├── app.config.ts
│       │   │   └── app.routes.ts
│       │   ├── main.ts
│       │   └── main.server.ts
│       └── project.json
├── libs/
│   ├── core/
│   │   ├── auth/
│   │   │   ├── login.service.ts
│   │   │   ├── login-response-handler.service.ts
│   │   │   └── login-store.service.ts
│   │   ├── session/
│   │   │   └── session-store.service.ts
│   │   ├── user/
│   │   │   └── user.service.ts
│   │   └── messaging/
│   │       └── message-queue.service.ts
│   ├── features/
│   │   ├── profile/
│   │   │   ├── profile.component.ts
│   │   │   ├── profile-edit.component.ts
│   │   │   └── profile.service.ts
│   │   ├── two-fa/
│   │   │   ├── two-fa-enable.component.ts
│   │   │   ├── two-fa-verify.component.ts
│   │   │   └── two-fa.service.ts
│   │   └── documents/
│   │       ├── document-upload.component.ts
│   │       ├── document-list.component.ts
│   │       └── documents.service.ts
│   └── shared/
│       ├── ui/
│       │   ├── notification/
│       │   └── loading-spinner/
│       └── utils/
│           └── validators.ts
```

---

### Core Services

#### SessionStoreService

**Purpose:** Wrapper around sessionStorage for type-safe session management

**Implementation:**
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



**Key Methods:**
- `set<T>(key, value)` - Store typed value
- `get<T>(key)` - Retrieve typed value
- `remove(key)` - Remove value
- `clear()` - Clear all session data

**Usage in 2FA Flow:**
```typescript
// Store workflow state
this.sessionService.set('two-fa-flowtype', { errorcode: 118 });

// Retrieve workflow state
const flowState = this.sessionService.get<{ errorcode: number }>('two-fa-flowtype');

// Clear on logout
this.sessionService.remove('two-fa-flowtype');
```

---

#### MessageQueueService

**Purpose:** Manage user notifications (success, error, info messages)

**Implementation:**
```typescript
export enum MessageType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
  Warning = 'warning'
}

export enum MessageLifetime {
  Single = 'single',      // Show once, then remove
  Persistent = 'persistent' // Show until manually cleared
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



---

#### LoginStoreService

**Purpose:** Store login-related state (PostLoginValues, last visitor)

**Implementation:**
```typescript
@Injectable({ providedIn: 'root' })
export class LoginStoreService {
  private postLoginValuesSignal = signal<any>(null);
  PostLoginValues = this.postLoginValuesSignal.asReadonly();

  private lastVisitorSignal = signal<string | null>(null);
  LastVisitor = this.lastVisitorSignal.asReadonly();

  setPostLoginValues(values: any): void {
    this.postLoginValuesSignal.set(values);
  }

  setLastVisitor(username: string): void {
    this.lastVisitorSignal.set(username);
  }

  clear(): void {
    this.postLoginValuesSignal.set(null);
    this.lastVisitorSignal.set(null);
  }
}
```

**PostLoginValues Structure:**
```typescript
interface PostLoginValues {
  errorcode: number;  // 118 = forced 2FA, 122 = optional 2FA
  suberror?: number;  // Additional error context
}
```

---

#### UserService

**Purpose:** Manage user state and authentication

**Implementation:**
```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private isAuthenticatedSignal = signal(false);
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  private workflowTypeSignal = signal(0);
  workflowType = this.workflowTypeSignal.asReadonly();

  private accountIdSignal = signal<string | null>(null);
  accountId = this.accountIdSignal.asReadonly();

  setAuthenticated(value: boolean): void {
    this.isAuthenticatedSignal.set(value);
  }

  setWorkflowType(type: number): void {
    this.workflowTypeSignal.set(type);
  }

  setAccountId(id: string): void {
    this.accountIdSignal.set(id);
  }

  clear(): void {
    this.isAuthenticatedSignal.set(false);
    this.workflowTypeSignal.set(0);
    this.accountIdSignal.set(null);
  }
}
```

---

### HTTP Interceptors

#### AuthInterceptor

**Purpose:** Add session token to all API requests

**Implementation:**
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionToken = sessionStorage.getItem('sessionToken');
  
  if (sessionToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${sessionToken}`
      }
    });
  }
  
  return next(req);
};
```



#### ErrorInterceptor

**Purpose:** Handle HTTP errors globally

**Implementation:**
```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageQueue = inject(MessageQueueService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      messageQueue.addError(errorMessage);
      return throwError(() => error);
    })
  );
};
```

---

### Route Guards

#### AuthGuard

**Purpose:** Protect routes that require authentication

**Implementation:**
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const router = inject(Router);
  
  if (userService.isAuthenticated()) {
    return true;
  }
  
  // Store intended URL for redirect after login
  sessionStorage.setItem('redirectUrl', state.url);
  return router.createUrlTree(['/login']);
};
```

---

## 3. Feature Implementation Details

### Profile Feature

#### ProfileComponent

**Purpose:** Display user profile information

**Template:**
```html
<div class="profile-container">
  @if (loading()) {
    <loading-spinner />
  } @else if (error()) {
    <div class="error">{{ error() }}</div>
  } @else if (profile()) {
    <div class="profile-card">
      <h2>Personal Details</h2>
      <div class="profile-field">
        <label>Name:</label>
        <span>{{ profile()!.firstName }} {{ profile()!.lastName }}</span>
      </div>
      <div class="profile-field">
        <label>Email:</label>
        <span>{{ profile()!.email }}</span>
      </div>
      <div class="profile-field">
        <label>Phone:</label>
        <span>{{ profile()!.phone }}</span>
      </div>
      <div class="profile-field">
        <label>2FA Status:</label>
        <span>{{ profile()!.twoFactorEnabled ? 'Enabled' : 'Disabled' }}</span>
      </div>
      <button (click)="editProfile()">Edit Profile</button>
    </div>
  }
</div>
```

**Component:**
```typescript
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingSpinnerComponent]
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private router = inject(Router);
  
  profile = signal<UserProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
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
  
  editProfile(): void {
    this.router.navigate(['/myaccount/profile/edit']);
  }
}
```



---

#### ProfileEditComponent

**Purpose:** Edit user profile with reactive forms

**Component:**
```typescript
@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule]
})
export class ProfileEditComponent implements OnInit {
  private profileService = inject(ProfileService);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  
  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, this.phoneValidator()]]
  });
  
  formValid = toSignal(this.form.statusChanges.pipe(
    map(() => this.form.valid)
  ));
  
  formDirty = toSignal(this.form.statusChanges.pipe(
    map(() => this.form.dirty)
  ));
  
  canSave = computed(() => this.formValid() && this.formDirty());
  saving = signal(false);
  
  ngOnInit(): void {
    this.loadProfile();
  }
  
  private loadProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.form.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone
        });
      }
    });
  }
  
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
  
  cancel(): void {
    this.router.navigate(['/myaccount/profile']);
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
<div class="profile-edit-container">
  <h2>Edit Profile</h2>
  <form [formGroup]="form" (ngSubmit)="save()">
    <div class="form-field">
      <label for="firstName">First Name</label>
      <input id="firstName" formControlName="firstName" />
      @if (form.controls.firstName.invalid && form.controls.firstName.touched) {
        <span class="error">First name is required (min 2 characters)</span>
      }
    </div>
    
    <div class="form-field">
      <label for="lastName">Last Name</label>
      <input id="lastName" formControlName="lastName" />
      @if (form.controls.lastName.invalid && form.controls.lastName.touched) {
        <span class="error">Last name is required (min 2 characters)</span>
      }
    </div>
    
    <div class="form-field">
      <label for="email">Email</label>
      <input id="email" type="email" formControlName="email" />
      @if (form.controls.email.invalid && form.controls.email.touched) {
        <span class="error">Valid email is required</span>
      }
    </div>
    
    <div class="form-field">
      <label for="phone">Phone</label>
      <input id="phone" formControlName="phone" />
      @if (form.controls.phone.invalid && form.controls.phone.touched) {
        <span class="error">Valid phone number is required</span>
      }
    </div>
    
    <div class="form-actions">
      <button type="submit" [disabled]="!canSave() || saving()">
        {{ saving() ? 'Saving...' : 'Save' }}
      </button>
      <button type="button" (click)="cancel()">Cancel</button>
    </div>
  </form>
</div>
```



---

### Two-Factor Authentication Feature

#### TwoFaEnableComponent

**Purpose:** Enable 2FA by sending and verifying OTP

**Component:**
```typescript
@Component({
  selector: 'app-two-fa-enable',
  templateUrl: './two-fa-enable.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoFaEnableComponent {
  private twoFaService = inject(TwoFaService);
  private messageQueue = inject(MessageQueueService);
  
  step = signal<'initial' | 'verify'>('initial');
  otpCode = signal('');
  sending = signal(false);
  verifying = signal(false);
  
  enableTwoFa(): void {
    this.sending.set(true);
    this.twoFaService.enable2FA('email').subscribe({
      next: (response) => {
        this.messageQueue.add(
          response.message,
          MessageType.Success,
          MessageLifetime.Single
        );
        this.step.set('verify');
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
      }
    });
  }
  
  verifyOtp(): void {
    if (this.otpCode().length !== 6) return;
    
    this.verifying.set(true);
    this.twoFaService.verify2FA(this.otpCode()).subscribe({
      next: (response) => {
        this.messageQueue.add(
          response.message,
          MessageType.Success,
          MessageLifetime.Single
        );
        // Reload profile to update 2FA status
        window.location.reload();
      },
      error: () => {
        this.verifying.set(false);
      }
    });
  }
  
  resendOtp(): void {
    this.otpCode.set('');
    this.enableTwoFa();
  }
}
```

**Template:**
```html
<div class="two-fa-enable-container">
  @if (step() === 'initial') {
    <div class="initial-step">
      <h2>Enable Two-Factor Authentication</h2>
      <p>Add an extra layer of security to your account.</p>
      <button (click)="enableTwoFa()" [disabled]="sending()">
        {{ sending() ? 'Sending...' : 'Enable 2FA' }}
      </button>
    </div>
  } @else {
    <div class="verify-step">
      <h2>Verify Your Code</h2>
      <p>Enter the 6-digit code sent to your email.</p>
      <input 
        type="text" 
        maxlength="6" 
        [value]="otpCode()"
        (input)="otpCode.set($any($event.target).value)"
        placeholder="______"
      />
      <div class="actions">
        <button (click)="verifyOtp()" [disabled]="otpCode().length !== 6 || verifying()">
          {{ verifying() ? 'Verifying...' : 'Verify' }}
        </button>
        <button (click)="resendOtp()" [disabled]="sending()">
          Resend Code
        </button>
      </div>
    </div>
  }
</div>
```



---

#### TwoFaVerifyComponent (Interceptor)

**Purpose:** Verify 2FA code during login flow (post-login interceptor)

**Component:**
```typescript
@Component({
  selector: 'app-two-fa-verify',
  templateUrl: './two-fa-verify.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoFaVerifyComponent implements OnInit {
  private twoFaService = inject(TwoFaService);
  private loginStore = inject(LoginStoreService);
  private sessionService = inject(SessionStoreService);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);
  
  otpCode = signal('');
  verifying = signal(false);
  flowType = signal<'forced' | 'optional' | null>(null);
  
  ngOnInit(): void {
    this.determineFlowType();
  }
  
  private determineFlowType(): void {
    // Check session storage first
    const sessionFlow = this.sessionService.get<{ errorcode: number }>('two-fa-flowtype');
    
    if (sessionFlow) {
      this.setFlowType(sessionFlow.errorcode);
      return;
    }
    
    // Check PostLoginValues from login response
    const postLoginValues = this.loginStore.PostLoginValues();
    
    if (!postLoginValues) {
      this.messageQueue.addError('Unable to complete authentication. Please contact support.');
      return;
    }
    
    // Store in session for page refresh
    this.sessionService.set('two-fa-flowtype', { errorcode: postLoginValues.errorcode });
    this.setFlowType(postLoginValues.errorcode);
  }
  
  private setFlowType(errorcode: number): void {
    if (errorcode === 118) {
      this.flowType.set('forced');
    } else if (errorcode === 122) {
      this.flowType.set('optional');
    }
  }
  
  verifyOtp(): void {
    if (this.otpCode().length !== 6) return;
    
    this.verifying.set(true);
    this.twoFaService.verify2FA(this.otpCode()).subscribe({
      next: () => {
        // Clear session state
        this.sessionService.remove('two-fa-flowtype');
        
        // Complete login - redirect to profile
        this.router.navigate(['/myaccount/profile']);
      },
      error: () => {
        this.verifying.set(false);
      }
    });
  }
  
  resendOtp(): void {
    this.otpCode.set('');
    this.twoFaService.enable2FA('email').subscribe({
      next: (response) => {
        this.messageQueue.add(response.message, MessageType.Success, MessageLifetime.Single);
      }
    });
  }
}
```

**Template:**
```html
<div class="two-fa-verify-container">
  <h2>Two-Factor Authentication</h2>
  
  @if (flowType() === 'forced') {
    <p class="warning">Your account requires two-factor authentication.</p>
  } @else {
    <p>Enter the verification code sent to your email.</p>
  }
  
  <input 
    type="text" 
    maxlength="6" 
    [value]="otpCode()"
    (input)="otpCode.set($any($event.target).value)"
    placeholder="______"
  />
  
  <div class="actions">
    <button (click)="verifyOtp()" [disabled]="otpCode().length !== 6 || verifying()">
      {{ verifying() ? 'Verifying...' : 'Verify' }}
    </button>
    <button (click)="resendOtp()">Resend Code</button>
  </div>
</div>
```



---

#### LoginResponseHandlerService

**Purpose:** Handle login response and redirect to interceptor if needed

**Implementation:**
```typescript
@Injectable({ providedIn: 'root' })
export class LoginResponseHandlerService {
  private loginStore = inject(LoginStoreService);
  private userService = inject(UserService);
  private router = inject(Router);
  
  async handle(response: LoginResponse): Promise<void> {
    // Store PostLoginValues for interceptor
    this.loginStore.setPostLoginValues(response.postLoginValues);
    
    // Update user state
    if (response.claims) {
      this.userService.setAccountId(response.claims.accountId);
      this.userService.setAuthenticated(response.user?.isAuthenticated ?? false);
    }
    
    // Store session token
    if (response.claims?.sessionToken) {
      sessionStorage.setItem('sessionToken', response.claims.sessionToken);
    }
    
    // Check if login is completed
    if (!response.isCompleted) {
      // Redirect to interceptor (2FA verify)
      if (response.redirectUrl) {
        await this.router.navigateByUrl(response.redirectUrl);
      }
      return;
    }
    
    // Login completed - redirect to profile
    await this.router.navigate(['/myaccount/profile']);
  }
}
```

**LoginResponse Interface:**
```typescript
interface LoginResponse {
  isCompleted: boolean;
  redirectUrl?: string;
  action?: string;
  claims?: {
    username: string;
    accountId: string;
    sessionToken: string;
  };
  postLoginValues?: {
    errorcode: number;
    suberror?: number;
  };
  user?: {
    isAuthenticated: boolean;
  };
}
```

---

### Document Upload Feature

#### DocumentUploadComponent

**Purpose:** Upload documents with preview and validation

**Component:**
```typescript
@Component({
  selector: 'app-document-upload',
  templateUrl: './document-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentUploadComponent {
  private documentsService = inject(DocumentsService);
  private messageQueue = inject(MessageQueueService);
  
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  uploading = signal(false);
  uploadProgress = signal(0);
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      this.messageQueue.addError('File size must be less than 5MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      this.messageQueue.addError('Only PDF, JPG, and PNG files are allowed');
      return;
    }
    
    this.selectedFile.set(file);
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }
  
  upload(): void {
    const file = this.selectedFile();
    if (!file) return;
    
    this.uploading.set(true);
    this.documentsService.uploadDocument(file, 'id').subscribe({
      next: (response) => {
        this.messageQueue.add(
          'Document uploaded successfully',
          MessageType.Success,
          MessageLifetime.Single
        );
        this.reset();
      },
      error: () => {
        this.uploading.set(false);
      }
    });
  }
  
  reset(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.uploading.set(false);
    this.uploadProgress.set(0);
  }
}
```



**Template:**
```html
<div class="document-upload-container">
  <h2>Upload Document</h2>
  
  <div class="file-input">
    <input 
      type="file" 
      accept=".pdf,.jpg,.jpeg,.png"
      (change)="onFileSelected($event)"
      [disabled]="uploading()"
    />
  </div>
  
  @if (selectedFile()) {
    <div class="preview-section">
      <h3>Selected File</h3>
      <p>{{ selectedFile()!.name }} ({{ (selectedFile()!.size / 1024 / 1024).toFixed(2) }} MB)</p>
      
      @if (previewUrl()) {
        <img [src]="previewUrl()!" alt="Preview" class="preview-image" />
      }
      
      <div class="actions">
        <button (click)="upload()" [disabled]="uploading()">
          {{ uploading() ? 'Uploading...' : 'Upload' }}
        </button>
        <button (click)="reset()" [disabled]="uploading()">Cancel</button>
      </div>
      
      @if (uploading() && uploadProgress() > 0) {
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="uploadProgress()"></div>
        </div>
      }
    </div>
  }
</div>
```

---

#### DocumentListComponent

**Purpose:** Display list of uploaded documents

**Component:**
```typescript
@Component({
  selector: 'app-document-list',
  templateUrl: './document-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentListComponent implements OnInit {
  private documentsService = inject(DocumentsService);
  private messageQueue = inject(MessageQueueService);
  
  documents = signal<Document[]>([]);
  loading = signal(true);
  
  ngOnInit(): void {
    this.loadDocuments();
  }
  
  private loadDocuments(): void {
    this.documentsService.getDocuments().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
  
  deleteDocument(id: string): void {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    this.documentsService.deleteDocument(id).subscribe({
      next: () => {
        this.messageQueue.add(
          'Document deleted successfully',
          MessageType.Success,
          MessageLifetime.Single
        );
        this.loadDocuments();
      }
    });
  }
  
  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
}
```

**Template:**
```html
<div class="document-list-container">
  <h2>My Documents</h2>
  
  @if (loading()) {
    <loading-spinner />
  } @else if (documents().length === 0) {
    <div class="empty-state">
      <p>No documents uploaded yet.</p>
      <a routerLink="/myaccount/documents/upload">Upload Document</a>
    </div>
  } @else {
    <table class="documents-table">
      <thead>
        <tr>
          <th>Filename</th>
          <th>Type</th>
          <th>Upload Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (doc of documents(); track doc.documentId) {
          <tr>
            <td>{{ doc.filename }}</td>
            <td>{{ doc.documentType }}</td>
            <td>{{ doc.uploadDate | date:'short' }}</td>
            <td>
              <span [class]="getStatusClass(doc.status)">
                {{ doc.status }}
              </span>
            </td>
            <td>
              @if (doc.status === 'pending') {
                <button (click)="deleteDocument(doc.documentId)">Delete</button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  }
</div>
```

---

## 4. Backend Architecture

### .NET Aspire AppHost

**Purpose:** Orchestrate all backend services with health checks and monitoring

**Program.cs:**
```csharp
var builder = DistributedApplication.CreateBuilder(args);

var myAccountApi = builder.AddProject<Projects.MyAccount_Api>("myaccount-api")
    .WithHttpHealthCheck("/health");

builder.Build().Run();
```

**appsettings.json:**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Aspire.Hosting.Dcp": "Warning"
    }
  },
  "Hostname": "localhost"
}
```

---

### MyAccount.Api Structure

**Program.cs:**
```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

// Add feature services
builder.Services.AddScoped<IUserRepository, InMemoryUserRepository>();
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>();
builder.Services.AddScoped<IDocumentRepository, InMemoryDocumentRepository>();

// Add health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();

// Map endpoints
app.MapPersonalDetailsEndpoints();
app.MapTwoFactorAuthEndpoints();
app.MapDocumentUploadEndpoints();
app.MapAuthenticationEndpoints();

app.MapHealthChecks("/health");

app.Run();
```

---

### Feature: PersonalDetails

**Endpoints:**
```csharp
public static class PersonalDetailsEndpoints
{
    public static void MapPersonalDetailsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/user");
        
        group.MapGet("/profile", GetProfile);
        group.MapPut("/profile", UpdateProfile);
    }
    
    private static async Task<IResult> GetProfile(
        IUserRepository userRepository,
        HttpContext context)
    {
        var userId = context.Request.Headers["Authorization"]
            .ToString().Replace("Bearer ", "");
        
        var user = await userRepository.GetUserAsync(userId);
        
        if (user == null)
            return Results.NotFound();
        
        return Results.Ok(user);
    }
    
    private static async Task<IResult> UpdateProfile(
        UpdateProfileRequest request,
        IUserRepository userRepository,
        HttpContext context)
    {
        var userId = context.Request.Headers["Authorization"]
            .ToString().Replace("Bearer ", "");
        
        var user = await userRepository.UpdateUserAsync(userId, request);
        
        return Results.Ok(user);
    }
}
```

**Models:**
```csharp
public record UserProfile(
    string UserId,
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    DateTime DateOfBirth,
    Address Address,
    bool TwoFactorEnabled
);

public record Address(
    string Street,
    string City,
    string State,
    string ZipCode,
    string Country
);

public record UpdateProfileRequest(
    string FirstName,
    string LastName,
    string Email,
    string Phone
);
```

**Repository:**
```csharp
public interface IUserRepository
{
    Task<UserProfile?> GetUserAsync(string userId);
    Task<UserProfile> UpdateUserAsync(string userId, UpdateProfileRequest request);
}

public class InMemoryUserRepository : IUserRepository
{
    private readonly Dictionary<string, UserProfile> _users = new()
    {
        ["user123"] = new UserProfile(
            "user123",
            "John",
            "Doe",
            "john.doe@example.com",
            "+1234567890",
            new DateTime(1990, 1, 1),
            new Address("123 Main St", "New York", "NY", "10001", "USA"),
            false
        )
    };
    
    public Task<UserProfile?> GetUserAsync(string userId)
    {
        _users.TryGetValue(userId, out var user);
        return Task.FromResult(user);
    }
    
    public Task<UserProfile> UpdateUserAsync(string userId, UpdateProfileRequest request)
    {
        if (!_users.TryGetValue(userId, out var user))
            throw new KeyNotFoundException("User not found");
        
        var updated = user with
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone
        };
        
        _users[userId] = updated;
        return Task.FromResult(updated);
    }
}
```

---

### Feature: TwoFactorAuth

**Endpoints:**
```csharp
public static class TwoFactorAuthEndpoints
{
    public static void MapTwoFactorAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/2fa");
        
        group.MapPost("/enable", Enable2FA);
        group.MapPost("/verify", Verify2FA);
        group.MapPost("/disable", Disable2FA);
    }
    
    private static async Task<IResult> Enable2FA(
        Enable2FARequest request,
        ITwoFactorService twoFactorService,
        HttpContext context)
    {
        var userId = GetUserIdFromToken(context);
        var otp = twoFactorService.GenerateOTP();
        
        // Store OTP with expiry (5 minutes)
        twoFactorService.StoreOTP(userId, otp, TimeSpan.FromMinutes(5));
        
        // Mock: Log OTP to console (in real app, send via email/SMS)
        Console.WriteLine($"OTP for user {userId}: {otp}");
        
        return Results.Ok(new
        {
            Success = true,
            Message = "OTP sent to your email",
            ExpiresIn = 300
        });
    }
    
    private static async Task<IResult> Verify2FA(
        Verify2FARequest request,
        ITwoFactorService twoFactorService,
        IUserRepository userRepository,
        HttpContext context)
    {
        var userId = GetUserIdFromToken(context);
        
        if (!twoFactorService.ValidateOTP(userId, request.Code))
        {
            return Results.BadRequest(new { Message = "Invalid or expired OTP" });
        }
        
        // Enable 2FA for user
        await twoFactorService.Enable2FAForUserAsync(userId);
        
        return Results.Ok(new
        {
            Success = true,
            Message = "2FA enabled successfully"
        });
    }
    
    private static string GetUserIdFromToken(HttpContext context)
    {
        return context.Request.Headers["Authorization"]
            .ToString().Replace("Bearer ", "");
    }
}
```

**Service:**
```csharp
public interface ITwoFactorService
{
    string GenerateOTP();
    void StoreOTP(string userId, string otp, TimeSpan expiry);
    bool ValidateOTP(string userId, string otp);
    Task Enable2FAForUserAsync(string userId);
}

public class TwoFactorService : ITwoFactorService
{
    private readonly Dictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();
    
    public string GenerateOTP()
    {
        return Random.Shared.Next(100000, 999999).ToString();
    }
    
    public void StoreOTP(string userId, string otp, TimeSpan expiry)
    {
        _otpStore[userId] = (otp, DateTime.UtcNow.Add(expiry));
    }
    
    public bool ValidateOTP(string userId, string otp)
    {
        if (!_otpStore.TryGetValue(userId, out var stored))
            return false;
        
        if (DateTime.UtcNow > stored.Expiry)
        {
            _otpStore.Remove(userId);
            return false;
        }
        
        if (stored.Otp != otp)
            return false;
        
        _otpStore.Remove(userId);
        return true;
    }
    
    public Task Enable2FAForUserAsync(string userId)
    {
        // Update user's 2FA status in repository
        return Task.CompletedTask;
    }
}
```

---

## 5. Routing Configuration

**App Routes:**
```typescript
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/en/myaccount',
    pathMatch: 'full'
  },
  {
    path: ':culture/myaccount',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component')
          .then(m => m.ProfileComponent)
      },
      {
        path: 'profile/edit',
        loadComponent: () => import('./features/profile/profile-edit.component')
          .then(m => m.ProfileEditComponent)
      },
      {
        path: '2fa-enable',
        loadComponent: () => import('./features/two-fa/two-fa-enable.component')
          .then(m => m.TwoFaEnableComponent)
      },
      {
        path: '2fa-verify',
        loadComponent: () => import('./features/two-fa/two-fa-verify.component')
          .then(m => m.TwoFaVerifyComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./features/documents/document-list.component')
          .then(m => m.DocumentListComponent)
      },
      {
        path: 'documents/upload',
        loadComponent: () => import('./features/documents/document-upload.component')
          .then(m => m.DocumentUploadComponent)
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component')
      .then(m => m.LoginComponent)
  }
];
```

---

## 6. Key Learning Outcomes

After implementing this design, you will understand:

1. **Interceptor Pattern** - How post-login workflows redirect to verification pages
2. **Session Management** - How to persist workflow state across page refreshes
3. **Signals + OnPush** - Modern Angular reactive patterns
4. **SSR-Safe Development** - Building components that work on server and client
5. **Reactive Forms** - Complex form validation with signals
6. **.NET Aspire** - Service orchestration and health monitoring
7. **Feature-Based Architecture** - Organizing code by business domain
8. **Message Queue Pattern** - User notification management
9. **HTTP Interceptors** - Global request/response handling
10. **Route Guards** - Authentication and authorization

---

## 7. Testing Strategy

### Unit Tests

**Profile Service Test:**
```typescript
describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch user profile', () => {
    const mockProfile = {
      userId: '123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };
    
    service.getProfile().subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });
    
    const req = httpMock.expectOne('/api/user/profile');
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });
});
```

### Integration Tests

Test the full 2FA flow:
1. Login with valid credentials
2. Receive redirect to 2FA verify
3. Enter OTP code
4. Complete login and redirect to profile

---

## 8. Deployment Considerations

### Frontend (Angular SSR)
- Build: `nx build myaccount --configuration=production`
- Serve: `node dist/myaccount/server/server.mjs`
- Environment variables for API URL

### Backend (.NET Aspire)
- Run: `dotnet run --project AppHost`
- Aspire dashboard: `http://localhost:15888`
- Health checks: `/health`

---

## 9. Next Steps

1. Review this design document
2. Set up project structure
3. Implement backend features first (easier to test)
4. Implement frontend features with backend running
5. Test each feature as you build
6. Document patterns learned

This design provides all the implementation details you need for your binge session. Ready to create the task list!
