import axios from "axios";
import { verifyAndDecryptResponse } from "./billdeskCrypto.js";

export async function sendToBillDesk(signedPayload, traceId, timestamp) {
  traceId = traceId || "TID" + Math.random().toString(36).slice(2, 14);
  timestamp = timestamp || Date.now().toString();

  const BASE_URL = process.env.BILLDESK_API_ENDPOINT; 
  const url = BASE_URL + "payments/ve1_2/orders/create";

  const headers = {
    "Content-Type": "application/jose",
    "Accept": "application/jose",
    "BD-Traceid": traceId,
    "BD-Timestamp": timestamp
  };

  console.log("📤 Sending to BillDesk:", url);
  console.log("📤 Request Headers:", JSON.stringify(headers, null, 2));
  console.log("📤 Request Payload (Signed & Encrypted):", signedPayload.substring(0, 100) + "...");

  try {
    const res = await axios.post(url, signedPayload, { headers });

    console.log("\n📥 Received encrypted response from BillDesk");
    console.log("Raw Response:", res.data);

    // Decrypt and verify BillDesk's response
    const decryptedResponse = await verifyAndDecryptResponse(
      res.data,
      process.env.BILLDESK_SIGNING_KEY,
      process.env.BILLDESK_ENCRYPTION_KEY
    );

    console.log("\n📋 Decrypted Response:", JSON.stringify(decryptedResponse, null, 2));

    return decryptedResponse;
  } catch (error) {
    // BillDesk returns encrypted error responses too
    if (error.response && error.response.data) {
      console.log("\n❌ BillDesk Error Response (Encrypted):", error.response.data);
      
      try {
        const decryptedError = await verifyAndDecryptResponse(
          error.response.data,
          process.env.BILLDESK_SIGNING_KEY,
          process.env.BILLDESK_ENCRYPTION_KEY
        );
        
        console.log("\n📋 Decrypted Error Response:", JSON.stringify(decryptedError, null, 2));
        
        // Create custom error with decrypted response attached
        const bdError = new Error(decryptedError.message || 'BillDesk Error');
        bdError.billdeskError = decryptedError;
        bdError.statusCode = error.response.status;
        bdError.isBillDeskError = true;
        throw bdError;
      } catch (decryptError) {
        // Only log if it's NOT our custom BillDesk error
        if (!decryptError.isBillDeskError) {
          console.log("\n⚠️ Could not decrypt error response:", decryptError.message);
          console.error(decryptError);
          throw error;
        }
        // Re-throw our custom error
        throw decryptError;
      }
    }
    throw error;
  }
}
