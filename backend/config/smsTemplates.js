// SMS Templates for Room and Tent Reservations

export const SMS_TEMPLATES = {
  // VANAVIHARI - Room booking template
  VANAVIHARI: {
    source: 'VANVHR',
    tempid: '1107176807116645251',
    getMessage: (data) => 
      `Dear ${data.fullName}, Your VANAVIHARI stay is booked! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -VANAVIHARI`
  },

  // JUNGLE STAR - Room booking template
  JUNGLESTAR: {
    source: 'JUNSTR',
    tempid: '1107176807164037326',
    getMessage: (data) => 
      `Dear ${data.fullName}, Your JungleStar stay is booked! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -JUNGLE STAR`
  },

  // COMMON TENT TEMPLATE - Used for all tent bookings (Vanavihari, Jungle Star, Karthikavanam)
  TENT_COMMON: {
    source: 'VANVHR',
    tempid: '1107176882804274771',
    getMessage: (data) => 
      `Dear ${data.fullName}, Enjoy your Tent stay at ${data.tentSpotName}! ID: ${data.bookingId}, Check-in: ${data.checkIn}. More info emailed.`
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
