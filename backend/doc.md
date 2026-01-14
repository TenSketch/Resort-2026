## Complete BillDesk Payment Flow

### **Phase 1: Pre-Reservation (User Books)**

**File:** `reservationController.js` → `createPublicBooking()`

1. User fills booking form on frontend
2. Backend receives booking request with room selection, dates, guest info
3. System runs `expirePendingReservations()` to clean up expired bookings
4. Checks room availability using `checkRoomAvailability()` 
5. If available, creates reservation with:
   - `status: 'pending'`
   - `paymentStatus: 'unpaid'`
   - `expiresAt: 15 minutes from now`
   - Auto-generated `bookingId` (e.g., `BV1606402512001`)
6. Returns reservation to frontend

---

### **Phase 2: Payment Initiation**

**File:** `paymentController.js` → `initiatePayment()`

1. Frontend calls `/api/payment/initiate` with `bookingId`
2. Backend validates:
   - Reservation exists
   - Status is 'pending'
   - Not expired
3. Prepares BillDesk order data:
   ```javascript
   {
     mercid: "MERCHANT_ID",
     orderid: bookingId,  // Your booking ID
     amount: "5000.00",
     currency: "356",     // INR
     order_date: "2025-12-30T10:30:00+05:30",
     ru: "https://yoursite.com/api/payment/callback",
     device: { ip, user_agent }
   }
   ```

4. **Encryption Process** (`billdeskCrypto.js`):
   - Encrypts order data using `A256GCM` algorithm → JWE
   - Signs encrypted data using `HS256` algorithm → JWS
   - Result: Double-encrypted payload

5. **Sends to BillDesk** (`sendToBilldesk.js`):
   - POST to `https://uat1.billdesk.com/payments/ve1_2/orders/create`
   - Headers: `BD-Traceid`, `BD-Timestamp`, `Content-Type: application/jose`
   - Body: Signed & encrypted payload

6. **BillDesk Response** (also encrypted):
   - Verifies signature
   - Decrypts response
   - Gets: `bdorderid`, `mercid`, `rdata` (payment token), form URL

7. Creates `PaymentTransaction` record with status 'initiated'

8. **Starts Transaction Polling** (`transactionPoller.js`):
   - Polls every 5 minutes for 15 minutes (3 checks)
   - Handles cases where callback fails

9. Returns payment data to frontend:
   ```javascript
   {
     merchantid: "MERCHANT_ID",
     bdorderid: "BD123456789",
     rdata: "encrypted_token...",
     formAction: "https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk"
   }
   ```

---

### **Phase 3: User Payment**

**Frontend handles this:**

1. Frontend receives payment data
2. Creates hidden HTML form:
   ```html
   <form action="https://uat1.billdesk.com/..." method="POST">
     <input name="merchantid" value="..." />
     <input name="bdorderid" value="..." />
     <input name="rdata" value="..." />
   </form>
   ```
3. Auto-submits form → redirects user to BillDesk payment page
4. User enters card/UPI/netbanking details
5. BillDesk processes payment

---

### **Phase 4: Payment Callback**

**File:** `paymentController.js` → `handlePaymentCallback()`

1. BillDesk redirects user back to: `https://yoursite.com/api/payment/callback`
2. Sends encrypted response in POST body
3. Backend:
   - Verifies signature
   - Decrypts response
   - Extracts: `orderid`, `transactionid`, `auth_status`, `amount`

4. **Auth Status Codes:**
   - `0300` = Success ✅
   - `0399` = Failed ❌
   - `0002` = Pending ⏳
   - `0398` = User Cancelled 🚫

5. Updates `Reservation`:
   - Success: `status: 'reserved'`, `paymentStatus: 'paid'`
   - Failed: `status: 'not-reserved'`, `paymentStatus: 'unpaid'`
   - Cancelled: `status: 'cancelled'`

6. Updates `PaymentTransaction` with transaction details

7. **If successful:**
   - Stops transaction polling
   - Sends confirmation emails to user & admin
   - Redirects to: `yoursite.com/#/booking-status?bookingId=...`

8. **If failed:**
   - Redirects to: `yoursite.com/#/booking-status?bookingId=...&status=failed`

---

### **Phase 5: Transaction Polling (Backup)**

**File:** `transactionPoller.js`

Runs in background in case callback fails:

1. Checks at 5, 10, and 15 minutes after payment initiation
2. Calls BillDesk API: `/payments/ve1_2/transactions/get`
3. Sends encrypted request with `orderid` (bookingId)
4. Gets current transaction status
5. Updates reservation if status changed
6. Stops polling when:
   - Payment confirmed (0300)
   - Payment failed (0399)
   - User cancelled (0398)
   - Max checks reached (3)

---

### **Phase 6: Manual Status Check**

**File:** `paymentController.js` → `retrieveTransactionStatus()`

Admin/user can manually check status:
- GET `/api/payment/transaction/:bookingId`
- Calls `retrieveTransaction()` service
- Returns current status from BillDesk

---

### **Phase 7: Webhook (Optional)**

**File:** `webhookController.js`

BillDesk can also send webhooks:
- POST to `/api/webhook/billdesk`
- Stores raw webhook data for debugging
- Not currently used for status updates (callback is primary)

---

## Key Security Features

1. **Double Encryption:** JWE (encryption) + JWS (signature)
2. **Signature Verification:** Ensures data from BillDesk is authentic
3. **Trace IDs:** Track each request for debugging
4. **Auth Tokens:** Stored for transaction retrieval API calls
5. **IP Validation:** Captures real client IP for fraud prevention

---

## Data Flow Summary

```
User → Frontend → createPublicBooking() → Reservation (pending)
                                              ↓
Frontend → initiatePayment() → Encrypt → BillDesk API
                                              ↓
                          BillDesk Response (encrypted)
                                              ↓
                          Decrypt → Payment Form Data
                                              ↓
Frontend → Submit Form → BillDesk Payment Page
                                              ↓
                          User Pays → BillDesk
                                              ↓
                          Callback (encrypted) → Backend
                                              ↓
                          Decrypt → Update Reservation
                                              ↓
                          Send Emails → Redirect User
                                              ↓
                          (Backup: Transaction Poller)
```

The system is robust with multiple fallbacks: callback, polling, and manual retrieval!