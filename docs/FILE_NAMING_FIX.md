# File Naming Fix - Trek Payment Routes

## Issue
Backend was crashing with module not found errors due to inconsistent file naming.

## Root Cause
The files were named with "touristSpot" prefix but imports were using "trek" prefix:
- Actual file: `touristSpotPaymentRoutes.js`
- Import was looking for: `trekPaymentRoutes.js`

## Files Fixed

### 1. backend/index.js
**Line 25 - Import statement:**
```javascript
// BEFORE:
import trekPaymentRouter from './routes/trekPaymentRoutes.js'

// AFTER:
import touristPaymentRouter from './routes/touristSpotPaymentRoutes.js'
```

**Line 80 - Route registration:**
```javascript
// BEFORE:
app.use('/api/trek-payment', trekPaymentRouter)

// AFTER:
app.use('/api/trek-payment', touristPaymentRouter)
```

### 2. backend/routes/touristSpotPaymentRoutes.js
**Line 2 - Controller import:**
```javascript
// BEFORE:
import { initiatePayment, handlePaymentCallback, retrieveTransactionStatus } from "../controllers/trekPaymentController.js";

// AFTER:
import { initiatePayment, handlePaymentCallback, retrieveTransactionStatus } from "../controllers/touristSpotPaymentController.js";
```

## Correct File Structure

```
backend/
├── controllers/
│   ├── touristSpotPaymentController.js  ✅ (was looking for trekPaymentController.js)
│   └── tentPaymentController.js
├── routes/
│   ├── touristSpotPaymentRoutes.js      ✅ (was looking for trekPaymentRoutes.js)
│   └── tentPaymentRoutes.js
└── index.js                              ✅ (fixed imports)
```

## API Endpoints (Unchanged)
The API endpoints remain the same:
- `/api/trek-payment/initiate` ✅
- `/api/trek-payment/callback` ✅
- `/api/trek-payment/transaction/:bookingId` ✅

## Status
✅ **FIXED** - Backend should now start without errors

## Test
Run the backend:
```bash
cd backend
npm run dev
```

Expected output:
```
[nodemon] starting `node index.js`
Server is running on port 5000
MongoDB connected successfully
```
