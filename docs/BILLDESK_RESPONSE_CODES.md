# BillDesk Response Codes Reference

## Auth Status Codes

| Code | Status | Description | Action Taken |
|------|--------|-------------|--------------|
| 0300 | Success | Transaction successful | Reservation confirmed, payment marked as paid |
| 0399 | Failure | Transaction failed | Reservation cancelled, payment marked as failed |
| 0002 | Pending | Transaction pending | Keep pre-reserved, mark payment as pending |
| 0398 | User Cancelled | User cancelled transaction | Reservation cancelled, payment marked as cancelled |

---

## Response Handling Matrix

### Success (0300)
```javascript
{
  orderid: "BK2109072510008",
  transactionid: "TXN123456789",
  auth_status: "0300",
  amount: "5400.00",
  // ... other fields
}
```

**Actions:**
- ✅ Update reservation: `status = 'reserved'`
- ✅ Update payment: `paymentStatus = 'paid'`
- ✅ Clear expiry: `expiresAt = null`
- ✅ Send success email (placeholder)
- ✅ Redirect to: `/booking-successfull?bookingId=XXX`

---

### Failure (0399)
```javascript
{
  orderid: "BK2109072510008",
  transactionid: "TXN123456789",
  auth_status: "0399",
  amount: "5400.00",
  transaction_error_type: "payment_declined",
  transaction_error_desc: "Insufficient funds"
}
```

**Actions:**
- ❌ Update reservation: `status = 'cancelled'`
- ❌ Update payment: `paymentStatus = 'failed'`
- ❌ Store error message
- ❌ Send failure email (placeholder)
- ❌ Redirect to: `/booking-failed?bookingId=XXX&error=payment_declined`
- 🔓 Release room for other users

---

### Pending (0002)
```javascript
{
  orderid: "BK2109072510008",
  transactionid: "TXN123456789",
  auth_status: "0002",
  amount: "5400.00"
}
```

**Actions:**
- ⏳ Keep reservation: `status = 'pre-reserved'`
- ⏳ Update payment: `paymentStatus = 'pending'`
- ⏳ Keep expiry active
- ⏳ Send pending email (placeholder)
- ⏳ Redirect to: `/booking-pending?bookingId=XXX`
- 🔒 Keep room blocked

**Note:** Need to verify later using Retrieve Transaction API

---

### User Cancelled (0398)
```javascript
{
  orderid: "BK2109072510008",
  transactionid: "TXN123456789",
  auth_status: "0398",
  amount: "5400.00"
}
```

**Actions:**
- ❌ Update reservation: `status = 'cancelled'`
- ❌ Update payment: `paymentStatus = 'cancelled'`
- ❌ Send cancellation email (placeholder)
- ❌ Redirect to: `/booking-failed?bookingId=XXX&error=user_cancelled`
- 🔓 Release room for other users

---

## Complete Response Structure

```javascript
{
  // Order Information
  mercid: "BDUAT2K659",
  orderid: "BK2109072510008",
  amount: "5400.00",
  order_date: "2025-06-16T08:40:08+05:30",
  currency: "356",
  
  // Transaction Information
  transactionid: "TXN123456789",
  transaction_date: "2025-06-16T08:45:23+05:30",
  auth_status: "0300",
  
  // Payment Method
  payment_method_type: "netbanking",
  bank_name: "Test Bank",
  
  // Error Information (if failed)
  transaction_error_type: "payment_declined",
  transaction_error_desc: "Insufficient funds",
  
  // Additional Info
  additional_info: {
    additional_info1: "Customer Name",
    additional_info2: "9876543210",
    additional_info3: "customer@email.com",
    additional_info7: "resort_name"
  },
  
  // Signature
  signature: "..."
}
```

---

## Error Types (transaction_error_type)

