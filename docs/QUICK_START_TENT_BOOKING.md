# Quick Start Guide - Tent Booking System

## Overview
The tent booking system allows users to:
1. Select a tent spot (location)
2. Choose check-in and check-out dates
3. View only available tents for those dates
4. Add tents to their booking

## How It Works

### User Flow
```
Select Tent Spot → Select Check-in Date → Select Check-out Date → Search → View Available Tents → Add to Booking
```

### Key Changes from Previous Implementation

#### Before
- "Select Resort" dropdown
- Tents loaded immediately on page load
- "Add tent" button always enabled
- No availability checking

#### After
- "Select Tent Spot" dropdown
- Tents loaded only after search
- "Add tent" button disabled until search performed
- Real-time availability checking against reservations

## Component Usage

### In Your Template
```html
<!-- Replace app-search-resort with app-search-tent -->
<app-search-tent (searchSubmitted)="onSearchSubmitted($event)"></app-search-tent>
```

### In Your Component
```typescript
onSearchSubmitted(criteria: { tentSpotId: string; checkinDate: string; checkoutDate: string }): void {
  this.tentService.getAvailableTents(
    criteria.tentSpotId,
    criteria.checkinDate,
    criteria.checkoutDate
  ).subscribe({
    next: (response) => {
      this.tents = response.tents;
    }
  });
}
```

## API Usage

### Get Available Tents
```javascript
GET /api/tents/available?tentSpotId=xxx&checkinDate=2025-12-01&checkoutDate=2025-12-03

Response:
{
  "success": true,
  "tents": [...],
  "totalTents": 10,
  "availableCount": 7,
  "bookedCount": 3
}
```

### Create Tent Reservation
```javascript
POST /api/tent-reservations
Body:
{
  "tentSpotId": "xxx",
  "tentIds": ["tent1", "tent2"],
  "checkinDate": "2025-12-01",
  "checkoutDate": "2025-12-03",
  "guests": 4,
  "fullName": "John Doe",
  "phone": "1234567890",
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "reservation": {
    "bookingId": "TENT-ABC123-XYZ",
    "status": "pending",
    "expiresAt": "2025-12-01T10:15:00Z"
  }
}
```

## Database Queries

### Check Tent Availability
```javascript
// Find overlapping reservations
TentReservation.find({
  tentSpot: tentSpotId,
  status: { $in: ['pending', 'confirmed'] },
  $or: [
    { checkinDate: { $gte: checkinDate, $lt: checkoutDate } },
    { checkoutDate: { $gt: checkinDate, $lte: checkoutDate } },
    { checkinDate: { $lte: checkinDate }, checkoutDate: { $gte: checkoutDate } }
  ]
})
```

## Common Issues & Solutions

### Issue: "Add tent" button not enabling
**Solution:** Ensure search is performed first. Button is disabled until `isSearchPerformed = true`

### Issue: No tents showing after search
**Solution:** Check if:
1. Tent spot has tents assigned
2. Tents are not disabled (`isDisabled: false`)
3. Dates don't overlap with existing reservations

### Issue: Date fields not enabling
**Solution:** 
- Check-in date: Requires tent spot selection
- Check-out date: Requires check-in date selection

### Issue: Availability check not working
**Solution:** Verify:
1. TentReservation model is imported correctly
2. Date format is ISO string
3. Status filter includes 'pending' and 'confirmed'

## Environment Setup

### Development
```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  API_URL: 'http://localhost:5000',
  apiUrl: 'http://localhost:5000/api'
};
```

### Production
```typescript
// frontend/src/environments/environment.prod.ts
export const environment = {
  production: true,
  API_URL: 'https://api.vanavihari.com',
  apiUrl: 'https://api.vanavihari.com/api'
};
```

## Cron Job Setup

The system automatically expires pending tent reservations every minute:

```javascript
// backend/index.js
setInterval(async () => {
  await expirePendingTentReservations()
}, 60000) // 1 minute
```

This prevents tents from being blocked by unpaid reservations.

## Testing Checklist

- [ ] Tent spot dropdown loads
- [ ] Check-in date disabled until tent spot selected
- [ ] Check-out date disabled until check-in selected
- [ ] Search button disabled until all fields filled
- [ ] Loading spinner shows during search
- [ ] Available tents display after search
- [ ] "Add tent" button disabled before search
- [ ] "Add tent" button enabled after search
- [ ] Booking summary updates correctly
- [ ] Overlapping dates are blocked
- [ ] Pending reservations expire after 15 minutes

## Quick Commands

### Start Backend
```bash
cd backend
npm start
```

### Start Frontend
```bash
cd frontend
npm start
```

### Check Syntax
```bash
node --check backend/models/tentReservationModel.js
node --check backend/controllers/tentReservationController.js
node --check backend/routes/tentReservationRoutes.js
```

## Support

For detailed documentation, see:
- `docs/TENT_RESERVATION_SYSTEM.md` - Complete system overview
- `docs/TENT_SPOT_SELECTION_IMPLEMENTATION.md` - Implementation details
- `docs/IMPLEMENTATION_SUMMARY.md` - Summary of changes
