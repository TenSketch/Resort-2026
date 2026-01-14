# Payment Flow Diagram

## Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER BOOKING FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   User fills │
│ booking form │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 1. CREATE PRE-RESERVATION                                            │
│    POST /api/reservations/book                                       │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ Request:                                                    │   │
│    │ - resort, cottageTypes, rooms                              │   │
│    │ - checkIn, checkOut, guests                                │   │
│    │ - customer details                                         │   │
│    │ - totalPayable                                             │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ Backend Creates:                                           │   │
│    │ - status: 'pre-reserved'                                   │   │
│    │ - paymentStatus: 'unpaid'                                  │   │
│    │ - expiresAt: now + 15 mins                                 │   │
│    │ - bookingId: auto-generated (e.g., BK2109072510008)       │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ Response:                                                  │   │
│    │ { success: true, reservation: {...} }                     │   │
│    └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. INITIATE PAYMENT                                                  │
│    POST /api/payment/initiate                                        │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ Request:                                                    │   │
│    │ { bookingId: "BK2109072510008" }                           │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ Backend:                                                   │   │
│    │ 1. Validates reservation exists                            │   │
│    │ 2. Checks not expired                                      │   │
│    │ 3. Creates BillDesk order:                                 │   │
│    │    - Encrypts order data                                   │   │
│    │    - Signs encrypted data                                  │   │
│    │    - Sends to BillDesk API                                 │   │
│    │ 4. Creates PaymentTransaction record                       │   │
│    │ 5. Updates reservation.paymentTransactionId                │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ Response:                                                  │   │
│    │ {                                                          │   │
│    │   success: true,                                           │   │
│    │   paymentData: {                                           │   │
│    │     bdorderid: "...",                                      │   │
│    │     merchantid: "...",                                     │   │
│    │     rdata: "encrypted_data",                               │   │
│    │     formAction: "https://uat1.billdesk.com/..."           │   │
│    │   }                                                        │   │
│    │ }                                                          │   │
│    └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. REDIRECT TO BILLDESK                                              │
│    Frontend auto-submits form                                        │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ <form method="POST" action="billdesk_url">                 │   │
│    │   <input name="bdorderid" value="..." />                   │   │
│    │   <input name="merchantid" value="..." />                  │   │
│    │   <input name="rdata" value="encrypted_data" />            │   │
│    │ </form>                                                    │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│    User leaves your site → BillDesk hosted payment page              │
└──────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. USER COMPLETES PAYMENT ON BILLDESK                                │
│                                                                       │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│    │  Net        │  │  Credit/    │  │    UPI      │               │
│    │  Banking    │  │  Debit Card │  │             │               │
│    └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                       │
│    For UAT Testing:                                                  │
│    - Select "Test Bank"                                              │
│    - Choose Success/Failure/Pending                                  │
└──────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. BILLDESK CALLBACK                                                 │
│    POST /api/payment/callback                                        │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ BillDesk sends encrypted response:                         │   │
│    │ { msg: "encrypted_jws_string" }                            │   │
│    └────────────────────────────────────────────────────────────┘   │
│                                                                       │
│    ┌────────────────────────────────────────────────────────────┐   │
│    │ Backend:                                                   │   │
│    │ 1. Verifies signature                                      │   │
│    │ 2. Decrypts response                                       │   │
│    │ 3. Extracts: orderid, transactionid, auth_status          │   │
│    │ 4. Finds reservation by bookingId                          │   │
│    │ 5. Updates based on auth_status:                           │   │
│    │                                                            │   │
│    │    ┌─────────────────────────────────────────────┐        │   │
│    │    │ auth_status = 0300 (Success)                │        │   │
│    │    │ - reservation.status = 'reserved'           │        │   │
│    │    │ - reservation.paymentStatus = 'paid'        │        │   │
│    │    │ - reservation.expiresAt = null              │        │   │
│    │    │ - paymentTransaction.status = 'success'     │        │   │
│    │    │ - Redirect: /booking-successfull            │        │   │
│    │    └─────────────────────────────────────────────┘        │   │
│    │                                                            │   │
│    │    ┌─────────────────────────────────────────────┐        │   │
│    │    │ auth_status = 0399 (Failed)                 │        │   │
│    │    │ - reservation.status = 'cancelled'          │        │   │
│    │    │ - reservation.paymentStatus = 'failed'      │        │   │
│    │    │ - paymentTransaction.status = 'failed'      │        │   │
│    │    │ - Redirect: /booking-failed                 │        │   │
│    │    └─────────────────────────────────────────────┘        │   │
│    │                                                            │   │
│    │    ┌─────────────────────────────────────────────┐        │   │
│    │    │ auth_status = 0002 (Pending)                │        │   │
│    │    │ - reservation.status = 'pre-reserved'       │        │   │
│    │    │ - reservation.paymentStatus = 'pending'     │        │   │
│    │    │ - paymentTransaction.status = 'pending'     │        │   │
│    │    │ - Redirect: /booking-pending                │        │   │
│    │    └─────────────────────────────────────────────┘        │   │
│    │                                                            │   │
│    │    ┌─────────────────────────────────────────────┐        │   │
│    │    │ auth_status = 0398 (User Cancelled)         │        │   │
│    │    │ - reservation.status = 'cancelled'          │        │   │
│    │    │ - reservation.paymentStatus = 'cancelled'   │        │   │
│    │    │ - paymentTransaction.status = 'cancelled'   │        │   │
│    │    │ - Redirect: /booking-failed                 │        │   │
│    │    └─────────────────────────────────────────────┘        │   │
│    │                                                            │   │
│    │ 6. Saves updates to database                              │   │
│    │ 7. Logs email notification (placeholder)                  │   │
│    │ 8. Redirects user to appropriate page                     │   │
│    └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 6. USER SEES RESULT                                                  │
│                                                                       │
│    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│    │   ✅ SUCCESS    │  │   ❌ FAILED     │  │  ⏳ PENDING     │   │
│    │                 │  │                 │  │                 │   │
│    │ Booking         │  │ Payment         │  │ Payment         │   │
│    │ Confirmed!      │  │ Failed          │  │ Processing      │   │
│    │                 │  │                 │  │                 │   │
│    │ Booking ID:     │  │ Try again       │  │ Will notify     │   │
│    │ BK2109072510008 │  │                 │  │ when complete   │   │
│    └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Database State Changes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RESERVATION STATUS FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

