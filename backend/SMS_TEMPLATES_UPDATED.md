# SMS Templates - Final Configuration

## ✅ Current Setup

### Room Booking Templates (Resort-Specific)

**VANAVIHARI - Room Bookings**
- Template ID: `1107176807116645251`
- Header: `VANVHR`
- Message: `Dear {Name}, Your VANAVIHARI stay is booked! ID: {BookingId}, Check-in: {Date}, Check-out: {Date}, Paid: INR {Amount}. More info emailed. Enjoy your visit! -VANAVIHARI`

**JUNGLE STAR - Room Bookings**
- Template ID: `1107176807164037326`
- Header: `JUNSTR`
- Message: `Dear {Name}, Your JungleStar stay is booked! ID: {BookingId}, Check-in: {Date}, Check-out: {Date}, Paid: INR {Amount}. More info emailed. Enjoy your visit! -JUNGLE STAR`

### Tent Booking Template (Common for All)

**TENT_COMMON - All Tent Bookings**
- Template ID: `1107176882804274771`
- Header: `VANVHR`
- Message: `Dear {Name}, Enjoy your Tent stay at {TentSpotName}! ID: {BookingId}, Check-in: {Date}. More info emailed.`
- **Used for:** Vanavihari tents, Jungle Star tents, Karthikavanam tents, and any other tent spots

## 📋 Template Usage

### Room Reservations
- Vanavihari rooms → VANAVIHARI template
- Jungle Star rooms → JUNGLESTAR template

### Tent Reservations
- **ALL tent bookings** → TENT_COMMON template
- Includes tent spot name dynamically
- Works for:
  - Vanavihari tent spots
  - Jungle Star tent spots
  - Karthikavanam tent spots
  - Any future tent spots

## 📱 Example SMS Messages

### Room Booking (Vanavihari)
```
Dear Balaji, Your VANAVIHARI stay is booked! ID: VANA8891, Check-in: 15-Jan-2026, Check-out: 17-Jan-2026, Paid: INR 4500.00. More info emailed. Enjoy your visit! -VANAVIHARI
```

### Room Booking (Jungle Star)
```
Dear Balaji, Your JungleStar stay is booked! ID: JUNG1234, Check-in: 20-Jan-2026, Check-out: 22-Jan-2026, Paid: INR 5500.00. More info emailed. Enjoy your visit! -JUNGLE STAR
```

### Tent Booking (Any Tent Spot)
```
Dear Balaji, Enjoy your Tent stay at Karthikavanam Valamuru! ID: TENT5678, Check-in: 25-Jan-2026. More info emailed.
```

## 🔧 How It Works

### Room SMS Logic
```javascript
// Checks resortSlug to select template
if (resortSlug === 'jungle-star' || resortSlug === 'junglestar') {
  → Use JUNGLESTAR template
} else {
  → Use VANAVIHARI template (default)
}
```

### Tent SMS Logic
```javascript
// Always uses common tent template
template = SMS_TEMPLATES.TENT_COMMON;

// Fetches tent spot name from database
tentSpotName = tentSpotData?.spotName || 'Tent Spot';
```

## 🎯 Benefits of Common Tent Template

✅ **Single template for all tent spots** - No need to create separate templates
✅ **Dynamic tent spot name** - Automatically includes the actual tent spot name
✅ **Simpler maintenance** - One template to manage
✅ **Works for future tent spots** - No code changes needed for new tent locations
✅ **Consistent messaging** - Same format across all tent bookings

## 📊 Template Summary

| Booking Type | Template Used | Template ID | Dynamic Fields |
|--------------|---------------|-------------|----------------|
| Vanavihari Room | VANAVIHARI | 1107176807116645251 | Name, ID, Dates, Amount |
| Jungle Star Room | JUNGLESTAR | 1107176807164037326 | Name, ID, Dates, Amount |
| Any Tent Booking | TENT_COMMON | 1107176882804274771 | Name, ID, Date, Tent Spot Name |

## 🚀 No Configuration Needed!

All templates are active and ready:
- ✅ Room templates configured
- ✅ Common tent template configured
- ✅ All tent spots supported automatically
- ✅ Just restart server and it works!

## 🧪 Testing

```bash
cd backend
node test-sms.js
```

This will test:
1. Room booking SMS (Vanavihari)
2. Tent booking SMS (Common template)

Both should succeed if SMS credentials are configured correctly.
