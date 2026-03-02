# Mini MyAccount Backend - Phase 1

## Overview
.NET 9 API with .NET Aspire orchestration for the Mini MyAccount learning project.

## ✅ Phase 1 Complete!

All backend features implemented and tested.

## Features Implemented
- ✅ Personal Details (GET/PUT profile)
- ✅ Two-Factor Authentication (enable/verify/disable)
- ✅ Document Upload (upload/list/delete)
- ✅ Authentication (login/logout)
- ✅ Health checks
- ✅ CORS configuration for Angular frontend

## Project Structure
```
backend/
├── AppHost/              # .NET Aspire orchestrator
├── MyAccount.Api/        # Main API
│   ├── Features/         # Feature-based endpoints
│   ├── Models/           # DTOs and models
│   ├── Repositories/     # In-memory data stores
│   └── Services/         # Business logic
└── Backend.slnx          # Solution file
```

## Running the Application

### Option 1: Run with Aspire (Recommended)
```bash
cd backend
dotnet run --project AppHost
```
- Aspire Dashboard: http://localhost:15888
- API will be available on a dynamic port (check dashboard)

### Option 2: Run API Directly
```bash
cd backend/MyAccount.Api
dotnet run
```
- API: http://localhost:5000
- Swagger: http://localhost:5000/swagger

## Testing with Swagger

1. Navigate to Swagger UI
2. Test endpoints in this order:

### 1. Login (to get session token)
POST /api/auth/login
```json
{
  "username": "john.doe",
  "password": "password123"
}
```
Response includes `sessionToken` - copy this for authorization

### 2. Get Profile
GET /api/user/profile
- Add Authorization header: `Bearer user123`

### 3. Update Profile
PUT /api/user/profile
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.updated@example.com",
  "phone": "+1234567890"
}
```

### 4. Enable 2FA
POST /api/2fa/enable
```json
{
  "method": "email"
}
```
Check console for OTP code

### 5. Verify 2FA
POST /api/2fa/verify
```json
{
  "code": "123456"
}
```
Use the OTP from console

## Test Users

### User 1 (No 2FA)
- Username: `john.doe`
- Password: `password123`
- User ID: `user123`

### User 2 (2FA Enabled)
- Username: `jane.smith`
- Password: `password456`
- User ID: `user456`

## API Endpoints

### Authentication
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout

### Personal Details
- GET /api/user/profile - Get user profile
- PUT /api/user/profile - Update profile

### Two-Factor Authentication
- POST /api/2fa/enable - Enable 2FA (sends OTP)
- POST /api/2fa/verify - Verify OTP code
- POST /api/2fa/disable - Disable 2FA

### Document Upload
- POST /api/documents/upload - Upload document
- GET /api/documents - List user documents
- DELETE /api/documents/{id} - Delete document

### Health
- GET /health - Health check

## Key Implementation Details

### 2FA Flow
1. User enables 2FA → OTP generated and logged to console
2. User verifies OTP → 2FA enabled on profile
3. Next login → API returns `isCompleted: false` with redirect to 2FA verify
4. User verifies OTP → Login completes

### Session Management
- Session tokens are simple GUIDs
- Token = userId for simplicity (in production, use JWT)
- Stored in Authorization header as Bearer token

### In-Memory Storage
- All data stored in memory (resets on restart)
- UserRepository: 2 test users
- DocumentRepository: Empty initially
- OTPStore: 5-minute expiry

## Next Steps
✅ Phase 1 Complete!
→ Move to Phase 2: Frontend Setup
