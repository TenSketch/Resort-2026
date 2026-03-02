import {
  sendRoomReservationSMS,
  sendTentReservationSMS,
  sendTrekReservationSMS,
  sendCancellationSMS,
} from './services/reservationSmsService.js';

const TEST_PHONE = process.env.TEST_PHONE || '9384318546'; // Override with SMS_TEST_PHONE in .env

console.log('╔════════════════════════════════════════╗');
console.log('║        🧪 SMS Service Test Suite       ║');
console.log('╚════════════════════════════════════════╝\n');
console.log(`📲 Sending test SMS to: ${TEST_PHONE}\n`);

// ── Helper ──────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {

  // ── 1. Room Booking SMS — Vanavihari ─────────────────────
  console.log('【1/6】 Room SMS (VANAVIHARI full template)...');
  const result1 = await sendRoomReservationSMS({
    fullName:     'Balaji',
    bookingId:    'BV2603001',
    phone:        TEST_PHONE,
    checkIn:      '2026-03-15',
    checkOut:     '2026-03-17',
    guests:       2,
    roomNumbers:  'R-101',
    cottageNames: 'Teak Cottage',
    totalPayable: 5000,
    resortSlug:   'vanavihari',
  }, {});
  console.log(`   → ${result1.success ? '✅ Sent' : '❌ Failed: ' + result1.error}\n`);
  await delay(2000);

  // ── 2. Room Booking SMS — Jungle Star ────────────────────
  console.log('【2/6】 Room SMS (JUNGLE STAR full template)...');
  const result2 = await sendRoomReservationSMS({
    fullName:     'Kavya',
    bookingId:    'BJ2603002',
    phone:        TEST_PHONE,
    checkIn:      '2026-03-20',
    checkOut:     '2026-03-22',
    guests:       3,
    roomNumbers:  'R-203',
    cottageNames: 'Bamboo Cottage',
    totalPayable: 7500,
    resortSlug:   'jungle-star',
  }, {});
  console.log(`   → ${result2.success ? '✅ Sent' : '❌ Failed: ' + result2.error}\n`);
  await delay(2000);

  // ── 3. Tent Booking SMS ───────────────────────────────────
  console.log('【3/6】 Tent SMS (VANAVIHARI short template)...');
  const result3 = await sendTentReservationSMS({
    fullName:     'Ravi',
    bookingId:    'TN2603001',
    phone:        TEST_PHONE,
    checkinDate:  '2026-03-25',
    checkoutDate: '2026-03-26',
    guests:       4,
    totalPayable: 3500,
  }, {});
  console.log(`   → ${result3.success ? '✅ Sent' : '❌ Failed: ' + result3.error}\n`);
  await delay(2000);

  // ── 4. Trek Booking SMS ───────────────────────────────────
  console.log('【4/6】 Trek SMS (VANAVIHARI trek template)...');
  const result4 = await sendTrekReservationSMS({
    user:        { name: 'Priya', phone: TEST_PHONE },
    bookingId:   'TS-260301-001',
    touristSpots:[{ visitDate: '2026-03-28' }],
    totalPayable: 1200,
  }, {});
  console.log(`   → ${result4.success ? '✅ Sent' : '❌ Failed: ' + result4.error}\n`);
  await delay(2000);

  // ── 5. Cancellation SMS — With Refund (Vanavihari) ───────
  console.log('【5/6】 Cancellation SMS with refund (VANAVIHARI)...');
  const result5 = await sendCancellationSMS({
    bookingId:  'BV2603001',
    phone:      TEST_PHONE,
    resortSlug: 'vanavihari',
  }, 4000, 'VANAVIHARI');
  console.log(`   → ${result5.success ? '✅ Sent' : '❌ Failed: ' + result5.error}\n`);
  await delay(2000);

  // ── 6. Cancellation SMS — No Refund (within 24h) ─────────
  console.log('【6/6】 Cancellation SMS NO refund (VANAVIHARI within 24h)...');
  const result6 = await sendCancellationSMS({
    bookingId:  'BV2603010',
    phone:      TEST_PHONE,
    resortSlug: 'vanavihari',
  }, 0, 'VANAVIHARI');
  console.log(`   → ${result6.success ? '✅ Sent' : '❌ Failed: ' + result6.error}\n`);

  // ── Summary ───────────────────────────────────────────────
  const results = [result1, result2, result3, result4, result5, result6];
  const passed  = results.filter(r => r.success).length;
  console.log('══════════════════════════════════════════');
  console.log(`✅ ${passed}/${results.length} tests passed`);
  if (passed < results.length) {
    console.log('❌ Some tests failed — check SMS API credentials and template IDs.');
  } else {
    console.log('🎉 All SMS tests passed!');
  }
}

run().catch(err => console.error('❌ Test suite crashed:', err.message));
