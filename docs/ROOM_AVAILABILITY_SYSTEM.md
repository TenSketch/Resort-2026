# Room Availability System Documentation

## Overview
Implemented a smart room availability system that checks reservations and shows only available rooms based on check-in and check-out dates.

## Features

### 1. **Date-Based Availability Check**
- Shows all rooms when only resort is selected (with disabled Add button)
- Filters out reserved rooms when dates are selected
- Real-time availability based on existing reservations

### 2. **Reservation Status Integration**
- Checks against reservation statuses: `reserved`, `pre-reserved`, `confirmed`
- Prevents double-booking
- Handles overlapping date ranges

### 3. **User Experience**
- **Without Dates**: Shows all rooms with message "Please select dates to book"
- **With Dates**: Shows only available rooms with enabled Add button
- Disabled rooms show tooltip explaining why they can't be booked

## API Endpoints

### New Endpoint: `/api/rooms/available`

**GET** `/api/rooms/available?resortSlug={slug}&checkin={date}&checkout={date}`

#### Parameters:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resortSlug` | string | Yes | Resort slug (e.g., `vanavihari-maredumilli`) |
| `checkin` | string | No | Check-in date (YYYY-MM-DD) |
| `checkout` | string | No | Check-out date (YYYY-MM-DD) |

#### Response (With Dates):
```json
{
  "rooms": [
    {
      "_id": "...",
      "roomName": "Narmada",
      "price": 2500,
      "isAvailable": true,
      "canBook": true,
      "images": [...],
      ...
    }
  ],
  "totalRooms": 17,
  "availableRooms": 15,
  "reservedRooms": 2,
  "checkin": "2025-10-21T00:00:00.000Z",
  "checkout": "2025-10-22T00:00:00.000Z"
}
```

#### Response (Without Dates):
```json
{
  "rooms": [
    {
      "_id": "...",
      "roomName": "Narmada",
      "isAvailable": false,
      "canBook": false,
      "message": "Please select check-in and check-out dates",
      ...
    }
  ],
  "allRooms": true
}
```

## Backend Implementation

### Room Controller (`roomController.js`)

#### Added Import:
```javascript
import Reservation from '../models/reservationModel.js'
```

#### New Function: `listAvailableRooms`

**Logic Flow:**
1. Validate resort slug (required)
2. Fetch resort by slug
3. Get all rooms for the resort
4. **If no dates provided:**
   - Return all rooms
   - Set `canBook: false` and `isAvailable: false`
   - Add message: "Please select check-in and check-out dates"
5. **If dates provided:**
   - Parse and validate dates
   - Find overlapping reservations:
     ```javascript
     {
       resort: resortName,
       status: { $in: ['reserved', 'pre-reserved', 'confirmed'] },
       $or: [
         { checkIn: { $gte: checkInDate, $lt: checkOutDate } },
         { checkOut: { $gt: checkInDate, $lte: checkOutDate } },
         { checkIn: { $lte: checkInDate }, checkOut: { $gte: checkOutDate } }
       ]
     }
     ```
   - Filter out reserved rooms
   - Return only available rooms with `canBook: true`

**Overlap Detection Logic:**
A reservation overlaps if:
- Starts during requested stay: `reservation.checkIn >= userCheckIn AND reservation.checkIn < userCheckOut`
- Ends during requested stay: `reservation.checkOut > userCheckIn AND reservation.checkOut <= userCheckOut`
- Completely covers requested stay: `reservation.checkIn <= userCheckIn AND reservation.checkOut >= userCheckOut`

### Routes (`roomRoutes.js`)
```javascript
router.get('/available', listAvailableRooms)  // NEW
router.get('/', listRooms)                     // Existing
```

## Frontend Implementation

### Component TypeScript

#### New Properties:
```typescript
interface RoomData {
  // ... existing properties
  isAvailable?: boolean;
  canBook?: boolean;
  message?: string;
}
```

#### New Method: `formatDateForAPI`
```typescript
formatDateForAPI(date: Date): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

#### Updated `fetchRoomList()`:
```typescript
// Build API URL with dates if available
let roomsUrl = `${this.api_url}/api/rooms/available?resortSlug=${resortSlug}`;

if (this.checkinDate && this.checkoutDate) {
  const checkinStr = this.formatDateForAPI(this.checkinDate);
  const checkoutStr = this.formatDateForAPI(this.checkoutDate);
  roomsUrl += `&checkin=${checkinStr}&checkout=${checkoutStr}`;
}
```

#### Room Data Mapping:
```typescript
this.roomData = response.rooms.map((room: any) => ({
  // ... existing mappings
  is_button_disabled: room.canBook === false,
  isAvailable: room.isAvailable !== undefined ? room.isAvailable : true,
  canBook: room.canBook !== undefined ? room.canBook : true,
  message: room.message || '',
}));
```

### Component HTML

#### Updated Add Room Button:
```html
<button mat-raised-button color="primary" 
  [disabled]="isRoomAdded(room.Room_Id) || !room.canBook" 
  (click)="addRoom(room)"
  [matTooltip]="!room.canBook ? room.message || 'Please select dates to book' : ''">
  Add room
