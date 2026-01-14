# BillDesk Transaction Response Field Fix

## Issue
Callback received but couldn't find encrypted response:
```
No encrypted response received
Available keys in body: [ 'transaction_response', 'orderid' ]
```

## Root Cause
BillDesk sends the encrypted response in a field called `transaction_response`, not `msg`.

## BillDesk Response Format

```javascript
{
  transaction_response: 'eyJhbGciOiJIUzI1NiIsImNsaWVudGlkIjoiYmR1YXQyazY3M3NqIiwia2lkIjoiSE1BQyJ9...',
  orderid: 'VM1918232511004'
}
```

## What Was Fixed

**File:** `backend/controllers/paymentController.js`

```javascript
// Before - only checked 'msg'
const encryptedResponse = req.body?.msg || req.query?.msg;

// After - checks 'transaction_response' first
const encryptedResponse = req.body?.transaction_response 
  || req.body?.msg 
  || req.query?.msg 
  || req.body?.response 
  || req.query?.response;
```

## Priority Order

1. `req.body.transaction_response` ← **BillDesk uses this!**
2. `req.body.msg`
3. `req.query.msg`
4. `req.body.response`
5. `req.query.response`

## Testing

### 1. Restart Backend
```bash
pm2 restart Vanavihari-2025-backend
```

### 2. Complete Payment

### 3. Expected Logs
```
=== PAYMENT CALLBACK RECEIVED ===
Request Body: {
  transaction_response: 'eyJhbGciOiJIUzI1NiIsImNsaWVudGlkIjoiYmR1YXQyazY3M3NqIiwia2lkIjoiSE1BQyJ9...',
  orderid: 'VM1918232511004'
}
✅ Found encrypted response in: transaction_response
✅ Signature verified
✅ Response decrypted
Payment Status: success
Reservation Status: reserved
```

## Status
✅ **FIXED** - Now correctly reads `transaction_response` field from BillDesk callback

## Next Steps
1. Restart backend
2. Test payment
3. Verify reservation updates
4. Check user sees success page
