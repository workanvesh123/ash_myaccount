# Mini MyAccount Learning Platform - Requirements

## 1. Overview

### Purpose
Build a simplified user account management system to gain hands-on experience with:
- Angular 20 + Nx monorepo architecture
- .NET Aspire orchestration + .NET 8 APIs
- MyAccount patterns (interceptors, session management, reactive forms)
- SSR-safe component development
- Signals + OnPush change detection

### Timeline
3-4 days (binge-friendly, can be done in one focused session)

### Scope
Focus on 4 core MyAccount features that demonstrate the full stack:
1. User Profile Management (personal details)
2. Two-Factor Authentication (2FA enable/verify flow)
3. Document Upload (KYC simulation)
4. Session & State Management

---

## 2. User Stories

### Epic 1: User Profile Management

**US-1.1: View Personal Details**
As a logged-in user
I want to view my personal details
So that I can verify my account information

**Acceptance Criteria:**
- Display user's first name, last name, email, phone number
- Display date of birth and address
- Data fetched from backend API
- Loading state shown while fetching
- Error message if fetch fails

**US-1.2: Edit Personal Details**
As a logged-in user
I want to edit my personal details
So that I can keep my information up to date

**Acceptance Criteria:**
- Form with editable fields (first name, last name, email, phone)
- Client-side validation (required fields, email format, phone format)
- Save button disabled until form is valid and dirty
- Success message on successful save
- Error message if save fails
- Form resets to saved values on cancel

---

### Epic 2: Two-Factor Authentication

**US-2.1: Enable 2FA**
As a logged-in user
I want to enable two-factor authentication
So that my account is more secure

**Acceptance Criteria:**
- Button to enable 2FA in settings
- Backend sends OTP code to user's email/phone (mocked)
- User enters 6-digit OTP code
- Success message when 2FA is enabled
- Error message if OTP is invalid or expired
- User can request new OTP code

**US-2.2: 2FA Login Interceptor**
As a user with 2FA enabled
I want to be prompted for my 2FA code after login
So that my account remains secure

**Acceptance Criteria:**
- After successful login, if 2FA is enabled, redirect to 2FA verification page
- User enters 6-digit OTP code
- Login completes only after successful OTP verification
- Error message if OTP is invalid
- User can request new OTP code
- Session state persists during 2FA flow

**US-2.3: Disable 2FA**
As a logged-in user with 2FA enabled
I want to disable two-factor authentication
So that I can simplify my login process

**Acceptance Criteria:**
- Button to disable 2FA in settings
- Confirmation dialog before disabling
- Success message when 2FA is disabled
- Error message if disable fails

---

### Epic 3: Document Upload (KYC Simulation)

**US-3.1: Upload Document**
As a logged-in user
I want to upload identity documents
So that I can verify my account

**Acceptance Criteria:**
- File picker for document upload (PDF, JPG, PNG)
- File size limit: 5MB
- Preview uploaded file before submission
- Upload progress indicator
- Success message on successful upload
- Error message if upload fails or file is invalid

**US-3.2: View Uploaded Documents**
As a logged-in user
I want to view my uploaded documents
So that I can track my verification status

**Acceptance Criteria:**
- List of uploaded documents with filename, upload date, status
- Status: Pending, Approved, Rejected
- Download button for each document
- Delete button for pending documents
- Empty state if no documents uploaded

---

### Epic 4: Session & State Management

**US-4.1: Login Flow**
As a user
I want to log in to my account
So that I can access my personal information

**Acceptance Criteria:**
- Login form with username and password
- Client-side validation (required fields)
- Success: redirect to profile page
- Error: display error message
- Session token stored in cookie
- User state persisted in SessionStoreService

**US-4.2: Logout Flow**
As a logged-in user
I want to log out of my account
So that my session is terminated

**Acceptance Criteria:**
- Logout button in header
- Session token cleared from cookie
- User state cleared from SessionStoreService
- Redirect to login page
- Success message displayed

**US-4.3: Session Persistence**
As a logged-in user
I want my session to persist across page refreshes
So that I don't have to log in repeatedly

**Acceptance Criteria:**
- Session token persists in cookie
- User state restored from session on page load
- Session expires after 30 minutes of inactivity
- User redirected to login on session expiry

---

## 3. Technical Requirements

### Frontend Architecture

**Framework:**
- Angular 20 with standalone components
- Nx monorepo structure
- SSR enabled

