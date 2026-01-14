# Payment Integration Setup Guide

## Quick Start

### 1. Update Environment Variables

Add these to your `backend/.env` file:

```env
# API Configuration
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:4200

# BillDesk Payment Gateway (Get from BillDesk)
BILLDESK_MERCID=BDUAT2K659
BILLDESK_CLIENTID=your_client_id_here
BILLDESK_ENCRYPTION_KEY=your_32_character_encryption_key
BILLDESK_SIGNING_KEY=your_signing_key_here
KEY_ID=your_key_id_here
BILLDESK_RETURN_URL=http://localhost:5000/api/payment/callback
```

**For UAT Testing:**
- Use BillDesk UAT credentials provided in your email
- Form action will be: `https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk`

**For Production:**
- Use production credentials
- Form action will be: `https://pgi.billdesk.com/u2/web/v1_2/embeddedsdk`

---

### 2. Restart Backend Server

```bash
cd backend
npm install  # If any new dependencies
node index.js
```

---

### 3. Test the Flow

#### A. Create Pre-Reservation
1. Go to booking page
2. Fill in all details
3. Click "Confirm and Pay"
4. Check console logs for:
   - Pre-reservation created
   - Booking ID generated
   - Status: 'pre-reserved'
   - PaymentStatus: 'unpaid'

#### B. Payment Initiation
1. After pre-reservation, payment should auto-initiate
2. Check console logs for:
   - Payment order created
   - Encrypted request
   - Signed request
   - Form submission to BillDesk

#### C. BillDesk Payment Page
1. You'll be redirected to BillDesk hosted page
2. For UAT testing:
   - Select "Test Bank" under Net Banking
   - Choose "Success" to simulate successful payment
   - Choose "Failure" to simulate failed payment

#### D. Payment Callback
1. After payment, BillDesk redirects back
2. Backend processes callback
3. Updates reservation status
4. Redirects to success/failure page

---

### 4. Verify in Database

#### Check Reservation
```javascript
// MongoDB query
db.reservations.findOne({ bookingId: "YOUR_BOOKING_ID" })

// Should show:
// - status: 'reserved' (if paid) or 'cancelled' (if failed)
// - paymentStatus: 'paid' or 'failed'
// - expiresAt: null (if paid)
```

#### Check Payment Transaction
```javascript
// MongoDB query
db.paymenttransactions.findOne({ bookingId: "YOUR_BOOKING_ID" })

// Should show:
// - status: 'success' or 'failed'
// - transactionId: from BillDesk
// - authStatus: '0300' (success) or '0399' (failed)
// - decryptedResponse: full BillDesk response
```

---

## Testing Scenarios

### Scenario 1: Successful Payment
1. Create booking → Pre-reserved
2. Initiate payment → Redirected to BillDesk
3. Complete payment (Test Bank → Success)
4. Callback received → Reservation updated to 'reserved'
5. User redirected to `/booking-successfull?bookingId=XXX`

**Expected Result:**
- Reservation status: `reserved`
- Payment status: `paid`
- PaymentTransaction status: `success`
- Room blocked for user

---

### Scenario 2: Failed Payment
1. Create booking → Pre-reserved
2. Initiate payment → Redirected to BillDesk
3. Payment fails (Test Bank → Failure)
4. Callback received → Reservation cancelled
5. User redirected to `/booking-failed?bookingId=XXX`

**Expected Result:**
- Reservation status: `cancelled`
- Payment status: `failed`
- PaymentTransaction status: `failed`
- Room released (available again)

---

### Scenario 3: User Cancels Payment
1. Create booking → Pre-reserved
2. Initiate payment → Redirected to BillDesk
3. User clicks "Cancel" on payment page
4. Callback received → Reservation cancelled
5. User redirected to `/booking-failed?bookingId=XXX`

**Expected Result:**
- Reservation status: `cancelled`
- Payment status: `cancelled`
- PaymentTransaction status: `cancelled`
- Room released

