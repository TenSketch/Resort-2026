# SMS Template Update - Simplified Common Template

## ✅ What Changed

### Before (Old Templates)
- Separate templates for Room and Tent reservations
- Long detailed messages with guest counts, room/tent details
- Template IDs: `1107171542954805556` (Vanavihari), `1107171543004186036` (Jungle Star)

### After (New Templates)
- **Single common template** for both Room and Tent reservations
- **Shorter, cleaner message** format
- **New Template IDs:**
  - VANAVIHARI: `1107176807116645251`
  - JUNGLE STAR: `1107176807164037326`

## 📱 New SMS Format

### VANAVIHARI
```
Dear Balaji, Your VANAVIHARI stay is booked! ID: VANA8891, Check-in: 15-Jan-2026, Check-out: 17-Jan-2026, Paid: INR 4500.00. More info emailed. Enjoy your visit! -VANAVIHARI
```

### JUNGLE STAR
```
Dear Balaji, Your JungleStar stay is booked! ID: TENT1234, Check-in: 20-Jan-2026, Check-out: 22-Jan-2026, Paid: INR 3500.00. More info emailed. Enjoy your visit! -JUNGLE STAR
```

## 🔧 Technical Changes

### 1. Simplified Template Structure
**File:** `backend/config/smsTemplates.js`

```javascript
// OLD - 4 separate templates
SMS_TEMPLATES = {
  ROOM_VANAVIHARI: {...},
  ROOM_JUNGLESTAR: {...},
  TENT_VANAVIHARI: {...},
  TENT_JUNGLESTAR: {...}
}

// NEW - 2 common templates
SMS_TEMPLATES = {
  VANAVIHARI: {...},
  JUNGLESTAR: {...}
}
```

### 2. Simplified Service Functions
**File:** `backend/services/reservationSmsService.js`

**Removed:**
- Room/Tent model imports (no longer needed)
- Room/cottage name fetching
- Tent spot/tent list fetching
- Guest count calculations

**Kept:**
- Phone number formatting
- Date formatting
- Resort slug detection
- SMS sending logic

### 3. Reduced Data Requirements

**Old SMS Data:**
```javascript
{
  fullName, bookingId, checkIn, checkOut,
  totalGuests, roomNames, cottageNames,  // ❌ Removed
  tentSpotName, tentList,                // ❌ Removed
  amount
}
```

**New SMS Data:**
```javascript
{
  fullName,    // ✅ Required
  bookingId,   // ✅ Required
  checkIn,     // ✅ Required
  checkOut,    // ✅ Required
  amount       // ✅ Required
}
```

## 🎯 Benefits

1. **Simpler Code** - Less database queries, cleaner logic
2. **Faster Execution** - No need to fetch room/tent details
3. **Easier Maintenance** - Single template for both types
4. **Consistent Messages** - Same format for room and tent bookings
5. **Better Performance** - Reduced database load

## 🚀 Testing

Run the test file:
```bash
cd backend
node test-sms.js
```

Expected output:
```
🧪 Testing SMS Service...

📱 Testing Room Reservation SMS...
📱 Preparing room reservation SMS for booking: VANA8891
📱 Sending SMS to: 919384318546
📱 Resort: vanavihari
📱 Source: VANVHR, Template ID: 1107176807116645251
✅ Room reservation SMS sent successfully to 919384318546
✅ Room SMS test completed successfully

📱 Testing Tent Reservation SMS...
📱 Preparing tent reservation SMS for booking: TENT1234
📱 Sending SMS to: 919384318546
📱 Resort: jungle-star
📱 Source: JUNSTR, Template ID: 1107176807164037326
✅ Tent reservation SMS sent successfully to 919384318546
✅ Tent SMS test completed successfully
```

## 📝 No Configuration Changes Needed

The environment variables remain the same:
```env
SMS_API_URL=https://rslri.connectbind.com:8443/bulksms/bulksms
SMS_USERNAME=DG35-vanavihari
SMS_PASSWORD=digimile
SMS_ENTITY_ID=1101485850000078016
SMS_TMID=1101485850000078016,1602100000000009244
```

Template IDs are now hardcoded in `backend/config/smsTemplates.js`.

## ✅ Backward Compatibility

- All integration points remain the same
- Function signatures unchanged
- Same async/non-blocking behavior
- Same error handling
- Same logging format

## 🔮 Future: Tourist Spot SMS

When adding tourist spot SMS, use the same pattern:

```javascript
// In smsTemplates.js - reuse existing templates
const template = SMS_TEMPLATES.VANAVIHARI; // or JUNGLESTAR

// In service - create new function
export async function sendTouristSpotReservationSMS(reservation, paymentTransaction) {
  // Use same template, just different date field (visitDate)
}
```

## 📊 Summary

✅ Templates updated to new IDs
✅ Code simplified (removed unnecessary DB queries)
✅ Same functionality, better performance
✅ Ready to use - just restart server!
