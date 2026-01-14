# Email Verification Flow Diagrams

## 1. Registration & Verification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

    USER                    FRONTEND                 BACKEND              EMAIL
     │                         │                        │                  │
     │  Fill Registration      │                        │                  │
     │  Form                   │                        │                  │
     ├────────────────────────>│                        │                  │
     │                         │                        │                  │
     │  Click Submit           │  POST /api/user/       │                  │
     ├────────────────────────>│  register              │                  │
     │                         ├───────────────────────>│                  │
     │                         │                        │                  │
     │                         │                        │  Create User     │
     │                         │                        │  isEmailVerified │
     │                         │                        │  = false         │
     │                         │                        │                  │
     │                         │                        │  Generate Token  │
     │                         │                        │  (32 bytes)      │
     │                         │                        │                  │
     │                         │                        │  Send Email      │
     │                         │                        ├─────────────────>│
     │                         │                        │                  │
     │                         │  Response:             │                  │
     │                         │  requiresVerification  │                  │
     │                         │  = true                │                  │
     │                         │<───────────────────────┤                  │
     │                         │                        │                  │
     │  Redirect to Success    │                        │                  │
     │  Message Page           │                        │                  │
     │<────────────────────────┤                        │                  │
     │                         │                        │                  │
     │  "Check your email"     │                        │                  │
     │<────────────────────────┤                        │                  │
     │                         │                        │                  │
     │                         │                        │  Verification    │
     │  Receive Email          │                        │  Email Delivered │
     │<────────────────────────┼────────────────────────┼──────────────────┤
     │                         │                        │                  │
     │  Click Verify Link      │                        │                  │
     │  (with token)           │                        │                  │
     ├────────────────────────>│                        │                  │
     │                         │                        │                  │
     │                         │  GET /api/user/        │                  │
     │                         │  verify-email/:token   │                  │
     │                         ├───────────────────────>│                  │
     │                         │                        │                  │
     │                         │                        │  Validate Token  │
     │                         │                        │  Check Expiry    │
     │                         │                        │                  │
     │                         │                        │  Update User:    │
     │                         │                        │  isEmailVerified │
     │                         │                        │  = true          │
     │                         │                        │                  │
     │                         │                        │  Delete Token    │
     │                         │                        │                  │
     │                         │                        │  Send Welcome    │
     │                         │                        │  Email           │
     │                         │                        ├─────────────────>│
     │                         │                        │                  │
     │                         │  Response:             │                  │
     │                         │  status = success      │                  │
     │                         │  + JWT token           │                  │
     │                         │<───────────────────────┤                  │
     │                         │                        │                  │
     │  Show Success           │                        │                  │
     │  "Email Verified!"      │                        │                  │
     │<────────────────────────┤                        │                  │
     │                         │                        │                  │
     │  Auto-redirect to       │                        │                  │
     │  Home (3 seconds)       │                        │                  │
     │<────────────────────────┤                        │                  │
     │                         │                        │                  │
```

## 2. Login Flow (Unverified Email)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LOGIN WITH UNVERIFIED EMAIL                       │
└─────────────────────────────────────────────────────────────────────┘

    USER                    FRONTEND                 BACKEND
     │                         │                        │
     │  Enter Credentials      │                        │
     ├────────────────────────>│                        │
     │                         │                        │
     │  Click Login            │  POST /api/user/login  │
     ├────────────────────────>├───────────────────────>│
     │                         │                        │
     │                         │                        │  Find User
     │                         │                        │
     │                         │                        │  Verify Password
     │                         │                        │  ✓ Valid
     │                         │                        │
     │                         │                        │  Check Email
     │                         │                        │  Verification
     │                         │                        │  ✗ Not Verified
     │                         │                        │
     │                         │  Error Response:       │
     │                         │  emailNotVerified:true │
     │                         │  msg: "Please verify   │
     │                         │  your email..."        │
     │                         │<───────────────────────┤
     │                         │                        │
     │  Show Error Message     │                        │
     │<────────────────────────┤                        │
     │                         │                        │
     │  Redirect to Resend     │                        │
     │  Verification Page      │                        │
     │  (after 2 seconds)      │                        │
     │<────────────────────────┤                        │
     │                         │                        │
```

