# Quick Test Guide - Mini MyAccount

## 🚀 Ready to Test!

Both servers are running:
- **Frontend:** http://localhost:4200/
- **Backend:** http://localhost:5000/api/v1
- **Swagger:** http://localhost:5000/swagger

---

## 🔑 Test Users

### John Doe (No 2FA)
- **Username:** `john.doe`
- **Password:** `password123`
- **User ID:** `user123`
- **2FA Status:** Disabled

### Jane Smith (2FA Enabled)
- **Username:** `jane.smith`
- **Password:** `password456`
- **User ID:** `user456`
- **2FA Status:** Enabled

---

## 🧪 Test Scenarios

### Scenario 1: Login without 2FA ✅
1. Open http://localhost:4200/
2. Click **"John Doe (No 2FA)"** button
3. Click **"Login"**
4. ✅ You should see the profile page immediately

### Scenario 2: Login with 2FA (Interceptor Pattern!) ✅
1. Open http://localhost:4200/
2. Click **"Jane Smith (2FA Enabled)"** button
3. Click **"Login"**
4. ✅ You'll be redirected to the 2FA verify page
5. **Check your backend console/terminal** for the OTP code
6. Look for a line like: `[2FA] OTP for user user456: 123456`
7. Enter the 6-digit code
8. Click **"Verify & Continue"**
9. ✅ You should see the profile page

### Scenario 3: Enable 2FA for John Doe ✅
1. Login as John Doe
2. On profile page, click **"Enable 2FA"**
3. Click **"Enable 2FA"** button
4. **Check backend console** for OTP (e.g., `[2FA] OTP for user user123: 654321`)
5. Enter the OTP code
6. Click **"Verify & Enable"**
7. ✅ 2FA is now enabled for John Doe

### Scenario 4: Edit Profile ✅
1. Login as any user
2. Click **"Edit Profile"**
3. Change email to `newemail@example.com`
4. Click **"Save Changes"**
5. ✅ Profile updated successfully

### Scenario 5: Upload Document ✅
1. Login as any user
2. Click **"View Documents"** on profile
3. Click **"Upload Document"**
4. Select document type (ID or Proof of Address)
5. Choose a file (PDF, JPG, or PNG under 5MB)
6. Click **"Upload Document"**
7. ✅ Document appears in the list

---

## 🔍 Where to Find OTP Codes

### Backend Console/Terminal
When you enable 2FA or login with 2FA, the OTP code is printed to the backend console.

**Look for lines like:**
```
[2FA] OTP for user user123: 123456
[2FA] OTP for user user456: 654321
```

### How OTP Works:
1. **Generated:** Random 6-digit code (100000-999999)
2. **Expiry:** 5 minutes
3. **Storage:** In-memory (cleared after use or expiry)
4. **Logged to:** Backend console (for testing purposes)

**In a real app:** The OTP would be sent via email or SMS, not logged to console!

---

## 🐛 Troubleshooting

### "User not found" Error
**Fixed!** The issue was that the frontend was sending the sessionToken instead of the userId. This has been corrected.

### Can't see OTP code
1. Make sure the backend is running
2. Check the terminal/console where you ran `dotnet run`
3. The OTP is printed immediately after clicking "Enable 2FA" or logging in with 2FA

### Login not working
1. Make sure both servers are running
2. Check browser console (F12) for errors
3. Verify you're using the correct credentials:
   - john.doe / password123
   - jane.smith / password456

### Profile page shows 404
1. Make sure you're logged in
2. Clear browser cache and try again
3. Check that the backend is running

---

## 📝 Testing Checklist

- [ ] Login as John Doe (no 2FA)
- [ ] Login as Jane Smith (with 2FA)
- [ ] View profile
- [ ] Edit profile
- [ ] Enable 2FA for John Doe
- [ ] Verify OTP code
- [ ] Upload a document
- [ ] View documents list
- [ ] Delete a document
- [ ] Logout
- [ ] Test auth guard (try accessing /en/myaccount/profile without login)

---

## 🎯 Key Features to Test

### 2FA Interceptor Pattern (Main Learning Goal!)
1. Login as Jane Smith
2. Notice the redirect to 2FA verify page
3. Enter OTP from backend console
4. Complete login

This demonstrates the interceptor pattern where:
- Backend returns `isCompleted: false`
- Frontend redirects to 2FA verify
- User completes verification
- Login flow continues

### Form Validation
- Try submitting empty forms
- Try invalid email formats
- Try short passwords
- See inline error messages

### Loading States
- Notice "Logging in..." on login button
- See "Saving..." when updating profile
- Watch "Uploading..." during document upload

### Error Handling
- Try wrong password
- Try expired OTP
- See error messages in notification area

---

## 🎉 Success Indicators

### Login Success
- Redirected to profile page
- Header shows navigation links
- Logout button visible

### 2FA Success
- OTP verified message
- Redirected to profile
- 2FA status shows "Enabled"

### Profile Update Success
- Green success message
- Updated values displayed
- Redirected back to profile view

### Document Upload Success
- Document appears in list
- Status shows "Pending"
- Can delete if needed

---

## 📞 Need Help?

If something isn't working:
1. Check both server terminals for errors
2. Check browser console (F12)
3. Review backend logs: `backend/MyAccount.Api/logs/`
4. Verify you're using the correct test credentials

---

**Happy Testing! 🚀**
