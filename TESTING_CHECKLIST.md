# Testing Checklist - Mini MyAccount

## Quick Start

**Backend:** http://localhost:5000/api/v1
**Frontend:** http://localhost:4200/
**Swagger:** http://localhost:5000/swagger

---

## ✅ Backend Tests

### Test 1: Health Check
- [ ] Open http://localhost:5000/health
- [ ] Should return: `Healthy`

### Test 2: Swagger UI
- [ ] Open http://localhost:5000/swagger
- [ ] Should see "MyAccount API" with V1 dropdown
- [ ] Click "Authorize" button
- [ ] Enter: `user123`
- [ ] Click "Authorize" again
- [ ] Should see "Authorized" with logout button

### Test 3: Login Without 2FA
- [ ] In Swagger, find POST /api/v1/auth/login
- [ ] Click "Try it out"
- [ ] Enter:
```json
{
  "username": "john.doe",
  "password": "password123"
}
```
- [ ] Click "Execute"
- [ ] Should see `"isCompleted": true`
- [ ] Should see `sessionToken` in response

### Test 4: Login With 2FA
- [ ] In Swagger, find POST /api/v1/auth/login
- [ ] Enter:
```json
{
  "username": "jane.smith",
  "password": "password456"
}
```
- [ ] Click "Execute"
- [ ] Should see `"isCompleted": false`
- [ ] Should see `"redirectUrl": "/en/myaccount/2fa-verify"`
- [ ] Should see `"errorcode": 118`

### Test 5: Get Profile
- [ ] In Swagger, find GET /api/v1/user/profile
- [ ] Make sure you're authorized (Bearer user123)
- [ ] Click "Try it out" → "Execute"
- [ ] Should see John Doe's profile
- [ ] Should see `"twoFactorEnabled": false`

### Test 6: Update Profile
- [ ] In Swagger, find PUT /api/v1/user/profile
- [ ] Enter:
```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890"
}
```
- [ ] Click "Execute"
- [ ] Should see updated profile with new values

### Test 7: Enable 2FA
- [ ] In Swagger, find POST /api/v1/2fa/enable
- [ ] Enter:
```json
{
  "method": "email"
}
```
- [ ] Click "Execute"
- [ ] Should see `"success": true`
- [ ] **Check your terminal/console** - should see OTP code like:
```
[2FA] OTP for user user123: 123456
```
- [ ] Copy the OTP code

### Test 8: Verify 2FA
- [ ] In Swagger, find POST /api/v1/2fa/verify
- [ ] Enter the OTP code from previous step:
```json
{
  "code": "123456"
}
```
- [ ] Click "Execute"
- [ ] Should see `"success": true`
- [ ] Should see `"message": "2FA enabled successfully"`

### Test 9: Check Logs
- [ ] Open `backend/MyAccount.Api/logs/`
- [ ] Find today's log file: `myaccount-YYYYMMDD.log`
- [ ] Should see structured logs with correlation IDs
- [ ] Should see login attempts, 2FA operations, etc.

### Test 10: Document Upload
- [ ] In Swagger, find POST /api/v1/documents/upload
- [ ] Click "Try it out"
- [ ] Choose a file (PDF, JPG, or PNG < 5MB)
- [ ] Select documentType: "id"
- [ ] Click "Execute"
- [ ] Should see document uploaded with status "pending"

### Test 11: List Documents
- [ ] In Swagger, find GET /api/v1/documents
- [ ] Click "Try it out" → "Execute"
- [ ] Should see list of uploaded documents

### Test 12: Delete Document
- [ ] Copy a documentId from previous test
- [ ] In Swagger, find DELETE /api/v1/documents/{id}
- [ ] Enter the documentId
- [ ] Click "Execute"
- [ ] Should see `"success": true`

---

## ✅ Frontend Tests

### Test 1: Home Page
- [ ] Open http://localhost:4200/
- [ ] Should see:
  - [ ] Header with "MyAccount" logo
  - [ ] Footer with copyright
  - [ ] Main content area
- [ ] Should NOT see:
  - [ ] Navigation links (not authenticated)
  - [ ] Logout button

### Test 2: Auth Guard Redirect
- [ ] Navigate to http://localhost:4200/en/myaccount/profile
- [ ] Should redirect to http://localhost:4200/login
- [ ] Should see 404 or error (LoginComponent not created yet)
- [ ] This is EXPECTED - auth guard is working!

### Test 3: View Page Source (SSR Check)
- [ ] On home page, press Ctrl+U (View Source)
- [ ] Should see server-rendered HTML
- [ ] Should see `<app-header>` with content
- [ ] Should see `<app-footer>` with content
- [ ] Should NOT see empty `<app-root></app-root>`

### Test 4: Hot Reload
- [ ] Open `frontend/src/app/shared/components/header/header.component.ts`
- [ ] Change line 18: `<a routerLink="/">MyAccount</a>`
- [ ] To: `<a routerLink="/">MyAccount Test</a>`
- [ ] Save file
- [ ] Browser should auto-reload
- [ ] Should see "MyAccount Test" in header
- [ ] Change it back to "MyAccount"

### Test 5: Browser Console
- [ ] Open browser console (F12)
- [ ] Should NOT see any errors
- [ ] Should see Angular hydration messages (SSR working)

### Test 6: Network Tab
- [ ] Open browser DevTools → Network tab
- [ ] Refresh page
- [ ] Should see:
  - [ ] Initial HTML document (server-rendered)
  - [ ] JavaScript bundles loading
  - [ ] No API calls yet (no features implemented)

### Test 7: Responsive Design
- [ ] Resize browser window
- [ ] Header should remain visible
- [ ] Footer should stay at bottom
- [ ] Content should be responsive

---

## 🎯 Expected Results Summary

### Backend ✅
- All 10 API endpoints working
- Swagger UI functional
- Logs being written to file
- 2FA flow working (enable → verify)
- Document upload/list/delete working
- Health check responding

### Frontend ✅
- Dev server running on port 4200
- SSR working (view source shows content)
- Header and footer visible
- Auth guard redirecting to /login
- Hot reload working
- No console errors

---

## ❌ Known Issues (Expected)

### Frontend
- [ ] Navigating to /login shows 404 - **EXPECTED** (LoginComponent not created yet)
- [ ] Navigating to /en/myaccount/* redirects to /login - **EXPECTED** (auth guard working)
- [ ] No actual features visible - **EXPECTED** (Phase 3 pending)

### Backend
- [ ] OTP codes logged to console - **EXPECTED** (for testing, not production)
- [ ] Data resets on restart - **EXPECTED** (in-memory storage)

---

## 🐛 Troubleshooting

### Backend Not Running
```bash
cd backend/MyAccount.Api
$env:ASPNETCORE_ENVIRONMENT='Development'
dotnet run
```

### Frontend Not Running
```bash
cd frontend
npm start
```

### Port Already in Use
**Backend (5000):**
```bash
# Find process using port 5000
netstat -ano | findstr :5000
# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Frontend (4200):**
```bash
# Find process using port 4200
netstat -ano | findstr :4200
# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Swagger Not Loading
- Make sure you're in Development mode
- Check `$env:ASPNETCORE_ENVIRONMENT='Development'`
- Restart the API

### Frontend Shows Blank Page
- Check browser console for errors
- Make sure dev server is running
- Try hard refresh (Ctrl+Shift+R)

---

## ✅ All Tests Passed?

If all tests pass:
- ✅ Backend is fully functional
- ✅ Frontend infrastructure is working
- ✅ Ready to implement features (Phase 3)

---

**Next:** Implement Profile Feature (Phase 3)