## 3. Resend Verification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RESEND VERIFICATION EMAIL                       │
└─────────────────────────────────────────────────────────────────────┘

    USER                    FRONTEND                 BACKEND              EMAIL
     │                         │                        │                  │
     │  Navigate to Resend     │                        │                  │
     │  Verification Page      │                        │                  │
     ├────────────────────────>│                        │                  │
     │                         │                        │                  │
     │  Enter Email Address    │                        │                  │
     ├────────────────────────>│                        │                  │
     │                         │                        │                  │
     │  Click Submit           │  POST /api/user/       │                  │
     ├────────────────────────>│  resend-verification   │                  │
     │                         ├───────────────────────>│                  │
     │                         │                        │                  │
     │                         │                        │  Find User       │
     │                         │                        │                  │
     │                         │                        │  Check if        │
     │                         │                        │  Already Verified│
     │                         │                        │  ✗ Not Verified  │
     │                         │                        │                  │
     │                         │                        │  Generate New    │
     │                         │                        │  Token           │
     │                         │                        │                  │
     │                         │                        │  Update Expiry   │
     │                         │                        │  (24 hours)      │
     │                         │                        │                  │
     │                         │                        │  Send Email      │
     │                         │                        ├─────────────────>│
     │                         │                        │                  │
     │                         │  Response:             │                  │
     │                         │  status = success      │                  │
     │                         │<───────────────────────┤                  │
     │                         │                        │                  │
     │  Show Success Message   │                        │                  │
     │<────────────────────────┤                        │                  │
     │                         │                        │                  │
     │  Redirect to Success    │                        │                  │
     │  Message Page           │                        │                  │
     │<────────────────────────┤                        │                  │
     │                         │                        │                  │
```

## 4. Admin Registration Flow (Bypass Verification)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ADMIN REGISTRATION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

    ADMIN                   ADMIN PANEL              BACKEND
     │                         │                        │
     │  Fill User Form         │                        │
     ├────────────────────────>│                        │
     │                         │                        │
     │  Click Create User      │  POST /api/user/       │
     ├────────────────────────>│  register              │
     │                         │  registerThrough:      │
     │                         │  "admin"               │
     │                         ├───────────────────────>│
     │                         │                        │
     │                         │                        │  Create User
     │                         │                        │  isEmailVerified
     │                         │                        │  = true
     │                         │                        │
     │                         │                        │  ✗ No Email Sent
     │                         │                        │
     │                         │  Response:             │
     │                         │  status = success      │
     │                         │  + JWT token           │
     │                         │<───────────────────────┤
     │                         │                        │
     │  User Created           │                        │
     │  (Can Login Immediately)│                        │
     │<────────────────────────┤                        │
     │                         │                        │
```

## 5. Token Expiration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TOKEN EXPIRATION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

    USER                    FRONTEND                 BACKEND
     │                         │                        │
     │  Click Expired          │                        │
     │  Verification Link      │                        │
     │  (> 24 hours old)       │                        │
     ├────────────────────────>│                        │
     │                         │                        │
     │                         │  GET /api/user/        │
     │                         │  verify-email/:token   │
     │                         ├───────────────────────>│
     │                         │                        │
     │                         │                        │  Find User
     │                         │                        │  with Token
     │                         │                        │
     │                         │                        │  Check Expiry
     │                         │                        │  ✗ Expired
     │                         │                        │
     │                         │  Error Response:       │
     │                         │  "Invalid or expired   │
     │                         │  verification token"   │
     │                         │<───────────────────────┤
     │                         │                        │
     │  Show Error Message     │                        │
     │<────────────────────────┤                        │
     │                         │                        │
     │  Show "Resend           │                        │
     │  Verification" Button   │                        │
     │<────────────────────────┤                        │
     │                         │                        │
     │  Click Resend Button    │                        │
     ├────────────────────────>│                        │
     │                         │                        │
     │  Redirect to Resend     │                        │
     │  Verification Page      │                        │
     │<────────────────────────┤                        │
     │                         │                        │
