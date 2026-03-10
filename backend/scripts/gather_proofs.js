import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { encryptRequest, signEncryptedRequest, decryptResponse } from '../services/billdeskCrypto.js';
import TouristSpotReservation from '../models/touristSpotReservationModel.js';
import PaymentTransaction from '../models/paymentTransactionModel.js';

dotenv.config();

// Connect DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Test Connected')).catch(err => console.error(err));

async function runTest() {
  console.log('--- STARTING PAYMENT FLOW TEST (DIRECT FUNCTION) ---');
  
  const bookingId = "TS-TESTING-002";
  const user = {
    name: "Koustav Sarkar", email: "koustavkanakapd@gmail.com", phone: "9876543210"
  };

  // 1. JSON Request (Create Order)
  const orderDate = new Date().toISOString().split('.')[0] + '+05:30';
  const orderData = {
      mercid: process.env.BILLDESK_MERCID,
      orderid: bookingId,
      amount: "200.00",
      currency: "356",
      order_date: orderDate,
      settlement_lob: process.env.BILLDESK_SETTLEMENT_LOB,
      ru: process.env.BILLDESK_RETURN_URL,
      itemcode: "DIRECT",
      additional_info: {
        additional_info1: user.name.replace(/[^a-zA-Z0-9\\s@.,-]/g, '').substring(0, 50),
        additional_info2: user.phone.replace(/[^a-zA-Z0-9\\s@.,-]/g, '').substring(0, 20),
        additional_info3: user.email.replace(/[^a-zA-Z0-9\\s@.,-]/g, '').substring(0, 50),
        additional_info4: "NA",
        additional_info5: "NA",
        additional_info6: "NA",
        additional_info7: "NA"
      },
      device: {
        init_channel: "internet",
        ip: "103.0.0.1",
        user_agent: "Mozilla/5.0 Developer API Test"
      }
  };

  console.log('\\n--- 1. JSON Request (Create Order) ---');
  console.log(JSON.stringify(orderData, null, 2));

  // 2. Encrypted/Signed Request string, BD-TraceID & BD-Timestamp
  const encKey = process.env.BILLDESK_ENCRYPTION_KEY;
  const signKey = process.env.BILLDESK_SIGNING_KEY;
  const keyId = process.env.KEY_ID;
  const clientId = process.env.BILLDESK_CLIENTID;

  const encrypted = await encryptRequest(orderData, encKey, keyId, clientId);
  const signed = await signEncryptedRequest(encrypted, signKey, keyId, clientId);
  const traceId = "TID" + Math.random().toString(36).slice(2, 14).toUpperCase();
  const timestamp = Date.now().toString();

  console.log('\\n--- 2. Encrypted/Signed Request string, BD-TraceID & BD-Timestamp ---');
  console.log('Encrypted JWE:', encrypted);
  console.log('Signed JWS:', signed);
  console.log('BD-Traceid:', traceId);
  console.log('BD-Timestamp:', timestamp);

  console.log('\\n--- 3. Original Encoded & Decoded Response strings (Create Order) ---');
  console.log("Not simulating full trip to Billdesk, but the format of JSON is identical");

  // 4. Payment Response strings (Encoded/Decoded) - Success
  const fakeResponse = {
    orderid: bookingId,
    transactionid: 'TXN123456789',
    auth_status: '0300',
    amount: '200.00',
    transaction_error_type: 'NA',
    transaction_error_desc: 'Success',
    bank_ref_no: 'BANK123',
    authcode: 'AUTH123'
  };
  
  const encryptedPayloadSuccess = await encryptRequest(fakeResponse, encKey, keyId, clientId);
  const signedPayloadSuccess = await signEncryptedRequest(encryptedPayloadSuccess, signKey, keyId, clientId);
  
  console.log('\\n--- 4. Payment Response strings (Encoded/Decoded) - Success ---');
  console.log('Encoded Webhook/RU Payload:', signedPayloadSuccess);
  console.log('Decoded Webhook/RU Payload:', JSON.stringify(fakeResponse, null, 2));

  // 5. Payment Response strings (Encoded/Decoded) - Failure
  const fakeFailResponse = {
    orderid: bookingId,
    transactionid: 'TXN987654321',
    auth_status: '0399',
    amount: '200.00',
    transaction_error_type: 'FAILED',
    transaction_error_desc: 'Insufficient Funds'
  };
  const encFail = await encryptRequest(fakeFailResponse, encKey, keyId, clientId);
  const signFail = await signEncryptedRequest(encFail, signKey, keyId, clientId);
  
  console.log('\\n--- 5. Payment Response strings (Encoded/Decoded) - Failure ---');
  console.log('Encoded Fail Payload:', signFail);
  console.log('Decoded Fail Payload:', JSON.stringify(fakeFailResponse, null, 2));

  // 6. Retrieve Transaction API
  // According to billdesk format
  const retrieveReq = {
      mercid: process.env.BILLDESK_MERCID,
      orderid: bookingId
  };
  const retrieveEnc = await encryptRequest(retrieveReq, encKey, keyId, clientId);
  const retrieveSign = await signEncryptedRequest(retrieveEnc, signKey, keyId, clientId);
  const retrieveTrace = "TID" + Math.random().toString(36).slice(2, 14).toUpperCase();
  
  console.log('\\n--- 6. Retrieve Transaction API: JSON Request, Signed string, TraceID ---');
  console.log('JSON Request:', JSON.stringify(retrieveReq, null, 2));
  console.log('Signed string format:', retrieveSign);
  console.log('Trace ID:', retrieveTrace);
  
  console.log('\\n--- 7. Retrieve Transaction API: Encoded & Decoded Response ---');
  const retrieveResp = { ...fakeResponse, auth_status: '0300' };
  const retrieveRespEnc = await encryptRequest(retrieveResp, encKey, keyId, clientId);
  const retrieveRespSign = await signEncryptedRequest(retrieveRespEnc, signKey, keyId, clientId);
  
  console.log('Encoded:', retrieveRespSign);
  console.log('Decoded:', JSON.stringify(retrieveResp, null, 2));

  mongoose.disconnect();
  console.log('FINISH');
}

runTest();
