# Mini MyAccount Learning Platform - Tasks

## Phase 1: Backend Setup

- [ ] 1. Create .NET Solution
  - [ ] 1.1 Create solution folder structure
  - [ ] 1.2 Create AppHost project (.NET Aspire)
  - [ ] 1.3 Create MyAccount.Api project
  - [ ] 1.4 Create Shared project for contracts

- [ ] 2. Configure .NET Aspire AppHost
  - [ ] 2.1 Add MyAccount.Api service reference
  - [ ] 2.2 Configure health checks
  - [ ] 2.3 Configure logging
  - [ ] 2.4 Test Aspire dashboard

- [ ] 3. Implement PersonalDetails Feature
  - [ ] 3.1 Create UserProfile model
  - [ ] 3.2 Create IUserRepository interface
  - [ ] 3.3 Implement InMemoryUserRepository
  - [ ] 3.4 Create GET /api/user/profile endpoint
  - [ ] 3.5 Create PUT /api/user/profile endpoint
  - [ ] 3.6 Add AutoMapper configuration
  - [ ] 3.7 Test endpoints with Swagger

- [ ] 4. Implement TwoFactorAuth Feature
  - [ ] 4.1 Create ITwoFactorService interface
  - [ ] 4.2 Implement TwoFactorService with OTP generation
  - [ ] 4.3 Create POST /api/2fa/enable endpoint
  - [ ] 4.4 Create POST /api/2fa/verify endpoint
  - [ ] 4.5 Create POST /api/2fa/disable endpoint
  - [ ] 4.6 Add in-memory OTP storage with expiry
  - [ ] 4.7 Test 2FA flow with Swagger

- [ ] 5. Implement DocumentUpload Feature
  - [ ] 5.1 Create Document model
  - [ ] 5.2 Create IDocumentRepository interface
  - [ ] 5.3 Implement InMemoryDocumentRepository
  - [ ] 5.4 Create POST /api/documents/upload endpoint
  - [ ] 5.5 Create GET /api/documents endpoint
  - [ ] 5.6 Create DELETE /api/documents/{id} endpoint
  - [ ] 5.7 Add file validation (size, type)
  - [ ] 5.8 Test document upload with Swagger

- [ ] 6. Implement Authentication Feature
  - [ ] 6.1 Create LoginRequest/LoginResponse models
  - [ ] 6.2 Create POST /api/auth/login endpoint
  - [ ] 6.3 Create POST /api/auth/logout endpoint
  - [ ] 6.4 Add mock user credentials
  - [ ] 6.5 Implement 2FA interceptor logic (isCompleted flag)
  - [ ] 6.6 Test login flow with Swagger

- [ ] 7. Add CORS Configuration
  - [ ] 7.1 Configure CORS for localhost:4200
  - [ ] 7.2 Test CORS with frontend

- [ ] 8. Add Health Checks
  - [ ] 8.1 Add health check endpoint
  - [ ] 8.2 Test health check

---

## Phase 2: Frontend Setup

- [ ] 9. Create Nx Workspace
  - [ ] 9.1 Initialize Nx workspace
  - [ ] 9.2 Create Angular application with SSR
  - [ ] 9.3 Configure TypeScript strict mode
  - [ ] 9.4 Configure ESLint

- [ ] 10. Configure SSR
  - [ ] 10.1 Add server.ts configuration
  - [ ] 10.2 Add app.config.server.ts
  - [ ] 10.3 Test SSR build
  - [ ] 10.4 Test SSR serve

- [ ] 11. Create Core Services
  - [ ] 11.1 Create SessionStoreService
  - [ ] 11.2 Create MessageQueueService
  - [ ] 11.3 Create LoginStoreService
  - [ ] 11.4 Create UserService
  - [ ] 11.5 Add unit tests for core services

- [ ] 12. Create HTTP Interceptors
  - [ ] 12.1 Create AuthInterceptor (add session token)
  - [ ] 12.2 Create ErrorInterceptor (handle errors)
  - [ ] 12.3 Register interceptors in app.config.ts
  - [ ] 12.4 Test interceptors

- [ ] 13. Create Route Guards
  - [ ] 13.1 Create AuthGuard
  - [ ] 13.2 Test AuthGuard

- [ ] 14. Create App Shell
  - [ ] 14.1 Create header component
  - [ ] 14.2 Create footer component
  - [ ] 14.3 Create notification component (message queue)
  - [ ] 14.4 Configure routing with culture support
  - [ ] 14.5 Add loading spinner component

- [ ] 15. Configure Environment
  - [ ] 15.1 Add environment files
  - [ ] 15.2 Configure API base URL
  - [ ] 15.3 Test environment configuration

---

## Phase 3: Profile Feature

- [ ] 16. Create Profile Feature Library
  - [ ] 16.1 Generate feature library
  - [ ] 16.2 Create ProfileService
  - [ ] 16.3 Create UserProfile interface

