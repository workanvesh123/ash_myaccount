# Kiro Handoff Prompt - Mini MyAccount Learning Project

## Context Summary

I am building a learning project called "Mini MyAccount" to gain hands-on experience with:
- **Frontend:** Angular 20, Nx monorepo, RxJS, Signals, OnPush change detection, SSR
- **Backend:** .NET 8, .NET Aspire orchestration, minimal APIs, AutoMapper
- **Patterns:** MyAccount interceptor workflows, session management, reactive forms

This is a **standalone learning project** (not part of the production wrapper_sports repo). The goal is to replicate key MyAccount patterns in a simplified, focused application.

---

## Project Structure

```
mini-myaccount-learning/
├── backend/
│   ├── AppHost/              # .NET Aspire orchestrator
│   ├── MyAccount.Api/        # Main API with features
│   └── Shared/               # Shared contracts/DTOs
└── frontend/
    └── (Nx workspace)        # Angular app with SSR
```

---

## Core Features (4 main areas)

1. **User Profile Management** - View/edit personal details with reactive forms
2. **Two-Factor Authentication** - Enable/verify 2FA with interceptor pattern (KEY LEARNING)
3. **Document Upload** - KYC simulation with file handling
4. **Session & State Management** - Login/logout with session persistence

---

## Key Patterns to Implement

### 1. Interceptor-Based Workflow (Most Important!)
**Concept:** After login, if user has 2FA enabled, redirect to verification page before completing login.

**Flow:**
1. User logs in → API returns `isCompleted: false` with `redirectUrl` and `postLoginValues`
2. `LoginResponseHandlerService` checks `isCompleted` flag
3. If false, stores `postLoginValues` in `LoginStoreService` and redirects to 2FA verify page
4. `TwoFaVerifyComponent` reads workflow state from `SessionStoreService`
5. After successful OTP verification, completes login and redirects to profile

**Reference files in wrapper_sports repo:**
- `packages/vanilla/lib/core/src/login/login-response-handler/login-response-handler.service.ts`
- `packages/myaccount/core-lib/src/lib/interceptors/two-fa/two-fa.component.ts`

### 2. Session Management
- Use `SessionStoreService` to wrap `sessionStorage`
- Store workflow state: `{ errorcode: 118 }` for forced 2FA, `{ errorcode: 122 }` for optional
- Persist state across page refreshes
- Clear on logout

### 3. Message Queue Pattern
- `MessageQueueService` manages user notifications
- Signal-based state: `messages = signal<Message[]>([])`
- Types: Success, Error, Info, Warning
- Lifetimes: Single (auto-dismiss), Persistent (manual clear)

### 4. Signals + OnPush
- All components use `ChangeDetectionStrategy.OnPush`
- State managed with signals: `signal()`, `computed()`, `toSignal()`
- No `async` pipe - use `toSignal()` instead
- No template getters - use `computed()` instead

### 5. SSR-Safe Development
- Never access `window`/`document` directly
- Use `inject(WINDOW)`, `inject(DOCUMENT)` tokens
- Use `afterNextRender()` for browser-only code
- Use `PLATFORM.runOnBrowser()` for conditional execution

---

## Implementation Approach

**Phase-by-phase execution:**
1. **Phase 1:** Backend setup (4-6 hours) - AppHost, API, all features
2. **Phase 2:** Frontend setup (2-3 hours) - Nx workspace, core services
3. **Phase 3:** Profile feature (3-4 hours) - View/edit with reactive forms
4. **Phase 4:** 2FA feature (4-5 hours) - Enable/verify with interceptor
5. **Phase 5:** Documents feature (3-4 hours) - Upload/list/delete
6. **Phase 6:** Login/logout (2-3 hours) - Auth flow
7. **Phase 7:** Polish (2-3 hours) - Error handling, testing, docs

**Total: 20-28 hours**

---

## Detailed Specifications

All detailed specifications are in these files (copy to new project):
- `requirements.md` - User stories, acceptance criteria, API contracts
- `design.md` - Complete architecture, code implementations, patterns
- `tasks.md` - 43 detailed tasks with sub-tasks

---

## Working with Me (Kiro)

### Efficient Workflow

**Your role:** Run commands, test, give feedback
**My role:** Write all code, create files, fix issues

### How to Request Work

**For each phase, say:**
> "Implement Phase [X]: [Phase Name]. Create all files for tasks [Y-Z]."

**Example:**
> "Implement Phase 1: Backend Setup. Create all files for tasks 1-8."

**I will:**
1. Generate all necessary files with complete implementations
2. Provide exact commands to run
3. Explain what to test

**You will:**
1. Run the commands
2. Test the functionality
3. Report any errors (just paste the error message)

**I will:**
1. Fix the issues immediately
2. Explain what was wrong