```

## 6. Database State Transitions

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE STATE CHANGES                          │
└─────────────────────────────────────────────────────────────────────┘

    REGISTRATION                VERIFICATION              POST-VERIFICATION
         │                           │                           │
         ▼                           ▼                           ▼
    ┌─────────┐                 ┌─────────┐               ┌─────────┐
    │  User   │                 │  User   │               │  User   │
    │ Created │                 │ Verified│               │ Active  │
    └─────────┘                 └─────────┘               └─────────┘
         │                           │                           │
         │                           │                           │
    isEmailVerified:           isEmailVerified:          isEmailVerified:
    false                      true                      true
         │                           │                           │
    emailVerificationToken:    emailVerificationToken:   emailVerificationToken:
    "abc123..."                undefined                 undefined
         │                           │                           │
    emailVerificationExpires:  emailVerificationExpires: emailVerificationExpires:
    Date(+24h)                 undefined                 undefined
         │                           │                           │
         │                           │                           │
    ❌ Cannot Login            ✅ Can Login              ✅ Can Login
         │                           │                           │
```

## 7. Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ERROR SCENARIOS                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  Invalid Token       │──> Show Error + Resend Button
└──────────────────────┘

┌──────────────────────┐
│  Expired Token       │──> Show Error + Resend Button
└──────────────────────┘

┌──────────────────────┐
│  Already Verified    │──> Show "Already Verified" + Login Button
└──────────────────────┘

┌──────────────────────┐
│  Email Not Found     │──> Show "No Account Found"
└──────────────────────┘

┌──────────────────────┐
│  Email Send Failed   │──> Continue Registration + Log Error
└──────────────────────┘

┌──────────────────────┐
│  Login Unverified    │──> Show Error + Redirect to Resend
└──────────────────────┘
```

## 8. Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EMAIL VERIFICATION SYSTEM                             │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │   Frontend   │         │   Backend    │         │   Database   │
    │              │         │              │         │              │
    │ - Sign Up    │◄───────►│ - Register   │◄───────►│ - Users      │
    │ - Sign In    │         │ - Login      │         │   Collection │
    │ - Verify     │         │ - Verify     │         │              │
    │ - Resend     │         │ - Resend     │         └──────────────┘
    └──────────────┘         └──────────────┘                │
           │                        │                         │
           │                        │                         │
           │                        ▼                         │
           │                 ┌──────────────┐                │
           │                 │ Email Service│                │
           │                 │              │                │
           │                 │ - Generate   │                │
           │                 │   Token      │                │
           │                 │ - Send Email │                │
           │                 │ - Templates  │                │
           │                 └──────────────┘                │
           │                        │                         │
           │                        ▼                         │
           │                 ┌──────────────┐                │
           │                 │ SMTP Server  │                │
           │                 │ (Brevo)      │                │
           │                 └──────────────┘                │
           │                        │                         │
           │                        ▼                         │
           │                 ┌──────────────┐                │
           │                 │ User's Email │                │
           │                 │ Inbox        │                │
           │                 └──────────────┘                │
           │                        │                         │
           └────────────────────────┴─────────────────────────┘
                            User Clicks Link
```

## Legend

```
│  Vertical Flow
├─ Branch Point
└─ End Point
─> Direction of Flow
<─ Response/Callback
✓  Success
✗  Failure/Error
```

## Notes

1. **Token Generation**: Uses crypto.randomBytes(32) for secure tokens
2. **Token Expiration**: 24 hours from creation
3. **Single Use**: Tokens deleted after successful verification
4. **Admin Bypass**: Users with registerThrough='admin' skip verification
5. **Email Failure**: System continues even if email sending fails
6. **Welcome Email**: Sent after successful verification (non-critical)