- [ ] 17. Implement ProfileComponent
  - [ ] 17.1 Create component with OnPush
  - [ ] 17.2 Add signals for state management
  - [ ] 17.3 Implement getProfile() call
  - [ ] 17.4 Add loading state
  - [ ] 17.5 Add error state
  - [ ] 17.6 Create template
  - [ ] 17.7 Add styles
  - [ ] 17.8 Test SSR compatibility

- [ ] 18. Implement ProfileEditComponent
  - [ ] 18.1 Create component with OnPush
  - [ ] 18.2 Create reactive form with FormBuilder
  - [ ] 18.3 Add validators (required, email, phone)
  - [ ] 18.4 Convert form state to signals
  - [ ] 18.5 Implement canSave computed signal
  - [ ] 18.6 Implement save() method
  - [ ] 18.7 Implement cancel() method
  - [ ] 18.8 Create template with form
  - [ ] 18.9 Add validation error messages
  - [ ] 18.10 Add styles
  - [ ] 18.11 Test form validation
  - [ ] 18.12 Test SSR compatibility

- [ ] 19. Add Profile Routing
  - [ ] 19.1 Add profile routes
  - [ ] 19.2 Add route guards
  - [ ] 19.3 Test navigation

- [ ] 20. Add Profile Unit Tests
  - [ ] 20.1 Test ProfileService
  - [ ] 20.2 Test ProfileComponent
  - [ ] 20.3 Test ProfileEditComponent

---

## Phase 4: Two-Factor Auth Feature

- [ ] 21. Create Two-FA Feature Library
  - [ ] 21.1 Generate feature library
  - [ ] 21.2 Create TwoFaService
  - [ ] 21.3 Create TwoFaModels interfaces

- [ ] 22. Implement TwoFaEnableComponent
  - [ ] 22.1 Create component with OnPush
  - [ ] 22.2 Add signals for state management
  - [ ] 22.3 Implement enableTwoFa() method
  - [ ] 22.4 Implement verifyOtp() method
  - [ ] 22.5 Implement resendOtp() method
  - [ ] 22.6 Create template with two steps
  - [ ] 22.7 Add OTP input field
  - [ ] 22.8 Add styles
  - [ ] 22.9 Test enable flow

- [ ] 23. Implement TwoFaVerifyComponent (Interceptor)
  - [ ] 23.1 Create component with OnPush
  - [ ] 23.2 Add signals for state management
  - [ ] 23.3 Implement determineFlowType() method
  - [ ] 23.4 Check SessionStoreService for flow state
  - [ ] 23.5 Check LoginStoreService for PostLoginValues
  - [ ] 23.6 Implement verifyOtp() method
  - [ ] 23.7 Implement resendOtp() method
  - [ ] 23.8 Clear session state on success
  - [ ] 23.9 Redirect to profile on success
  - [ ] 23.10 Create template
  - [ ] 23.11 Add styles
  - [ ] 23.12 Test interceptor flow

- [ ] 24. Implement LoginResponseHandlerService
  - [ ] 24.1 Create service
  - [ ] 24.2 Implement handle() method
  - [ ] 24.3 Store PostLoginValues in LoginStoreService
  - [ ] 24.4 Update UserService state
  - [ ] 24.5 Store session token
  - [ ] 24.6 Check isCompleted flag
  - [ ] 24.7 Redirect to interceptor if not completed
  - [ ] 24.8 Redirect to profile if completed
  - [ ] 24.9 Test login flow

- [ ] 25. Add Two-FA Routing
  - [ ] 25.1 Add 2FA routes
  - [ ] 25.2 Test navigation

- [ ] 26. Add Two-FA Unit Tests
  - [ ] 26.1 Test TwoFaService
  - [ ] 26.2 Test TwoFaEnableComponent
  - [ ] 26.3 Test TwoFaVerifyComponent
  - [ ] 26.4 Test LoginResponseHandlerService

---

## Phase 5: Document Upload Feature

- [ ] 27. Create Documents Feature Library
  - [ ] 27.1 Generate feature library
  - [ ] 27.2 Create DocumentsService
  - [ ] 27.3 Create Document interface

- [ ] 28. Implement DocumentUploadComponent
  - [ ] 28.1 Create component with OnPush
  - [ ] 28.2 Add signals for state management
  - [ ] 28.3 Implement onFileSelected() method
  - [ ] 28.4 Add file validation (size, type)
  - [ ] 28.5 Generate preview for images
  - [ ] 28.6 Implement upload() method
  - [ ] 28.7 Implement reset() method
  - [ ] 28.8 Create template with file input
  - [ ] 28.9 Add preview section
  - [ ] 28.10 Add progress bar
  - [ ] 28.11 Add styles
  - [ ] 28.12 Test upload flow

- [ ] 29. Implement DocumentListComponent
  - [ ] 29.1 Create component with OnPush
  - [ ] 29.2 Add signals for state management
  - [ ] 29.3 Implement loadDocuments() method
  - [ ] 29.4 Implement deleteDocument() method
  - [ ] 29.5 Implement getStatusClass() method
  - [ ] 29.6 Create template with table
  - [ ] 29.7 Add empty state
  - [ ] 29.8 Add styles
  - [ ] 29.9 Test list and delete

