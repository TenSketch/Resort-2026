# Transaction Polling - Quick Start Guide

## What Was Implemented

✅ **Automatic transaction status checking** every 5 minutes for 15 minutes  
✅ **BillDesk Retrieve Transaction API** integration  
✅ **Polling service** that manages multiple bookings  
✅ **Manual endpoint** to check transaction status  
✅ **Console logging** to see BillDesk responses

## How to Test

### Step 1: Start Backend
```bash
cd backend
npm run dev
```

### Step 2: Create a Test Booking
1. Go to frontend and create a booking
2. Initiate payment
3. Watch backend console logs

### Step 3: See Polling in Action
You'll see logs like this:
```
🔄 Starting transaction polling for booking: BB2109072510008
   BD Order ID: BDORDER123456
   Will check every 5 minutes for 15 minutes

📊 Poll Check #1 for booking: BB2109072510008
   Time: 2025-12-07T10:00:00.000Z

=== RETRIEVE TRANSACTION REQUEST ===
URL: https://uat1.billdesk.com/u2/payments/ve1_2/transactions/get/BDORDER123456
BD-TraceID: TID123ABC
BD-Timestamp: 1234567890
Request Body: {
  "mercid": "BDMERCID"
}

Response Status: 200
Response Data: {
  // BillDesk response here
}
====================================

✅ Transaction retrieved successfully
```

### Step 4: Manual Check (Optional)
Test the manual endpoint:
```bash
# Get your auth token first
curl -X GET http://localhost:5000/api/payment/transaction/BB2109072510008 \
  -H "token: YOUR_JWT_TOKEN"
```

### Step 5: Test with Script
```bash
cd backend
node test-retrieve-transaction.js
```
**Note:** Update the `testBdOrderId` in the script first!

## What Happens Now

### During 15-Minute Hold Period:
- ✅ Polling checks transaction status at 0, 5, and 10 minutes
- ✅ All responses logged to console
- ✅ You can see BillDesk response structure

### When Payment Confirmed:
- ✅ Polling automatically stops
- ✅ Reservation updated to "reserved"
- ✅ Confirmation emails sent

### After 15 Minutes:
- ✅ Polling automatically stops
- ✅ Reservation expires if not paid

## Next Phase: Add Status Update Logic

Once you see the BillDesk response structure, we'll add:

```javascript
// In transactionPoller.js - pollTransaction()
if (result.data.transaction?.auth_status === '0300') {
  // Update reservation to paid/reserved
  // Send confirmation emails
  // Stop polling
}
```

## Files Modified

1. ✅ `backend/services/retrieveTransaction.js` - NEW
2. ✅ `backend/services/transactionPoller.js` - NEW
3. ✅ `backend/controllers/paymentController.js` - UPDATED
4. ✅ `backend/routes/paymentRoutes.js` - UPDATED
5. ✅ `backend/test-retrieve-transaction.js` - NEW (test script)

## API Endpoints

### New Endpoint
```
GET /api/payment/transaction/:bookingId
```
Requires authentication (JWT token in headers)

## Important Fix Applied

✅ **Authorization Header Issue Fixed**
- BillDesk requires an `authorization` header for transaction retrieval
- We now extract and store the auth token from order creation response
- Token is stored in `reservation.rawSource.authToken`
- Token is passed to all polling requests

✅ **Callback Field Name Fixed**
- BillDesk sends `encrypted_response` (not `transaction_response`)
- Callback handler now checks for `encrypted_response` first

## Troubleshooting

### No Logs Appearing?
- Check if payment was initiated successfully
- Verify `bdOrderId` exists in PaymentTransaction collection

### API Errors (401 Authentication)?
- ✅ **FIXED**: Auth token now extracted from BillDesk response
- Token stored in reservation and passed to all API calls
- Check logs for "Auth Token: Present" message

### API Errors (Other)?
- Check BillDesk credentials in `.env`
- Verify you're using UAT endpoint for testing
- Check if `bdOrderId` is valid

### Polling Not Starting?
- Check console for "🔄 Started transaction polling" message
- Verify `initiatePayment` completed successfully

## What to Look For

When polling runs, check the BillDesk response for:
- `transaction.status` - Current transaction status
- `transaction.auth_status` - Payment authorization status
- `transaction.transactionid` - Transaction ID
- `transaction.amount` - Payment amount

Share the response structure and we'll implement the status update logic!
