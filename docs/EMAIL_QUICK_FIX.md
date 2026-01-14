# 🚀 Email Not Received? Quick Fix Guide

## ✅ Your SMTP is Working!

Test email was sent successfully. If you're not receiving emails, follow these steps:

## Step 1: Check Spam Folder (90% of cases)
**Most verification emails go to spam!**

1. Open your email client
2. Go to **Spam** or **Junk** folder
3. Search for "Vanavihari" or "Verify Your Email"
4. If found, mark as "Not Spam"

## Step 2: Wait 5 Minutes
- Email delivery can take 1-5 minutes
- Brevo processes emails in queue
- Be patient!

## Step 3: Check Brevo Dashboard
1. Login: https://app.brevo.com
2. Go to **Statistics** → **Email**
3. Check recent sends
4. Look for delivery status

## Step 4: Verify Sender Email in Brevo

**Important:** `info@revivewardrobe.com` must be verified in Brevo!

### To Verify:
1. Login to https://app.brevo.com
2. Go to **Senders & IP** → **Senders**
3. Click **Add a Sender**
4. Add: `info@revivewardrobe.com`
5. Verify via email confirmation

### Temporary Fix (If Not Verified):
Update `backend/.env`:
```env
SENDER_EMAIL=94cb9a001@smtp-brevo.com
```
Then restart backend server.

## Step 5: Test with Your Admin Email

Register using: `official.codewithbalaji@gmail.com`

This is your admin email, so you'll definitely receive it!

## Step 6: Check Backend Logs

When you register, watch the backend console:

**Success:**
```
Attempting to send verification email to user@example.com...
✅ Verification email sent successfully to user@example.com
Message ID: <...>
```

**Error:**
```
❌ Error sending verification email: [error message]
```

## Quick Test

Run this command to send a test email:
```bash
cd backend
node test-email.js
```

Check `official.codewithbalaji@gmail.com` inbox (and spam).

## Common Solutions

### Solution 1: Restart Backend
```bash
cd backend
npm start
```

### Solution 2: Clear Email Queue
Sometimes emails get stuck. Wait 10 minutes and try again.

### Solution 3: Use Different Email
Try registering with:
- Gmail
- Outlook
- Yahoo

Different providers have different spam filters.

## Verification Link Format

Should look like:
```
http://localhost:4200/#/verify-email?token=abc123...
```

Note the `#` for Angular routing!

## Still Not Working?

### Check These:
1. ✅ SMTP credentials correct in `.env`
2. ✅ Sender email verified in Brevo
3. ✅ Backend server running
4. ✅ No errors in backend console
5. ✅ Brevo account active (not suspended)
6. ✅ Daily limit not exceeded (300 emails/day)

### Get Help:
- Check: [EMAIL_TROUBLESHOOTING.md](EMAIL_TROUBLESHOOTING.md)
- Brevo Support: support@brevo.com
- Brevo Status: https://status.brevo.com

## Success Checklist

- [ ] Checked spam folder
- [ ] Waited 5 minutes
- [ ] Verified sender email in Brevo
- [ ] Tested with admin email
- [ ] Checked backend logs
- [ ] Checked Brevo dashboard
- [ ] Restarted backend server

## 99% Solution

**Check your spam folder!** 

Most verification emails are there. 📧