**State Management:**
- Signals for component state
- OnPush change detection for all components
- RxJS for HTTP calls and async operations

**Routing:**
- Lazy-loaded feature modules
- Route guards for authentication
- Culture-based URLs: `/{culture}/myaccount/{feature}`

**Forms:**
- Reactive forms with validation
- Custom validators for email, phone
- Form state management with signals

**Package Structure:**
```
mini-myaccount/
├── apps/
│   └── myaccount/                    # Main app shell
├── libs/
│   ├── core/                         # Core services
│   │   ├── auth/                     # Authentication
│   │   ├── session/                  # Session management
│   │   ├── http/                     # HTTP interceptors
│   │   └── config/                   # Configuration
│   ├── features/
│   │   ├── profile/                  # Profile management
│   │   ├── two-fa/                   # 2FA flows
│   │   └── documents/                # Document upload
│   ├── shared/
│   │   ├── ui/                       # Shared components
│   │   └── utils/                    # Utilities
│   └── interceptors/                 # Workflow interceptors
```

---

### Backend Architecture

**.NET Stack:**
- .NET 8 with minimal APIs
- .NET Aspire for orchestration
- AutoMapper for DTO mapping

**API Structure:**
```
backend/
├── AppHost/                          # Aspire orchestrator
├── MyAccount.Api/
│   ├── Features/
│   │   ├── PersonalDetails/         # Profile endpoints
│   │   ├── TwoFactorAuth/           # 2FA endpoints
│   │   ├── DocumentUpload/          # Upload endpoints
│   │   └── UserDetails/             # User info endpoints
│   ├── Models/                       # DTOs
│   ├── ServiceClients/               # Mock POS API
│   └── Program.cs
└── Shared/
    └── Contracts/                    # Shared DTOs
```

**Endpoints:**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/2fa/enable` - Enable 2FA (sends OTP)
- `POST /api/2fa/verify` - Verify OTP code
- `POST /api/2fa/disable` - Disable 2FA
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

---

## 4. API Contracts

### User Profile

**GET /api/user/profile**
Response:
```json
{
  "userId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "2000-01-01",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "twoFactorEnabled": false
}
```

**PUT /api/user/profile**
Request:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string"
}
```
Response: Same as GET

---

### Two-Factor Authentication

