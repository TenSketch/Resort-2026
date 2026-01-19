// Test SMS sending for Room and Tent Reservations
// Run with: node test-sms.js

import { sendRoomReservationSMS, sendTentReservationSMS } from './services/reservationSmsService.js';

console.log('🧪 Testing SMS Service...\n');

// Test Room Reservation SMS - Vanavihari
const testRoomReservation = {
  fullName: "Balaji",
  bookingId: "VANA8891",
  phone: "9384318546",
  checkIn: "2026-01-15",
  checkOut: "2026-01-17",
  totalPayable: 4500,
  resortSlug: "vanavihari"
};

const testTransaction = {
  transactionId: "TEST123456"
};

console.log('📱 Testing Room Reservation SMS (Vanavihari)...');
sendRoomReservationSMS(testRoomReservation, testTransaction)
  .then(result => {
    if (result.success) {
      console.log('✅ Room SMS test completed successfully\n');
    } else {
      console.log('❌ Room SMS test failed:', result.error, '\n');
    }
  })
  .catch(err => {
    console.error('❌ Room SMS test error:', err.message, '\n');
  });

// Test Tent Reservation SMS - Common template (works for all tent spots)
setTimeout(() => {
  const testTentReservation = {
    fullName: "Balaji",
    bookingId: "TENT1234",
    phone: "9384318546",
    checkinDate: "2026-01-20",
    checkoutDate: "2026-01-22",
    totalPayable: 3500,
    tentSpot: null // Will show "Tent Spot" as default
  };

  console.log('📱 Testing Tent Reservation SMS (Common Template)...');
  sendTentReservationSMS(testTentReservation, testTransaction)
    .then(result => {
      if (result.success) {
        console.log('✅ Tent SMS test completed successfully\n');
      } else {
        console.log('❌ Tent SMS test failed:', result.error, '\n');
      }
    })
    .catch(err => {
      console.error('❌ Tent SMS test error:', err.message, '\n');
    });
}, 2000);

console.log('⏳ Tests running... (check logs above)\n');
