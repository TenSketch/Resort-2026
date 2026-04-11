import mongoose from 'mongoose';
import 'dotenv/config';
import { lockRooms, releaseLocks } from '../utils/bookingLock.js';

async function verifyDoubleBooking() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const roomId = 'TEST-ROOM-' + Math.floor(Math.random() * 1000);
    const checkIn = new Date('2026-05-01');
    const checkOut = new Date('2026-05-03');
    const expiry = new Date(Date.now() + 60000); // 1 min

    console.log(`\n--- TEST 1: Simultaneous parallel requests ---`);
    console.log(`Attempting 10 parallel locks for ${roomId} on 2026-05-01...`);

    const requests = Array(10).fill(null).map((_, i) => 
      lockRooms([roomId], checkIn, checkOut, `req-${i}`, expiry)
    );

    const results = await Promise.all(requests);

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    console.log(`Successes: ${successes.length}`);
    console.log(`Failures: ${failures.length}`);

    if (successes.length === 1) {
      console.log('✅ PASS: Only 1 request succeeded. Race condition prevented!');
    } else {
      console.log('❌ FAIL: Multiple requests succeeded. Race condition still exists!');
    }

    console.log(`\n--- TEST 2: Lock & Release ---`);
    console.log('Releasing locks...');
    for (let i = 0; i < 10; i++) {
      await releaseLocks(`req-${i}`);
    }

    console.log('Attempting lock again after release...');
    const retry = await lockRooms([roomId], checkIn, checkOut, 'retry-1', expiry);
    if (retry.success) {
      console.log('✅ PASS: Lock successfully re-acquired after release.');
    } else {
      console.log('❌ FAIL: Could not re-acquire lock after release.');
    }

    await releaseLocks('retry-1');
    await mongoose.connection.close();
    console.log('\nVerification complete.');

  } catch (err) {
    console.error('An error occurred during verification:', err);
    process.exit(1);
  }
}

verifyDoubleBooking();
