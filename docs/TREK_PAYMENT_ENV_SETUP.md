# Trek Payment Environment Variable Setup

## Issue
Trek spot bookings were using the wrong callback URL, causing payment failures.

## Root Cause
The `touristSpotPaymentController.js` was using `BILLDESK_RETURN_URL` which points to `/api/payment/callback` (for room bookings), but trek bookings need their own callback URL: `/api/trek-payment/callback`.

## Solution

### 1. Add Environment Variable

Add this to your `.env` file:

```env
# Trek Payment Callback URL
BILLDESK_TREK_RETURN_URL=https://api.vanavihari.com/api/trek-payment/callback
```

For local development:
```env
BILLDESK_TREK_RETURN_URL=http://localhost:5000/api/trek-payment/callback
```

### 2. Controller Changes Made

**File:** `backend/controllers/touristSpotPaymentController.js`

**Change 1 - Return URL (Line ~183):**
```javascript
// BEFORE:
ru: process.env.BILLDESK_RETURN_URL.trim(),

// AFTER:
ru: process.env.BILLDESK_TREK_RETURN_URL || process.env.BILLDESK_RETURN_URL.trim(),
```

**Change 2 - Booking Type (Line ~289):**
```javascript
// BEFORE:
startTransactionPolling(bookingId, bdorderid, merchantId, authToken);
console.log(`🔄 Started transaction polling for booking: ${bookingId}`);

// AFTER:
startTransactionPolling(bookingId, bdorderid, merchantId, authToken, 'trek');
console.log(`🔄 Started transaction polling for trek booking: ${bookingId}`);
```

## Callback URL Mapping

| Booking Type | Callback URL | Controller |
|--------------|--------------|------------|
| Room | `/api/payment/callback` | `paymentController.js` |
| Tent | `/api/tent-payment/callback` | `tentPaymentController.js` |
| Trek | `/api/trek-payment/callback` | `touristSpotPaymentController.js` |

## Environment Variables Summary

```env
# Room bookings
BILLDESK_RETURN_URL=https://api.vanavihari.com/api/payment/callback

# Tent bookings
BILLDESK_TENT_RETURN_URL=https://api.vanavihari.com/api/tent-payment/callback

# Trek bookings (NEW)
BILLDESK_TREK_RETURN_URL=https://api.vanavihari.com/api/trek-payment/callback
```

## Testing

After adding the environment variable:

1. Restart the backend server
2. Create a new trek booking
3. Proceed to payment
4. Complete payment on BillDesk
5. Verify callback is received at `/api/trek-payment/callback`
6. Check booking status is updated to "reserved"
7. Check payment status is updated to "paid"

## Logs to Verify

Look for these in the logs:

```
✅ CORRECT:
ru: https://api.vanavihari.com/api/trek-payment/callback
Booking Type: trek
🔄 Started transaction polling for trek booking: TS-260209-001

❌ WRONG (before fix):
ru: https://api.vanavihari.com/api/payment/callback
Booking Type: room
🔄 Started transaction polling for room booking: TS-260209-001
```

## Deployment Checklist

- [ ] Add `BILLDESK_TREK_RETURN_URL` to production `.env`
- [ ] Add `BILLDESK_TREK_RETURN_URL` to staging `.env`
- [ ] Restart backend servers
- [ ] Test trek booking end-to-end
- [ ] Verify callback is received correctly
- [ ] Verify booking status updates

## Troubleshooting

### Issue: Still getting 404 on callback
**Solution:** Make sure the environment variable is set and the server is restarted.

### Issue: Callback goes to wrong URL
**Solution:** Check that `BILLDESK_TREK_RETURN_URL` is set correctly in `.env` file.

### Issue: Booking type shows as "room"
**Solution:** Make sure the 5th parameter `'trek'` is passed to `startTransactionPolling()`.

## Status
✅ **FIXED** - Controller updated to use trek-specific callback URL
⏳ **PENDING** - Environment variable needs to be added to `.env` file
