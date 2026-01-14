# Tent Reservation System

## Overview
The tent reservation system is completely separate from the room reservation system, with its own models, controllers, and routes.

## Backend Implementation

### Models

#### TentReservation Model (`backend/models/tentReservationModel.js`)
Separate model for tent bookings with the following key fields:
- `tentSpot`: Reference to TentSpot
- `tents`: Array of Tent references
- `checkinDate` / `checkoutDate`: Booking dates
- `guests`: Number of guests
- `status`: pending, confirmed, cancelled, completed
- `bookingId`: Unique booking identifier (format: TENT-{timestamp}-{random})
- `paymentStatus`: unpaid, paid, failed, pending, refunded
- `fullName`, `phone`, `email`: Guest information
- `expiresAt`: 15-minute expiry for pending bookings

### Controllers

#### TentReservation Controller (`backend/controllers/tentReservationController.js`)
Handles all tent reservation operations:
- `createTentReservation`: Create new tent booking with availability check
- `getAllTentReservations`: Get all reservations (with filters)
- `getTentReservationById`: Get by MongoDB ID
- `getTentReservationByBookingId`: Get by booking ID
- `updateTentReservation`: Update reservation details
- `updatePaymentStatus`: Update payment and confirm booking
- `cancelTentReservation`: Cancel with refund calculation
- `deleteTentReservation`: Hard delete
- `expirePendingTentReservations`: Cron job to expire unpaid bookings

#### Tent Controller Updates (`backend/controllers/tentController.js`)
- `getAvailableTents`: Check tent availability using TentReservation model
  - Filters by tent spot and date range
  - Returns only tents not booked during requested period

### Routes

#### Tent Reservation Routes (`backend/routes/tentReservationRoutes.js`)
```
POST   /api/tent-reservations              - Create reservation (public)
GET    /api/tent-reservations/booking/:id  - Get by booking ID (public)
GET    /api/tent-reservations              - Get all (admin)
GET    /api/tent-reservations/:id          - Get by ID (admin)
PUT    /api/tent-reservations/:id          - Update (admin)
PATCH  /api/tent-reservations/:id/payment  - Update payment
PATCH  /api/tent-reservations/:id/cancel   - Cancel (admin)
DELETE /api/tent-reservations/:id          - Delete (admin)
```

#### Tent Routes Updates (`backend/routes/tentRoutes.js`)
```
GET /api/tents/available?tentSpotId=xxx&checkinDate=xxx&checkoutDate=xxx
```

### Cron Jobs
Added to `backend/index.js`:
- Runs every minute to expire pending tent reservations
- Separate from room reservation expiry

## Frontend Implementation

### Services

#### TentSpotService (`frontend/src/app/services/tent-spot.service.ts`)
- `getAllTentSpots()`: Get all tent spots
- `getTentSpotById(id)`: Get specific tent spot

#### TentService Updates (`frontend/src/app/services/tent.service.ts`)
- `getAllTents()`: Get all tents
- `getTentsBySpot(tentSpotId)`: Get tents by spot
- `getAvailableTents(tentSpotId, checkinDate, checkoutDate)`: Get available tents

#### TentReservationService (`frontend/src/app/services/tent-reservation.service.ts`)
- `createReservation(data)`: Create new reservation
- `getReservationByBookingId(id)`: Get reservation details
- `updatePaymentStatus(id, data)`: Update payment
- `cancelReservation(id, refund)`: Cancel reservation

### Components

#### SearchTentComponent (`frontend/src/app/shared/search-tent/`)
New search component specifically for tents:
- Select Tent Spot (replaces "Select Resort")
- Check-in date (disabled until tent spot selected)
- Check-out date (disabled until check-in selected)
- Emits search criteria to parent component

#### BookTentComponent Updates (`frontend/src/app/modules/book-tent/`)
- Uses `SearchTentComponent` instead of `SearchResortComponent`
- Loads tents only after search is performed
- "Add tent" button disabled until dates are selected
- Shows appropriate messages:
  - Before search: "Select a tent spot and dates to view available tents"
  - Loading: Spinner with "Loading available tents..."
  - No results: "No tents available for the selected dates"
  - Results: Available tents with "Add tent" button enabled

### User Flow

1. User selects a tent spot from dropdown
2. Check-in date field becomes enabled
3. User selects check-in date
4. Check-out date field becomes enabled (min date = check-in + 1 day)
5. User selects check-out date
6. User clicks "Search" button
7. System fetches available tents for that spot and date range
8. Available tents are displayed
9. "Add tent" buttons are now enabled
10. User adds tents to booking summary
11. User proceeds to checkout

## Key Features

### Availability Logic
- Checks for overlapping reservations in TentReservation collection
- Three overlap scenarios:
  1. Reservation starts during requested period
  2. Reservation ends during requested period
  3. Reservation spans entire requested period
- Only shows tents with no overlapping confirmed/pending bookings

### Booking Expiry
- Pending bookings expire after 15 minutes
- Automatic cleanup via cron job
- Prevents tent blocking without payment

### Separation from Room Bookings
- Completely separate database collections
- Independent booking IDs (TENT- prefix)
- Separate controllers and routes
- No mixing of tent and room data

## Environment Configuration

### Frontend (`frontend/src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  API_URL: 'http://localhost:5000',
  apiUrl: 'http://localhost:5000/api'
};
```

## Database Indexes
TentReservation model includes indexes for:
- `tentSpot`, `checkinDate`, `checkoutDate` (compound)
- `bookingId`
- `status`
- `expiresAt`

## Next Steps
1. Implement tent checkout page
2. Integrate payment gateway for tent bookings
3. Add email notifications for tent reservations
4. Create admin panel for tent reservation management
5. Add cancellation policy enforcement
6. Implement refund processing
