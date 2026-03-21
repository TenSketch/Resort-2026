import axios from "axios";
import { verifyAndDecryptResponse } from "./billdeskCrypto.js";

export async function sendToBillDesk(signedPayload, traceId, timestamp) {
  traceId   = traceId   || "TID" + Math.random().toString(36).slice(2, 14).toUpperCase();
  timestamp = timestamp || Date.now().toString();

  const BASE_URL = process.env.BILLDESK_API_ENDPOINT;
  const url      = BASE_URL + "payments/v1_2/orders/create";  // ✅ fixed: was ve1_2

  const headers = {
    "Content-Type": "application/jose",
    "Accept":       "application/jose",
    "BD-Traceid":   traceId,
    "BD-Timestamp": timestamp
  };

  // ── UAT SECTION B: Send headers log ──────────────────────────────────
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║  UAT PROOF — Sending Create Order to BillDesk             ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("📌 URL         :", url);
  console.log("📌 BD-Traceid  :", traceId);
  console.log("📌 BD-Timestamp:", timestamp);
  console.log("✍️  Signed JWS (SENT — first 150 chars):", signedPayload.substring(0, 150) + "...");
  console.log("✍️  Full Signed JWS Payload (SENT):\n", signedPayload);

  try {
    const res = await axios.post(url, signedPayload, { headers });

    // ── UAT SECTION C: Raw encoded response ──────────────────────────
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║  UAT PROOF — Section C: Original Encoded Response          ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("📥 Raw Encoded Response (from BillDesk — ORIGINAL STRING):\n", res.data);

    // Decrypt and verify BillDesk's response
    const decryptedResponse = await verifyAndDecryptResponse(
      res.data,
      process.env.BILLDESK_SIGNING_KEY,
      process.env.BILLDESK_ENCRYPTION_KEY
    );

    // ── UAT SECTION C: Decoded response ──────────────────────────────
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║  UAT PROOF — Section C: Decoded Create Order Response       ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
    console.log("📋 Decoded JSON Response:\n", JSON.stringify(decryptedResponse, null, 2));

    // Write to UAT log file
    try {
      const fs = await import("fs");
      fs.writeFileSync("debug_trek_payment_uat.log", `
════════════════════ UAT SECTION C: Create Order Response ════════════════════
Timestamp: ${new Date().toISOString()}
Original Encoded Response (STORED — NOT RECONSTRUCTED):
${res.data}

Decoded JSON Response:
${JSON.stringify(decryptedResponse, null, 2)}
══════════════════════════════════════════════════════════════════════════════
`, { flag: "a" });
    } catch (_) {}

    return decryptedResponse;

  } catch (error) {
    if (error.response && error.response.data) {
      console.log("\n❌ BillDesk Error Response (Encoded):", error.response.data);
      try {
        const decryptedError = await verifyAndDecryptResponse(
          error.response.data,
          process.env.BILLDESK_SIGNING_KEY,
          process.env.BILLDESK_ENCRYPTION_KEY
        );
        console.log("📋 Decrypted Error Response:", JSON.stringify(decryptedError, null, 2));
        const bdError      = new Error(decryptedError.message || "BillDesk Error");
        bdError.billdeskError = decryptedError;
        bdError.statusCode    = error.response.status;
        bdError.isBillDeskError = true;
        throw bdError;
      } catch (decryptError) {
        if (!decryptError.isBillDeskError) {
          console.log("⚠️ Could not decrypt error response:", decryptError.message);
          throw error;
        }
        throw decryptError;
      }
    }
    throw error;
  }
}
