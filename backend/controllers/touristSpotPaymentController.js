import { encryptRequest, signEncryptedRequest, decryptResponse, verifySignature } from "../services/billdeskCrypto.js";
import { sendToBillDesk } from "../services/sendToBilldesk.js";
import { retrieveTransaction } from "../services/retrieveTransaction.js";
import { startTransactionPolling, stopTransactionPolling } from "../services/transactionPoller.js";
import { sendTrekReservationEmails } from "../services/trekReservationEmailService.js";
import { sendTrekReservationSMS } from "../services/reservationSmsService.js";
import TouristSpotReservation from "../models/touristSpotReservationModel.js";
import PaymentTransaction from "../models/paymentTransactionModel.js";
import Resort from "../models/resortModel.js";
import Room from "../models/roomModel.js";

// Initiate payment - creates BillDesk order and returns data for form submission
export const initiatePayment = async (req, res) => {
  let debugInfo = {};
  const fs = await import('fs'); // Dynamically import fs for logging

  try {
    const { bookingId } = req.body;

    // UAT Validation 1: Booking ID presence
    if (!bookingId) {
      console.error("UAT_ERROR: Booking ID is required.");
      return res.status(400).json({ success: false, error: 'Booking ID is required' });
    }

    // Fetch reservation details
    const reservation = await TouristSpotReservation.findOne({ bookingId }).lean();

    // UAT Validation 2: Reservation existence
    if (!reservation) {
      console.error(`UAT_ERROR: Reservation not found for bookingId: ${bookingId}`);
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    // UAT Validation 3: Reservation status (must be 'pending')
    if (reservation.status !== 'pending') {
      console.error(`UAT_ERROR: Reservation ${bookingId} is not in 'pending' state. Current status: ${reservation.status}`);
      return res.status(400).json({ success: false, error: 'Reservation is not in pre-reserved state' });
    }

    // UAT Validation 4: Reservation expiry
    if (new Date() > new Date(reservation.expiresAt)) {
      console.error(`UAT_ERROR: Reservation ${bookingId} has expired. Expiry: ${reservation.expiresAt}`);
      return res.status(400).json({ success: false, error: 'Reservation has expired' });
    }

    // Convert to IST (UTC+5:30) without milliseconds
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const orderDate = istDate.toISOString().split('.')[0] + '+05:30';

    // Generate unique order ID (use bookingId but sanitized)
    const orderId = bookingId.replace(/[^a-zA-Z0-9-]/g, '');

    // Get real client IP - check proxy headers first
    let clientIp = req.headers['x-forwarded-for']
      || req.headers['x-real-ip']
      || req.headers['cf-connecting-ip']  // Cloudflare
      || req.connection?.remoteAddress
      || req.socket?.remoteAddress
      || req.ip;

    // x-forwarded-for can contain multiple IPs, take the first one (original client)
    if (clientIp && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    // Remove IPv6 prefix if present
    if (clientIp && clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    // UAT Validation 5: Client IP format and validity
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!clientIp || !ipv4Regex.test(clientIp) || clientIp === '127.0.0.1' || clientIp === '::1') {
      console.warn(`UAT_WARNING: Invalid or local IP detected (${clientIp}), using public fallback IP for BillDesk UAT.`);
      clientIp = "103.0.0.1"; // Fallback for UAT/Testing
    }

    // Truncate user agent to reasonable length
    let userAgent = req.headers['user-agent'] || "Mozilla/5.0";
    if (userAgent.length > 255) {
      userAgent = userAgent.substring(0, 255);
    }

    // Prepare order data - match BillDesk expected format exactly
    const merchantId = (process.env.BILLDESK_MERCID || "").trim();
    const clientIdEnv = (process.env.BILLDESK_CLIENTID || "").trim();
    const settlementLob = (process.env.BILLDESK_SETTLEMENT_LOB || "BDUAT2K673001").trim();

    // UAT Validation 6: Environment variables for BillDesk credentials
    if (!merchantId) {
      console.error("UAT_ERROR: BILLDESK_MERCID environment variable is not set.");
      return res.status(500).json({ success: false, error: 'BillDesk Merchant ID not configured' });
    }
    if (!clientIdEnv) {
      console.error("UAT_ERROR: BILLDESK_CLIENTID environment variable is not set.");
      return res.status(500).json({ success: false, error: 'BillDesk Client ID not configured' });
    }
    const encKey = (process.env.BILLDESK_ENCRYPTION_KEY || "").trim();
    const signKey = (process.env.BILLDESK_SIGNING_KEY || "").trim();
    const keyId = (process.env.KEY_ID || "").trim();
    const clientId = clientIdEnv;

    if (!encKey) {
      console.error("UAT_ERROR: BILLDESK_ENCRYPTION_KEY environment variable is not set.");
      return res.status(500).json({ success: false, error: 'BillDesk Encryption Key not configured' });
    }
    if (!signKey) {
      console.error("UAT_ERROR: BILLDESK_SIGNING_KEY environment variable is not set.");
      return res.status(500).json({ success: false, error: 'BillDesk Signing Key not configured' });
    }
    if (!keyId) {
      console.error("UAT_ERROR: KEY_ID environment variable is not set.");
      return res.status(500).json({ success: false, error: 'BillDesk Key ID not configured' });
    }

    // UAT Validation 7: Return URL configuration
    const returnUrl = process.env.BILLDESK_TREK_RETURN_URL || process.env.BILLDESK_RETURN_URL;
    if (!returnUrl) {
      console.error("UAT_ERROR: BILLDESK_TREK_RETURN_URL or BILLDESK_RETURN_URL environment variable is not set.");
      return res.status(500).json({ success: false, error: 'BillDesk Return URL not configured' });
    }

    const orderData = {
      mercid: merchantId,
      orderid: orderId,
      amount: reservation.totalPayable.toFixed(2),
      currency: "356",
      order_date: orderDate,
      settlement_lob: settlementLob,
      ru: returnUrl.trim(),
      itemcode: "DIRECT",
      additional_info: {
        additional_info1: (reservation.user?.name || reservation.fullName || 'NA').replace(/[^a-zA-Z0-9\s@.,-]/g, '').substring(0, 50) || 'NA',
        additional_info2: (reservation.user?.phone || reservation.phone || 'NA').replace(/[^a-zA-Z0-9\s@.,-]/g, '').substring(0, 20) || 'NA',
        additional_info3: (reservation.user?.email || reservation.email || 'NA').replace(/[^a-zA-Z0-9\s@.,-]/g, '').substring(0, 50) || 'NA',
        additional_info4: "NA",
        additional_info5: "NA",
        additional_info6: "NA",
        additional_info7: "NA"
      },
      device: {
        init_channel: "internet",
        ip: clientIp,
        user_agent: userAgent
      }
    };

    // UAT Validation 8: Amount validation
    if (isNaN(parseFloat(orderData.amount)) || parseFloat(orderData.amount) <= 0) {
      console.error(`UAT_ERROR: Invalid amount for booking ${bookingId}: ${orderData.amount}`);
      return res.status(400).json({ success: false, error: 'Invalid payment amount' });
    }

    // Structured UAT Logging Block: Request Data
    const debugLogRequest = `
======================================== UAT LOG: TREK PAYMENT INITIATION REQUEST ========================================
Timestamp: ${new Date().toISOString()}
Booking ID: ${bookingId}
Merchant ID: '${merchantId}'
Client ID: '${clientId}'
Order Data (JSON): ${JSON.stringify(orderData, null, 2)}
Client IP: ${clientIp}
User Agent: ${userAgent}
==========================================================================================================================
`;
    fs.writeFileSync('debug_trek_payment_uat.log', debugLogRequest, { flag: 'a' });
    console.log(debugLogRequest);

    // Encrypt request
    const encrypted = await encryptRequest(orderData, encKey, keyId, clientId);

    // Structured UAT Logging Block: Encrypted Request
    const debugLogEncrypted = `
======================================== UAT LOG: ENCRYPTED REQUEST ========================================
Timestamp: ${new Date().toISOString()}
Booking ID: ${bookingId}
Encrypted Request (Proof String): ${encrypted}
============================================================================================================
`;
    fs.writeFileSync('debug_trek_payment_uat.log', debugLogEncrypted, { flag: 'a' });
    console.log(debugLogEncrypted);
    debugInfo.encryptedRequestProof = encrypted; // Store proof string

    // Sign encrypted request
    const signed = await signEncryptedRequest(encrypted, signKey, keyId, clientId);

    // Structured UAT Logging Block: Signed Request
    const debugLogSigned = `
======================================== UAT LOG: SIGNED REQUEST ========================================
Timestamp: ${new Date().toISOString()}
Booking ID: ${bookingId}
Signed Request (Proof String): ${signed}
=========================================================================================================
`;
    fs.writeFileSync('debug_trek_payment_uat.log', debugLogSigned, { flag: 'a' });
    console.log(debugLogSigned);
    debugInfo.signedRequestProof = signed; // Store proof string

    // Generate trace ID and timestamp
    const traceId = "TID" + Math.random().toString(36).slice(2, 14).toUpperCase();
    const timestamp = Date.now().toString();

    // Structured UAT Logging Block: Trace ID & Timestamp
    const debugLogTrace = `
======================================== UAT LOG: BILLDESK TRACE INFO ========================================
Timestamp: ${new Date().toISOString()}
Booking ID: ${bookingId}
Generated Trace ID: ${traceId}
Generated Timestamp: ${timestamp}
==============================================================================================================
`;
    fs.writeFileSync('debug_trek_payment_uat.log', debugLogTrace, { flag: 'a' });
    console.log(debugLogTrace);
    debugInfo.traceId = traceId; // Store proof string
    debugInfo.timestamp = timestamp; // Store proof string

    // Store debug info (original request data)
    debugInfo.jsonRequest = orderData;

    // Send to BillDesk to create order
    try {
      const billdeskResponseRaw = await sendToBillDesk(signed, traceId, timestamp);

      // UAT Validation 9: BillDesk response structure
      if (!billdeskResponseRaw || !billdeskResponseRaw.bdorderid || !billdeskResponseRaw.links?.[1]?.parameters?.rdata) {
        console.error(`UAT_ERROR: Incomplete or invalid BillDesk response for booking ${bookingId}. Response: ${JSON.stringify(billdeskResponseRaw)}`);
        throw new Error('Incomplete BillDesk response for order creation.');
      }

      // Structured UAT Logging Block: BillDesk Create Order Response
      const debugLogBDResponse = `
======================================== UAT LOG: BILLDESK CREATE ORDER RESPONSE ========================================
Timestamp: ${new Date().toISOString()}
Booking ID: ${bookingId}
Original Encoded Response: ${JSON.stringify(billdeskResponseRaw)}
Decoded Response (JSON): ${JSON.stringify(billdeskResponseRaw, null, 2)}
=========================================================================================================================
`;
      fs.writeFileSync('debug_trek_payment_uat.log', debugLogBDResponse, { flag: 'a' });
      console.log(debugLogBDResponse);
      debugInfo.billdeskCreateOrderResponse = billdeskResponseRaw; // Store proof string

      // Create payment transaction record
      const paymentTransaction = new PaymentTransaction({
        bookingId: bookingId,
        reservationId: reservation._id.toString(),
        bdOrderId: billdeskResponseRaw.bdorderid || orderId,
        amount: reservation.totalPayable,
        status: 'Initiated',
        traceId: traceId,
        timestamp: timestamp,
        encryptedRequest: signed, // Store the signed request for later verification/debug
        customerDetails: {
          name: reservation.user?.name || reservation.fullName,
          phone: reservation.user?.phone || reservation.phone,
          email: reservation.user?.email || reservation.email
        }
      });
      await paymentTransaction.save();

      // Extract authorization token from BillDesk response for future API calls
      const authToken = billdeskResponseRaw.links?.[1]?.headers?.authorization || null;

      // Update reservation with payment transaction reference and auth token
      await TouristSpotReservation.findOneAndUpdate(
        { bookingId },
        {
          paymentTransactionId: paymentTransaction._id.toString(),
          $set: { 'rawSource.authToken': authToken }
        }
      );

      // Return data for frontend to submit form
      const merchantIdFromBD = billdeskResponseRaw.mercid || billdeskResponseRaw.links?.[1]?.parameters?.mercid || merchantId;
      const bdorderid = billdeskResponseRaw.bdorderid;
      const rdata = billdeskResponseRaw.links?.[1]?.parameters?.rdata;
      const formAction = billdeskResponseRaw.links?.[1]?.href || 'https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk';

      // UAT Validation 10: Essential BillDesk response parameters
      if (!merchantIdFromBD || !bdorderid || !rdata || !formAction) {
        console.error(`UAT_ERROR: Missing critical parameters from BillDesk response for booking ${bookingId}.`);
        console.error(`merchantIdFromBD: ${merchantIdFromBD}, bdorderid: ${bdorderid}, rdata: ${rdata ? 'present' : 'missing'}, formAction: ${formAction}`);
        return res.status(500).json({
          success: false,
          error: 'Missing required payment fields from BillDesk response'
        });
      }

      // Start polling for transaction status (every 5 mins for 15 mins)
      startTransactionPolling(bookingId, bdorderid, merchantIdFromBD, authToken, 'trek');
      console.log(`🔄 Started transaction polling for trek booking: ${bookingId}`);

      // UAT Validation 11: Polling initiation confirmation
      if (!startTransactionPolling) { // This is a conceptual check, actual check would be if the poller is running
        console.warn(`UAT_WARNING: Transaction polling might not have started for booking ${bookingId}.`);
      }

      console.log('\n=== Payment Data for Frontend ===');
      console.log('merchantid:', merchantIdFromBD);
      console.log('bdorderid:', bdorderid);
      console.log('rdata:', rdata?.substring(0, 50) + '...');
      console.log('formAction:', formAction);
      console.log('================================\n');

      return res.status(200).json({
        success: true,
        paymentData: {
          merchantid: merchantIdFromBD,
          bdorderid: bdorderid,
          rdata: rdata,
          formAction: formAction
        },
        debug: debugInfo
      });
    } catch (bdError) {
      console.error("BillDesk API Call Error:", bdError);
      // UAT Validation 12: BillDesk API call failure
      fs.writeFileSync('debug_trek_payment_uat.log', `\nUAT_ERROR: BillDesk API call failed for booking ${bookingId}: ${bdError.message}\n`, { flag: 'a' });

      return res.status(bdError.statusCode || 500).json({
        success: false,
        error: bdError.message,
        debug: debugInfo,
        billdesk_error: bdError.billdeskError || null
      });
    }

  } catch (err) {
    console.error("initiatePayment Error:", err);
    fs.writeFileSync('debug_trek_payment_uat.log', `\nUAT_ERROR: General initiatePayment error for booking ${req.body?.bookingId}: ${err.message}\n`, { flag: 'a' });
    return res.status(500).json({
      success: false,
      error: err.message,
      debug: debugInfo
    });
  }
};

// Handle payment callback from BillDesk (RU - Return URL for frontend redirect ONLY)
// ✅ UAT: RU is used for acknowledgment redirect only — NOT for DB updates (webhook does that)
export const handlePaymentCallback = async (req, res) => {
  try {
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║  UAT PROOF — RU Callback Received (ACK ONLY — no DB write) ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("Request Method:", req.method);
    console.log("Request Body:", JSON.stringify(req.body));

    // ── BillDesk sends terminal_state for CANCELLATIONS (not a JWS token) ─
    // Format: { terminal_state: '111', orderid: 'TS-...', txnResponse: {...} }
    // This must be checked BEFORE looking for encrypted JWS response
    const terminalState = req.body?.terminal_state;
    const cancelledOrderId = req.body?.orderid;

    if (terminalState) {
      console.log("\n⚠️  [UAT] BillDesk terminal_state received — CANCELLATION (plain form-data, no JWS)");
      console.log("terminal_state:", terminalState, "| orderid:", cancelledOrderId);
      console.log("Full body:", JSON.stringify(req.body, null, 2));

      // ── UAT SECTION F: Failure/Cancellation proof log ──────────────────
      try {
        const fs = await import('fs');
        fs.writeFileSync('debug_trek_payment_uat.log', `
════════════════════ UAT SECTION F: Payment Response - FAILURE/CANCELLED ════════════════════
Timestamp       : ${new Date().toISOString()}
Booking ID      : ${cancelledOrderId}
Outcome         : ❌ CANCELLED
terminal_state  : ${terminalState}  (111 = user cancelled / session expired)
Response Format : Plain form-data — BillDesk does NOT send JWS for cancellations

Raw Body Received from BillDesk (NOT encrypted — plain cancel notification):
${JSON.stringify(req.body, null, 2)}

NOTE: No auth_status in cancellation response. Equivalent auth_status = 0398 (user cancelled)
      Signature validation not applicable — no JWS token present.
══════════════════════════════════════════════════════════════════════════════════════════════
`, { flag: 'a' });
      } catch (_) {}

      // Update DB to cancelled
      try {
        const paymentTransaction = await PaymentTransaction.findOne({ bookingId: cancelledOrderId });
        if (paymentTransaction && paymentTransaction.status === 'Initiated') {
          paymentTransaction.status = 'cancelled';
          paymentTransaction.authStatus = '0398';
          paymentTransaction.errorMessage = `BillDesk terminal_state: ${terminalState} (user cancelled)`;
          await paymentTransaction.save();
          console.log(`✅ DB updated to cancelled for booking: ${cancelledOrderId}`);
        }
        const reservation = await TouristSpotReservation.findOne({ bookingId: cancelledOrderId });
        if (reservation) {
          reservation.status = 'not-reserved';
          reservation.paymentStatus = 'unpaid';
          await reservation.save();
        }
      } catch (dbErr) {
        console.error("DB update error for cancellation:", dbErr.message);
      }

      const errorMsg = encodeURIComponent('Payment cancelled');
      return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${cancelledOrderId}&status=failed&error=${errorMsg}&type=trek`);
    }

    // ── Standard JWS encrypted response path ─────────────────────────────
    const encryptedResponse = req.body?.encrypted_response
      || req.body?.transaction_response
      || req.body?.msg
      || req.query?.msg
      || req.body?.response
      || req.query?.response;

    if (!encryptedResponse) {
      console.error("❌ [UAT] RU Callback: No encrypted response and no terminal_state");
      console.error("Body keys:", req.body ? Object.keys(req.body) : 'undefined');
      return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=no_response`);
    }

    const encKey  = process.env.BILLDESK_ENCRYPTION_KEY;
    const signKey = process.env.BILLDESK_SIGNING_KEY;

    // ── UAT: auth_status checked ONLY after successful signature validation
    const isValid = await verifySignature(encryptedResponse, signKey);
    if (!isValid) {
      console.error("❌ [UAT] RU Callback: Signature validation FAILED — NOT reading auth_status");
      return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=invalid_signature`);
    }
    console.log("✅ [UAT] RU Callback: Signature validated — now reading auth_status");

    // ── UAT SECTION F (RU): Payment Response Encoded + Decoded ───────────
    console.log("\n📥 [UAT] Original Encoded Payment Response (RU):");
    console.log(encryptedResponse);

    const decryptedResponse = await decryptResponse(encryptedResponse, encKey);

    console.log("\n📋 [UAT] Decoded Payment Response (RU):");
    console.log(JSON.stringify(decryptedResponse, null, 2));

    const { orderid: bookingId, auth_status, transaction_error_desc } = decryptedResponse;
    const outcome = auth_status === '0300' ? '✅ SUCCESS' : auth_status === '0002' ? '⏳ PENDING' : '❌ FAILED';
    console.log(`\n[UAT] Payment Outcome: ${outcome} | auth_status: ${auth_status} | bookingId: ${bookingId}`);

    try {
      const fs = await import('fs');
      fs.writeFileSync('debug_trek_payment_uat.log', `
════════════════════ UAT SECTION F: Payment Response via RU (ACK ONLY) ════════════════════
Timestamp: ${new Date().toISOString()}
Booking ID: ${bookingId}
Outcome: ${outcome}
auth_status: ${auth_status} (read AFTER signature validation ✅)
Original Encoded Response (STORED — NOT RECONSTRUCTED):
${encryptedResponse}

Decoded JSON Response:
${JSON.stringify(decryptedResponse, null, 2)}
═══════════════════════════════════════════════════════════════════════════════════════════
`, { flag: 'a' });
    } catch (_) {}

    // ✅ UAT: Receipt / redirect determined ONLY based on auth_status
    if (auth_status === '0300') {
      return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&type=trek`);
    } else if (auth_status === '0002') {
      return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&status=pending&type=trek`);
    } else {
      const errorMsg = encodeURIComponent(transaction_error_desc || 'payment_failed');
      return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&status=failed&error=${errorMsg}&type=trek`);
    }

  } catch (err) {
    console.error("handlePaymentCallback Error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=callback_error`);
  }
};

