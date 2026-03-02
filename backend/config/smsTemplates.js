export const SMS_TEMPLATES = {
  // VANAVIHARI - Room booking template (Short)
  VANAVIHARI_SHORT: {
    source: 'VANVHR',
    tempid: '1107176807116645251',
    getMessage: (data) => 
      `Dear ${data.fullName}, Your VANAVIHARI stay is booked! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -VANAVIHARI`
  },

  // JUNGLE STAR - Room booking template (Short)
  JUNGLESTAR_SHORT: {
    source: 'JUNSTR',
    tempid: '1107176807164037326',
    getMessage: (data) => 
      `Dear ${data.fullName}, Your JungleStar stay is booked! ID: ${data.bookingId}, Check-in: ${data.checkIn}, Check-out: ${data.checkOut}, Paid: INR ${data.amount}. More info emailed. Enjoy your visit! -JUNGLE STAR`
  },

  // VANAVIHARI — Full room booking confirmation (DLT: 1107171542954805556)
  VANAVIHARI_BOOKING_FULL: {
    source: 'VANVHR',
    tempid: '1107171542954805556',
    getMessage: (data) =>
      `Dear ${data.fullName},\nYour room booking is confirmed.\nID: ${data.bookingId}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\nGUESTS: ${data.guests}\nROOM: ${data.rooms}\nCOTTAGE: ${data.cottages}\nAmount paid: INR ${data.amount}\nFull details are in your email. Call 9840166419 for support. Wish you a wonderful stay! Thank you for choosing our resort -VANAVIHARI`
  },

  // JUNGLE STAR — Full room booking confirmation (DLT: 1107171543004186036)
  JUNGLESTAR_BOOKING_FULL: {
    source: 'JUNSTR',
    tempid: '1107171543004186036',
    getMessage: (data) =>
      `Dear ${data.fullName},\nYour room booking is confirmed.\nID: ${data.bookingId}\nCheck-in: ${data.checkIn}\nCheck-out: ${data.checkOut}\nGUESTS: ${data.guests}\nROOM: ${data.rooms}\nCOTTAGE: ${data.cottages}\nAmount paid: INR ${data.amount}\nFull details are in your email. Call 9840166419 for support. Wish you a wonderful stay! Thank you for choosing our resort -JUNGLE STAR`
  },

  // VANAVIHARI — Admin new booking notification (DLT: 1107171740058959535)
  VANAVIHARI_ADMIN_BOOKING: {
    source: 'VANVHR',
    tempid: '1107171740058959535',
    getMessage: (data) =>
      `Dear Coordinator,\nA new room booking has been received.\nGuest Name: ${data.fullName}  \nMobile No.: ${data.phone}  \nID: ${data.bookingId}  \nCheck-in: ${data.checkIn}  \nCheck-out: ${data.checkOut}  \nGuest Count: ${data.guests}  \nRoom(s): ${data.rooms}  \nCottage(s): ${data.cottages}  \nAmount Paid: INR ${data.amount}\nPlease ensure the room is prepared for the guest's check-in. Thank you! -VANAVIHARI`
  },

  // JUNGLE STAR — Admin new booking notification (DLT: 1107171740089476326)
  JUNGLESTAR_ADMIN_BOOKING: {
    source: 'JUNSTR',
    tempid: '1107171740089476326',
    getMessage: (data) =>
      `Dear Coordinator,\nA new room booking has been received.\nGuest Name: ${data.fullName}  \nMobile No.: ${data.phone}  \nID: ${data.bookingId}  \nCheck-in: ${data.checkIn}  \nCheck-out: ${data.checkOut}  \nGuest Count: ${data.guests}  \nRoom(s): ${data.rooms}  \nCottage(s): ${data.cottages}  \nAmount Paid: INR ${data.amount}\nPlease ensure the room is prepared for the guest's check-in. Thank you! -JUNGLE STAR`
  },

  // TREK_BOOKING
  TREK_BOOKING: {
    source: 'VANVHR',
    tempid: '1107177200964168936',
    getMessage: (data) =>
      `Dear ${data.fullName}, Your Trek booking is confirmed. ID: ${data.bookingId}, Visit dt.: ${data.visitDate}, Paid Rs. ${data.amount}. More info emailed. Enjoy your visit! -VANAVIHARI`
  },

  // VANAVIHARI — Cancellation with refund (Guest) (DLT: 1107171946479475368)
  VANAVIHARI_CANCEL_REFUND: {
    source: 'VANVHR',
    tempid: '1107171946479475368',
    getMessage: (data) =>
      `Your booking with ID ${data.bookingId} at ${data.resortName} has been cancelled. A refund of Rs ${data.refundAmount} will be processed within 5-7 days. Please check your email for further details. -VANAVIHARI`
  },

  // VANAVIHARI — Cancellation NO refund (Guest, within 24h of check-in) (DLT: 1107171946498032782)
  VANAVIHARI_CANCEL_NO_REFUND: {
    source: 'VANVHR',
    tempid: '1107171946498032782',
    getMessage: (data) =>
      `Your booking with ID ${data.bookingId} at ${data.resortName} has been cancelled. Since the cancellation request was submitted within 24 hours of check-in, you will not receive a refund. Please check your email for further details. -VANAVIHARI`
  },

  // JUNGLE STAR — Cancellation with refund (Guest) (DLT: 1107171942066798897)
  JUNGLESTAR_CANCEL_REFUND: {
    source: 'JUNSTR',
    tempid: '1107171942066798897',
    getMessage: (data) =>
      `Your booking with ID ${data.bookingId} at ${data.resortName} has been cancelled. A refund of Rs ${data.refundAmount} will be processed in 5-7 days. Check your email for details. -JUNGLE STAR`
  },

  // JUNGLE STAR — Cancellation with refund for Vanavihari guest (DLT: 1107171942053526260)
  JUNGLESTAR_CANCEL_GUEST: {
    source: 'VANVHR',
    tempid: '1107171942053526260',
    getMessage: (data) =>
      `Your booking with ID ${data.bookingId} at ${data.resortName} has been cancelled. A refund of Rs ${data.refundAmount} will be processed in 5-7 days. Check your email for details. -VANAVIHARI`
  },

  // VANAVIHARI — Admin cancellation alert with refund (DLT: 1107171972995215491)
  VANAVIHARI_CANCEL_ADMIN_REFUND: {
    source: 'VANVHR',
    tempid: '1107171972995215491',
    getMessage: (data) =>
      `ALERT! A guest has submitted a cancellation request:\nBooking ID: ${data.bookingId}\nResort Name: ${data.resortName}\nRefund Amount: Rs ${data.refundAmount}\nPlease verify the details. -VANAVIHARI`
  },

  // VANAVIHARI — Admin cancellation alert NO refund (DLT: 1107171973020205946)
  VANAVIHARI_CANCEL_ADMIN_NO_REFUND: {
    source: 'VANVHR',
    tempid: '1107171973020205946',
    getMessage: (data) =>
      `ALERT! A guest has submitted a cancellation request within 24 hours of check-in:\nBooking ID: ${data.bookingId}\nResort Name: ${data.resortName}\nNo Refund Applicable.\nPlease verify the details. -VANAVIHARI`
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
  tmid: process.env.SMS_TMID || '1101485850000078016,1602100000000009244',
  adminPhone: process.env.SMS_ADMIN_PHONE || '9840166419'
};