### Debugging Protocol

**Don't try to fix issues yourself.** Just tell me:
> "I'm getting this error: [paste error]. Fix it."

I'll identify the root cause and fix it.

### Testing Checkpoints

After each phase:
> "Phase [X] works! Move to Phase [Y]."

Or:
> "Phase [X] has this issue: [describe]. Fix it before moving on."

---

## Technical Stack Details

### Backend (.NET 8 + Aspire)

**Key packages:**
- `Aspire.Hosting` - Orchestration
- `AutoMapper` - DTO mapping
- `Swashbuckle` - Swagger/OpenAPI

**Architecture:**
- Feature-based organization (PersonalDetails, TwoFactorAuth, DocumentUpload, Authentication)
- Minimal APIs (no controllers)
- In-memory repositories (no database needed)
- Health checks at `/health`

**Endpoints:**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/2fa/enable` - Enable 2FA (sends OTP)
- `POST /api/2fa/verify` - Verify OTP
- `POST /api/2fa/disable` - Disable 2FA
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Frontend (Angular 20 + Nx)

**Key packages:**
- `@angular/core` v20
- `@nx/angular` - Nx workspace
- `@angular/ssr` - Server-side rendering
- `rxjs` - Reactive programming

**Architecture:**
- Standalone components (no NgModules)
- Feature libraries (profile, two-fa, documents)
- Core services (session, message-queue, login-store, user)
- HTTP interceptors (auth, error)
- Route guards (auth)

**Core Services:**
- `SessionStoreService` - Session storage wrapper
- `MessageQueueService` - Notification queue
- `LoginStoreService` - Login state (PostLoginValues)
- `UserService` - User state (isAuthenticated, accountId)
- `LoginResponseHandlerService` - Login flow handler

**Routing:**
- Culture-based: `/:culture/myaccount/*`
- Lazy-loaded features
- Auth guard on protected routes

---

## Key Learning Outcomes

After completing this project, I will understand:

1. **Interceptor Pattern** - Post-login workflow redirection
2. **Session Management** - Persisting state across refreshes
3. **Signals + OnPush** - Modern Angular reactive patterns
4. **SSR-Safe Development** - Server/client compatible code
5. **Reactive Forms** - Complex validation with signals
6. **.NET Aspire** - Service orchestration
7. **Feature-Based Architecture** - Domain-driven organization
8. **Message Queue Pattern** - User notifications
9. **HTTP Interceptors** - Global request/response handling
10. **Route Guards** - Authentication/authorization

---

## Success Criteria

✅ Backend APIs respond correctly (test with Swagger)
✅ Frontend components render without errors
✅ 2FA interceptor redirects correctly after login
✅ Session persists across page refreshes
✅ Forms validate correctly
✅ Error messages display via message queue
✅ Success messages display via message queue
✅ SSR renders all pages without errors
✅ All unit tests pass
✅ Documentation is complete

---

## Commands Reference

### Backend
```bash
# Run Aspire AppHost
cd backend
dotnet run --project AppHost

# Aspire dashboard: http://localhost:15888
# API Swagger: http://localhost:5000/swagger
```

### Frontend
```bash
# Serve with SSR
cd frontend
nx serve myaccount

# Build for production
nx build myaccount --configuration=production

# Run tests
nx test myaccount
```

---

## Important Notes

1. **This is a learning project** - Focus on understanding patterns, not production-ready code
2. **Mock everything** - No real POS API, no real email/SMS sending
3. **Keep it simple** - Minimal features, maximum learning
4. **Test frequently** - After each feature, test before moving on
5. **Commit often** - After each completed phase
6. **Ask questions** - If anything is unclear, ask me to explain

---

## Getting Started

1. Create project folder and initialize git
2. Copy these spec files (requirements.md, design.md, tasks.md) to the new project
3. Tell me: "Ready for Phase 1. Create all backend files."
4. I'll generate all files and give you commands to run
5. Test, report issues, move to next phase

---

## Reference Materials

**Existing codebase patterns (wrapper_sports repo):**
- Login handler: `packages/vanilla/lib/core/src/login/login-response-handler/login-response-handler.service.ts`
- 2FA interceptor: `packages/myaccount/core-lib/src/lib/interceptors/two-fa/two-fa.component.ts`
- Backend structure: `backend/myaccount/Frontend.MyAccount.Api/`
- Aspire config: `backend/host-app/Frontend.AppHost.AppHost/`

**Documentation:**
- All patterns explained in `design.md`
- All tasks listed in `tasks.md`
- All requirements in `requirements.md`

---

## Ready to Start!

Once you've set up the project folder and copied these files, just say:

> "Ready for Phase 1. I'm in the mini-myaccount-learning folder."

I'll generate all the code and guide you through testing!
