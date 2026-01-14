# Tent Booking System Implementation

## Overview
Implement a tent booking system similar to room booking with tent spot selection and date-based availability.

## Requirements

### Frontend Changes
1. **Search Component**
   - Rename "Select Resort" to "Select Tent Spot"
   - Fetch tent spots from `/api/tent-spots`
   - Add Check-in and Check-out date pickers
   - Search button to fetch available tents

2. **Tent Listing**
   - Show all tents for selected tent spot (without dates)
   - Disable "Add tent" button with message: "Please select check-in and check-out dates"
   - After date selection, show only available tents
   - Enable "Add tent" button for available tents

3. **Tent Display**
   - Show tent details from database:
     - Tent ID
     - Tent Type (from tentType reference)
     - Tent Spot (from tentSpot reference)
     - No. of Guests
     - Rate
     - Images from Cloudinary
     - Amenities from tent type

### Backend Changes
1. **New Endpoint**: `/api/tents/available`
   - Query params: `tentSpotId`, `checkin`, `checkout`
   - Returns available tents for the date range
   - Excludes tents with overlapping bookings

2. **Booking Model** (if not exists)
   - Create tent booking model similar to room reservations
   - Fields: tent, tentSpot, checkIn, checkOut, status, etc.

## API Endpoints

### Get Tents by Tent Spot
```
GET /api/tents?tentSpotId=:id
Response: { success: true, tents: [...] }
```

### Get Available Tents
```
GET /api/tents/available?tentSpotId=:id&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD
Response: { success: true, tents: [...], totalTents: 10, availableTents: 7 }
```

## Implementation Steps

1. Update backend controller to add availability endpoint
2. Update frontend service to fetch tent spots
3. Update search component to use tent spots dropdown
4. Add date validation
5. Implement availability check
6. Update tent card to show availability status
7. Disable/enable "Add tent" button based on dates

## Similar to Room Booking
This follows the same pattern as room booking:
- Select location (tent spot instead of resort)
- Select dates
- Show available options
- Book and proceed to checkout
