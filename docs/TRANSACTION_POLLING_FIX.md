# Transaction Polling - Authorization Fix

## Issues Found

### 1. Missing Authorization Header (401 Error)
```
❌ RETRIEVE TRANSACTION ERROR ===
Error Message: Request failed with status code 401
Response Data: {
  status: 401,
  error_type: 'authentication_error',
  error_code: 'GNAUE0001',
  message: 'Required header authorization is missing'
}
```

### 2. Wrong Callback Field Name
```
❌ No encrypted response received
Available keys in body: [..., 'encrypted_response', ...]
```
Looking for `transaction_response` but BillDesk sends `encrypted_response`

## Fixes Applied

### Fix 1: Extract and Store Auth Token

**In `paymentController.js` - `initiatePayment()`:**
```javascript
// Extract authorization token from BillDesk response
const authToken = billdeskResponse.links?.[1]?.headers?.authorization || null;

// Store in reservation for future API calls
await Reservation.findOneAndUpdate(
  { bookingId },
  { 
    paymentTransactionId: paymentTransaction._id.toString(),
    $set: { 'rawSource.authToken': authToken }
  }
);

// Pass to polling service
startTransactionPolling(bookingId, bdorderid, merchantId, authToken);
```

### Fix 2: Pass Auth Token to API Calls

**In `retrieveTransaction.js`:**
```javascript
export async function retrieveTransaction(bdOrderId, mercid, authToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/jose',
    'BD-Traceid': traceId,
    'BD-Timestamp': timestamp
  };

  // Add authorization header if token is provided
  if (authToken) {
    headers['authorization'] = authToken;
  }

  const response = await axios.post(url, requestBody, { headers });
}
```

### Fix 3: Update Polling Service

**In `transactionPoller.js`:**
```javascript
export function startTransactionPolling(bookingId, bdOrderId, mercid, authToken = null) {
  // Pass authToken to all poll checks
  pollTransaction(bookingId, bdOrderId, mercid, authToken, checkCount);
}

async function pollTransaction(bookingId, bdOrderId, mercid, authToken, checkNumber) {
  const result = await retrieveTransaction(bdOrderId, mercid, authToken);
}
```

### Fix 4: Update Manual Endpoint

**In `paymentController.js` - `retrieveTransactionStatus()`:**
```javascript
// Find reservation to get auth token
const reservation = await Reservation.findOne({ bookingId }).lean();
const authToken = reservation?.rawSource?.authToken || null;

// Pass to retrieve function
const result = await retrieveTransaction(bdOrderId, mercid, authToken);
```

### Fix 5: Callback Field Name

**In `paymentController.js` - `handlePaymentCallback()`:**
```javascript
// Check for encrypted_response first (BillDesk's actual field name)
const encryptedResponse = req.body?.encrypted_response
  || req.body?.transaction_response 
  || req.body?.msg 
  || req.query?.msg;
```

## What Changed

### Files Modified:
1. ✅ `backend/services/retrieveTransaction.js` - Added authToken parameter
2. ✅ `backend/services/transactionPoller.js` - Pass authToken through polling
3. ✅ `backend/controllers/paymentController.js` - Extract, store, and use authToken
4. ✅ `docs/TRANSACTION_POLLING_QUICK_START.md` - Updated troubleshooting

### Database Changes:
- Auth token now stored in `reservation.rawSource.authToken`
- No schema changes needed (rawSource is Mixed type)

## Testing

### Expected Logs (Success):
```
🔄 Starting transaction polling for booking: VM0712212512002
   BD Order ID: OAW21S40L6HORWZ0
   Will check every 5 minutes for 15 minutes

📊 Poll Check #1 for booking: VM0712212512002
   Time: 2025-12-07T12:21:31.020Z

=== RETRIEVE TRANSACTION REQUEST ===
URL: https://uat1.billdesk.com/u2/payments/ve1_2/transactions/get/OAW21S40L6HORWZ0
BD-TraceID: TIDMPUE02MGRWO
BD-Timestamp: 1765110091021
Request Body: {
  "mercid": "BDUAT2K673"
}
Auth Token: Present  ✅

Response Status: 200  ✅
Response Data: {
  // Transaction details here
}

✅ Transaction retrieved successfully
```

### What to Look For:
1. ✅ "Auth Token: Present" in logs
2. ✅ Response Status: 200 (not 401)
3. ✅ Transaction data in response

## Next Steps

Once polling works and you see the transaction response:

1. **Analyze Response Structure**
   - Look for `auth_status` field
   - Check `transaction.status`
   - Identify payment success indicators

2. **Implement Status Update Logic**
   ```javascript
   if (result.data.auth_status === '0300') {
     // Update reservation to paid/reserved
     // Send confirmation emails
     // Stop polling
   }
   ```

3. **Handle All Status Codes**
   - `0300` - Success
   - `0399` - Failed
   - `0002` - Pending
   - `0398` - Cancelled

## Auth Token Format

The auth token from BillDesk looks like:
```
OToken be811eb029539bfd32abd20f260b689124b762bf0447775278628b66871a31a7...
```

It's stored in the order creation response at:
```javascript
billdeskResponse.links[1].headers.authorization
```
