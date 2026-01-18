# SMS Integration for Reservations

## Overview
SMS notifications are automatically sent to customers after successful payment for both room and tent reservations, similar to email confirmations.

## Files Created

### 1. `backend/config/smsTemplates.js`
Contains SMS templates and configuration for:
- Room reservations (Vanavihari & Jungle Star)
- Tent reservations (Vanavihari & Jungle Star)
- SMS API configuration

### 2. `backend/services/reservationSmsService.js`
Main SMS service with two functions:
- `sendRoomReservationSMS(reservation, paymentTransaction)` - Sends SMS for room bookings
- `sendTentReservationSMS(reservation, paymentTransaction)` - Sends SMS for tent bookings

## Integration Points

### Room Reservations
SMS is sent from 2 locations:

1. **`backend/services/transactionPoller.js`** (line ~143)
   - Triggered when polling detects successful payment
   - Runs asynchronously after email sending

2. **`backend/controllers/paymentController.js`** (line ~443)
   - Triggered on immediate payment callback
   - Runs asynchronously after email sending

### Tent Reservations
SMS is sent from 1 location:

1. **`backend/controllers/tentPaymentController.js`** (line ~342)
   - Triggered after successful tent payment
   - Runs asynchronously after email sending

## SMS Templates

### Room Reservation SMS Format
```
Dear {Name},
Your room booking is confirmed.
ID: {BookingId}
Check-in: {Date}
Check-out: {Date}
GUESTS: {Count}
ROOM: {RoomNames}
COTTAGE: {CottageNames}
Amount paid: INR {Amount}
Full details are in your email. Call 9840166419 for support. Wish you a wonderful stay! Thank you for choosing our resort -{ResortName}
```

### Tent Reservation SMS Format
```
Dear {Name},
Your tent booking is confirmed.
ID: {BookingId}
Check-in: {Date}
Check-out: {Date}
GUESTS: {Count}
TENT SPOT: {SpotName}
TENTS: {TentList}
Amount paid: INR {Amount}
Full details are in your email. Call 9840166419 for support. Wish you a wonderful camping experience! Thank you for choosing -{ResortName}
```

## Configuration

### Environment Variables
Add to `backend/.env`:

```env
SMS_API_URL=https://rslri.connectbind.com:8443/bulksms/bulksms
SMS_USERNAME=DG35-vanavihari
SMS_PASSWORD=digimile
SMS_ENTITY_ID=1101485850000078016
SMS_TMID=1101485850000078016,1602100000000009244
```

### Template IDs by Resort

**Vanavihari:**
- Source: `VANVHR`
- Template ID: `1107171542954805556`

**Jungle Star:**
- Source: `JUNSTR`
- Template ID: `1107171543004186036`

## Features

### Phone Number Formatting
- Automatically adds "91" country code if missing
- Removes non-digit characters
- Validates format before sending

### Date Formatting
- Converts dates to `DD-MMM-YYYY` format
- Example: `15-Jan-2026`

### Resort Detection
- Automatically selects correct template based on `resortSlug`
- Supports: `vanavihari`, `jungle-star`, `junglestar`
- Defaults to Vanavihari if slug not found

### Error Handling
- SMS failures are logged but don't break payment flow
- Runs asynchronously (non-blocking)
- Returns success/failure status for monitoring

## Testing

### Test Room Reservation SMS
```javascript
import { sendRoomReservationSMS } from './services/reservationSmsService.js';

const testReservation = {
  fullName: "Test User",
  bookingId: "VANA1234",
  phone: "9384318546",
  checkIn: "2026-01-15",
  checkOut: "2026-01-17",
  adults: 2,
  guests: 0,
  children: 1,
  totalPayable: 4500,
  resortSlug: "vanavihari",
  rooms: [] // Add room IDs if testing with DB
};

const testTransaction = {
  transactionId: "TEST123"
};

sendRoomReservationSMS(testReservation, testTransaction);
```

### Test Tent Reservation SMS
```javascript
import { sendTentReservationSMS } from './services/reservationSmsService.js';

const testReservation = {
  fullName: "Test User",
  bookingId: "TENT1234",
  phone: "9384318546",
  checkinDate: "2026-01-15",
  checkoutDate: "2026-01-17",
  guests: 2,
  children: 1,
  totalPayable: 3500,
  resortSlug: "vanavihari",
  tents: [] // Add tent IDs if testing with DB
};

const testTransaction = {
  transactionId: "TEST123"
};

sendTentReservationSMS(testReservation, testTransaction);
```

## Logs

SMS operations log the following:
- `📱 Preparing room/tent reservation SMS for booking: {bookingId}`
- `📱 Sending SMS to: {mobile}`
- `📱 Resort: {resortSlug}`
- `📱 Source: {source}, Template ID: {tempid}`
- `✅ Room/Tent reservation SMS sent successfully to {mobile}`
- `❌ Failed to send SMS: {error}`

## Future Enhancements

### Tourist Spot Reservations
To add SMS for tourist spot bookings:

1. Create template in `backend/config/smsTemplates.js`:
```javascript
TOURIST_SPOT_VANAVIHARI: {
  source: 'VANVHR',
  tempid: 'YOUR_TEMPLATE_ID',
  getMessage: (data) => `Your tourist spot booking message...`
}
```

2. Add function in `backend/services/reservationSmsService.js`:
```javascript
export async function sendTouristSpotReservationSMS(reservation, paymentTransaction) {
  // Similar to room/tent implementation
}
```

3. Integrate in tourist spot payment controller

## Troubleshooting

### SMS Not Sending
1. Check environment variables are set correctly
2. Verify phone number format (should have 91 prefix)
3. Check SMS API credentials
4. Review console logs for error messages

### Wrong Template
1. Verify `resortSlug` in reservation document
2. Check template IDs match your SMS provider configuration
3. Ensure source IDs are approved by SMS provider

### Phone Number Issues
- Phone must be valid 10-digit Indian number
- System automatically adds "91" prefix
- Non-digit characters are removed automatically

## API Response Codes
Check SMS provider documentation for response codes. Common responses:
- Success: SMS queued/sent
- Failure: Invalid number, insufficient credits, template mismatch
