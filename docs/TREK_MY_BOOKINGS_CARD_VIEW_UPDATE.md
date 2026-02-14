# Trek Bookings - My Bookings Card View Update

## Date: February 9, 2026

## Problem

Trek bookings in the My Bookings page were displaying incorrectly:
1. Generic resort image (not trek-appropriate)
2. "Resort name: Tourist Spots" (not descriptive)
3. Long trek names getting cut off in "Room name" field
4. "Cottage type: Trek Entry" (not informative)
5. Showing check-in/check-out dates (should be single visit date)
6. Showing check-in/check-out times (not applicable for treks)

## Solution

Created a **dedicated card layout for trek bookings** that differs from room and tent bookings.

---

## Changes Made

### 1. HTML Template Updates
**File**: `frontend/src/app/modules/my-bookings/my-bookings.component.html`

#### Before (Generic Display)
```html
<h5 class="my-2">
  <strong>Resort name:</strong> {{ item.rooms.restort }}
</h5>
<p class="mb-0">
  <strong>Room name:</strong> {{ item.rooms.name }}
</p>
<p class="mb-0">
  <strong>Cottage type:</strong> {{ item.rooms.cottage }}
</p>
```

#### After (Trek-Specific Display)
```html
<div *ngIf="item.booking_type === 'trek'">
  <h5 class="my-2">
    <strong>Booking Type:</strong> Tourist Spot Entry
  </h5>
  <p class="mb-0">
    <strong>Spot(s):</strong> {{ item.rooms.name }}
  </p>
  <p class="mb-0">
    <strong>Visit Date:</strong> {{ formatDate(item.checkin).day }} {{ formatDate(item.checkin).month }} {{ formatDate(item.checkin).year }}
  </p>
  <p class="mb-0">
    <strong>Guest info:</strong> {{ item.noof_guest }} guests
  </p>
  <p class="mb-0">
    <strong>Total amount:</strong> ₹{{ item.total_payable_amt }}
  </p>
</div>
```

---

### 2. Date Display Updates

#### Trek Bookings (Single Visit Date)
```html
<div *ngIf="item.booking_type === 'trek'">
  <div class="show-date">
    <h5 class="mb-0">Visit Date</h5>
    <h1 class="display-3 mb-0">{{ formatDate(item.checkin).day }}</h1>
    <p class="mb-0">
      {{ formatDate(item.checkin).month }}
      {{ formatDate(item.checkin).year }}
    </p>
  </div>
  <br />
  <div class="show-date">
    <h5 class="mb-0">Entry Time</h5>
    <p class="mb-0">As per spot timings</p>
  </div>
</div>
```

#### Room/Tent Bookings (Check-in/Check-out)
```html
<div *ngIf="item.booking_type !== 'trek'">
  <!-- Original check-in/check-out display -->
</div>
```

---

### 3. Image Selection Logic
**File**: `frontend/src/app/modules/my-bookings/my-bookings.component.ts`

```typescript
getRoomImages(roomname: any): string[] {
  const lowercaseRoomName = roomname.toLowerCase();

  // Check if it's a trek booking
  if (lowercaseRoomName.includes('trek') || 
      lowercaseRoomName.includes('jalatarangi') || 
      lowercaseRoomName.includes('rampa') || 
      lowercaseRoomName.includes('nellore')) {
    // Return default trek/nature images
    return ['assets/img/MAREDUMILLI-waterfalls.jpg', 'assets/img/Rampa-falls.jpg'];
  }

  // Original room image logic
  switch (lowercaseRoomName) {
    // ... existing room cases
  }
}
```

---

## Display Comparison

### Room Booking Card
```
┌─────────────────────────────────────┐
│ [Room Image]                        │
│ Resort name: Vanavihari, Maredumilli│
│ Room name: Panther                  │
│ Cottage type: Hill Top Guest House  │
│ Guest info: 2 guests, 0 child, 0 ex │
│ Total amount: ₹4500                 │
│                                     │
│ Check-in: 8 Feb 2026                │
│ Check-out: 9 Feb 2026               │
│ Check-in Time: 10 AM                │
│ Check-out Time: 9 AM                │
└─────────────────────────────────────┘
```

### Tent Booking Card
```
┌─────────────────────────────────────┐
│ [Tent Image]                        │
│ Tent Spot: Camping Ground           │
│ Tent ID: TENT-001                   │
│ Booking type: Tent Camping          │
│ Guest info: 4 guests, 2 child, 0 ex │
│ Total amount: ₹2000                 │
│                                     │
│ Check-in: 8 Feb 2026                │
│ Check-out: 9 Feb 2026               │
│ Check-in Time: 10 AM                │
│ Check-out Time: 9 AM                │
└─────────────────────────────────────┘
```

