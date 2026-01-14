# Booking ID Auto-Generation and Status Updates

## Overview
Implemented auto-generation of booking IDs, updated status dropdown options, and auto-counting of rooms.

## Changes Made

### 1. Auto-Generated Booking ID

#### Format
`{ResortInitials}{Day}{Hour}{Minute}{Year}{Month}{Serial}`

#### Example
- Resort: "Blue Bay Resort" → Initials: "BB"
- Date: 21-Oct-2025
- Time: 09:07
- Serial: 8 (8th booking of the day)
- **Result**: `BB2109072510008`

#### Implementation Details
```typescript
// Get resort initials (first letter of each word)
const resortInitials = selectedResort.resortName
  .split(' ')
  .map(word => word.charAt(0).toUpperCase())
  .join('');

// Format: BB2109072510008
const bookingId = `${resortInitials}${day}${hour}${minute}${year}${month}${serial}`;
```

#### Serial Number Logic
- Backend endpoint `/api/reservations/next-serial` counts today's reservations
- Returns the next serial number (count + 1)
- Serial is padded to 3 digits (001, 002, etc.)
- Resets daily (each day starts from 001)

#### User Experience
- Booking ID field is **read-only** (cannot be edited)
- Auto-generates when a resort is selected
- Updates if resort selection changes
- Placeholder text: "Auto-generated"
- Gray background to indicate it's not editable

### 2. Updated Status Dropdown

#### New Options
1. **Reserved** - Confirmed reservation
2. **Pre-Reserved** - Tentative/pending reservation
3. **Not Reserved** - Available/not booked
4. **Canceled** - Canceled reservation

#### Previous Options (Removed)
- ~~Unreserved~~ (replaced with "Not Reserved")

#### Implementation
```typescript
<Select value={formData.status} onValueChange={(value) => handleSelect("status", value)}>
  <SelectContent>
    <SelectItem value="reserved">Reserved</SelectItem>
    <SelectItem value="pre-reserved">Pre-Reserved</SelectItem>
    <SelectItem value="not-reserved">Not Reserved</SelectItem>
    <SelectItem value="canceled">Canceled</SelectItem>
  </SelectContent>
</Select>
```

### 3. Auto-Count Number of Rooms

#### Behavior
- Automatically counts selected rooms
- Updates in real-time as rooms are added/removed
- Field is **read-only** (cannot be manually edited)

#### Example
- User selects "Vanya" and "Prana" → Shows "2"
- User removes "Prana" → Shows "1"
- User deselects all → Shows "0"

#### Implementation
```typescript
useEffect(() => {
  setFormData(prev => ({ 
    ...prev, 
    numberOfRooms: String(formData.rooms.length) 
  }));
}, [formData.rooms]);
```

#### User Experience
- Field is read-only with gray background
- Placeholder text: "Auto-counted"
- Updates automatically when room selection changes

## Backend Changes

### New Endpoint: Get Next Serial

**Route**: `GET /api/reservations/next-serial`

**Purpose**: Returns the next serial number for booking ID generation

**Logic**:
1. Count reservations created today
2. Return count + 1 as the next serial

**Response**:
```json
{
  "success": true,
  "serial": 8
}
```

**Implementation**:
```javascript
export const getNextSerial = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const count = await Reservation.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })

    const serial = count + 1
    res.json({ success: true, serial })
  } catch (err) {
    console.error('getNextSerial error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
```

## User Flow

### Creating a Reservation

1. **Select Resort** → Booking ID auto-generates (e.g., "BB2109072510008")
2. **Select Cottage Types** → Available rooms appear
3. **Select Rooms** → Number of Rooms auto-updates (e.g., "2")
4. **Enter Guest Details** → Validated against room capacity
5. **Select Status** → Choose from 4 options (Reserved, Pre-Reserved, Not Reserved, Canceled)
6. **Submit** → Reservation saved with auto-generated booking ID

### Booking ID Generation Timing
- Generates when resort is selected
- Regenerates if resort changes
- Uses current date/time at generation
- Fetches latest serial number from backend

## Benefits

1. **Unique IDs**: Each booking has a unique, traceable ID
2. **No Manual Entry**: Eliminates human error in ID creation
3. **Consistent Format**: All IDs follow the same pattern
4. **Date/Time Tracking**: ID contains booking date and time
5. **Resort Identification**: ID includes resort initials
6. **Daily Reset**: Serial numbers reset each day for easy tracking
7. **Auto Room Count**: Prevents mismatch between selected rooms and count
8. **Clear Status Options**: Better categorization of reservations

## Example Scenarios

### Scenario 1: First Booking of the Day
- Resort: "Jungle Star, Valamuru" → "JS"
- Date: 21-Oct-2025, Time: 09:07
- Serial: 1 (first booking today)
- **Booking ID**: `JS2109072510001`

### Scenario 2: Multiple Bookings Same Day
- Same resort, same day
- Time: 14:30
- Serial: 15 (15th booking today)
- **Booking ID**: `JS2114302510015`

### Scenario 3: Different Resort
- Resort: "Vanavihari, Maredumilli" → "VM"
- Date: 21-Oct-2025, Time: 16:45
- Serial: 3 (3rd booking for this resort today)
- **Booking ID**: `VM2116452510003`

## Future Enhancements

- Add booking ID search functionality
- Show booking ID history/pattern
- Add booking ID validation on backend
- Implement booking ID prefix customization per resort
- Add option to regenerate booking ID if needed
- Track booking ID conflicts/duplicates
