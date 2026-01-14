import axios from 'axios';
import { encryptRequest, signEncryptedRequest, verifyAndDecryptResponse } from './billdeskCrypto.js';

/**
 * Retrieve transaction status from BillDesk
 * @param {string} orderid - Original order ID (bookingId like VM0712482512006)
 * @param {string} mercid - Merchant ID
 * @param {string} authToken - Authorization token (not used, kept for compatibility)
 * @returns {Promise<Object>} Transaction details
 */
export async function retrieveTransaction(orderid, mercid, authToken = null) {
  try {
    const traceId = "TID" + Math.random().toString(36).slice(2, 14).toUpperCase();
    const timestamp = Date.now().toString();

    // Request body - BillDesk wants "orderid" (our bookingId), not "bdorderid"
    const requestBody = {
      mercid: mercid || process.env.BILLDESK_MERCID,
      orderid: orderid
    };

    const BASE_URL = process.env.BILLDESK_API_ENDPOINT;
    const url = `${BASE_URL}payments/ve1_2/transactions/get`;
    
    console.log('\n=== RETRIEVE TRANSACTION REQUEST ===');
    console.log('URL:', url);
    console.log('BD-TraceID:', traceId);
    console.log('BD-Timestamp:', timestamp);
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    // Encrypt and sign the request - SAME AS ORDER CREATION
    const encKey = process.env.BILLDESK_ENCRYPTION_KEY;
    const signKey = process.env.BILLDESK_SIGNING_KEY;
    const keyId = process.env.KEY_ID;
    const clientId = process.env.BILLDESK_CLIENTID;

    console.log('🔐 Encrypting request...');
    const encrypted = await encryptRequest(requestBody, encKey, keyId, clientId);
    
    console.log('✍️ Signing request...');
    const signed = await signEncryptedRequest(encrypted, signKey, keyId, clientId);

    const headers = {
      'Content-Type': 'application/jose',
      'Accept': 'application/jose',
      'BD-Traceid': traceId,
      'BD-Timestamp': timestamp
    };

    console.log('📤 Sending encrypted request to BillDesk...');
    const response = await axios.post(url, signed, {
      headers,
      timeout: 30000 // 30 second timeout
    });

    console.log('📥 Received encrypted response from BillDesk');
    console.log('Response Status:', response.status);
    console.log('Raw Response:', response.data);

    // Decrypt and verify BillDesk's response - SAME AS ORDER CREATION
    console.log('🔓 Decrypting response...');
    const decryptedData = await verifyAndDecryptResponse(
      response.data,
      signKey,
      encKey
    );

    console.log('✅ Response decrypted successfully');
    console.log('📋 Decrypted Data:', JSON.stringify(decryptedData, null, 2));
    console.log('====================================\n');

    return {
      success: true,
      data: decryptedData,
      traceId,
      timestamp
    };

  } catch (error) {
    console.error('\n❌ RETRIEVE TRANSACTION ERROR ===');
    console.error('Error Message:', error.message);
    
    // BillDesk returns encrypted error responses too - SAME AS ORDER CREATION
    if (error.response && error.response.data) {
      console.log('BillDesk Error Response (Encrypted):', error.response.data);
      
      try {
        const decryptedError = await verifyAndDecryptResponse(
          error.response.data,
          process.env.BILLDESK_SIGNING_KEY,
          process.env.BILLDESK_ENCRYPTION_KEY
        );
        
        console.log('📋 Decrypted Error Response:', JSON.stringify(decryptedError, null, 2));
        console.error('====================================\n');
        
        return {
          success: false,
          error: decryptedError.message || error.message,
          billdeskError: decryptedError
        };
      } catch (decryptError) {
        console.log('⚠️ Could not decrypt error response:', decryptError.message);
      }
    }
    
    console.error('====================================\n');
    return {
      success: false,
      error: error.message,
      response: error.response?.data || null
    };
  }
}