Initial State:
┌──────────────────────────────────────────────────────────────┐
│ Reservation                                                  │
│ - status: 'pre-reserved'                                     │
│ - paymentStatus: 'unpaid'                                    │
│ - expiresAt: now + 15 mins                                   │
│ - bookingId: 'BK2109072510008'                               │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  Payment Initiated
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ PaymentTransaction                                           │
│ - status: 'initiated'                                        │
│ - bookingId: 'BK2109072510008'                               │
│ - amount: 5400.00                                            │
│ - traceId: 'TID...'                                          │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  User Pays on BillDesk
                           │
        ┌──────────────────┼──────────────────┬──────────────┐
        │                  │                  │              │
        ▼                  ▼                  ▼              ▼
   ┌─────────┐      ┌─────────┐       ┌─────────┐    ┌─────────┐
   │ SUCCESS │      │ FAILED  │       │ PENDING │    │CANCELLED│
   │  0300   │      │  0399   │       │  0002   │    │  0398   │
   └────┬────┘      └────┬────┘       └────┬────┘    └────┬────┘
        │                │                 │              │
        ▼                ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Reservation  │  │ Reservation  │  │ Reservation  │  │ Reservation  │
│ status:      │  │ status:      │  │ status:      │  │ status:      │
│ 'reserved'   │  │ 'cancelled'  │  │'pre-reserved'│  │ 'cancelled'  │
│              │  │              │  │              │  │              │
│ payment:     │  │ payment:     │  │ payment:     │  │ payment:     │
│ 'paid'       │  │ 'failed'     │  │ 'pending'    │  │ 'cancelled'  │
│              │  │              │  │              │  │              │
│ expiresAt:   │  │ expiresAt:   │  │ expiresAt:   │  │ expiresAt:   │
│ null         │  │ unchanged    │  │ unchanged    │  │ unchanged    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
        │                │                 │              │
        ▼                ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Payment      │  │ Payment      │  │ Payment      │  │ Payment      │
