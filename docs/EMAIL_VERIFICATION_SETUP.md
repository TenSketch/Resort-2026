# Email Verification Setup Guide

## Quick Start

This guide will help you set up and test the email verification system.

## Prerequisites

1. Node.js and npm installed
2. MongoDB running
3. SMTP credentials (using Brevo/Sendinblue)
4. Backend and frontend projects set up

## Step 1: Backend Setup

### 1.1 Install Dependencies (if not already installed)
```bash
cd backend
npm install nodemailer crypto
```

### 1.2 Update Environment Variables
Add to `backend/.env`:
```env
# Email Configuration
SMTP_USER=your-brevo-smtp-user
SMTP_PASS=your-brevo-smtp-password

# Frontend URL for email links
FRONTEND_URL=http://localhost:4200

# JWT Secret (if not already set)
JWT_SECRET=your-secret-key-here
```

### 1.3 Verify Files Created
Ensure these files exist:
- ✅ `backend/services/emailService.js`
- ✅ `backend/models/userModel.js` (updated)
- ✅ `backend/controllers/userController.js` (updated)
- ✅ `backend/routes/userRoutes.js` (updated)

### 1.4 Restart Backend Server
```bash
cd backend
npm start
```

## Step 2: Frontend Setup

### 2.1 Add New Components to Module

Edit your `app.module.ts` or relevant routing module:

```typescript
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { ResendVerificationComponent } from './auth/resend-verification/resend-verification.component';

@NgModule({
  declarations: [
    // ... existing components
    VerifyEmailComponent,
    ResendVerificationComponent
  ],
  // ... rest of module
})
```

### 2.2 Add Routes

Edit your routing module (e.g., `app-routing.module.ts`):

```typescript
const routes: Routes = [
  // ... existing routes
  {
    path: 'verify-email',
    component: VerifyEmailComponent
  },
  {
    path: 'resend-verification',
    component: ResendVerificationComponent
  },
  // ... other routes
];
```

### 2.3 Verify Files Created
Ensure these files exist:
- ✅ `frontend/src/app/auth/verify-email/verify-email.component.ts`
- ✅ `frontend/src/app/auth/verify-email/verify-email.component.html`
- ✅ `frontend/src/app/auth/verify-email/verify-email.component.scss`
- ✅ `frontend/src/app/auth/resend-verification/resend-verification.component.ts`
- ✅ `frontend/src/app/auth/resend-verification/resend-verification.component.html`
- ✅ `frontend/src/app/auth/resend-verification/resend-verification.component.scss`
- ✅ `frontend/src/app/auth/sign-up/sign-up.component.ts` (updated)
- ✅ `frontend/src/app/auth/sign-in/sign-in.component.ts` (updated)

### 2.4 Restart Frontend Server
```bash
cd frontend
npm start
```

## Step 3: Testing

### 3.1 Test Registration Flow

1. **Navigate to Sign Up:**
   - Go to `http://localhost:4200/sign-up`

2. **Fill Registration Form:**
   - Full Name: Test User
   - Email: your-real-email@example.com (use a real email you can access)
   - Mobile: 9876543210
   - Password: Test@123
   - Accept terms and conditions

3. **Submit Form:**
   - Should see success message
   - Should redirect to `/show-success-message?id=your-email@example.com`
   - Message should say "Please check your email to verify your account"

4. **Check Email:**
   - Open your email inbox
   - Look for email from Vanavihari
   - Subject: "Verify Your Email - Vanavihari"
   - Click the "VERIFY" button

5. **Verify Email:**
   - Should redirect to `/verify-email?token=...`
   - Should see "Verifying your email..." loading state
   - Should see "Email Verified Successfully!" message
   - Should auto-redirect to home page after 3 seconds

### 3.2 Test Login Before Verification

