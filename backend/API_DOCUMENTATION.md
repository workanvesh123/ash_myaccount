# MyAccount API Documentation

## Overview
Mini MyAccount Learning Platform API - A simplified account management system demonstrating Angular + .NET patterns with 2FA interceptor workflows.

**Base URL:** `http://localhost:5000/api/v1`
**Version:** 1.0
**Authentication:** Bearer token (userId)

---

## API Versioning

This API uses URL-based versioning. All endpoints are prefixed with `/api/v{version}`.

**Current Version:** v1
**Example:** `GET /api/v1/user/profile`

You can also specify the version via header:
```
X-Api-Version: 1.0
```

---

## Authentication

All endpoints (except login) require authentication using a Bearer token.

**Header:**
```
Authorization: Bearer {userId}
```

**Example:**
```
Authorization: Bearer user123
```

**Test Users:**
- `user123` - John Doe (no 2FA)
- `user456` - Jane Smith (2FA enabled)

---

## Endpoints

### Authentication

#### POST /api/v1/auth/login
Authenticates user and initiates login flow.

**Request Body:**
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

**Response (No 2FA):**
```json
{
  "isCompleted": true,
  "redirectUrl": null,
  "action": null,
  "claims": {
    "username": "john.doe",
    "accountId": "user123",
    "sessionToken": "abc123"
  },
  "postLoginValues": null,
  "user": {
    "isAuthenticated": true
  }
}
```

**Response (With 2FA):**
```json
{
  "isCompleted": false,
  "redirectUrl": "/en/myaccount/2fa-verify",
  "action": "twoFactorAuth",
  "claims": {
    "username": "jane.smith",
    "accountId": "user456",
    "sessionToken": "xyz789"
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

---

#### POST /api/v1/auth/logout
Logs out the authenticated user.

**Response:**
```json
{
  "success": true
}
```

---

### Personal Details

#### GET /api/v1/user/profile
Retrieves authenticated user's profile.

**Headers:**
```
Authorization: Bearer user123
```

**Response:**
```json
{
  "userId": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01T00:00:00Z",
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

---

#### PUT /api/v1/user/profile
Updates authenticated user's profile.

**Headers:**
```
Authorization: Bearer user123
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.updated@example.com",
  "phone": "+1234567890"
}
```

**Response:** Same as GET /api/v1/user/profile

**Validation:**
- First name: Required, not empty
- Last name: Required, not empty
- Email: Required, must contain "@"
- Phone: Required, not empty

---

### Two-Factor Authentication

#### POST /api/v1/2fa/enable
Generates and sends OTP code to enable 2FA.

**Headers:**
```
Authorization: Bearer user123
```

**Request Body:**
```json
{
  "method": "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "expiresIn": 300
}
```

**Note:** OTP code is logged to console for testing.

---

#### POST /api/v1/2fa/verify
Verifies OTP code to complete 2FA enablement or login.

**Headers:**
```
Authorization: Bearer user123
```

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

**Response (Error):**
```json
{
  "message": "Invalid or expired OTP"
}
```

---

#### POST /api/v1/2fa/disable
Disables 2FA for authenticated user.

**Headers:**
```
Authorization: Bearer user123
```

**Response:**
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

---

### Document Upload

#### POST /api/v1/documents/upload
Uploads a KYC document.

**Headers:**
```
Authorization: Bearer user123
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File (PDF, JPG, PNG)
- `documentType`: "id" | "proof_of_address"

**Constraints:**
- Max file size: 5MB
- Allowed types: PDF, JPG, PNG

**Response:**
```json
{
  "documentId": "doc123",
  "filename": "passport.pdf",
  "uploadDate": "2024-01-15T10:30:00Z",
  "status": "pending",
  "documentType": "id"
}
```

---

#### GET /api/v1/documents
Lists all documents for authenticated user.

**Headers:**
```
Authorization: Bearer user123
```

**Response:**
```json
{
  "documents": [
    {
      "documentId": "doc123",
      "filename": "passport.pdf",
      "uploadDate": "2024-01-15T10:30:00Z",
      "status": "pending",
      "documentType": "id"
    }
  ]
}
```

**Document Status:**
- `pending` - Awaiting review
- `approved` - Verified
- `rejected` - Rejected

---

#### DELETE /api/v1/documents/{id}
Deletes a pending document.

**Headers:**
```
Authorization: Bearer user123
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Note:** Only pending documents can be deleted.

---

## Error Codes

### PostLoginValues Error Codes
- `118` - Forced 2FA (user must complete 2FA)
- `122` - Optional 2FA (user can skip)

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting
Not implemented (learning project).

---

## CORS
Allowed origins configured in `appsettings.json`:
- `http://localhost:4200` (Angular dev server)

---

## Logging
All requests are logged with correlation IDs for tracing.

**Log Location:** `backend/MyAccount.Api/logs/`

---

## Health Check
**Endpoint:** `GET /health`

**Response:**
```
Healthy
```

---

## Swagger UI
Available in Development mode only:
**URL:** `http://localhost:5000/swagger`

---

## Example Workflows

### Workflow 1: Login without 2FA
1. POST /api/v1/auth/login
2. Receive `isCompleted: true`
3. Use sessionToken for subsequent requests

### Workflow 2: Login with 2FA
1. POST /api/v1/auth/login
2. Receive `isCompleted: false` with `redirectUrl`
3. Frontend redirects to 2FA verify page
4. POST /api/v1/2fa/verify with OTP
5. Login completes

### Workflow 3: Enable 2FA
1. POST /api/v1/2fa/enable
2. Check console for OTP code
3. POST /api/v1/2fa/verify with OTP
4. 2FA enabled

### Workflow 4: Upload Document
1. POST /api/v1/documents/upload (multipart/form-data)
2. GET /api/v1/documents to verify upload
3. DELETE /api/v1/documents/{id} if needed

---

## Support
For issues or questions, check the logs or contact the development team.
