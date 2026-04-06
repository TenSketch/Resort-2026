import axios from 'axios';
import { encryptRequest, signEncryptedRequest, verifyAndDecryptResponse } from './billdeskCrypto.js';

/**
 * Retrieve transaction status from BillDesk
 * UAT Proof: Section D (Request) & Section E (Response)
 */
export async function retrieveTransaction(orderid, mercid, authToken = null) {
  try {
    const traceId = "TID" + Math.random().toString(36).slice(2, 14).toUpperCase();
    const timestamp = Date.now().toString();

    const requestBody = {
      mercid: mercid || process.env.BILLDESK_MERCID,
      orderid: orderid   // BillDesk wants our bookingId here, not the bdorderid
    };

    const BASE_URL = process.env.BILLDESK_API_ENDPOINT;
    const url = `${BASE_URL.replace(/\/$/, '')}/payments/v1_2/transactions/get`; // ✅ Use v1_2 for GET status

    const encKey = process.env.BILLDESK_ENCRYPTION_KEY;
    const signKey = process.env.BILLDESK_SIGNING_KEY;
    const keyId = process.env.KEY_ID;
    const clientId = process.env.BILLDESK_CLIENTID;

    // Encrypt and sign exactly like Create Order
    const encrypted = await encryptRequest(requestBody, encKey, keyId, clientId);
    const signed = await signEncryptedRequest(encrypted, signKey, keyId, clientId);

    const headers = {
      'Content-Type': 'application/jose',
      'Accept': 'application/jose',
      'BD-Traceid': traceId,
      'BD-Timestamp': timestamp
    };

    // ── UAT SECTION D: Retrieve Transaction Request ─────────────────────
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  UAT PROOF — Section D: Retrieve Transaction API Request     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('📌 URL         :', url);
    console.log('📌 BD-Traceid  :', traceId);
    console.log('📌 BD-Timestamp:', timestamp);
    console.log('📝 JSON Request Body:\n', JSON.stringify(requestBody, null, 2));
    console.log('✍️  Full Signed JWS (SENT):\n', signed);

    try {
      const fs = await import('fs');
      fs.writeFileSync('debug_trek_payment_uat.log', `
════════════════════ UAT SECTION D: Retrieve Transaction Request ════════════════════
Timestamp   : ${new Date().toISOString()}
URL         : ${url}
BD-Traceid  : ${traceId}
BD-Timestamp: ${timestamp}
JSON Request Body:
${JSON.stringify(requestBody, null, 2)}
Encrypted JWE: ${encrypted}
Signed JWS   : ${signed}
═════════════════════════════════════════════════════════════════════════════════════
`, { flag: 'a' });
    } catch (_) { }

    const response = await axios.post(url, signed, { headers, timeout: 30000 });

    // ── UAT SECTION D: Check auth_status ONLY after signature validation ─
    // verifyAndDecryptResponse() verifies signature FIRST, then decrypts
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  UAT PROOF — Section E: Retrieve Transaction Encoded Response ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('📥 Original Encoded Response (STORED — NOT RECONSTRUCTED):\n', response.data);

    // ✅ UAT: auth_status read ONLY after successful signature validation
    const decryptedData = await verifyAndDecryptResponse(response.data, signKey, encKey);

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  UAT PROOF — Section E: Retrieve Transaction Decoded Response ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('📋 Decoded JSON Response:\n', JSON.stringify(decryptedData, null, 2));
    console.log(`✅ [UAT] auth_status = "${decryptedData.auth_status}" — read AFTER signature verification`);

    try {
      const fs = await import('fs');
      fs.writeFileSync('debug_trek_payment_uat.log', `
════════════════════ UAT SECTION E: Retrieve Transaction Response ════════════════════
Timestamp: ${new Date().toISOString()}
Original Encoded Response (STORED — NOT RECONSTRUCTED):
${response.data}

Decoded JSON Response:
${JSON.stringify(decryptedData, null, 2)}

auth_status: ${decryptedData.auth_status} (read AFTER signature validation ✅)
══════════════════════════════════════════════════════════════════════════════════════
`, { flag: 'a' });
    } catch (_) { }

    return { success: true, data: decryptedData, traceId, timestamp };

  } catch (error) {
    console.error('\n❌ RETRIEVE TRANSACTION ERROR:', error.message);

    if (error.response && error.response.data) {
      console.log('Encoded BillDesk Error Response:', error.response.data);
      try {
        const decryptedError = await verifyAndDecryptResponse(
          error.response.data,
          process.env.BILLDESK_SIGNING_KEY,
          process.env.BILLDESK_ENCRYPTION_KEY
        );
        console.log('Decrypted Error Response:', JSON.stringify(decryptedError, null, 2));
        return { success: false, error: decryptedError.message || error.message, billdeskError: decryptedError };
      } catch (decryptError) {
        console.log('⚠️ Could not decrypt error response:', decryptError.message);
      }
    }

    return { success: false, error: error.message, response: error.response?.data || null };
  }
}