**POST /api/2fa/enable**
Request:
```json
{
  "method": "email" | "sms"
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
  "documentId": "string",
  "filename": "string",
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
      "documentId": "string",
      "filename": "string",
      "uploadDate": "2024-01-01T00:00:00Z",
      "status": "pending" | "approved" | "rejected",
      "documentType": "id" | "proof_of_address"
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

### Authentication

**POST /api/auth/login**
Request:
```json
{
  "username": "string",
  "password": "string"
}
```
Response:
```json
{
  "isCompleted": false,
  "redirectUrl": "/en/myaccount/2fa-verify",
  "action": "twoFactorAuth",
  "claims": {
    "username": "string",
    "accountId": "string",
    "sessionToken": "string"
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

**POST /api/auth/logout**
Response:
```json
{
  "success": true
}
```

---

## 5. Key Patterns to Implement

### Pattern 1: Interceptor-Based Workflow (2FA)

**Concept:** After login, if user has 2FA enabled, redirect to 2FA verification page before completing login.

**Implementation:**
1. Login API returns `isCompleted: false` with `redirectUrl` and `action`
2. `LoginResponseHandlerService` checks `isCompleted`
3. If false, redirect to interceptor page (2FA verify)
4. After successful verification, complete login flow

**Files to study:**
- `packages/vanilla/lib/core/src/login/login-response-handler/login-response-handler.service.ts`
- `packages/myaccount/core-lib/src/lib/interceptors/two-fa/two-fa.component.ts`

---

### Pattern 2: Session Management

**Concept:** Store workflow state in session to persist across page refreshes.

**Implementation:**
1. `SessionStoreService` wraps `sessionStorage`
2. Store 2FA flow state: `{ errorcode: 118 }`
3. On page load, check session for workflow state
4. Resume workflow if state exists

**Services to implement:**
- `SessionStoreService` - session storage wrapper
- `LoginStoreService` - login state management

---

### Pattern 3: Message Queue

**Concept:** Display user notifications (success, error, info) in a queue.

**Implementation:**
1. `MessageQueueService` manages notification queue
2. Components call `messageQueue.add()` or `messageQueue.addError()`
3. Global notification component displays messages
4. Messages auto-dismiss after timeout

**Service to implement:**
- `MessageQueueService` - notification queue

---

### Pattern 4: Reactive Forms with Signals

**Concept:** Use reactive forms with signal-based state management.

**Implementation:**
1. Create `FormGroup` with validators
2. Convert form state to signals: `formValid = toSignal(form.statusChanges)`
3. Use `computed()` for derived state: `canSave = computed(() => formValid() && formDirty())`
4. Disable save button based on computed signal

---

### Pattern 5: SSR-Safe Components

**Concept:** All components must work in SSR mode.

**Implementation:**
1. Never access `window` or `document` directly
2. Use `inject(WINDOW)` and `inject(DOCUMENT)` tokens
3. Use `afterNextRender()` for browser-only code
4. Use `PLATFORM.runOnBrowser()` for conditional execution

---

## 6. Implementation Checklist

### Phase 1: Backend Setup (4-6 hours)

- [ ] Create .NET 8 solution
- [ ] Set up .NET Aspire AppHost
- [ ] Create MyAccount.Api project
- [ ] Implement PersonalDetails feature
  - [ ] GET /api/user/profile endpoint
  - [ ] PUT /api/user/profile endpoint
  - [ ] Mock user data in memory
- [ ] Implement TwoFactorAuth feature
  - [ ] POST /api/2fa/enable endpoint (mock OTP send)
  - [ ] POST /api/2fa/verify endpoint (validate OTP)
  - [ ] POST /api/2fa/disable endpoint
  - [ ] In-memory OTP storage with expiry
- [ ] Implement DocumentUpload feature
  - [ ] POST /api/documents/upload endpoint
  - [ ] GET /api/documents endpoint
  - [ ] DELETE /api/documents/{id} endpoint
  - [ ] In-memory document storage
- [ ] Implement Authentication feature
  - [ ] POST /api/auth/login endpoint
  - [ ] POST /api/auth/logout endpoint
  - [ ] Mock user credentials
- [ ] Add AutoMapper configuration
- [ ] Add health checks
- [ ] Test all endpoints with Swagger

---

### Phase 2: Frontend Setup (2-3 hours)

- [ ] Create Nx workspace
- [ ] Create Angular app with SSR
- [ ] Configure routing with culture support
- [ ] Create core services
  - [ ] UserService
  - [ ] SessionStoreService
  - [ ] MessageQueueService
  - [ ] LoginStoreService
- [ ] Create HTTP interceptors
  - [ ] Auth interceptor (add session token)
  - [ ] Error interceptor (handle errors)
- [ ] Create route guards
  - [ ] AuthGuard (require login)
- [ ] Create app shell with header/footer
- [ ] Test SSR rendering

---

### Phase 3: Profile Feature (3-4 hours)

- [ ] Create profile feature library
- [ ] Create profile component
  - [ ] Fetch user profile on init
  - [ ] Display profile data
  - [ ] Loading state
  - [ ] Error state
- [ ] Create profile edit component
  - [ ] Reactive form with validation
  - [ ] Email validator
  - [ ] Phone validator
  - [ ] Save button (disabled until valid)
  - [ ] Cancel button
  - [ ] Success/error messages
- [ ] Create profile service
  - [ ] getProfile() method
  - [ ] updateProfile() method
- [ ] Add routing
- [ ] Test SSR compatibility
- [ ] Add unit tests

---

### Phase 4: Two-Factor Auth Feature (4-5 hours)

- [ ] Create two-fa feature library
- [ ] Create 2FA enable component
  - [ ] Enable button
  - [ ] OTP input (6 digits)
  - [ ] Verify button
  - [ ] Resend OTP button
  - [ ] Success/error messages
- [ ] Create 2FA verify component (interceptor)
  - [ ] OTP input (6 digits)
  - [ ] Verify button
  - [ ] Resend OTP button
  - [ ] Session state management
  - [ ] Success: complete login
  - [ ] Error: show message
- [ ] Create 2FA service
  - [ ] enable2FA() method
  - [ ] verify2FA() method
  - [ ] disable2FA() method
- [ ] Implement LoginResponseHandlerService
  - [ ] Check isCompleted flag
  - [ ] Redirect to 2FA verify if needed
  - [ ] Store postLoginValues in session
- [ ] Add routing
- [ ] Test interceptor flow
- [ ] Test SSR compatibility
- [ ] Add unit tests

---

### Phase 5: Document Upload Feature (3-4 hours)

- [ ] Create documents feature library
- [ ] Create document upload component
  - [ ] File picker
  - [ ] File validation (size, type)
  - [ ] Preview
  - [ ] Upload button
  - [ ] Progress indicator
  - [ ] Success/error messages
- [ ] Create document list component
  - [ ] Fetch documents on init
  - [ ] Display document list
  - [ ] Download button
  - [ ] Delete button
  - [ ] Empty state
- [ ] Create documents service
  - [ ] uploadDocument() method
  - [ ] getDocuments() method
  - [ ] deleteDocument() method
- [ ] Add routing
- [ ] Test SSR compatibility
- [ ] Add unit tests

---

### Phase 6: Login/Logout (2-3 hours)

- [ ] Create login component
  - [ ] Reactive form (username, password)
  - [ ] Validation
  - [ ] Login button
  - [ ] Error messages
- [ ] Create login service
  - [ ] login() method
  - [ ] logout() method
- [ ] Implement logout button in header
- [ ] Test login flow
- [ ] Test 2FA interceptor flow
- [ ] Test session persistence
- [ ] Add unit tests

---

### Phase 7: Polish & Testing (2-3 hours)

- [ ] Add loading spinners
- [ ] Add error handling
- [ ] Add success messages
- [ ] Test all flows end-to-end
- [ ] Test SSR rendering
- [ ] Add dark mode support (optional)
- [ ] Add tracking service (optional)
- [ ] Document patterns learned
- [ ] Create README with setup instructions

---

## 7. Success Criteria

After completing this project, you should be able to:

✅ **Backend:**
- Set up .NET Aspire orchestration
- Create feature-based API structure
- Implement minimal APIs with AutoMapper
- Mock external dependencies (POS API)
- Add health checks and monitoring

✅ **Frontend:**
- Create Nx monorepo with feature libraries
- Implement SSR-safe components
- Use signals + OnPush change detection
- Create reactive forms with validation
- Implement interceptor-based workflows
- Manage session state
- Handle HTTP errors gracefully

✅ **Patterns:**
- Understand MyAccount architecture
- Implement 2FA interceptor pattern
- Use SessionStoreService for state
- Use MessageQueueService for notifications
- Follow LoginResponseHandler pattern
- Create SSR-compatible components

---

## 8. Resources & References

### Existing Code to Study
- `packages/myaccount/core-lib/src/lib/interceptors/two-fa/two-fa.component.ts`
- `packages/vanilla/lib/core/src/login/login-response-handler/login-response-handler.service.ts`
- `backend/myaccount/Frontend.MyAccount.Api/Features/PersonalDetails/`
- `backend/myaccount/Frontend.MyAccount.Host/Properties/launchSettings.json`

### Documentation
- `.kiro/steering/01-project-context.md`
- `.kiro/steering/02-coding-standards.md`
- `.kiro/steering/04-monorepo-and-packages.md`
- `.kiro/steering/packages/vanilla/vanilla-context.md`

### External Resources
- Angular SSR: https://angular.dev/guide/ssr
- .NET Aspire: https://learn.microsoft.com/en-us/dotnet/aspire/
- Nx: https://nx.dev/getting-started/intro

---

## 9. Estimated Timeline

**Total: 20-28 hours (can be done in 3-4 focused days)**

| Phase | Hours | Description |
|-------|-------|-------------|
| Backend Setup | 4-6 | APIs, Aspire, endpoints |
| Frontend Setup | 2-3 | Nx, SSR, core services |
| Profile Feature | 3-4 | Forms, validation, API integration |
| 2FA Feature | 4-5 | Interceptor pattern, session management |
| Documents Feature | 3-4 | Upload, list, delete |
| Login/Logout | 2-3 | Auth flow, guards |
| Polish & Testing | 2-3 | Error handling, testing |

**Binge-friendly:** Can be completed in one focused 24-30 hour session if you're in the zone!

---

## 10. Next Steps

1. Review this requirements document
2. Set up development environment
3. Start with Phase 1: Backend Setup
4. Follow the implementation checklist
5. Test each feature as you build
6. Document patterns learned

Good luck! 🚀