- [ ] 30. Add Documents Routing
  - [ ] 30.1 Add documents routes
  - [ ] 30.2 Test navigation

- [ ] 31. Add Documents Unit Tests
  - [ ] 31.1 Test DocumentsService
  - [ ] 31.2 Test DocumentUploadComponent
  - [ ] 31.3 Test DocumentListComponent

---

## Phase 6: Login/Logout

- [ ] 32. Create Login Feature
  - [ ] 32.1 Create LoginComponent
  - [ ] 32.2 Create reactive form
  - [ ] 32.3 Add validators
  - [ ] 32.4 Implement login() method
  - [ ] 32.5 Call LoginResponseHandlerService
  - [ ] 32.6 Create template
  - [ ] 32.7 Add styles
  - [ ] 32.8 Test login flow

- [ ] 33. Create LoginService
  - [ ] 33.1 Create service
  - [ ] 33.2 Implement login() method
  - [ ] 33.3 Implement logout() method
  - [ ] 33.4 Test service

- [ ] 34. Add Logout Functionality
  - [ ] 34.1 Add logout button to header
  - [ ] 34.2 Implement logout() method
  - [ ] 34.3 Clear session token
  - [ ] 34.4 Clear UserService state
  - [ ] 34.5 Clear LoginStoreService state
  - [ ] 34.6 Redirect to login
  - [ ] 34.7 Test logout flow

- [ ] 35. Test Full Authentication Flow
  - [ ] 35.1 Test login without 2FA
  - [ ] 35.2 Test login with 2FA
  - [ ] 35.3 Test session persistence
  - [ ] 35.4 Test session expiry
  - [ ] 35.5 Test logout

---

## Phase 7: Polish & Testing

- [ ] 36. Add Loading States
  - [ ] 36.1 Add loading spinners to all async operations
  - [ ] 36.2 Disable buttons during loading
  - [ ] 36.3 Test loading states

- [ ] 37. Add Error Handling
  - [ ] 37.1 Test all error scenarios
  - [ ] 37.2 Verify error messages display
  - [ ] 37.3 Test error recovery

- [ ] 38. Add Success Messages
  - [ ] 38.1 Add success messages for all operations
  - [ ] 38.2 Test message queue
  - [ ] 38.3 Test message auto-dismiss

- [ ] 39. Test SSR Rendering
  - [ ] 39.1 Test all pages render on server
  - [ ] 39.2 Test hydration
  - [ ] 39.3 Fix any SSR issues

- [ ] 40. Add Dark Mode Support (Optional)
  - [ ] 40.1 Create DarkModeService
  - [ ] 40.2 Add dark mode toggle
  - [ ] 40.3 Add dark mode styles

- [ ] 41. Add Tracking Service (Optional)
  - [ ] 41.1 Create TrackingService
  - [ ] 41.2 Add tracking events
  - [ ] 41.3 Test tracking

- [ ] 42. Create Documentation
  - [ ] 42.1 Create README with setup instructions
  - [ ] 42.2 Document patterns learned
  - [ ] 42.3 Document API endpoints
  - [ ] 42.4 Add architecture diagrams

- [ ] 43. Final Testing
  - [ ] 43.1 Test all features end-to-end
  - [ ] 43.2 Test on different browsers
  - [ ] 43.3 Test SSR vs CSR
  - [ ] 43.4 Fix any remaining issues

---

## Completion Checklist

- [ ] All backend endpoints working
- [ ] All frontend features working
- [ ] 2FA interceptor flow working
- [ ] Session management working
- [ ] SSR rendering working
- [ ] Error handling working
- [ ] Unit tests passing
- [ ] Documentation complete

---

## Estimated Time per Phase

| Phase | Hours | Description |
|-------|-------|-------------|
| Phase 1 | 4-6 | Backend setup and APIs |
| Phase 2 | 2-3 | Frontend setup and core services |
| Phase 3 | 3-4 | Profile feature |
| Phase 4 | 4-5 | Two-factor auth (most complex) |
| Phase 5 | 3-4 | Document upload |
| Phase 6 | 2-3 | Login/logout |
| Phase 7 | 2-3 | Polish and testing |
| **Total** | **20-28** | **Full implementation** |

---

## Success Criteria

✅ Backend APIs respond correctly
✅ Frontend components render without errors
✅ 2FA interceptor redirects correctly
✅ Session persists across page refreshes
✅ Forms validate correctly
✅ Error messages display correctly
✅ Success messages display correctly
✅ SSR renders all pages
✅ All unit tests pass
✅ Documentation is complete

---

## Notes

- Start with backend (easier to test in isolation)
- Test each feature before moving to next
- Use Swagger for backend testing
- Use browser DevTools for frontend debugging
- Check console for errors frequently
- Commit after each completed phase
