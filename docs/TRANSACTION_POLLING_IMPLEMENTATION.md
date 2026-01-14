# Transaction Polling Implementation

## Overview
Automatic polling system that checks BillDesk transaction status every 5 minutes during the 15-minute reservation hold period.

## How It Works

### 1. Reservation Flow
```
User Creates Booking → Payment Initiated → Polling Starts → Check Every 5 Mins → Update Status
```

### 2. Polling Schedule
- **Duration**: 15 minutes (reservation hold period)
- **Interval**: Every 5 minutes
- **Total Checks**: 3 checks (at 0, 5, and 10 minutes)
- **Auto-stop**: After 15 minutes or when payment confirmed

### 3. Files Created

#### `backend/services/retrieveTransaction.js`
- Makes API call to BillDesk to retrieve transaction status
- Endpoint: `POST https://uat1.billdesk.com/u2/payments/ve1_2/transactions/get/{bdOrderId}`
- Headers required:
  - `BD-Traceid`: Unique trace ID
  - `BD-Timestamp`: Request timestamp
  - `Content-Type`: application/json
  - `Accept`: application/jose

#### `backend/services/transactionPoller.js`
- Manages polling intervals for multiple bookings
- Starts/stops polling automatically
- Logs all transaction responses for analysis

#### `backend/controllers/paymentController.js`
- Added `retrieveTransactionStatus()` endpoint
- Integrated polling into `initiatePayment()`
- Auto-stops polling on successful callback

#### `backend/routes/paymentRoutes.js`
- New route: `GET /api/payment/transaction/:bookingId`

## API Endpoints

### 1. Retrieve Transaction Status (Manual)
```http
GET /api/payment/transaction/:bookingId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "bookingId": "BB2109072510008",
  "bdOrderId": "BDORDER123456",
  "transactionData": {
    // BillDesk response data
  },
  "traceId": "TID123ABC",
  "timestamp": "1234567890"
}
```

## Testing

### 1. Test Retrieve Transaction API
```bash
cd backend
node test-retrieve-transaction.js
```

**Before running:**
- Update `testBdOrderId` in the script with a real BD Order ID
- Ensure `.env` has correct BillDesk credentials

### 2. Test Polling in Real Booking
1. Create a booking via frontend
2. Initiate payment
3. Check backend logs - you'll see:
```
🔄 Starting transaction polling for booking: BB2109072510008
   BD Order ID: BDORDER123456
   Will check every 5 minutes for 15 minutes

📊 Poll Check #1 for booking: BB2109072510008
   Time: 2025-12-07T10:00:00.000Z
✅ Transaction retrieved successfully
   Response: { ... }
```

## Next Steps (Phase 2)

Once we understand the BillDesk response structure, we'll implement:

### 1. Parse Response
```javascript
// In transactionPoller.js - pollTransaction()
const transactionStatus = result.data.transaction?.status;
const authStatus = result.data.transaction?.auth_status;
```

### 2. Update Reservation Status
```javascript
if (authStatus === '0300') {
  // Payment successful
  await Reservation.findOneAndUpdate(
    { bookingId },
    {
      status: 'reserved',
      paymentStatus: 'paid',
      expiresAt: null
    }
  );
  
  await PaymentTransaction.findOneAndUpdate(
    { bookingId },
    {
      status: 'success',
      transactionId: result.data.transaction.transactionid
    }
  );
  
  // Stop polling
  stopTransactionPolling(bookingId);
  
  // Send confirmation emails
  sendReservationSuccessEmails(reservation, paymentTransaction);
}
```

### 3. Handle Different Status Codes
- `0300` - Success
- `0399` - Failed
- `0002` - Pending
- `0398` - User Cancelled

## Environment Variables Required
```env
BILLDESK_MERCID=your_merchant_id
BILLDESK_CLIENTID=your_client_id
BILLDESK_ENCRYPTION_KEY=your_encryption_key
BILLDESK_SIGNING_KEY=your_signing_key
KEY_ID=your_key_id
```

## Monitoring

### Check Active Polls
```javascript
import { getActivePolls } from './services/transactionPoller.js';

const activeBookings = getActivePolls();
console.log('Currently polling:', activeBookings);
```

### Stop Specific Poll
```javascript
import { stopTransactionPolling } from './services/transactionPoller.js';

stopTransactionPolling('BB2109072510008');
```

## Benefits

1. **Automatic Status Updates**: No manual intervention needed
2. **Handles Delayed Callbacks**: Catches payments even if callback fails
3. **Better UX**: Users see updated status without refreshing
4. **Audit Trail**: All checks logged for debugging
5. **Resource Efficient**: Only 3 checks per booking

## Limitations

- Polling stops after 15 minutes (reservation expiry)
- Maximum 3 checks per booking
- Requires BillDesk API access
- Network failures may miss status updates

## Future Enhancements

1. Configurable polling intervals
2. Webhook fallback if polling fails
3. Admin dashboard to view active polls
4. Retry logic for failed API calls
5. Email alerts for stuck transactions
