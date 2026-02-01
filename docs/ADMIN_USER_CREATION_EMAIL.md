# Admin User Creation with Email Credentials

## Overview
When an admin creates a user account through the admin panel, the system automatically sends the login credentials to the user's email address.

## Features

### 1. Email Template
- Professional welcome email with Vanavihari branding
- Includes login credentials (email and password)
- Shows email verification status
- Direct login link button
- Security notice recommending password change after first login

### 2. Email Content
The email includes:
- **User's Full Name**: Personalized greeting
- **Email Address**: Their login email
- **Password**: The generated/set password (displayed clearly)
- **Verification Status**: Whether email is verified or not
- **Login Link**: Direct link to the login page
- **Security Notice**: Recommendation to change password after first login
- **Contact Information**: Support email and phone number

### 3. Admin Panel Flow
1. Admin fills out the guest registration form
2. Admin sets password (or generates one)
3. Admin selects email verification status (Verified/Not Verified)
4. On successful registration:
   - User account is created in database
   - Email with credentials is sent automatically
   - Admin sees success message confirming email was sent

### 4. Success Messages
- **If email sent successfully**: "User account created successfully! Login credentials have been sent to the user's email."
- **With verification status**: Indicates whether email is verified or pending

## Technical Implementation

### Backend Changes

#### 1. Email Template (`backend/config/emailTemplates.js`)
```javascript
export const PASSWORD_ADMIN_SEND_TEMPLATE = `...`
```
- Professional HTML email template
- Includes all necessary user information
- Responsive design with Vanavihari branding

#### 2. Email Service (`backend/services/emailService.js`)
```javascript
export const sendAdminCreatedAccountEmail = async (user, plainPassword, isEmailVerified)
```
- Sends credentials email to newly created user
- Includes plain text password (before hashing)
- Shows verification status

#### 3. User Controller (`backend/controllers/userController.js`)
- Modified `registerUser` function
- Sends email only for admin-created accounts
- Passes plain password before it's hashed
- Returns `credentialsSent: true` in response

### Frontend Changes

#### Guest Form (`admin/src/components/guests/GuestForm.tsx`)
- Enhanced success message to confirm email was sent
- Shows user's email in confirmation
- Indicates password was sent to their email

## Security Considerations

1. **Password in Email**: While sending passwords via email is generally not recommended, this is acceptable for admin-created accounts where:
   - Admin sets a temporary password
   - User is advised to change it after first login
   - Email verification can be controlled by admin

2. **Email Verification Control**: Admin can choose whether to mark email as verified or require user verification

3. **Secure Password Generation**: Form includes password generator that creates strong passwords

## User Experience

### For Admin:
1. Create user with all details
2. Set or generate password
3. Choose email verification status
4. Submit form
5. Receive confirmation that credentials were emailed

### For User:
1. Receive welcome email with credentials
2. Click login link or manually navigate to login page
3. Use provided email and password to login
4. (Recommended) Change password after first login
5. If email not verified, may need to verify before certain actions

## Environment Variables Required

```env
FRONTEND_URL=http://localhost:4200  # Frontend URL for login link
SMTP_USER=your-email@gmail.com      # Email sender
SENDER_EMAIL=noreply@vanavihari.com # Optional custom sender
```

## Testing

To test the feature:
1. Ensure email configuration is set up in `.env`
2. Create a new user through admin panel
3. Check the user's email inbox
4. Verify email contains correct credentials
5. Test login with provided credentials

## Error Handling

- If email fails to send, user account is still created
- Error is logged but doesn't prevent account creation
- Admin sees success message even if email fails (account creation succeeded)
- Email sending happens asynchronously

## Future Enhancements

1. Add option to resend credentials email
2. Add email delivery status tracking
3. Add option to send password reset link instead of plain password
4. Add email template customization in admin panel
