# Trek Spot Admin Booking Implementation

## Overview
Complete implementation of the Trek Spot (Tourist Spot) booking form for the admin panel, following the same pattern as the Reservation Form.

---

## ✅ Implementation Summary

### Backend Changes

#### 1. **Updated Model** (`backend/models/touristSpotReservationModel.js`)
- Added `guests` field (total guests count)
- Added `address2` field for user details
- Added `reservationDate` field (when booking was made)
- Added `reservedFrom` field: 'Online', 'Admin', 'Phone', 'Walk-in'
- Added `internalNotes` field for admin use
- Updated status enum to include 'not-reserved'
- Updated paymentStatus enum to include 'cancelled'
- Removed vehicle-related fields (vehicleType, vehicleCount)

#### 2. **New Controller Function** (`backend/controllers/touristSpotReservationController.js`)
- Created `createAdminReservation()` function
- Auto-generates booking ID: `TS-YYMMDD-SEQ`
- Fetches selected trek spots from database
- Auto-calculates pricing:
  - Entry Fees = guests × spot.entryFees
  - Camera Fees = cameras × spot.cameraFees
  - Grand Total = entry fees + camera fees
- Validates required fields
- Supports multi-select trek spots
- No expiry time for admin bookings

#### 3. **New API Route** (`backend/routes/touristSpotReservationRoutes.js`)
- Added `POST /api/tourist-booking/admin-create`
- Protected with `adminAuth` middleware
- Separate from public booking endpoint

---

### Frontend Implementation

#### **New Component** (`admin/src/components/touristBookings/AddTouristBooking.tsx`)

##### Form Structure:

**1. Trek Spot Section**
- Multi-select dropdown with search
- Fetches all trek spots from API
- Supports selecting multiple spots

**2. Booking Details Section**
- Visit Date: Cannot select past or today (min: tomorrow, max: 90 days)
- No. of Guests: Number input (min: 1, required)
- No. of Cameras: Number input (min: 0)
- Reservation Date: Auto-filled with today's date
- Status: Dropdown (Reserved, Pending, Not Reserved, Cancelled)
- Payment Status: Dropdown (Paid, Unpaid, Cancelled)
- Booking ID: Auto-generated, read-only

**3. User Details Section**
- Add Existing User: Dropdown with search (auto-fills all fields)
- Full Name: Required
- Phone: Required
- Email: Optional
- Address Line 1 & 2
- City, State, Postal Code
- Country: Dropdown

**4. Trek Amount Section** (Auto-calculated)
- Entry Fees: Calculated from guests × entryFees
- Camera Fees: Calculated from cameras × cameraFees (shows only if > 0)
- Grand Total: Sum of entry fees + camera fees

**5. Internal Notes**
- Textarea for admin notes

---

## Key Features

### ✨ Auto-Calculations
- Real-time pricing updates when:
  - Trek spots are selected/deselected
  - Guest count changes
  - Camera count changes
- Fetches pricing from selected trek spots
- Calculates per-spot and total amounts

### ✨ Smart Form Behavior
- Auto-generates unique booking ID on load
- Auto-fills today's date for reservation date
- Conditionally shows camera fees only when > 0
- Existing user selection auto-fills all user details

### ✨ Validations
- At least one trek spot must be selected
- Visit date cannot be in past or today
- Guest count must be ≥ 1
- Full name and phone are required
- Date range: tomorrow to 90 days ahead

---

## API Integration

### Endpoints Used:

**GET** `/api/tourist-spots`
- Fetches all trek spots with pricing
- Used for dropdown and calculations

**GET** `/api/user/all`
- Fetches all registered users
- Used for "Add Existing User" dropdown

**POST** `/api/tourist-booking/admin-create`
- Creates new trek spot booking
- Admin-protected endpoint
- Returns booking ID and confirmation

---

## Data Flow

```
1. Admin selects trek spots
   ↓
2. Form fetches spot pricing from API
   ↓
3. Admin enters guest/camera counts
   ↓
4. Frontend calculates amounts in real-time
   ↓
5. Admin fills user details (or selects existing user)
   ↓
6. On submit, sends to backend
   ↓
7. Backend validates and recalculates amounts
   ↓
8. Backend saves to database
   ↓
9. Returns booking ID to frontend
```

---

## Comparison with Reservation Form

| Feature | Reservation Form | Trek Booking Form |
|---------|------------------|-------------------|
| Main Selection | Resort → Cottage Types → Rooms | Trek Spots (multi-select) |
| Date Validation | Resort-specific (today/tomorrow) | Always tomorrow onwards |
| Pricing | Room rates + extra bed charges | Entry fees + Camera fees |
| Guest Limits | Based on room capacity | No limits |
| Booking ID Format | Resort initials + timestamp | TS-YYMMDD-SEQ |
| Multi-select | Rooms only | Trek spots |

---

## Testing Checklist

- [ ] Trek spots load in dropdown
- [ ] Multi-select works correctly
- [ ] Visit date validation (no past/today)
- [ ] Auto-calculation updates in real-time
- [ ] Existing user auto-fills details
- [ ] Booking ID auto-generates
- [ ] Form submission creates booking
- [ ] Success message shows booking ID
- [ ] Form resets after submission
- [ ] Validation errors display correctly

---

## Next Steps

1. Test the form in the admin panel
2. Verify booking appears in tourist bookings list
3. Add edit/view functionality if needed
4. Consider adding booking confirmation email
5. Add permission checks if needed

---

## Files Modified

### Backend:
- `backend/models/touristSpotReservationModel.js` - Updated schema
- `backend/controllers/touristSpotReservationController.js` - Added createAdminReservation
- `backend/routes/touristSpotReservationRoutes.js` - Added admin-create route

### Frontend:
- `admin/src/components/touristBookings/AddTouristBooking.tsx` - Complete rewrite

---

## Notes

- The form follows the exact same pattern as ReservationForm.tsx
- All calculations happen both frontend (for display) and backend (for validation)
- Backend recalculates amounts to prevent tampering
- Multi-spot booking supported (calculates fees for each spot)
- Admin-specific fields like `reservedFrom` and `internalNotes` included
- No expiry time set for admin bookings (unlike online bookings)
- Vehicle-related fields removed as per requirements
