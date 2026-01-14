# Email Verification API Reference

## API Endpoints

### 1. Register User (Modified)
**Endpoint:** `POST /api/user/register`

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email_id": "john@example.com",
  "mobile_number": "9876543210",
  "password": "SecurePass123!",
  "registerThrough": "frontend"
}
```

**Success Response (Frontend Registration):**
```json
{
  "code": 3000,
  "result": {
    "status": "success",
    "msg": "Account created successfully! Please check your email to verify your account.",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "emailSent": true,
    "requiresVerification": true
  }
}
```

**Success Response (Admin Registration):**
```json
{
  "code": 3000,
  "result": {
    "status": "success",
    "msg": "Account created successfully with complete profile!",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "token": "jwt_token_here",
    "userfullname": "John Doe",
    "profileCompleted": true
  }
}
```

---

### 2. Login User (Modified)
**Endpoint:** `POST /api/user/login`

**Request Body:**
```json
{
  "email_id": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:**
```json
{
  "code": 3000,
  "result": {
    "status": "success",
    "msg": "Login successful!",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "token": "jwt_token_here",
    "userfullname": "John Doe",
    "profileCompleted": true
  }
}
```

**Error Response (Email Not Verified):**
```json
{
  "code": 3000,
  "result": {
    "status": "error",
    "msg": "Please verify your email before logging in. Check your inbox for the verification link.",
    "emailNotVerified": true,
    "email": "john@example.com"
  }
}
```

---

### 3. Verify Email (New)
**Endpoint:** `GET /api/user/verify-email/:token`

**URL Parameters:**
- `token` (string, required) - Verification token from email link

**Example:** `GET /api/user/verify-email/abc123def456...`

**Success Response:**
```json
{
  "code": 3000,
  "result": {
    "status": "success",
    "msg": "Email verified successfully! You can now login.",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    "token": "jwt_token_here",
    "userfullname": "John Doe"
  }
}
```

**Error Response (Invalid/Expired Token):**
```json
{
  "code": 3000,
  "result": {
    "status": "error",
    "msg": "Invalid or expired verification token. Please request a new verification email."
  }
}
```

---

### 4. Resend Verification Email (New)
**Endpoint:** `POST /api/user/resend-verification`

**Request Body:**
```json
{
  "email_id": "john@example.com"
}
```

**Success Response:**
```json
{
  "code": 3000,
  "result": {
    "status": "success",
    "msg": "Verification email sent successfully! Please check your inbox."
  }
}
```

**Error Response (Already Verified):**
```json
{
  "code": 3000,
  "result": {
    "status": "error",
    "msg": "This email is already verified. You can login now."
  }
}
```

**Error Response (User Not Found):**
```json
{
  "code": 3000,
  "result": {
    "status": "error",
    "msg": "No account found with this email address"
  }
}
```

---

## Frontend Routes

### New Routes to Add to Angular Router

```typescript
// In your routing module, add these routes:

{
  path: 'verify-email',
  component: VerifyEmailComponent
},
{
  path: 'resend-verification',
  component: ResendVerificationComponent
}
```

### Route Usage

1. **Verify Email Route:** `/verify-email?token=abc123...`
   - Accessed from email link
   - Automatically verifies on load
   - Shows success/error state

2. **Resend Verification Route:** `/resend-verification`
   - Accessed when user needs new verification email
   - Simple form with email input
   - Redirects to success message after sending

3. **Success Message Route:** `/show-success-message?id=email@example.com`
   - Already exists in your app
   - Shows after registration
   - Displays email address

---

## Email Link Format

The verification email contains a link in this format:
```
{FRONTEND_URL}/verify-email?token={VERIFICATION_TOKEN}
```

Example:
```
http://localhost:4200/verify-email?token=a1b2c3d4e5f6...
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 3000 | Standard response (check result.status for success/error) |
| 5000 | Internal server error |

---

## Status Codes

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success (login, verify, resend) |
| 201 | Created (registration) |
| 400 | Bad request (validation errors) |
| 401 | Unauthorized (invalid credentials) |
| 403 | Forbidden (email not verified) |
| 404 | Not found (user doesn't exist) |
| 500 | Internal server error |

---

## Testing with Postman/cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email_id": "test@example.com",
    "mobile_number": "9876543210",
    "password": "Test@123",
    "registerThrough": "frontend"
  }'
```

### Verify Email
```bash
curl -X GET http://localhost:5000/api/user/verify-email/YOUR_TOKEN_HERE
```

### Resend Verification
```bash
curl -X POST http://localhost:5000/api/user/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email_id": "test@example.com"
  }'
```

### Login (After Verification)
```bash
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_id": "test@example.com",
    "password": "Test@123"
  }'
```

---

## Database Fields

### User Model - New Fields
```javascript
{
  isEmailVerified: Boolean,        // default: false
  emailVerificationToken: String,  // random 32-byte hex string
  emailVerificationExpires: Date   // 24 hours from creation
}
```

### Example User Document
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "hashed_password",
  "isEmailVerified": false,
  "emailVerificationToken": "a1b2c3d4e5f6...",
  "emailVerificationExpires": "2024-12-07T10:30:00.000Z",
  "registrationDate": "2024-12-06T10:30:00.000Z",
  "registerThrough": "frontend",
  "profileCompleted": false
}
```

---

## Integration Notes

1. **Module Imports:** Ensure `VerifyEmailComponent` and `ResendVerificationComponent` are declared in your Angular module

2. **Environment Variables:** Add `FRONTEND_URL` to your backend `.env` file

3. **Email Service:** Ensure SMTP credentials are configured in `.env`

4. **Testing:** Test with a real email address to receive verification emails

5. **Production:** Update `FRONTEND_URL` to your production domain before deploying
