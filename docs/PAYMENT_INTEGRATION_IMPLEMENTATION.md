# Payment Integration Implementation Summary

## Overview
Implemented BillDesk PG V2 payment gateway integration with pre-reservation flow.

## Implementation Status: ✅ COMPLETE

---

## What Was Implemented

### 1. Database Models

#### PaymentTransaction Model (`backend/models/paymentTransactionModel.js`)
- Tracks all payment attempts
- Stores encrypted requests and decrypted responses
- Links to reservation via bookingId
- Status tracking: initiated, success, failed, pending, cancelled

#### Reservation Model Updates (`backend/models/reservationModel.js`)
- Added `status` enum: pre-reserved, reserved, cancelled, completed
- Added `paymentStatus` enum: unpaid, paid, failed, pending, refunded
- Added `expiresAt` field for 15-minute pre-reservation expiry
- Added `paymentTransactionId` reference

---

### 2. Backend Controllers

#### Reservation Controller (`backend/controllers/reservationController.js`)
**Updated `createPublicBooking`:**
- Creates reservation with `status: 'pre-reserved'`
- Sets `paymentStatus: 'unpaid'`
- Sets `expiresAt` to 15 minutes from creation
- Auto-generates unique bookingId

#### Payment Controller (`backend/controllers/paymentController.js`)
**New Functions:**

1. **`initiatePayment`** - Creates BillDesk order
   - Validates reservation exists and is pre-reserved
   - Checks expiry
   - Encrypts and signs order data
   - Creates PaymentTransaction record
   - Returns payment form data for frontend

2. **`handlePaymentCallback`** - Processes BillDesk response
   - Verifies signature
   - Decrypts response
   - Updates reservation status based on auth_status:
     - `0300` → Success → status: reserved, paymentStatus: paid
     - `0399` → Failed → status: cancelled, paymentStatus: failed
     - `0002` → Pending → paymentStatus: pending
     - `0398` → User cancelled → status: cancelled
   - Redirects user to appropriate page
   - Email notification placeholder added

---

### 3. Backend Routes

#### Payment Routes (`backend/routes/paymentRoutes.js`)
- `POST /api/payment/initiate` - Initiate payment (requires auth)
- `POST /api/payment/callback` - Handle BillDesk callback (no auth)
- `GET /api/payment/callback` - Handle BillDesk callback via GET

---

### 4. Crypto Services

#### BillDesk Crypto (`backend/services/billdeskCrypto.js`)
**Added Functions:**
- `verifySignature()` - Verify JWS signature only
- `decryptResponse()` - Decrypt and parse BillDesk response

---

### 5. Frontend Updates

#### Booking Summary Component (`frontend/src/app/modules/booking-summary/booking-summary.component.ts`)

**Updated `submitBooking()`:**
- Creates pre-reservation (not final reservation)
- Calls `initiatePayment()` on success

**New `initiatePayment()`:**
- Calls `/api/payment/initiate` with bookingId
- Receives encrypted payment data
- Calls `submitPaymentForm()`

**New `submitPaymentForm()`:**
- Creates HTML form dynamically
- Auto-submits to BillDesk hosted page
- User leaves site for payment

---

## Payment Flow

### Step 1: User Clicks "Confirm and Pay"
```
Frontend → POST /api/reservations/book
Backend creates:
- status: 'pre-reserved'
- paymentStatus: 'unpaid'
- expiresAt: now + 15 mins
- bookingId: auto-generated
```

### Step 2: Initiate Payment
```
Frontend → POST /api/payment/initiate { bookingId }
Backend:
1. Validates reservation
2. Creates BillDesk order (encrypted + signed)
3. Creates PaymentTransaction record
4. Returns: bdorderid, merchantid, rdata, formAction
```

### Step 3: Redirect to BillDesk
```
Frontend auto-submits form to BillDesk
User completes payment on BillDesk hosted page
```

### Step 4: Payment Callback
```
BillDesk → POST /api/payment/callback { msg: encrypted_response }
Backend:
1. Verifies signature
2. Decrypts response
3. Updates reservation based on auth_status
4. Redirects user to success/failed/pending page
```

---

## BillDesk Response Codes

| auth_status | Meaning | Reservation Status | Payment Status | Redirect |
|-------------|---------|-------------------|----------------|----------|
| 0300 | Success | reserved | paid | /booking-successfull |
| 0399 | Failed | cancelled | failed | /booking-failed |
| 0002 | Pending | pre-reserved | pending | /booking-pending |
| 0398 | User Cancelled | cancelled | cancelled | /booking-failed |

