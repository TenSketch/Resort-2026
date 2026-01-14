# Guest Limit Validation Implementation

## Overview
Added automatic validation for guests, extra guests, and children based on the capacity limits defined in the selected rooms.

## How It Works

### 1. Capacity Calculation
When rooms are selected, the form automatically calculates the total capacity by summing up the limits from all selected rooms:

**Example:**
- Room "Vanya": 2 guests, 1 extra guest, 2 children
- Room "Prana": 2 guests, 1 extra guest, 2 children
- **Total Capacity**: 4 guests, 2 extra guests, 4 children

### 2. Dynamic Limits Display
The input labels show the maximum allowed values:
- "Guests (Max: 4)"
- "Extra Guests (Max: 2)"
- "Children (under 5) (Max: 4)"

### 3. Validation Rules

#### Input Validation
- Fields are **disabled** until rooms are selected
- HTML `max` attribute prevents entering values above the limit
- Custom validation shows an alert if user tries to exceed limits

#### Automatic Clearing
- When cottage types change → rooms and guest counts are cleared
- When rooms change → guest counts are cleared (to prevent invalid values)

### 4. User Experience

**Before Selecting Rooms:**
- Guest input fields are disabled
- Placeholder text: "Select rooms first"

**After Selecting Rooms:**
- Fields become enabled
- Max limits are displayed in the label
- User can enter values up to the calculated maximum
- If user tries to exceed the limit, an alert appears

**Example Alert Messages:**
- "Maximum 4 guests allowed for selected rooms"
- "Maximum 2 extra guests allowed for selected rooms"
- "Maximum 4 children allowed for selected rooms"

## Technical Implementation

### Room Interface Update
```typescript
interface Room {
  // ... existing fields
  guests?: number;
  extraGuests?: number;
  children?: number;
}
```

### Capacity Calculation
```typescript
const guestLimits = useMemo(() => {
  if (formData.rooms.length === 0) {
    return { maxGuests: 0, maxExtraGuests: 0, maxChildren: 0 };
  }

  const selectedRooms = rooms.filter(room => formData.rooms.includes(room._id));
  
  const maxGuests = selectedRooms.reduce((sum, room) => sum + (room.guests || 0), 0);
  const maxExtraGuests = selectedRooms.reduce((sum, room) => sum + (room.extraGuests || 0), 0);
  const maxChildren = selectedRooms.reduce((sum, room) => sum + (room.children || 0), 0);

  return { maxGuests, maxExtraGuests, maxChildren };
}, [formData.rooms, rooms]);
```

### Input Validation
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  
  if (name === 'guests' || name === 'extraGuests' || name === 'children') {
    const numValue = parseInt(value) || 0;
    
    if (name === 'guests' && numValue > guestLimits.maxGuests) {
      alert(`Maximum ${guestLimits.maxGuests} guests allowed for selected rooms`);
      return;
    }
    // ... similar checks for extraGuests and children
  }
  
  setFormData({ ...formData, [name]: value });
};
```

## Example Scenarios

### Scenario 1: Single Room
- Select "Vanya" (2 guests, 1 extra, 2 children)
- Can enter: 0-2 guests, 0-1 extra guests, 0-2 children

### Scenario 2: Multiple Rooms
- Select "Vanya" + "Prana" (both have 2 guests, 1 extra, 2 children each)
- Can enter: 0-4 guests, 0-2 extra guests, 0-4 children

### Scenario 3: Changing Selection
- User selects rooms and enters guest counts
- User changes room selection
- Guest counts are automatically cleared
- User must re-enter valid counts for new room selection

## Benefits

1. **Prevents Overbooking**: Users cannot exceed room capacity
2. **Clear Feedback**: Max limits are always visible
3. **Data Integrity**: Invalid guest counts cannot be submitted
4. **Better UX**: Disabled state prevents confusion before room selection
5. **Automatic Updates**: Limits recalculate when room selection changes

## Future Enhancements

- Show a breakdown of capacity per room
- Visual indicator (progress bar) showing capacity usage
- Warning when approaching maximum capacity
- Suggest additional rooms if capacity is exceeded
