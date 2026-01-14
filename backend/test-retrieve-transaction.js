import dotenv from 'dotenv';
import { retrieveTransaction } from './services/retrieveTransaction.js';

dotenv.config();

// Test the retrieve transaction API
async function testRetrieveTransaction() {
  console.log('🧪 Testing BillDesk Retrieve Transaction API\n');

  // Replace with actual BD Order ID from your test payment
  const testBdOrderId = 'BDORDER123456789'; // UPDATE THIS
  const mercid = process.env.BILLDESK_MERCID;

  console.log('Test Parameters:');
  console.log('  BD Order ID:', testBdOrderId);
  console.log('  Merchant ID:', mercid);
  console.log('\n');

  const result = await retrieveTransaction(testBdOrderId, mercid);

  if (result.success) {
    console.log('✅ SUCCESS - Transaction retrieved');
    console.log('\nFull Response:');
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log('❌ FAILED - Could not retrieve transaction');
    console.log('Error:', result.error);
    if (result.response) {
      console.log('Response:', JSON.stringify(result.response, null, 2));
    }
  }
}

testRetrieveTransaction();
