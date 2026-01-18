# SMS Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Add Environment Variables
Open `backend/.env` and add:

```env
SMS_API_URL=https://rslri.connectbind.com:8443/bulksms/bulksms
SMS_USERNAME=DG35-vanavihari
SMS_PASSWORD=digimile
SMS_ENTITY_ID=1101485850000078016
SMS_TMID=1101485850000078016,1602100000000009244
```

**Note:** Template IDs are now in the code:
- VANAVIHARI: `1107176807116645251`
- JUNGLE STAR: `1107176807164037326`

### Step 2: Restart Your Server
```bash
# Stop your backend server (Ctrl+C)
# Then restart it
npm start
```

### Step 3: Test with a Real Booking
Make a test booking and check the console logs for:
```
📱 Preparing room reservation SMS for booking: VANA1234
📱 Sending SMS to: 919384318546
📱 Resort: vanavihari
📱 Source: VANVHR, Template ID: 1107176807116645251
✅ Room reservation SMS sent successfully to 919384318546
```

## ✅ What's Already Done

- ✅ SMS service created
- ✅ Templates configured for Vanavihari & Jungle Star
- ✅ Integrated into room reservation flow (2 places)
- ✅ Integrated into tent reservation flow (1 place)
- ✅ Phone number auto-formatting
- ✅ Error handling (SMS failures won't break bookings)
- ✅ Async execution (non-blocking)

## 📱 SMS Flow

```
Payment Success
    ↓
Email Sent (existing)
    ↓
SMS Sent (new) ← You are here!
    ↓
User receives confirmation SMS
```

## 🔍 Verify It's Working

1. **Check logs** - Look for `📱` emoji in console
2. **Check phone** - Customer should receive SMS
3. **Check SMS provider dashboard** - Verify delivery status

## 🛠️ Customization

### Change SMS Template
Edit `backend/config/smsTemplates.js`:
```javascript
VANAVIHARI: {
  source: 'VANVHR',
  tempid: '1107176807116645251',
  getMessage: (data) => `Your custom message here...`
}
```

### Add New Resort
In `backend/config/smsTemplates.js`, add:
```javascript
NEWRESORT: {
  source: 'NEWSRC',
  tempid: 'NEW_TEMPLATE_ID',
  getMessage: (data) => `Your message...`
}
```

Then update `backend/services/reservationSmsService.js` to handle the new slug.

## 📞 Support

If SMS is not sending:
1. Check environment variables are set
2. Verify SMS credentials with provider
3. Check console logs for error messages
4. Verify phone number format (10 digits)
5. Check SMS provider balance/credits

## 📚 Full Documentation

See `docs/SMS_INTEGRATION.md` for complete details.
