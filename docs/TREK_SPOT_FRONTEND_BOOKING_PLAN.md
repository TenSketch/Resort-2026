# Trek Spot Frontend Booking Implementation Plan

## 📋 Overview
Implement complete trek spot booking flow from frontend to payment gateway, following the tent booking pattern.

---

## 🎯 Current State vs Target State

### Current State:
- ✅ Admin booking works (saves directly with status: reserved, paymentStatus: paid)
- ❌ Frontend booking incomplete
- ❌ No payment integration for frontend
- ❌ Visit date allows past/today selection

### Target State:
- ✅ Frontend booking creates reservation with status: pending, paymentStatus: unpaid
- ✅ Payment gateway integration (BillDesk)
- ✅ After payment: status: reserved, paymentStatus: paid
- ✅ Visit date validation (no past/today)
- ✅ Payment transaction ID stored

---

## 📂 Files to Modify/Create

### Backend:
1. ✅ `backend/models/touristSpotReservationModel.js` - Already updated
2. ✅ `backend/controllers/touristSpotReservationController.js` - Already has createReservation
3. ⚠️ `backend/controllers/trekPaymentController.js` - **NEEDS TO BE CREATED**
4. ✅ `backend/routes/touristPaymentRoutes.js` - Already exists (but check if correct)
5. ⚠️ `backend/index.js` - **CHECK IF ROUTE IS REGISTERED**

### Frontend:
1. ⚠️ `frontend/src/app/modules/tourist-spots-booking/tourist-spots-booking.component.ts` - Add date validation
2. ⚠️ `frontend/src/app/modules/tourist-spots-booking/tourist-spots-booking.component.html` - Update date picker
3. ⚠️ `frontend/src/app/modules/tourist-spots-checkout/tourist-spots-checkout.component.ts` - Add payment flow
4. ✅ `frontend/src/payment-redirect.html` - Already exists

---

## 🔄 Complete Flow

### Step 1: User Selects Trek Spots
**File:** `tourist-spots-booking.component.ts`

```typescript
// Add date validation
minDate = new Date();
visitDate: Date;

ngOnInit() {
  // Set minDate to tomorrow
  this.minDate.setDate(this.minDate.getDate() + 1);
}

// Validate visit date
validateVisitDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(this.visitDate);
  selected.setHours(0, 0, 0, 0);
  
  if (selected <= today) {
    alert('Visit date must be tomorrow or later');
    return false;
  }
  return true;
}
```

---

### Step 2: User Proceeds to Checkout
**File:** `tourist-spots-checkout.component.ts`

**Current Data Structure:**
```typescript
bookingData = {
  spots: [
    {
      id: 'spot_id',
      name: 'Trek Name',
      counts: { adults: 3, cameras: 2 },
      breakdown: { entry: 2400, camera: 1000, total: 3400 }
    }
  ],
  total: 5550,
  visitDate: '2026-02-10'
}
```

**Transform to Backend Format:**
```typescript
prepareBookingPayload() {
  return {
    spots: this.bookingData.spots.map(spot => ({
      id: spot.id,
      name: spot.name,
      counts: {
        adults: spot.counts.adults || 0,
        cameras: spot.counts.cameras || 0,
        vehicles: 0,
        twoWheelers: 0,
        fourWheelers: 0
      },
      breakdown: {
        entry: spot.breakdown.entry || 0,
        camera: spot.breakdown.camera || 0,
        parking: 0,
        addOns: 0,
        total: spot.breakdown.total || 0
      },
      addOns: []
    })),
    total: this.bookingData.total,
    visitDate: this.bookingData.visitDate,
    customer: {
      gname: this.form.value.gname,
      gemail: this.form.value.gemail,
      gphone: this.form.value.gphone,
      gaddress: this.form.value.gaddress,
      gcity: this.form.value.gcity,
      gstate: this.form.value.gstate,
      gpincode: this.form.value.gpincode,
      gcountry: this.form.value.gcountry
    }
  };
}
```

---

### Step 3: Create Reservation (Pending)
**API Call:** `POST /api/trek-reservations/book`

**Request:**
```json
{
  "spots": [...],
  "total": 5550,
  "visitDate": "2026-02-10",
  "customer": {...}
}
```

**Response:**
```json
{
  "success": true,
  "bookingId": "TS-260209-723",
  "reservation": {...}
}
```

**Backend Logic** (`createReservation` in `touristSpotReservationController.js`):
- ✅ Generate booking ID
- ✅ Set status: 'pending'
- ✅ Set paymentStatus: 'unpaid'
- ✅ Set expiresAt: 15 minutes from now
- ✅ Map customer data to user object
- ✅ Map spots to touristSpots array
- ✅ Save reservation

