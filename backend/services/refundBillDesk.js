import axios from 'axios';
import { encryptRequest, signEncryptedRequest, decryptResponse, verifySignature } from './billdeskCrypto.js';

export const initiateBilldeskRefund = async (refundData, encKey, signKey, keyId, clientId) => {
  try {
    const encrypted = await encryptRequest(refundData, encKey, keyId, clientId);
    const signed = await signEncryptedRequest(encrypted, signKey, keyId, clientId);
    
    const traceId = "TID" + Math.random().toString(36).slice(2, 14).toUpperCase();
    const timestamp = Date.now().toString();

    // BillDesk Refund API requires a token from generate token API or signature 
    // Wait, the API spec says:
    // Header BD-Traceid, BD-Timestamp
    // JWS signed payload
    const headers = {
      "Content-Type": "application/jose",
      "BD-Traceid": traceId,
      "BD-Timestamp": timestamp
    };
    
    // For refund, we might need BDAuth token, but usually signature is enough.
    // Let's check sendToBillDesk.js what it does.
    const host = process.env.BILLDESK_API_URL || "https://uat1.billdesk.com";
    const url = `${host}/u2/payments/ve1_2/refunds/create`;

    console.log("SENDING REFUND REQUEST TO BILLDESK:");
    console.log("URL:", url);
    console.log("Headers:", headers);

    const response = await axios.post(url, signed, { headers });

    const responseData = response.data;
    const isValid = await verifySignature(responseData, signKey);
    
    if (!isValid) {
      throw new Error("Invalid signature in BillDesk Refund Response");
    }

    const decrypted = await decryptResponse(responseData, encKey);
    return { success: true, data: decrypted, traceId, timestamp };
  } catch (error) {
    if (error.response && error.response.data) {
        try {
            const isValid = await verifySignature(error.response.data, signKey);
            if(isValid) {
                 const decrypted = await decryptResponse(error.response.data, encKey);
                 return { success: false, data: decrypted, error: "Refund failed at gateway" };
            }
        } catch(e) {}
    }
    console.error("Refund API Error:", error.message);
    throw error;
  }
};
