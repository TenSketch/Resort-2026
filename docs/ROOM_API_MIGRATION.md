# Room API Migration Documentation

## Overview
Migrated the frontend room listing from using a query-based API to a REST API that fetches rooms directly from MongoDB.

## Changes Made

### Backend Changes

#### 1. Room Controller (`backend/controllers/roomController.js`)
- **Updated `listRooms` function** to support filtering by resort slug
- Added query parameter support: `?resortSlug=<slug>`
- Returns all rooms if no slug provided, or filtered by resort if slug is provided

```javascript
const listRooms = async (req, res) => {
  const { resortSlug } = req.query
  let query = {}
  
  if (resortSlug) {
    const resort = await Resort.findOne({ slug: resortSlug })
    if (!resort) {
      return res.status(404).json({ error: 'Resort not found' })
    }
    query.resort = resort._id
  }
  
  const rooms = await Room.find(query).sort({ createdAt: -1 }).populate('resort').populate('cottageType')
  res.json({ rooms })
}
```

### Frontend Changes

#### 1. Room Component (`frontend/src/app/modules/resorts/rooms/rooms.component.ts`)

**Updated `fetchRoomList()` method:**
- Removed old query API logic (`?api_type=room_list&resort=...&checkin=...&checkout=...`)
- Now calls REST API: `GET /api/rooms?resortSlug=<slug>`
- Removed fallback to `assets/json/rooms.json` (hardcoded data)
- Always fetches from API regardless of date selection

**Data Transformation:**
Maps API response to frontend interface:
- `room._id` → `Room_Id`
- `room.roomName` → `Room_Name`
- `room.weekdayRate` → `Week_Days_Rate`
- `room.weekendRate` → `Week_End_Rate`
- `room.bedChargeWeekday` → `Charges_per_Bed_Week_Days`
- `room.bedChargeWeekend` → `Charges_per_Bed_Week_End`
- `room.cottageType.name` → `Cottage_Type`
- `room.guests` → `Max_Allowed_Guest` & `Max_Allowed_Adult`
- `room.images[]` → Stored for gallery display

**Updated `getRoomImages()` method:**
- Now prioritizes images from API (`room.images[].url`)
- Falls back to `galleryService` hardcoded images if API images not available
- Supports dynamic image display from Cloudinary

**Updated `RoomData` Interface:**
Added new properties:
```typescript
interface RoomData {
  // ... existing properties
  extra_guest: boolean;
  images?: { url: string; public_id: string }[];
}
```

## API Endpoints

### Get Rooms by Resort
```
GET http://localhost:5000/api/rooms?resortSlug=vanavihari
GET http://localhost:5000/api/rooms?resortSlug=jungle-star
```

### Get All Rooms
```
GET http://localhost:5000/api/rooms
```

## Room Data Structure

### API Response Format
```json
{
  "rooms": [
    {
      "_id": "68f3ce2f76baaba9c66ed7d1",
      "roomNumber": "VM1",
      "roomId": "VM1",
      "roomName": "Narmada",
      "status": "available",
      "price": 2500,
      "weekdayRate": 2500,
      "weekendRate": 2500,
      "guests": 2,
      "extraGuests": 1,
      "children": 1,
      "bedChargeWeekday": 2500,
      "bedChargeWeekend": 2500,
      "resort": {
        "_id": "68f39cfbba3f9af8d15fcb3f",
        "resortName": "Vanavihari",
        "slug": "vanavihari"
      },
      "cottageType": {
        "_id": "68f3a7e38876285a0d2a5ff9",
        "name": "Deluxe Rooms"
      },
      "amenities": [],
      "images": [
        {
          "url": "https://res.cloudinary.com/dv9tkwqsf/image/upload/v1760808493/vanavihari/rooms/hf6ptipf4ifya9dhj6r8.png",
          "public_id": "vanavihari/rooms/hf6ptipf4ifya9dhj6r8",
          "_id": "68f3ce2f76baaba9c66ed7d2"
        }
      ],
      "createdAt": "2025-10-18T17:28:15.895Z",
      "updatedAt": "2025-10-18T17:44:00.254Z"
    }
  ]
}
```

## Benefits

1. **No Hardcoded Data**: Rooms are now fetched dynamically from the database
2. **Single Source of Truth**: MongoDB is the only source for room data
3. **Image Support**: Room images from Cloudinary are displayed automatically
4. **Cleaner Code**: Removed complex query string building and legacy API logic
5. **Better Maintainability**: REST API is easier to understand and extend
6. **Always Available**: Rooms display immediately without requiring date selection

## Resort Slug Mapping

| Frontend Resort Name       | Backend Slug    |
|---------------------------|-----------------|
| Vanavihari, Maredumilli   | `vanavihari`    |
| Jungle Star, Valamuru     | `jungle-star`   |

## Testing

1. Visit: `http://localhost:4200/#/resorts/rooms?bookingTypeResort=Vanavihari,%20Maredumilli`
2. Rooms should load immediately from API
3. Images from Cloudinary should display in the carousel
4. No "Please select dates" message should appear
5. Room sorting should work based on predefined order

## Future Enhancements

1. Add date-based availability filtering
2. Add real-time availability status
3. Add room search/filter capabilities
4. Implement caching for better performance
5. Add pagination for large room lists
