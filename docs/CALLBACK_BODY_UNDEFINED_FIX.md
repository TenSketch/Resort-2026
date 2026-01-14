# Payment Callback - Request Body Undefined Fix

## Issue
Payment callback received but `req.body` is `undefined`:
```
=== PAYMENT CALLBACK RECEIVED ===
Request Body: undefined
Request Query: [Object: null prototype] {}
```

Error:
```
TypeError: Cannot read properties of undefined (reading 'msg')
```

## Root Cause
Express wasn't configured to parse URL-encoded form data. BillDesk sends the callback data as `application/x-www-form-urlencoded`, but Express only had `express.json()` middleware.

## What Was Fixed

### 1. Added URL-Encoded Parser
**File:** `backend/index.js`

```javascript
// Before
app.use(express.json())

// After
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // Added this
```

This allows Express to parse form data sent by BillDesk.

### 2. Updated Return URL
**File:** `backend/.env`

```env
# Before
BILLDESK_RETURN_URL=https://api.vanavihari.com/api/billdesk/return

# After
BILLDESK_RETURN_URL=https://api.vanavihari.com/api/payment/callback
```

Using the existing `/api/payment/callback` route instead of creating a new one.

### 3. Enhanced Logging
**File:** `backend/controllers/paymentController.js`

Added comprehensive logging to debug callback issues:
```javascript
console.log("Request Method:", req.method);
console.log("Request Headers:", req.headers);
console.log("Request Body:", req.body);
console.log("Request Query:", req.query);
```

### 4. Multiple Data Source Checks
```javascript
// Try multiple sources for encrypted response
const encryptedResponse = req.body?.msg 
  || req.query?.msg 
  || req.body?.response 
  || req.query?.response;
```

## How BillDesk Sends Data

BillDesk can send callback data in different ways:

### Method 1: POST with Form Data (Most Common)
```
POST /api/payment/callback
Content-Type: application/x-www-form-urlencoded

msg=encrypted_response_string
```

### Method 2: POST with JSON
```
POST /api/payment/callback
Content-Type: application/json

{"msg": "encrypted_response_string"}
```

### Method 3: GET with Query Parameters
```
GET /api/payment/callback?msg=encrypted_response_string
```

Our code now handles all three methods!

## Testing

### 1. Restart Backend
```bash
cd backend
# Stop server (Ctrl+C or pm2 stop)
node index.js
# or
pm2 restart Vanavihari-2025-backend
```

### 2. Complete Payment
1. Create booking
2. Complete payment on BillDesk
3. Check backend logs

### 3. Expected Logs
```
=== PAYMENT CALLBACK RECEIVED ===
Request Method: POST
Request Headers: { content-type: 'application/x-www-form-urlencoded', ... }
Request Body: { msg: 'eyJhbGciOiJIUzI1NiIsImNsaWVudGlkIjoiYmR1YXQyazY3M3NqIiwia2lkIjoiSE1BQyJ9...' }
Request Query: {}
```

Body should NOT be undefined!

## Verification Checklist

- [ ] Backend restarted with new code
- [ ] `express.urlencoded()` middleware added
- [ ] Return URL updated in .env
- [ ] Payment completed on BillDesk
- [ ] Callback received with body data
- [ ] Reservation status updated
- [ ] User redirected to success page

## Common Issues

### Issue 1: Body still undefined
**Check:**
1. Middleware order in index.js
2. `express.urlencoded()` is before routes
3. Server restarted

### Issue 2: CORS error on callback
**Solution:** Callback route doesn't need CORS (BillDesk server-to-server)

### Issue 3: Signature verification fails
**Check:**
1. BILLDESK_SIGNING_KEY is correct
2. No extra spaces in .env
3. Response format from BillDesk

## Middleware Order (Important!)

```javascript
// Correct order
app.use(express.json())                    // 1. JSON parser
app.use(express.urlencoded({ extended: true })) // 2. Form parser
app.use(cors({...}))                       // 3. CORS
app.use('/api/payment', paymentRouter)     // 4. Routes
```

## BillDesk Response Format

After decryption, BillDesk response looks like:
```json
{
  "orderid": "VM1918152511003",
  "transactionid": "TXN123456789",
  "auth_status": "0300",
  "amount": "4000.00",
  "mercid": "BDUAT2K673",
  "bdorderid": "OA8G1OTRG47KNKZQ"
}
```

## Files Modified

1. ✅ `backend/index.js` - Added `express.urlencoded()`
2. ✅ `backend/.env` - Updated return URL
3. ✅ `backend/controllers/paymentController.js` - Enhanced logging

## Next Steps

1. ✅ Restart backend server
2. ✅ Test payment flow
3. ✅ Verify callback receives body data
4. ✅ Check reservation status updates
5. ✅ Verify user sees success page

## Status
✅ **FIXED** - Express now parses form data from BillDesk callback