│ Transaction  │  │ Transaction  │  │ Transaction  │  │ Transaction  │
│ status:      │  │ status:      │  │ status:      │  │ status:      │
│ 'success'    │  │ 'failed'     │  │ 'pending'    │  │ 'cancelled'  │
│              │  │              │  │              │  │              │
│ transaction  │  │ error:       │  │ Need to      │  │              │
│ ID stored    │  │ stored       │  │ verify later │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
        │                │                 │              │
        ▼                ▼                 ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Room Status  │  │ Room Status  │  │ Room Status  │  │ Room Status  │
│ BLOCKED      │  │ AVAILABLE    │  │ BLOCKED      │  │ AVAILABLE    │
│ for user     │  │ (released)   │  │ (temp)       │  │ (released)   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Expiry Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRE-RESERVATION EXPIRY                            │
└─────────────────────────────────────────────────────────────────────┘

Pre-reservation created
expiresAt = now + 15 mins
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                    15 MINUTE TIMER                            │
│                                                               │
│  ⏰ 00:00 ────────────────────────────────────────► 15:00    │
│                                                               │
│  User has 15 minutes to complete payment                     │
└───────────────────────────────────────────────────────────────┘
        │
        ├─────────────────┬─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Payment      │  │ Payment      │  │ Timer        │
│ Completed    │  │ Initiated    │  │ Expires      │
│ (< 15 mins)  │  │ (< 15 mins)  │  │ (> 15 mins)  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Reservation  │  │ User on      │  │ Reservation  │
│ Confirmed    │  │ BillDesk     │  │ Should be    │
│              │  │ payment page │  │ Cancelled    │
│ expiresAt    │  │              │  │              │
│ cleared      │  │ Allow to     │  │ Room         │
│              │  │ complete     │  │ Released     │
└──────────────┘  └──────────────┘  └──────────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ CRON JOB     │
                                    │ (Future)     │
                                    │              │
                                    │ Runs every   │
                                    │ 5 minutes    │
                                    │              │
                                    │ Finds:       │
                                    │ - status:    │
                                    │   pre-reserved│
                                    │ - expiresAt  │
                                    │   < now      │
                                    │              │
                                    │ Updates to:  │
                                    │ - status:    │
                                    │   cancelled  │
                                    └──────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ERROR SCENARIOS                               │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 1. Reservation Not Found                                     │
│    - User tries to pay with invalid bookingId                │
│    - Response: 404 "Reservation not found"                   │
│    - Action: Show error, redirect to home                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 2. Reservation Expired                                       │
│    - User tries to pay after 15 mins                         │
│    - Response: 400 "Reservation has expired"                 │
│    - Action: Show error, suggest new booking                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 3. Invalid Signature                                         │
│    - BillDesk callback with wrong signature                  │
│    - Response: Redirect to /booking-failed?error=invalid     │
│    - Action: Log error, alert admin                          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 4. Decryption Failed                                         │
│    - Cannot decrypt BillDesk response                        │
│    - Response: Redirect to /booking-failed?error=decrypt     │
│    - Action: Log error, manual verification needed           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 5. BillDesk API Error                                        │
│    - BillDesk API returns error                              │
│    - Response: Show error message                            │
│    - Action: User can retry, contact support                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 6. Database Error                                            │
│    - Cannot save to database                                 │
│    - Response: 500 error                                     │
│    - Action: Log error, retry, alert admin                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Future Enhancements

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEBHOOK FLOW (Future)                             │
└─────────────────────────────────────────────────────────────────────┘

User completes payment
        │
        ├──────────────────┬──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐    ┌──────────────┐  ┌──────────────┐
│ Callback     │    │ Webhook      │  │ User closes  │
│ (Sync)       │    │ (Async)      │  │ browser      │
│              │    │              │  │              │
│ User waits   │    │ Background   │  │ No callback  │
│ for redirect │    │ processing   │  │ received     │
└──────────────┘    └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Both update same     │
                │ reservation          │
                │                      │
                │ Idempotency check:   │
                │ - If already updated │
                │   skip processing    │
                └──────────────────────┘
```

This visual flow helps understand the complete payment integration process!