---

### Step 4: Initiate Payment
**API Call:** `POST /api/trek-payment/initiate`

**File:** `backend/controllers/trekPaymentController.js` **(TO BE CREATED)**

**Request:**
```json
{
  "bookingId": "TS-260209-723"
}
```

**Backend Logic:**
```javascript
export const initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // 1. Find reservation
    const reservation = await TouristSpotReservation.findOne({ bookingId });
    if (!reservation) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // 2. Check if already paid
    if (reservation.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Already paid' });
    }
    
    // 3. Check if expired
    if (reservation.expiresAt && new Date() > reservation.expiresAt) {
      return res.status(400).json({ error: 'Booking expired' });
    }
    
    // 4. Create BillDesk order
    const orderData = {
      mercid: process.env.BILLDESK_MERCHANT_ID,
      orderid: bookingId,
      amount: reservation.totalPayable.toFixed(2),
      currency: '356', // INR
      ru: `${process.env.FRONTEND_URL}/trek-booking-confirmation`,
      itemcode: 'TREK',
      // ... other BillDesk params
    };
    
    // 5. Encrypt and send to BillDesk
    const encryptedData = encryptBilldesk(orderData);
    
    res.json({
      success: true,
      action: process.env.BILLDESK_URL,
      parameters: { msg: encryptedData }
    });
    
  } catch (err) {
    console.error('Payment initiation error:', err);
    res.status(500).json({ error: err.message });
  }
};
```

---

### Step 5: Redirect to Payment Gateway
**File:** `tourist-spots-checkout.component.ts`

```typescript
async initiatePayment() {
  try {
    // 1. Create reservation
    const bookingRes = await this.http.post('/api/trek-reservations/book', 
      this.prepareBookingPayload()
    ).toPromise();
    
    const bookingId = bookingRes.bookingId;
    
    // 2. Initiate payment
    const paymentRes = await this.http.post('/api/trek-payment/initiate', 
      { bookingId }
    ).toPromise();
    
    // 3. Redirect to payment gateway
    const paymentData = encodeURIComponent(JSON.stringify(paymentRes));
    window.location.href = `/payment-redirect.html?data=${paymentData}`;
    
  } catch (err) {
    console.error('Payment error:', err);
    alert('Payment initiation failed');
  }
}
```

---

### Step 6: Payment Callback
**API:** `POST /api/trek-payment/callback`

**File:** `backend/controllers/trekPaymentController.js`

```javascript
export const handlePaymentCallback = async (req, res) => {
  try {
    // 1. Decrypt BillDesk response
    const decrypted = decryptBilldesk(req.body.msg);
    
    // 2. Parse response
    const parts = decrypted.split('|');
    const bookingId = parts[1];
    const status = parts[14]; // 0300 = success
    const transactionId = parts[2];
    
    // 3. Find reservation
    const reservation = await TouristSpotReservation.findOne({ bookingId });
    if (!reservation) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // 4. Update reservation
    if (status === '0300') {
      reservation.status = 'reserved';
      reservation.paymentStatus = 'paid';
      reservation.paymentTransactionId = transactionId;
      reservation.expiresAt = null; // Remove expiry
    } else {
      reservation.status = 'failed';
      reservation.paymentStatus = 'failed';
    }
    
    reservation.rawSource = decrypted;
    await reservation.save();
    
    // 5. Send email confirmation (optional)
    // await sendBookingConfirmation(reservation);
    
    // 6. Redirect to confirmation page
    res.redirect(`${process.env.FRONTEND_URL}/trek-booking-confirmation?bookingId=${bookingId}`);
    
  } catch (err) {
    console.error('Payment callback error:', err);
    res.status(500).json({ error: err.message });
  }
};
```

---

### Step 7: Booking Confirmation Page
**File:** `frontend/src/app/modules/trek-booking-confirmation/`

**Display:**
- ✅ Booking ID
- ✅ Trek spots booked
- ✅ Visit date
- ✅ Guest details
- ✅ Payment status
- ✅ Transaction ID
- ✅ Total amount paid

---

## 🔧 Implementation Checklist

### Phase 1: Date Validation (Frontend)
- [ ] Update `tourist-spots-booking.component.ts`
  - [ ] Set minDate to tomorrow
  - [ ] Add validateVisitDate() method
  - [ ] Call validation before proceeding
