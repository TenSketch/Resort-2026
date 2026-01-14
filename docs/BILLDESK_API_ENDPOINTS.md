# BillDesk API Endpoints Reference

## Available Endpoints

### 1. Create Order
**Endpoint:** `POST https://uat1.billdesk.com/u2/payments/ve1_2/orders/create`

**Purpose:** Create a new payment order

**Authentication:** Encrypted + Signed request

**Response:** Order details with payment redirect URL and auth token

---

### 2. Order Status (Recommended for Polling)
**Endpoint:** `GET https://uat1.billdesk.com/u2/payments/ve1_2/orders/status/{bdorderid}`

**Purpose:** Get current status of an order (includes transaction details if payment made)

**Authentication:** 
- May work without auth token for merchant's own orders
- Can use auth token from order creation if required

**Headers:**
```
BD-Traceid: TID{random}
BD-Timestamp: {timestamp}
Content-Type: application/json
Accept: application/jose
authorization: {OToken from order creation} (optional)
```

**Response:** Encrypted JOSE response with order and transaction details

**Advantages:**
- ✅ Simpler endpoint
- ✅ Returns both order and transaction info
- ✅ May not require auth token
- ✅ Better for polling during payment window

---

### 3. Transaction Retrieve
**Endpoint:** `POST https://uat1.billdesk.com/u2/payments/ve1_2/transactions/get`

**Purpose:** Get transaction details after payment is completed

**Authentication:** Encrypted + Signed request (same as order creation)

**Body:**
```json
{
  "mercid": "BDUAT2K673",
  "orderid": "VM0712482512006"
}
```

**Important Notes:**
- Use `orderid` (your original booking ID), NOT `bdorderid` (BillDesk's internal ID)
- The `orderid` goes in the request body, NOT in the URL path
- BillDesk error: "Either transactionid or mercid and orderid are required"

**Headers:**
```
BD-Traceid: TID{random}
BD-Timestamp: {timestamp}
Content-Type: application/json
Accept: application/jose
authorization: {OToken from order creation} (required)
```

**Response:** Encrypted JOSE response with transaction details

**Issues:**
- ❌ Requires valid auth token
- ❌ Auth token format/usage unclear in docs
- ❌ May only work after transaction is complete

---

## Current Implementation

We're using **Transaction Retrieve endpoint** (`/transactions/get/{bdorderid}`) with proper authentication:

### Authentication Pattern (Same as Order Creation):
1. ✅ Create request body with `mercid`
2. ✅ Encrypt request using encryption key
3. ✅ Sign encrypted request using signing key
4. ✅ Send as `application/jose` content type
5. ✅ Decrypt response using same keys

**No authorization header needed** - authentication is done through encryption/signing!

## Response Format

Both endpoints return encrypted JOSE responses that need to be:
1. Verified (signature check)
2. Decrypted (using encryption key)
3. Parsed (JSON)

Example decrypted response structure:
```json
{
  "orderid": "VM0712382512004",
  "bdorderid": "OA3A95H79B7U880",
  "status": "ACTIVE",
  "transaction": {
    "transactionid": "TXN123456",
    "auth_status": "0300",
    "amount": "3000.00",
    "transaction_date": "2025-12-07T18:08:42+05:30"
  }
}
```

## Auth Status Codes

- `0300` - Success (payment completed)
- `0399` - Failed (payment failed)
- `0002` - Pending (payment in progress)
- `0398` - Cancelled (user cancelled)
- `NA` - Not yet attempted

## Testing

Test the new endpoint:
```bash
cd backend
node test-retrieve-transaction.js
```

Update the script with a real `bdOrderId` from a test payment.
