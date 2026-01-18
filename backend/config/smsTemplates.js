// SMS Templates for Room and Tent Reservations

export const SMS_TEMPLATES = {
  // Room Reservation Templates
  ROOM_VANAVIHARI: {
    source: 'VANVHR',
    tempid: '1107171542954805556',
    getMessage: (data) => 
      `Dear ${data.fullName},
Your room booking is confirmed.
ID: ${data.bookingId}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}
GUESTS: ${data.totalGuests}
ROOM: ${data.roomNames}
COTTAGE: ${data.cottageNames}
Amount paid: INR ${data.amount}
Full details are in your email. Call 9840166419 for support. Wish you a wonderful stay! Thank you for choosing our resort -VANAVIHARI`
  },

  ROOM_JUNGLESTAR: {
    source: 'JUNSTR',
    tempid: '1107171543004186036',
    getMessage: (data) => 
      `Dear ${data.fullName},
Your room booking is confirmed.
ID: ${data.bookingId}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}
GUESTS: ${data.totalGuests}
ROOM: ${data.roomNames}
COTTAGE: ${data.cottageNames}
Amount paid: INR ${data.amount}
Full details are in your email. Call 9840166419 for support. Wish you a wonderful stay! Thank you for choosing our resort -JUNGLE STAR`
  },

  // Tent Reservation Templates
  TENT_VANAVIHARI: {
    source: 'VANVHR',
    tempid: '1107171542954805556', // Update with actual tent template ID if different
    getMessage: (data) => 
      `Dear ${data.fullName},
Your tent booking is confirmed.
ID: ${data.bookingId}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}
GUESTS: ${data.totalGuests}
TENT SPOT: ${data.tentSpotName}
TENTS: ${data.tentList}
Amount paid: INR ${data.amount}
Full details are in your email. Call 9840166419 for support. Wish you a wonderful camping experience! Thank you for choosing -VANAVIHARI`
  },

  TENT_JUNGLESTAR: {
    source: 'JUNSTR',
    tempid: '1107171543004186036', // Update with actual tent template ID if different
    getMessage: (data) => 
      `Dear ${data.fullName},
Your tent booking is confirmed.
ID: ${data.bookingId}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}
GUESTS: ${data.totalGuests}
TENT SPOT: ${data.tentSpotName}
TENTS: ${data.tentList}
Amount paid: INR ${data.amount}
Full details are in your email. Call 9840166419 for support. Wish you a wonderful camping experience! Thank you for choosing -JUNGLE STAR`
  }
};

// SMS Configuration
export const SMS_CONFIG = {
  url: process.env.SMS_API_URL || 'https://rslri.connectbind.com:8443/bulksms/bulksms',
  username: process.env.SMS_USERNAME || 'DG35-vanavihari',
  password: process.env.SMS_PASSWORD || 'digimile',
  entityid: process.env.SMS_ENTITY_ID || '1101485850000078016',
  tmid: process.env.SMS_TMID || '1101485850000078016,1602100000000009244'
};