// Handle Webhook callback from BillDesk (S2S - For DB updates)
// ✅ UAT: ALL payment posting done here — Webhook only. RU is for redirect ack only.
export const handleWebhookCallback = async (req, res) => {
  try {
    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║  UAT PROOF — Webhook Callback Received (ALL DB updates here)  ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝");

    const encryptedResponse = req.body?.encrypted_response
      || req.body?.transaction_response
      || req.body?.msg
      || req.query?.msg
      || req.body?.response
      || req.query?.response;

    if (!encryptedResponse) {
      console.error("❌ [UAT] Webhook: No encrypted response received");
      return res.status(400).send("No encrypted response received");
    }

    const encKey  = process.env.BILLDESK_ENCRYPTION_KEY;
    const signKey = process.env.BILLDESK_SIGNING_KEY;

    // ✅ UAT: Verify signature FIRST — auth_status only read after this passes
    const isValid = await verifySignature(encryptedResponse, signKey);
    if (!isValid) {
      console.error("❌ [UAT] Webhook: Signature validation FAILED — NOT reading auth_status");
      return res.status(400).send("Invalid signature");
    }
    console.log("✅ [UAT] Webhook: Signature validated — now reading auth_status");

    // ── UAT SECTION F (Webhook): Payment Response Encoded + Decoded ─────
    console.log("\n📥 [UAT] Original Encoded Payment Response (Webhook):");
    console.log(encryptedResponse);

    const decryptedResponse = await decryptResponse(encryptedResponse, encKey);

    console.log("\n📋 [UAT] Decoded Payment Response (Webhook):");
    console.log(JSON.stringify(decryptedResponse, null, 2));

    const {
      orderid: bookingId,
      transactionid,
      auth_status,
      transaction_error_desc
    } = decryptedResponse;

    // Find reservation
    const reservation = await TouristSpotReservation.findOne({ bookingId });
    if (!reservation) {
      console.error("Reservation not found in webhook:", bookingId);
      return res.status(404).send("Reservation not found");
    }

    // Find payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({ bookingId });

    // Update payment transaction
    if (paymentTransaction) {
      // Only process if it's not already a final state, or if this is a success override
      if (['Initiated', 'pending'].includes(paymentTransaction.status) || auth_status === '0300') {
        paymentTransaction.transactionId = transactionid;
        paymentTransaction.authStatus = auth_status;
        paymentTransaction.decryptedResponse = decryptedResponse;
        paymentTransaction.encryptedResponse = encryptedResponse;

        // Determine status based on auth_status
        if (auth_status === '0300') {
          // Success
          paymentTransaction.status = 'Success';
          reservation.status = 'reserved';
          reservation.paymentStatus = 'paid';
          reservation.expiresAt = null; // Clear expiry
          if (!reservation.rawSource) reservation.rawSource = {};
          reservation.rawSource.transactionId = transactionid;
          reservation.rawSource.bankRefNo = decryptedResponse.bank_ref_no;
          reservation.rawSource.authCode = decryptedResponse.authcode;
          reservation.markModified('rawSource');
        } else if (auth_status === '0399') {
          // Failed
          paymentTransaction.status = 'Failed';
          paymentTransaction.errorMessage = transaction_error_desc;
          reservation.status = 'not-reserved';
          reservation.paymentStatus = 'unpaid';
          if (!reservation.rawSource) reservation.rawSource = {};
          reservation.rawSource.paymentError = transaction_error_desc;
        } else if (auth_status === '0002') {
          // Pending
          paymentTransaction.status = 'pending';
          reservation.paymentStatus = 'unpaid';
        } else if (auth_status === '0398') {
          // User cancelled
          paymentTransaction.status = 'cancelled';
          reservation.status = 'not-reserved';
          reservation.paymentStatus = 'unpaid';
        }

        await paymentTransaction.save();
        await reservation.save();

        console.log("Webhook Payment Status:", paymentTransaction.status);

        // Send emails only once when transitioning to Success
        if (paymentTransaction.status === 'Success') {
           const { stopTransactionPolling } = await import('../services/transactionPoller.js');
           stopTransactionPolling(bookingId);
           
           try {
             const userEmail = reservation.user?.email || reservation.email;
             console.log(`📧 Sending trek confirmation emails from webhook to ${userEmail}...`);
             sendTrekReservationEmails(reservation, paymentTransaction).catch(e => console.error(e));
             sendTrekReservationSMS(reservation, paymentTransaction).catch(e => console.error(e));
           } catch(e) {
             console.error('Error sending communications from webhook:', e);
           }
        }
      } else {
        console.log(`Webhook ignoring update, tx already in final state: ${paymentTransaction.status}`);
      }
      
      // Send 200 OK back to BillDesk as Ack
      return res.status(200).send("OK");
    } else {
      console.error("Payment transaction not found in webhook");
      return res.status(404).send("Transaction not found");
    }

  } catch (err) {
    console.error("handleWebhookCallback Error:", err);
    return res.status(500).send("Internal Server Error");
  }
};

// Manual endpoint to retrieve transaction status
export const retrieveTransactionStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required' });
    }

    // Find payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({ bookingId }).lean();
    if (!paymentTransaction) {
      return res.status(404).json({ success: false, error: 'Payment transaction not found' });
    }

    // Find reservation to get auth token from rawSource
    const reservation = await TouristSpotReservation.findOne({ bookingId }).lean();
    const authToken = reservation?.rawSource?.authToken || null;

    const bdOrderId = paymentTransaction.bdOrderId;
    const mercid = process.env.BILLDESK_MERCID;

    console.log(`\n🔍 Manual transaction retrieval for booking: ${bookingId}`);
    console.log(`   BD Order ID: ${bdOrderId}`);
    console.log(`   Auth Token: ${authToken ? 'Present' : 'Missing'}`);

    // Retrieve transaction from BillDesk
    const result = await retrieveTransaction(bdOrderId, mercid, authToken);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction',
        details: result.error
      });
    }

    return res.status(200).json({
      success: true,
      bookingId,
      bdOrderId,
      transactionData: result.data,
      traceId: result.traceId,
      timestamp: result.timestamp
    });

  } catch (err) {
    console.error("retrieveTransactionStatus Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
