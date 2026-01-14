# Email Verification Troubleshooting Guide

## ✅ SMTP Configuration Verified

Your Brevo SMTP is working correctly! Test email was sent successfully.

## Why You Might Not Receive Emails

### 1. Check Spam/Junk Folder
**Most Common Issue!**
- Verification emails often go to spam
- Check your spam/junk folder
- Mark as "Not Spam" if found there

### 2. Email Delivery Delay
- Brevo may take 1-5 minutes to deliver
- Wait a few minutes before trying again
- Check backend logs for confirmation

### 3. Sender Email Verification (Brevo)
Your sender email `info@revivewardrobe.com` must be verified in Brevo:

**To verify in Brevo:**
1. Login to https://app.brevo.com
2. Go to **Senders & IP** → **Senders**
3. Check if `info@revivewardrobe.com` is verified
4. If not, add and verify it

### 4. Check Backend Logs
When you register, check the backend console for:
```
Attempting to send verification email to user@example.com...
✅ Verification email sent successfully to user@example.com
Message ID: <...>
```

If you see errors, they will appear here.

## Testing Email Delivery

### Test 1: Run Email Test Script
```bash
cd backend
node test-email.js
```

This sends a test email to `official.codewithbalaji@gmail.com`

### Test 2: Register with Your Email
1. Go to `http://localhost:4200/#/sign-up`
2. Register with your email: `official.codewithbalaji@gmail.com`
3. Check backend console for logs
4. Check your email (including spam)

### Test 3: Check Brevo Dashboard
1. Login to https://app.brevo.com
2. Go to **Statistics** → **Email**
3. Check recent email sends
4. Look for delivery status

## Common Issues & Solutions

### Issue: "Authentication Failed"
**Solution:**
- Verify `SMTP_USER` in `.env` is correct: `94cb9a001@smtp-brevo.com`
- Verify `SMTP_PASS` is correct
- Check Brevo account is active

### Issue: "Sender Email Not Verified"
**Solution:**
1. Login to Brevo
2. Verify `info@revivewardrobe.com` as a sender
3. Or change `SENDER_EMAIL` in `.env` to a verified email

### Issue: Email Goes to Spam
**Solution:**
- This is normal for new senders
- Mark as "Not Spam" in your email client
- Over time, reputation will improve
- Consider adding SPF/DKIM records (advanced)

### Issue: No Email Received at All
**Checklist:**
- [ ] Check spam/junk folder
- [ ] Wait 5 minutes
- [ ] Check backend logs for errors
- [ ] Verify sender email in Brevo
- [ ] Check Brevo dashboard for delivery status
- [ ] Try with a different email address

## Backend Console Logs

### Successful Email Send:
```
Attempting to send verification email to user@example.com...
✅ Verification email sent successfully to user@example.com
Message ID: <abc123@revivewardrobe.com>
```

### Failed Email Send:
```
❌ Error sending verification email: [error message]
Full error: [detailed error]
```

## Verification Link Format

The verification link should look like:
```
http://localhost:4200/#/verify-email?token=abc123def456...
```

**Note:** The `#` is important for Angular hash routing!

## Testing Different Email Providers

Try registering with different email providers:
- ✅ Gmail (official.codewithbalaji@gmail.com)
- ✅ Outlook/Hotmail
- ✅ Yahoo
- ✅ Custom domain emails

Some providers have stricter spam filters than others.

## Brevo Account Limits

### Free Plan Limits:
- 300 emails per day
- 9,000 emails per month

Check your usage:
1. Login to Brevo
2. Go to **Account** → **Plan**
3. Check remaining quota

## Advanced Troubleshooting

### Enable Debug Mode
Already enabled in `test-email.js`:
```javascript
debug: true,
logger: true
```

### Check Email Headers
If you receive the email:
1. Open the email
2. View email headers/source
3. Check for:
   - SPF: PASS
   - DKIM: PASS
   - Spam score

### Verify DNS Records (Production)
For production, add these DNS records:
- SPF record
- DKIM record
- DMARC record

Contact Brevo support for specific values.

## Quick Fixes

### Fix 1: Use Different Sender Email
If `info@revivewardrobe.com` isn't verified, temporarily use:
```env
SENDER_EMAIL = '94cb9a001@smtp-brevo.com'
```

### Fix 2: Test with Admin Email
Register using: `official.codewithbalaji@gmail.com`
This is your admin email, so you can definitely receive it.

### Fix 3: Check Brevo Status
Visit: https://status.brevo.com
Ensure Brevo services are operational.

## Contact Support

### Brevo Support:
- Email: support@brevo.com
- Help Center: https://help.brevo.com
- Live Chat: Available in dashboard

### Check These:
1. Is your Brevo account active?
2. Is `info@revivewardrobe.com` verified?
3. Have you exceeded daily limits?
4. Are there any account restrictions?

## Success Indicators

You'll know it's working when:
- ✅ Backend logs show "Email sent successfully"
- ✅ Brevo dashboard shows email delivered
- ✅ Email appears in inbox (or spam)
- ✅ Verification link works when clicked

## Next Steps

1. **Check your spam folder** (most likely location)
2. **Wait 5 minutes** for delivery
3. **Check Brevo dashboard** for delivery status
4. **Try with your admin email** for testing
5. **Verify sender email** in Brevo if needed

## Test Results

Based on our test:
- ✅ SMTP connection: **Working**
- ✅ Authentication: **Successful**
- ✅ Email sending: **Successful**
- ✅ Message queued: **Confirmed**

**The email system is working correctly!**

Check your spam folder at: `official.codewithbalaji@gmail.com`