---

## Environment Variables Required

Add to `backend/.env`:
```env
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:4200

# BillDesk Configuration
BILLDESK_MERCID=your_merchant_id
BILLDESK_CLIENTID=your_client_id
BILLDESK_ENCRYPTION_KEY=your_encryption_key_32_chars
BILLDESK_SIGNING_KEY=your_signing_key
KEY_ID=your_key_id
BILLDESK_RETURN_URL=http://localhost:5000/api/payment/callback
```

---

## Testing Checklist

### Pre-Reservation
- [ ] Creates reservation with status 'pre-reserved'
- [ ] Sets paymentStatus to 'unpaid'
- [ ] Sets expiresAt to 15 minutes
- [ ] Generates unique bookingId
- [ ] Blocks room availability

### Payment Initiation
- [ ] Validates reservation exists
- [ ] Checks reservation not expired
- [ ] Creates BillDesk order successfully
- [ ] Creates PaymentTransaction record
- [ ] Returns correct form data

### Payment Callback
- [ ] Verifies BillDesk signature
- [ ] Decrypts response correctly
- [ ] Updates reservation on success (0300)
- [ ] Cancels reservation on failure (0399)
- [ ] Handles pending status (0002)
- [ ] Handles user cancellation (0398)
- [ ] Redirects to correct page

### Edge Cases
- [ ] Expired pre-reservation handling
- [ ] Duplicate callback handling
- [ ] Invalid signature rejection
- [ ] Missing reservation handling

---

## What's NOT Implemented (Future Work)

### 1. Webhook Handler
- Async payment status updates
- Handles cases where user closes browser
- Route: `POST /api/payment/webhook`

### 2. Verify Transaction API
- Manual payment verification
- Cron job for pending payments
- Route: `GET /api/payment/verify/:bookingId`

### 3. Auto-Expiry Cron Job
- Automatically cancel expired pre-reservations
- Run every 5 minutes
- Check `expiresAt` field

### 4. Email Notifications
- Currently just placeholder console.log
- Need to implement actual email service
- Send on: success, failure, pending

### 5. Payment Retry Logic
- Allow users to retry failed payments
- Reuse same bookingId or create new one?
- Decision needed from business side

### 6. Frontend Pages
- `/booking-pending` page for pending payments
- `/booking-failed` page improvements
- Better error messages

---

## Best Practices for Failed Payments

**Question 3 Answer:** Should failed payments allow retry with same bookingId?

**Recommendation:** 
- **NO** - Don't reuse same bookingId for retry
- Create new pre-reservation for each payment attempt
- Keeps audit trail clean
- Avoids confusion in payment reconciliation
- User can go back to room selection and start fresh

**Alternative (if retry needed):**
- Keep reservation in 'pre-reserved' state
- Reset expiresAt to +15 mins
- Create new PaymentTransaction record
- Use same bookingId but new BillDesk orderid

---

## Security Considerations

✅ **Implemented:**
- Signature verification on callbacks
- Encryption/decryption using jose library
- User authentication required for booking
- No sensitive keys exposed to frontend

⚠️ **TODO:**
- Rate limiting on payment endpoints
- Idempotency checks for duplicate callbacks
- IP whitelisting for BillDesk callbacks (optional)

---

## Debugging

### Enable Debug Logs
All payment operations log to console:
- Request encryption
- Response decryption
- Status updates
- Redirects

### Check Payment Transaction
```javascript
// In MongoDB
db.paymenttransactions.find({ bookingId: "YOUR_BOOKING_ID" })
```

### Check Reservation Status
```javascript
// In MongoDB
db.reservations.find({ bookingId: "YOUR_BOOKING_ID" })
```

---

## Next Steps

1. **Add BillDesk credentials to `.env`**
2. **Test with BillDesk UAT environment**
3. **Create booking-pending page** (optional)
4. **Implement email notifications**
5. **Add cron job for expired reservations**
6. **Test all payment scenarios**
7. **Move to production after UAT approval**

---

## Support

For BillDesk integration issues, provide:
1. Decrypted Request string
2. Decrypted Response string
3. Trace ID & Timestamp
4. BillDesk API endpoint used

All stored in PaymentTransaction model for easy debugging.