1. **Register a New User** (don't verify email)

2. **Try to Login:**
   - Go to `http://localhost:4200/sign-in`
   - Enter email and password
   - Click login

3. **Expected Result:**
   - Should see error: "Please verify your email before logging in"
   - Should redirect to `/resend-verification` after 2 seconds

### 3.3 Test Resend Verification

1. **Navigate to Resend Page:**
   - Go to `http://localhost:4200/resend-verification`

2. **Enter Email:**
   - Enter the unverified email address
   - Click "Resend Verification Email"

3. **Expected Result:**
   - Should see success message
   - Should redirect to success message page
   - Should receive new verification email

4. **Check Email:**
   - New verification email should arrive
   - Click verify button
   - Should successfully verify

### 3.4 Test Admin Registration (Bypass Verification)

1. **Use Admin Panel or API:**
   ```bash
   curl -X POST http://localhost:5000/api/user/register \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "Admin User",
       "email_id": "admin@example.com",
       "mobile_number": "9876543211",
       "password": "Admin@123",
       "registerThrough": "admin"
     }'
   ```

2. **Expected Result:**
   - User created with `isEmailVerified: true`
   - No verification email sent
   - Can login immediately

## Step 4: Verify Database

### 4.1 Check User Document

Connect to MongoDB and check a user document:

```javascript
db.users.findOne({ email: "your-email@example.com" })
```

**Before Verification:**
```json
{
  "isEmailVerified": false,
  "emailVerificationToken": "a1b2c3d4e5f6...",
  "emailVerificationExpires": ISODate("2024-12-07T10:30:00.000Z")
}
```

**After Verification:**
```json
{
  "isEmailVerified": true,
  "emailVerificationToken": null,
  "emailVerificationExpires": null
}
```

## Step 5: Production Deployment

### 5.1 Update Environment Variables

**Backend `.env`:**
```env
FRONTEND_URL=https://your-production-domain.com
SMTP_USER=your-production-smtp-user
SMTP_PASS=your-production-smtp-password
JWT_SECRET=your-strong-production-secret
```

### 5.2 Test Email Delivery

1. Register with a real email
2. Verify email is received
3. Check spam folder if not in inbox
4. Verify links work correctly

### 5.3 Monitor Logs

Check backend logs for:
- Email sending success/failure
- Verification attempts
- Token expiration issues

## Troubleshooting

### Issue: Email Not Received

**Solutions:**
1. Check SMTP credentials in `.env`
2. Check spam/junk folder
3. Verify Brevo account is active
4. Check backend logs for email errors:
   ```bash
   # Look for these logs:
   Verification email sent to user@example.com
   # or
   Error sending verification email: ...
   ```

### Issue: Token Expired

**Solutions:**
1. Use "Resend Verification Email" feature
2. Tokens expire after 24 hours
3. New token will be generated

### Issue: Verification Link Not Working

**Solutions:**
1. Check `FRONTEND_URL` in backend `.env`
2. Ensure frontend route is configured
3. Check browser console for errors
4. Verify token in URL is complete

### Issue: Already Verified Error

**Solution:**
- User can proceed to login
- No action needed

### Issue: Components Not Found

**Solutions:**
1. Ensure components are declared in module
2. Check import paths
3. Restart Angular dev server
4. Clear browser cache

## Security Notes

1. **Tokens are single-use** - Deleted after verification
2. **Tokens expire** - 24-hour validity
3. **Secure generation** - Cryptographically random
4. **No sensitive data in emails** - Only verification link
5. **HTTPS in production** - Always use HTTPS for email links

## Monitoring

### Key Metrics to Track

1. **Registration Rate:**
   - Total registrations
   - Verified vs unverified users

2. **Verification Rate:**
   - % of users who verify email
   - Time to verification

3. **Email Delivery:**
   - Successful sends
   - Failed sends
   - Bounce rate

4. **Resend Requests:**
   - Number of resend requests
   - Reasons for resend

### Database Queries

**Count unverified users:**
```javascript
db.users.countDocuments({ isEmailVerified: false, registerThrough: 'frontend' })
```

**Find expired tokens:**
```javascript
db.users.find({
  isEmailVerified: false,
  emailVerificationExpires: { $lt: new Date() }
})
```

**Verification rate:**
```javascript
db.users.aggregate([
  { $match: { registerThrough: 'frontend' } },
  { $group: {
    _id: null,
    total: { $sum: 1 },
    verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
  }},
  { $project: {
    verificationRate: { $multiply: [{ $divide: ['$verified', '$total'] }, 100] }
  }}
])
```

## Support

For issues or questions:
1. Check documentation in `docs/` folder
2. Review API reference
3. Check backend logs
4. Test with Postman/cURL
5. Verify environment variables

## Next Steps

After successful setup:
1. ✅ Test all flows thoroughly
2. ✅ Update email templates with your branding
3. ✅ Set up monitoring and alerts
4. ✅ Configure production SMTP
5. ✅ Test in production environment
6. ✅ Train support team on verification process