</button>
<small *ngIf="!room.canBook && room.message" class="text-warning d-block mt-1">
  {{ room.message }}
</small>
```

## User Flows

### Flow 1: User Selects Resort Only
1. User selects "Vanavihari, Maredumilli"
2. API call: `GET /api/rooms/available?resortSlug=vanavihari-maredumilli`
3. Backend returns all 17 rooms with `canBook: false`
4. UI shows all rooms with disabled "Add room" buttons
5. Message displays: "Please select check-in and check-out dates"

### Flow 2: User Selects Resort + Dates
1. User selects "Vanavihari, Maredumilli"
2. User selects dates: Oct 21 - Oct 22
3. API call: `GET /api/rooms/available?resortSlug=vanavihari-maredumilli&checkin=2025-10-21&checkout=2025-10-22`
4. Backend checks reservations:
   - Total rooms: 17
   - Reserved: 2 (Narmada, Bahuda)
   - Available: 15
5. UI shows only 15 available rooms
6. "Add room" buttons are enabled
7. User can book available rooms

### Flow 3: Room Becomes Reserved
1. Room "Narmada" is available for Oct 21-22
2. Another user books "Narmada" for Oct 21-22
3. Reservation created with status: "reserved"
4. Current user refreshes or searches again
5. "Narmada" no longer appears in available rooms
6. Only 16 rooms shown (14 available)

## Reservation Statuses

| Status | Description | Blocks Booking |
|--------|-------------|----------------|
| `reserved` | Confirmed reservation | ✅ Yes |
| `pre-reserved` | Temporarily reserved (payment pending) | ✅ Yes |
| `confirmed` | Confirmed and paid | ✅ Yes |
| `cancelled` | Cancelled by user/admin | ❌ No |
| `completed` | Past reservation | ❌ No (but date-based) |

## Database Queries

### Find Overlapping Reservations:
```javascript
await Reservation.find({
  resort: "Vanavihari, Maredumilli",
  status: { $in: ['reserved', 'pre-reserved', 'confirmed'] },
  $or: [
    { checkIn: { $gte: '2025-10-21', $lt: '2025-10-22' } },
    { checkOut: { $gt: '2025-10-21', $lte: '2025-10-22' } },
    { 
      checkIn: { $lte: '2025-10-21' },
      checkOut: { $gte: '2025-10-22' }
    }
  ]
})
```

## Testing Scenarios

### Test 1: No Reservations
- **Setup**: No reservations in database
- **Input**: Select dates Oct 21-22
- **Expected**: All 17 rooms available
- **Result**: ✅ Pass

### Test 2: One Room Reserved
- **Setup**: "Narmada" reserved for Oct 21-22
- **Input**: Select dates Oct 21-22
- **Expected**: 16 rooms available (Narmada excluded)
- **Result**: ✅ Pass

### Test 3: Overlapping Dates
- **Setup**: "Narmada" reserved Oct 20-23
- **Input**: Select dates Oct 21-22
- **Expected**: 16 rooms available (Narmada excluded due to overlap)
- **Result**: ✅ Pass

### Test 4: Non-Overlapping Dates
- **Setup**: "Narmada" reserved Oct 20-21
- **Input**: Select dates Oct 22-23
- **Expected**: All 17 rooms available (no overlap)
- **Result**: ✅ Pass

### Test 5: No Dates Selected
- **Setup**: Any reservations
- **Input**: Select resort only
- **Expected**: All rooms shown with disabled buttons and message
- **Result**: ✅ Pass

## Benefits

1. **✅ Prevents Double Booking**: Checks existing reservations in real-time
2. **✅ Accurate Availability**: Only shows truly available rooms
3. **✅ Better UX**: Clear messaging when dates aren't selected
4. **✅ Flexible**: Works with or without dates
5. **✅ Scalable**: Handles multiple reservation statuses
6. **✅ Performance**: Single query for overlapping reservations
7. **✅ Data Integrity**: Status-based filtering prevents conflicts

## Future Enhancements

1. **Cache availability** for frequently searched dates
2. **Real-time updates** using WebSockets
3. **Bulk availability** check for multiple rooms
4. **Availability calendar** view
5. **Minimum stay requirements** based on resort policy
6. **Partial availability** (available for some days in range)
7. **Room type filtering** combined with availability
8. **Price variation** by season/availability
