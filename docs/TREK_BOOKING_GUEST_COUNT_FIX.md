# Trek Booking Guest Count Fix

## Date: February 9, 2026

## Problem Summary

Trek bookings were showing **0 guests** in:
1. Booking confirmation page
2. Email confirmations (user and admin)
3. My Bookings page not showing trek bookings at all

## Root Cause

The data structure in the database uses `counts.adults` and `counts.children` instead of `counts.guests`:

```json
{
  "touristSpots": [{
    "counts": {
      "cameras": 2,
      "adults": 1,      // ← Actual guest count here
      "children": 0,    // ← Children count here
      "guests": 0       // ← This is always 0!
    }
  }]
}
```

The code was only checking `counts.guests` which was always 0, instead of calculating `adults + children`.

---

## Fixes Applied

### 1. Trek Email Service
**File**: `backend/services/trekReservationEmailService.js`

**Change**: Calculate guests from adults + children
```javascript
// Before
const guests = spot.counts?.guests || 0;

// After
const adults = spot.counts?.adults || 0;
const children = spot.counts?.children || 0;
const guests = spot.counts?.guests || (adults + children);
```

**Impact**: Emails now show correct guest counts

---

### 2. Booking Status Component
**File**: `frontend/src/app/modules/booking-status/booking-status.component.ts`

**Changes**:

#### processTrekBooking() Method
```javascript
// Calculate total guests correctly
const totalGuests = booking.touristSpots?.reduce((sum: number, s: any) => {
  const adults = s.counts?.adults || 0;
  const children = s.counts?.children || 0;
  const guests = s.counts?.guests || (adults + children);
  return sum + guests;
}, 0) || 0;
```

#### processRoomBooking() Method (for trek bookings coming through room path)
```javascript
if (isTouristSpot) {
  // Calculate total guests (adults + children across all spots)
  totalGuests = booking.touristSpots.reduce((sum: number, s: any) => {
    const adults = s.counts?.adults || 0;
    const children = s.counts?.children || 0;
    const guests = s.counts?.guests || (adults + children);
    return sum + guests;
  }, 0);
}
```

**Impact**: Booking confirmation page now shows correct guest counts

---

### 3. My Bookings Component
**File**: `frontend/src/app/modules/my-bookings/my-bookings.component.ts`

**Change**: Calculate guests from adults + children
```javascript
const totalGuests = booking.touristSpots?.reduce((sum: number, s: any) => {
  const adults = s.counts?.adults || 0;
  const children = s.counts?.children || 0;
  const guests = s.counts?.guests || (adults + children);
  return sum + guests;
}, 0) || 0;
```

**Impact**: My Bookings page now shows correct guest counts for trek bookings

---

### 4. Backend API Response
**File**: `backend/controllers/touristSpotReservationController.js`

**Change**: Return `bookings` instead of `reservations` for consistency
```javascript
// Before
res.json({ success: true, reservations });

// After
res.json({ success: true, bookings: reservations });
```

**Impact**: My Bookings page can now fetch trek bookings (was failing silently before)

---

## Data Structure Explanation

### Database Schema
```javascript
touristSpots: [{
  counts: {
    guests: Number,      // Always 0 (not used)
    cameras: Number,     // Camera count
    adults: Number,      // ← Actual adult count
    children: Number,    // ← Actual children count
    vehicles: Number,    // Legacy field
    twoWheelers: Number, // Legacy field
    fourWheelers: Number // Legacy field
  }
}]
```

### Calculation Logic
```javascript
// For each spot
const adults = spot.counts?.adults || 0;
const children = spot.counts?.children || 0;
const guests = spot.counts?.guests || (adults + children);

// Total across all spots
const totalGuests = spots.reduce((sum, spot) => sum + guests, 0);
```

---

## Testing Results

### Before Fix
- Booking Status Page: **0 Guests** ❌
- Email: **0 Guests** ❌
- My Bookings: **Trek bookings not showing** ❌

### After Fix
- Booking Status Page: **Correct guest count** ✅
- Email: **Correct guest count** ✅
- My Bookings: **Trek bookings showing with correct counts** ✅

---

## Example Data

### Sample Booking
```json
{
  "bookingId": "TS-260209-003",
  "touristSpots": [
    {
      "name": "Soft Trek: Jalatarangi to G.M.Valasa",
      "counts": {
        "adults": 1,
        "children": 0,
        "cameras": 2,
        "guests": 0
      }
    },
    {
      "name": "Very Hard Trek: Jungle Star to Nellore",
      "counts": {
        "adults": 1,
        "children": 0,
        "cameras": 0,
        "guests": 0
      }
    }
  ]
}
```

### Calculated Values
- Spot 1: 1 adult + 0 children = **1 guest**
- Spot 2: 1 adult + 0 children = **1 guest**
- **Total: 2 guests** ✅

---

## Display Format

### Booking Status Page
```
Resort: Trek Spot Booking
Rooms Booked:
  - Soft Trek: Jalatarangi to G.M.Valasa (1 Guests, 2 Cameras)
  - Very Hard Trek: Jungle Star to Nellore (1 Guests, 0 Cameras)
Guests: 2
```

### Email
```
Tourist Spot(s): 
  Soft Trek: Jalatarangi to G.M.Valasa (1 guests, 2 cameras)
  Very Hard Trek: Jungle Star to Nellore (1 guests, 0 cameras)
Total Guests: 2
Total Cameras: 2
```

### My Bookings
```
Resort name: Tourist Spots
Room name: Soft Trek: Jalatarangi..., Very Hard Trek: Jungle Star...
Cottage type: Trek Entry
Guest info: 2 guests, 0 child, 0 extra guest
```

---

## Files Modified

### Backend
1. `backend/services/trekReservationEmailService.js` - Fixed guest calculation in emails
2. `backend/controllers/touristSpotReservationController.js` - Fixed API response format

### Frontend
1. `frontend/src/app/modules/booking-status/booking-status.component.ts` - Fixed guest display
2. `frontend/src/app/modules/my-bookings/my-bookings.component.ts` - Fixed guest calculation

---

## Backward Compatibility

The fix maintains backward compatibility:
```javascript
const guests = spot.counts?.guests || (adults + children);
```

- If `guests` field is populated in future: Uses that value
- If `guests` is 0 or missing: Calculates from adults + children
- Works with both old and new data structures

---

## Future Recommendations

### Option 1: Update Data on Save
Automatically calculate and save `guests` field:
```javascript
spot.counts.guests = spot.counts.adults + spot.counts.children;
```

### Option 2: Database Migration
Run a one-time migration to populate `guests` field:
```javascript
db.touristspotreservations.updateMany(
  {},
  [{
    $set: {
      "touristSpots.$[].counts.guests": {
        $add: [
          "$touristSpots.$[].counts.adults",
          "$touristSpots.$[].counts.children"
        ]
      }
    }
  }]
);
```

### Option 3: Keep Current Approach
Continue calculating on-the-fly (current solution) - simplest and most flexible.

---

## Success Criteria Met ✅

1. ✅ Booking status page shows correct guest count
2. ✅ Email shows correct guest count
3. ✅ My Bookings page displays trek bookings
4. ✅ Guest count calculated from adults + children
5. ✅ Backward compatible with existing data
6. ✅ Works across all spots in a booking
7. ✅ API response format fixed
8. ✅ No diagnostics errors

---

**Status**: ✅ COMPLETE - All guest count issues resolved
