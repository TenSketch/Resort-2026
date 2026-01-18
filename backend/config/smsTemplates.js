// SMS Templates for Room and Tent Reservations
// Using common template for both room and tent bookings

export const SMS_TEMPLATES = {
  // VANAVIHARI - Common template for both Room and Tent
  VANAVIHARI: {
    source: 'VANVHR',
    tempid: '1107176807116645251',
    getMessage: (data) => 
      `Dear ${data.fullName}, Your VANAVIHARI stay is booked! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -VANAVIHARI`
  },

  // JUNGLE STAR - Common template for both Room and Tent
  JUNGLESTAR: {
    source: 'JUNSTR',
    tempid: '1107176807164037326',
    getMessage: (data) => 
      `Dear ${data.fullName}, Your JungleStar stay is booked! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -JUNGLE STAR`
  },

  // KARTHIKAVANAM - Tent booking template (TODO: Add template ID when available)
  KARTHIKAVANAM: {
    source: 'KRTVNM', // TODO: Update with actual source ID from SMS provider
    tempid: 'PENDING_TEMPLATE_ID', // TODO: Update with actual template ID
    getMessage: (data) => 
      `Dear ${data.fullName}, Your Karthikavanam tent booking is confirmed! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -KARTHIKAVANAM`
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