---

### Scenario 4: Pending Payment
1. Create booking → Pre-reserved
2. Initiate payment → Redirected to BillDesk
3. Payment pending (bank processing)
4. Callback received → Status remains pending
5. User redirected to `/booking-pending?bookingId=XXX`

**Expected Result:**
- Reservation status: `pre-reserved`
- Payment status: `pending`
- PaymentTransaction status: `pending`
- Room still blocked (until verified)

---

### Scenario 5: Expired Pre-Reservation
1. Create booking → Pre-reserved (expiresAt: +15 mins)
2. Wait 15+ minutes
3. Try to initiate payment
4. Error: "Reservation has expired"

**Expected Result:**
- Payment not initiated
- User shown error message
- Room released (should be handled by cron job)

---

## Troubleshooting

### Issue: Payment form not submitting
**Check:**
- Console logs for payment data
- Network tab for `/api/payment/initiate` response
- BillDesk credentials in .env

### Issue: Callback not received
**Check:**
- BILLDESK_RETURN_URL is correct
- Backend server is accessible from internet (for production)
- BillDesk callback logs in console

### Issue: Signature verification failed
**Check:**
- BILLDESK_SIGNING_KEY is correct
- No extra spaces in .env values
- Key encoding is UTF-8

### Issue: Decryption failed
**Check:**
- BILLDESK_ENCRYPTION_KEY is correct (32 characters)
- Key encoding is UTF-8
- Response format from BillDesk

---

## Console Logs to Monitor

### Backend Logs
```
=== PAYMENT INITIATION ===
Booking ID: BK...
Order Data: {...}
Encrypted Request: ...
Signed Request: ...
Trace ID: TID...
=========================

=== PAYMENT CALLBACK RECEIVED ===
Request Body: {...}
Decrypted Response: {...}
Payment Status: success
Reservation Status: reserved
================================
```

### Frontend Logs
```
Pre-reservation created! Booking Id: BK...
Payment initiated: {...}
Submitting payment form to BillDesk...
```

---

## Important Notes

1. **15-Minute Expiry:**
   - Pre-reservations expire after 15 minutes
   - User must complete payment within this time
   - Expired reservations should be auto-cancelled (cron job needed)

2. **Room Blocking:**
   - Pre-reserved rooms block availability
   - Other users cannot book same room
   - Released only when cancelled or expired

3. **Payment Retry:**
   - Failed payments require new booking
   - Don't reuse same bookingId
   - User goes back to room selection

4. **Email Notifications:**
   - Currently just console.log placeholders
   - Implement actual email service later
   - Send on: success, failure, pending

5. **Webhook (Future):**
   - Async payment updates
   - More reliable than callback
   - Implement after basic flow works

---

## Production Checklist

Before going live:

- [ ] Update BillDesk credentials to production
- [ ] Update form action URL to production
- [ ] Update BILLDESK_RETURN_URL to production domain
- [ ] Test all payment scenarios in UAT
- [ ] Implement email notifications
- [ ] Add cron job for expired reservations
- [ ] Set up webhook endpoint
- [ ] Add monitoring/alerting
- [ ] Test with real payment methods
- [ ] Verify refund process
- [ ] Document support procedures

---

## Support Contacts

**BillDesk Support:**
- Provide: Decrypted request, response, trace ID, timestamp
- All stored in PaymentTransaction model

**Internal Support:**
- Check MongoDB for reservation and payment transaction
- Review backend console logs
- Check frontend network tab

---

## Next Steps After Testing

1. ✅ Verify all scenarios work in UAT
2. ✅ Get approval from BillDesk
3. ✅ Implement email notifications
4. ✅ Add cron job for expiry
5. ✅ Create booking-pending page
6. ✅ Move to production
7. ✅ Monitor first few transactions closely

---

Good luck with testing! 🚀