### Trek Booking Card (NEW)
```
┌─────────────────────────────────────┐
│ [Waterfall/Nature Image]            │
│ Booking Type: Tourist Spot Entry    │
│ Spot(s): Soft Trek: Jalatarangi to  │
│          G.M.Valasa, Very Hard Trek:│
│          Jungle Star to Nellore     │
│ Visit Date: 9 February 2026         │
│ Guest info: 2 guests                │
│ Total amount: ₹3700                 │
│                                     │
│ Visit Date: 9 Feb 2026              │
│ Entry Time: As per spot timings     │
└─────────────────────────────────────┘
```

---

## Key Differences

### Trek Bookings
- **Label**: "Booking Type: Tourist Spot Entry"
- **Spots**: Shows comma-separated list of trek spots
- **Visit Date**: Single date (not check-in/check-out)
- **Entry Time**: "As per spot timings" (not fixed time)
- **Guest Info**: Only shows total guests (no children/extra)
- **Image**: Nature/waterfall images

### Room Bookings
- **Label**: "Resort name"
- **Details**: Room name, cottage type
- **Dates**: Check-in and check-out
- **Times**: 10 AM check-in, 9 AM check-out
- **Guest Info**: Guests, children, extra guests
- **Image**: Room-specific images

### Tent Bookings
- **Label**: "Tent Spot"
- **Details**: Tent ID, booking type
- **Dates**: Check-in and check-out
- **Times**: 10 AM check-in, 9 AM check-out
- **Guest Info**: Guests, children, extra guests
- **Image**: Tent-specific images

---

## Data Structure Used

### Trek Booking Data
```typescript
{
  booking_id: "TS-260209-003",
  booking_type: "trek",  // ← Key identifier
  rooms: {
    name: "Soft Trek: Jalatarangi to G.M.Valasa, Very Hard Trek: Jungle Star...",
    cottage: "Trek Entry",
    restort: "Tourist Spots"
  },
  checkin: "2026-02-09",  // Visit date
  checkout: "2026-02-09", // Same as checkin
  noof_guest: 2,
  total_payable_amt: 3700
}
```

---

## Conditional Rendering Logic

```html
<!-- Trek-specific display -->
<div *ngIf="item.booking_type === 'trek'">
  <!-- Trek layout -->
</div>

<!-- Tent-specific display -->
<div *ngIf="item.booking_type === 'tent'">
  <!-- Tent layout -->
</div>

<!-- Room-specific display -->
<div *ngIf="item.booking_type !== 'tent' && item.booking_type !== 'trek'">
  <!-- Room layout -->
</div>
```

---

## Image Fallback Strategy

1. **Check trek keywords**: "trek", "jalatarangi", "rampa", "nellore"
2. **Return nature images**: Waterfall images from assets
3. **Fallback to room images**: If no match, use room-specific images

```typescript
if (lowercaseRoomName.includes('trek') || 
    lowercaseRoomName.includes('jalatarangi') || 
    lowercaseRoomName.includes('rampa') || 
    lowercaseRoomName.includes('nellore')) {
  return ['assets/img/MAREDUMILLI-waterfalls.jpg', 'assets/img/Rampa-falls.jpg'];
}
```

---

## Benefits

### User Experience
1. ✅ Clear distinction between booking types
2. ✅ Appropriate terminology (Visit Date vs Check-in)
3. ✅ Relevant images (nature/waterfall for treks)
4. ✅ Simplified guest info (no children/extra for treks)
5. ✅ Accurate time information (spot timings vs fixed times)

### Code Maintainability
1. ✅ Separate display logic for each booking type
2. ✅ Easy to modify trek-specific display
3. ✅ No impact on existing room/tent displays
4. ✅ Clear conditional structure

---

## Testing Checklist

- [x] Trek bookings show "Tourist Spot Entry" label
- [x] Trek bookings show spot names (comma-separated)
- [x] Trek bookings show single visit date
- [x] Trek bookings show "As per spot timings"
- [x] Trek bookings show correct guest count
- [x] Trek bookings show nature/waterfall images
- [x] Room bookings still display correctly
- [x] Tent bookings still display correctly
- [x] No diagnostics errors

---

## Future Enhancements

1. **Trek-specific images**: Add dedicated images for each trek spot
2. **Spot details**: Show difficulty level, duration, distance
3. **Camera info**: Display camera count in card
4. **Weather info**: Show weather forecast for visit date
5. **Directions**: Add link to trek spot location/directions

---

## Files Modified

1. `frontend/src/app/modules/my-bookings/my-bookings.component.html` - Card layout
2. `frontend/src/app/modules/my-bookings/my-bookings.component.ts` - Image selection logic

---

**Status**: ✅ COMPLETE - Trek bookings now have dedicated card view
