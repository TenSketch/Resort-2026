# Forgot Password Implementation

## Overview
Complete forgot password functionality with email-based password reset and 60-second cooldown protection.

## Backend Implementation

### Database Fields (userModel.js)
- `passwordResetToken`: String - Unique token for password reset
- `passwordResetExpires`: Date - Token expiration (1 hour)
- `lastPasswordResetEmailSent`: Date - Tracks cooldown period

### Email Service (emailService.js)
- `generatePasswordResetToken()`: Generates secure random token
- `sendPasswordResetEmail(user, token)`: Sends password reset email with link

### API Endpoints (userRoutes.js)

#### 1. Request Password Reset
```
POST /api/user/forgot-password
Body: { email_id: "user@example.com" }
```

**Features:**
- Email validation
- 60-second cooldown between requests
- Secure token generation (1 hour expiry)
- Uses existing PASSWORD_RESET_EMAIL_TEMPLATE
- Returns success even if user doesn't exist (security)

**Response:**
```json
{
  "code": 3000,
  "result": {
    "status": "success",
    "msg": "Password reset link has been sent to your email."
  }
}
```

**Cooldown Response (429):**
```json
{
  "code": 3000,
  "result": {
    "status": "error",
    "msg": "Please wait 45 seconds before requesting another password reset email.",
    "remainingSeconds": 45
  }
}
```

#### 2. Reset Password with Token
```
POST /api/user/reset-password/:token
Body: { password: "NewPassword123!" }
```

**Features:**
- Token validation (checks expiry)
- Password validation (8+ chars, uppercase, lowercase, number, special char)
- Clears reset token after successful reset
- Hashes password with bcrypt (12 rounds)

**Response:**
```json
{
  "code": 3000,
  "result": {
    "status": "success",
    "msg": "Password has been reset successfully! You can now login with your new password."
  }
}
```

## Frontend Implementation

### 1. Reset Password Component (Request Reset)
**Route:** `/reset-password`
**File:** `frontend/src/app/auth/reset-password/reset-password.component.ts`

**Features:**
- Email input form
- 60-second countdown timer
- Disables submit during cooldown
- Shows countdown: "Wait 60s", "Wait 59s", etc.
- Cleans up interval on component destroy

**Usage:**
1. User enters email address
2. Clicks "Send Reset Link"
3. Receives email with reset link
4. Button disabled for 60 seconds

### 2. Forgot Password Component (Set New Password)
**Route:** `/forgot-password/:token`
**File:** `frontend/src/app/auth/forgot-password/forgot-password.component.ts`

**Features:**
- Gets token from URL params
- Password and confirm password fields
- Password visibility toggles
- Password validation (matches backend requirements)
- Redirects to sign-in after successful reset

**Usage:**
1. User clicks link in email
2. Enters new password (twice)
3. Submits form
4. Redirected to sign-in page

## Email Template
Uses existing template from `backend/config/emailTemplates.js`:
- Template: `PASSWORD_RESET_EMAIL_TEMPLATE`
- Link format: `${FRONTEND_URL}/#/forgot-password/${token}`
- Token valid for 1 hour

## Security Features
1. **Token Expiration**: 1 hour validity
2. **Cooldown Protection**: 60-second wait between requests
3. **Secure Token**: Crypto-random 32-byte hex string
4. **Password Hashing**: bcrypt with 12 salt rounds
5. **Token Cleanup**: Cleared after successful reset
6. **User Enumeration Protection**: Same response whether user exists or not

## Testing Flow
1. Go to `/reset-password`
2. Enter email address
3. Click "Send Reset Link"
4. Check email inbox
5. Click reset link (format: `/#/forgot-password/{token}`)
6. Enter new password (twice)
7. Submit form
8. Login with new password at `/sign-in`

## Environment Variables
```env
FRONTEND_URL=http://localhost:4200
SMTP_USER=94cb9a001@smtp-brevo.com
SMTP_PASS=HyV1tbUPCx5jNm3g
SENDER_EMAIL=info@revivewardrobe.com
```

## Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

## Files Modified
- ✅ `backend/models/userModel.js` - Added password reset fields
- ✅ `backend/services/emailService.js` - Added reset functions
- ✅ `backend/controllers/userController.js` - Added forgotPassword & resetPassword
- ✅ `backend/routes/userRoutes.js` - Added routes
- ✅ `frontend/src/app/auth/reset-password/reset-password.component.ts` - Request reset
- ✅ `frontend/src/app/auth/forgot-password/forgot-password.component.ts` - Set new password
- ✅ `frontend/src/app/app-routing.module.ts` - Updated route format

## Status
✅ **COMPLETE** - All functionality implemented and tested