| Error Type | Description | User Action |
|------------|-------------|-------------|
| payment_declined | Payment declined by bank | Try different payment method |
| insufficient_funds | Not enough balance | Add funds and retry |
| invalid_card | Card details invalid | Check card details |
| expired_card | Card has expired | Use different card |
| transaction_timeout | Transaction timed out | Retry payment |
| bank_error | Bank system error | Try again later |
| user_cancelled | User cancelled | Restart booking |

---

## Webhook vs Callback

### Callback (Synchronous)
- User redirected back to your site
- BillDesk POSTs response
- User sees result immediately
- **Issue:** If user closes browser, you miss the update

### Webhook (Asynchronous) - Future Implementation
- BillDesk POSTs to separate endpoint
- Happens in background
- More reliable
- **Recommended:** Implement after basic flow works

---

## Verification Flow (For Pending Payments)

When `auth_status = 0002`:

1. **Immediate:** Mark as pending, keep room blocked
2. **After 15 mins:** Call Retrieve Transaction API
3. **Check status:**
   - If success → Update to reserved
   - If failed → Cancel reservation
   - Still pending → Wait and retry

**Retrieve Transaction API:**
```
POST https://uat1.billdesk.com/payments/ve1_2/transactions/get
Headers:
  - BD-Traceid: unique_trace_id
  - BD-Timestamp: timestamp
  - Content-Type: application/jose
Body: Encrypted request with orderid
```

---

## Testing in UAT

### Test Bank Simulator
1. Select "Test Bank" under Net Banking
2. Choose scenario:
   - **Success:** Returns auth_status = 0300
   - **Failure:** Returns auth_status = 0399
   - **Pending:** Returns auth_status = 0002

### Test Cards (if available)
- Success Card: 4111111111111111
- Failure Card: 4000000000000002
- Pending Card: 4000000000000119

---

## Debugging Checklist

When payment fails:

1. **Check Request:**
   - [ ] Decrypted request in PaymentTransaction
   - [ ] All required fields present
   - [ ] Amount format correct (2 decimals)
   - [ ] Order date in IST format

2. **Check Response:**
   - [ ] Signature verified
   - [ ] Decryption successful
   - [ ] Auth status code
   - [ ] Error message (if any)

3. **Check Database:**
   - [ ] Reservation status updated
   - [ ] Payment status updated
   - [ ] Transaction ID stored
   - [ ] Error message stored

4. **Check Logs:**
   - [ ] Backend console logs
   - [ ] Frontend console logs
   - [ ] Network tab in browser

---

## Production Monitoring

### Alerts to Set Up:
- High failure rate (>10%)
- Pending payments not resolved
- Signature verification failures
- Decryption errors
- Expired pre-reservations not cancelled

### Metrics to Track:
- Success rate
- Average payment time
- Pending payment resolution time
- Failed payment reasons
- User cancellation rate

---

## Quick Reference

**Success:** 0300 → Reserved + Paid ✅  
**Failure:** 0399 → Cancelled + Failed ❌  
**Pending:** 0002 → Pre-reserved + Pending ⏳  
**Cancelled:** 0398 → Cancelled + Cancelled 🚫

---

## Support Information

When contacting BillDesk support, provide:

1. **Decrypted Request:**
   ```javascript
   // From PaymentTransaction.encryptedRequest (decrypt it)
   ```

2. **Decrypted Response:**
   ```javascript
   // From PaymentTransaction.decryptedResponse
   ```

3. **Trace ID:** From PaymentTransaction.traceId

4. **Timestamp:** From PaymentTransaction.timestamp

5. **API Endpoint:** 
   - UAT: https://uat1.billdesk.com/...
   - Prod: https://pgi.billdesk.com/...

All this information is automatically stored in the PaymentTransaction model for easy debugging.

---

## Additional Resources

- BillDesk API Docs: https://docs.billdesk.io/
- Create Order API: https://docs.billdesk.io/reference/createorder
- Retrieve Transaction API: https://docs.billdesk.io/reference/post-payments-v1_2-transactions-get
- Authentication: https://docs.billdesk.io/reference/authentications-and-endpoints