- [ ] Update `tourist-spots-booking.component.html`
  - [ ] Add [min]="minDate" to date picker
  - [ ] Disable past dates

### Phase 2: Backend Payment Controller
- [ ] Create `backend/controllers/trekPaymentController.js`
  - [ ] Import TouristSpotReservation model
  - [ ] Import BillDesk crypto functions
  - [ ] Implement initiatePayment()
  - [ ] Implement handlePaymentCallback()
  - [ ] Implement retrieveTransactionStatus()
- [ ] Verify `backend/routes/touristPaymentRoutes.js` exists
- [ ] Register route in `backend/index.js`
  ```javascript
  import trekPaymentRouter from './routes/touristPaymentRoutes.js';
  app.use('/api/trek-payment', trekPaymentRouter);
  ```

### Phase 3: Frontend Checkout Integration
- [ ] Update `tourist-spots-checkout.component.ts`
  - [ ] Add prepareBookingPayload() method
  - [ ] Add initiatePayment() method
  - [ ] Update onOk() to call initiatePayment()
  - [ ] Handle errors gracefully
- [ ] Test booking creation
- [ ] Test payment initiation
- [ ] Test payment redirect

### Phase 4: Payment Callback Handling
- [ ] Test payment callback
- [ ] Verify reservation update
- [ ] Test success scenario
- [ ] Test failure scenario
- [ ] Test expired booking scenario

### Phase 5: Confirmation Page
- [ ] Create trek-booking-confirmation component
- [ ] Fetch booking details by bookingId
- [ ] Display all booking information
- [ ] Add download invoice button
- [ ] Add view in My Bookings link

---

## 🔍 Key Differences from Tent Booking

| Feature | Tent Booking | Trek Booking |
|---------|-------------|--------------|
| Model | TentReservation | TouristSpotReservation |
| Booking ID | TENT-YYMMDD-SEQ | TS-YYMMDD-SEQ |
| Route Prefix | /api/tent-payment | /api/trek-payment |
| Controller | tentPaymentController | trekPaymentController |
| Item Code | TENT | TREK |
| Spots Array | tentSpots | touristSpots |
| Counts | guests, cameras | adults, cameras, vehicles |

---

## 🧪 Testing Scenarios

### 1. Date Validation
- [ ] Try selecting today → Should be disabled
- [ ] Try selecting yesterday → Should be disabled
- [ ] Select tomorrow → Should work
- [ ] Select 3 months ahead → Should work

### 2. Booking Creation
- [ ] Create booking with 1 spot → Check DB
- [ ] Create booking with 2 spots → Check DB
- [ ] Verify status: pending
- [ ] Verify paymentStatus: unpaid
- [ ] Verify expiresAt is set

### 3. Payment Flow
- [ ] Initiate payment → Check redirect
- [ ] Complete payment → Check callback
- [ ] Verify status: reserved
- [ ] Verify paymentStatus: paid
- [ ] Verify transactionId saved

### 4. Edge Cases
- [ ] Expired booking → Should fail
- [ ] Already paid → Should fail
- [ ] Invalid booking ID → Should fail
- [ ] Payment failure → Status should be failed

---

## 📝 Environment Variables Needed

```env
# BillDesk Configuration
BILLDESK_MERCHANT_ID=your_merchant_id
BILLDESK_SECURITY_ID=your_security_id
BILLDESK_URL=https://uat.billdesk.com/pgidsk/PGIMerchantPayment
BILLDESK_CHECKSUM_KEY=your_checksum_key

# Frontend URL
FRONTEND_URL=http://localhost:4200
```

---

## 🚀 Implementation Order

1. **Date Validation** (Easiest, no backend changes)
2. **Backend Payment Controller** (Core logic)
3. **Frontend Checkout Integration** (Connect to backend)
4. **Payment Callback** (Handle responses)
5. **Confirmation Page** (Display results)
6. **Testing** (End-to-end)

---

## 📌 Notes

- Follow tent booking pattern exactly
- Reuse BillDesk crypto functions
- Keep error handling consistent
- Add proper logging for debugging
- Test with BillDesk UAT environment first
- Add email notifications (optional)
- Consider SMS notifications (optional)

---

## ✅ Success Criteria

- [ ] User cannot select past/today dates
- [ ] Booking creates with status: pending
- [ ] Payment gateway opens correctly
- [ ] Successful payment updates status to reserved
- [ ] Failed payment updates status to failed
- [ ] Transaction ID is stored
- [ ] User receives confirmation
- [ ] Booking appears in My Bookings
- [ ] Admin can see booking in admin panel
