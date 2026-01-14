# Booking Status and Error Handling Implementation

## Overview
Implemented proper booking status management and comprehensive error handling for the reservation and payment flow.

## Changes Made

### 1. Backend Changes (reservationModel.js)

#### Status Enum Update
Updated the `status` field enum to include:
- Added `pending` - New default status for bookings
- Added `confirmed` - For successful payment completion
- Added `not-reserved` - For expired bookings
- Changed default from `pre-reserved` to `pending`
- Kept legacy values (`pre-reserved`, `reserved`) for backward compatibility

### 2. Backend Changes (roomController.js)

#### Room Availability Filter
Updated `listAvailableRooms` function to:
- Only block rooms for reservations with status: `pending`, `reserved`, or `confirmed`
- Show rooms as available if reservation status is: `cancelled` or `not-reserved`
- This ensures expired/cancelled bookings don't block room availability

### 3. Backend Changes (reservationController.js)

#### Status Management
- **Initial Status**: Changed from `pre-reserved` to `pending`
- **Payment Status**: Remains `unpaid` initially
- **Expiry Time**: 15 minutes from creation

#### Auto-Expiry Function
Added `expirePendingReservations()` function that:
- Runs every minute via setInterval
- Finds all pending reservations with `expiresAt <= now`
- Updates status from `pending` to `not-reserved`
- Keeps paymentStatus as `unpaid`
- Makes rooms available again automatically

### 4. Backend Changes (index.js)

#### Periodic Expiry Check
- Imported `expirePendingReservations` function
- Set up interval to run every 60 seconds
- Runs once on server startup

### 5. Frontend Changes (booking-summary.component.ts)

#### Reservation Flow
1. User clicks "Confirm and Pay"
2. Create reservation with `pending` status
3. Immediately initiate payment
4. If payment fails, reservation expires in 15 minutes

#### Error Handling
Comprehensive error handling for both reservation creation and payment initiation:

**Reservation Creation Errors:**
- **400 Bad Request**: Invalid booking details
- **401 Unauthorized**: Session expired → redirect to login
- **403 Forbidden**: Permission denied
- **409 Conflict**: Rooms no longer available
- **500 Server Error**: Technical issues

**Payment Initiation Errors:**
- **400 Bad Request**: Invalid payment request
- **401 Unauthorized**: Session expired → redirect to login
- **403 Forbidden**: Payment gateway access denied
- **404 Not Found**: Payment service unavailable
- **409 Conflict**: Payment conflict
- **500 Server Error**: Payment gateway unavailable

#### User Experience
- Clear, user-friendly error messages
- Booking ID shown when relevant
- Automatic redirect to login on session expiry
- No reservation created if initial validation fails
- Reservation auto-expires if payment fails

## Status Flow

```
User Action → pending (15 min timer starts) [Room BLOCKED]
              ↓
              ├─→ Payment Success → confirmed [Room BLOCKED]
              │
              └─→ Payment Fails/Timeout (15 min) → not-reserved [Room AVAILABLE]
```

## Room Availability Logic

**Rooms are BLOCKED (not shown) when reservation status is:**
- `pending` - Reservation in progress, payment pending (15-minute window)
- `pre-reserved` - Legacy status for pending bookings
- `reserved` - Legacy status for confirmed bookings
- `confirmed` - Payment completed, booking confirmed

**Rooms are AVAILABLE (shown) when reservation status is:**
- `not-reserved` - Reservation expired or never completed
- `cancelled` - Booking was cancelled by user/admin
- `completed` - Past booking that has been completed
- No reservation exists for those dates

## Reservation Status Enum Values

The Reservation model now supports these status values:
- `pending` - New default status for bookings awaiting payment
- `pre-reserved` - Legacy status (kept for backward compatibility)
- `reserved` - Legacy confirmed booking status
- `confirmed` - Payment completed successfully
- `cancelled` - Booking cancelled by user or admin
- `completed` - Booking has been completed (past check-out date)
- `not-reserved` - Booking expired without payment

## Benefits

1. **Room Availability**: Rooms automatically become available after 15 minutes if payment not completed
2. **User Clarity**: Clear error messages guide users on what to do
3. **No Orphan Bookings**: Pending reservations don't block rooms indefinitely
4. **Better UX**: Users know their booking ID even if payment fails
5. **Session Management**: Automatic redirect to login when session expires
6. **Technical Issues**: Graceful handling of payment gateway issues

## Testing Recommendations

1. Test reservation creation with valid data
2. Test payment initiation success flow
3. Test each error code (400, 401, 403, 404, 409, 500)
4. Verify auto-expiry after 15 minutes
5. Check room availability after expiry
6. Test session expiry during booking
7. Verify booking ID is shown in error messages
