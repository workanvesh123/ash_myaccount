# Quick Test Run - MyAccount Platform

## ✅ Servers Status

**Backend:** ✅ Running on http://localhost:5000
**Frontend:** ✅ Running on http://localhost:4200

---

## 🚀 Quick Test (10 minutes)

Follow these steps to test all major features:

### 1. Test Dark Mode (30 seconds)
1. Open http://localhost:4200/
2. Click moon icon 🌙 in header
3. **Expected:** Theme switches to dark
4. Refresh page (F5)
5. **Expected:** Dark mode persists
6. Click sun icon ☀️
7. **Expected:** Back to light mode

✅ **PASS** if theme toggles and persists

---

### 2. Test Login & Real-time Notification (1 minute)
1. Go to http://localhost:4200/login
2. Click **"John Doe (No 2FA)"** button
3. Click **"Login"**
4. **Watch for:**
   - Loading spinner appears
   - Redirected to profile page
   - **Toast notification slides in** saying "Login Successful"
   - **Bell icon** in header shows badge "1"
   - **Green dot** next to bell (SignalR connected)

5. Open browser console (F12)
6. Look for: `[SignalR] Connected successfully`

✅ **PASS** if login works and notification appears

---

### 3. Test Notification Center (1 minute)
1. Click the **notification bell** in header
2. **Expected:** Dropdown panel opens
3. **Expected:** See login notification with:
   - ✅ Icon
   - "Login Successful" title
   - IP address and device info
   - "Just now" timestamp
   - Blue left border (unread)

4. Click the notification
5. **Expected:**
   - Blue border disappears (marked as read)
   - Badge count decreases to 0

✅ **PASS** if notification center works

---

### 4. Test Avatar Upload (1 minute)
1. On profile page, click **"Upload"** button
2. Select an image file (< 2MB)
3. **Expected:**
   - Avatar appears on profile
   - Avatar appears in header (small)
4. Refresh page
5. **Expected:** Avatar persists

✅ **PASS** if avatar uploads and displays

---

### 5. Test Activity Log (30 seconds)
1. Click **"Activity Log"** link on profile
2. **Expected:** See login activity with:
   - 🔓 Login icon
   - IP address
   - Device type
   - Browser name
   - Timestamp

✅ **PASS** if activity is logged

---

### 6. Test Sessions (30 seconds)
1. Click **"Manage Sessions"** link on profile
2. **Expected:** See current session with:
   - "Current Session" badge
   - Device icon 💻
   - Browser and OS info
   - IP address
   - "Last Active: Just now"

✅ **PASS** if session is displayed

---

### 7. Test Multiple Notifications (1 minute)
1. Go to Profile → Edit Profile
2. Change email to: `newemail@example.com`
3. Click **"Save Changes"**
4. **Expected:**
   - Success message
   - **New notification appears** (toast + bell badge)

5. Click bell → See 2 notifications now
6. Click **"Mark all as read"**
7. **Expected:** Badge disappears

✅ **PASS** if multiple notifications work

---

### 8. Test Change Password (1 minute)
1. Profile → Security → **"Change Password"**
2. Fill in:
   - Current: `password123`
   - New: `NewPassword123!`
   - Confirm: `NewPassword123!`
3. Click **"Change Password"**
4. **Expected:**
   - Success message
   - Redirected to profile

✅ **PASS** if password changes

---

### 9. Test Password Reset (2 minutes)
1. Logout
2. Click **"Forgot Password?"**
3. Enter: `john.doe@example.com`
4. Click **"Send Reset Link"**
5. **Check backend console** for reset link
6. Copy the full link and paste in browser
7. Enter new password: `TestPassword123!`
8. Click **"Reset Password"**
9. **Expected:** Auto-redirects to login after 2 seconds

✅ **PASS** if password reset works

---

### 10. Test 2FA Login (1 minute)
1. Login page → Click **"Jane Smith (2FA Enabled)"**
2. Click **"Login"**
3. **Expected:** Redirected to 2FA verify page
4. **Check backend console** for OTP code
5. Look for: `[2FA] OTP for user user456: 123456`
6. Enter the OTP code
7. Click **"Verify & Continue"**
8. **Expected:**
   - Success message
   - Redirected to profile
   - **Notification appears** for login

✅ **PASS** if 2FA login works

---

## 🎯 Test Results Summary

Mark each test as you complete it:

- [ ] 1. Dark Mode
- [ ] 2. Login & Real-time Notification
- [ ] 3. Notification Center
- [ ] 4. Avatar Upload
- [ ] 5. Activity Log
- [ ] 6. Sessions
- [ ] 7. Multiple Notifications
- [ ] 8. Change Password
- [ ] 9. Password Reset
- [ ] 10. 2FA Login

---

## 🐛 If Something Doesn't Work

### SignalR Not Connecting (No green dot)
1. Check browser console (F12) for errors
2. Verify backend is running: http://localhost:5000/health
3. Try refreshing the page
4. Try logging out and back in

### Notifications Not Appearing
1. Check SignalR connection (green dot)
2. Check browser console for `[SignalR]` messages
3. Check backend console for notification logs
4. Try performing another action (edit profile)

### Frontend Not Loading
1. Check if dev server is running
2. Go to http://localhost:4200/
3. If not working, restart:
   ```bash
   cd frontend
   npx nx reset
   npm start
   ```

### Backend Not Responding
1. Check if backend is running
2. Go to http://localhost:5000/health
3. If not working, restart:
   ```bash
   cd backend/MyAccount.Api
   $env:ASPNETCORE_ENVIRONMENT='Development'
   dotnet run
   ```

---

## 🎉 All Tests Passed?

If all 10 tests pass, you have successfully verified:

✅ Authentication system
✅ Real-time notifications with SignalR
✅ Notification center with live updates
✅ Activity logging
✅ Session management
✅ Profile management
✅ Avatar system
✅ Password reset flow
✅ 2FA authentication
✅ Dark mode
✅ All UI components

**Congratulations! Your MyAccount Platform is fully functional!** 🚀

---

## 📊 Current Status

**Backend:** http://localhost:5000 ✅
**Frontend:** http://localhost:4200 ✅
**Swagger:** http://localhost:5000/swagger ✅
**Health Check:** http://localhost:5000/health ✅

**Total Features:** 25+
**Total API Endpoints:** 18+
**Total Components:** 18+
**Real-time:** SignalR WebSocket ✅

---

## 🔗 Quick Links

- **Login:** http://localhost:4200/login
- **Profile:** http://localhost:4200/en/myaccount/profile
- **Activity Log:** http://localhost:4200/en/myaccount/activity
- **Sessions:** http://localhost:4200/en/myaccount/sessions
- **Documents:** http://localhost:4200/en/myaccount/documents

---

**Ready to test! Start with Test #1 above.** 🎯
