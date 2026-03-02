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

  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required' });
    }

    // Fetch reservation details
    const reservation = await TouristSpotReservation.findOne({ bookingId }).lean();
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    // Check if reservation is pending and not expired
    if (reservation.status !== 'Pending') {
      return res.status(400).json({ success: false, error: 'Reservation is not in pre-reserved state' });
    }

    if (new Date() > new Date(reservation.expiresAt)) {
      return res.status(400).json({ success: false, error: 'Reservation has expired' });
    }

    // Convert to IST (UTC+5:30) without milliseconds
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const orderDate = istDate.toISOString().split('.')[0] + '+05:30';

    // Generate unique order ID (use bookingId)
    const orderId = bookingId;

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

    // Validate IP format - must be valid IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!clientIp || !ipv4Regex.test(clientIp) || clientIp === '127.0.0.1' || clientIp === '::1') {
      // Use a hardcoded valid public IP for UAT/Testing if local or invalid
      // BillDesk often rejects private IPs or localhost
      console.warn(`⚠️ Invalid or local IP deteced (${clientIp}), using public fallback IP for BillDesk UAT`);
      clientIp = "103.0.0.1";
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

    const orderData = {
      mercid: merchantId,
      orderid: orderId,
      amount: reservation.totalPayable.toFixed(2),
      currency: "356",
      order_date: orderDate,
      settlement_lob: settlementLob,
      ru: process.env.BILLDESK_TREK_RETURN_URL || process.env.BILLDESK_RETURN_URL.trim(),
      itemcode: "DIRECT",
      additional_info: {
        additional_info1: (reservation.user?.name || reservation.fullName || 'NA').substring(0, 50),
        additional_info2: (reservation.user?.phone || reservation.phone || 'NA').substring(0, 20),
        additional_info3: (reservation.user?.email || reservation.email || 'NA').substring(0, 50),
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

    const encKey = (process.env.BILLDESK_ENCRYPTION_KEY || "").trim();
    const signKey = (process.env.BILLDESK_SIGNING_KEY || "").trim();
    const keyId = (process.env.KEY_ID || "").trim();
    const clientId = clientIdEnv;

    // DEBUG: Write to file to ensure we catch the logs
    try {
      const fs = await import('fs');
      const debugLog = `
======================================== (TREK)
Timestamp: ${new Date().toISOString()}
Booking ID: ${bookingId}
Merchant ID: '${merchantId}'
Client ID: '${clientId}'
Order Data: ${JSON.stringify(orderData, null, 2)}
========================================
`;
      fs.writeFileSync('debug_trek_payment.log', debugLog, { flag: 'a' });
    } catch (fsErr) {
      console.error('Failed to write debug log', fsErr);
    }

    console.log("\n=== TREK PAYMENT INITIATION ===");
    console.log("Booking ID:", bookingId);
    console.log("Order Data:", JSON.stringify(orderData, null, 2));

    // Encrypt request
    const encrypted = await encryptRequest(orderData, encKey, keyId, clientId);
    console.log("Encrypted Request:", encrypted);

    // Sign encrypted request
    const signed = await signEncryptedRequest(encrypted, signKey, keyId, clientId);
    console.log("Signed Request:", signed);

    // Generate trace ID and timestamp
    const traceId = "TID" + Math.random().toString(36).slice(2, 14).toUpperCase();
    const timestamp = Date.now().toString();

    // Store debug info
    debugInfo = {
      jsonRequest: orderData,
      encryptedRequest: encrypted,
      signedRequest: signed,
      traceId: traceId,
      timestamp: timestamp
    };

    // Send to BillDesk to create order
    try {
      const billdeskResponse = await sendToBillDesk(signed, traceId, timestamp);

      // Create payment transaction record
      const paymentTransaction = new PaymentTransaction({
        bookingId: bookingId,
        reservationId: reservation._id.toString(),
        bdOrderId: billdeskResponse.bdorderid || orderId,
        amount: reservation.totalPayable,
        status: 'Initiated',
        traceId: traceId,
        timestamp: timestamp,
        encryptedRequest: signed,
        customerDetails: {
          name: reservation.user?.name || reservation.fullName,
          phone: reservation.user?.phone || reservation.phone,
          email: reservation.user?.email || reservation.email
        }
      });
      await paymentTransaction.save();

      // Extract authorization token from BillDesk response for future API calls
      const authToken = billdeskResponse.links?.[1]?.headers?.authorization || null;

      // Update reservation with payment transaction reference and auth token
      await TouristSpotReservation.findOneAndUpdate(
        { bookingId },
        {
          paymentTransactionId: paymentTransaction._id.toString(),
          $set: { 'rawSource.authToken': authToken }
        }
      );

      // Return data for frontend to submit form
      // Note: Form uses 'merchantid' but BillDesk response has 'mercid'
      const merchantId = billdeskResponse.mercid || billdeskResponse.links?.[1]?.parameters?.mercid || (process.env.BILLDESK_MERCID || "").trim();
      const bdorderid = billdeskResponse.bdorderid;
      const rdata = billdeskResponse.links?.[1]?.parameters?.rdata;

      // Start polling for transaction status (every 5 mins for 15 mins)
      startTransactionPolling(bookingId, bdorderid, merchantId, authToken, 'trek');
      console.log(`🔄 Started transaction polling for trek booking: ${bookingId}`);
      const formAction = billdeskResponse.links?.[1]?.href || 'https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk';

      console.log('\n=== Payment Data for Frontend ===');
      console.log('merchantid:', merchantId);
      console.log('bdorderid:', bdorderid);
      console.log('rdata:', rdata?.substring(0, 50) + '...');
      console.log('formAction:', formAction);
      console.log('================================\n');

      // Validate all required fields are present
      if (!merchantId || !bdorderid || !rdata) {
        console.error('Missing required payment fields!');
        console.error('merchantId:', merchantId);
        console.error('bdorderid:', bdorderid);
        console.error('rdata:', rdata ? 'present' : 'MISSING');
        return res.status(500).json({
          success: false,
          error: 'Missing required payment fields from BillDesk response'
        });
      }

      return res.status(200).json({
        success: true,
        paymentData: {
          merchantid: merchantId,
          bdorderid: bdorderid,
          rdata: rdata,
          formAction: formAction
        },
        debug: debugInfo
      });
    } catch (bdError) {
      console.error("BillDesk Error:", bdError);

      return res.status(bdError.statusCode || 500).json({
        success: false,
        error: bdError.message,
        debug: debugInfo,
        billdesk_error: bdError.billdeskError || null
      });
    }

  } catch (err) {
    console.error("initiatePayment Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      debug: debugInfo
    });
  }
};

// Handle payment callback from BillDesk
export const handlePaymentCallback = async (req, res) => {
  try {
    console.log("\n=== PAYMENT CALLBACK RECEIVED ===");
    console.log("Request Method:", req.method);
    console.log("Request Headers:", req.headers);
    console.log("Request Body:", req.body);
    console.log("Request Query:", req.query);
    console.log("Request Params:", req.params);
    console.log("Raw Body:", req.rawBody);

    // BillDesk sends encrypted response in different field names
    // Try multiple sources
    const encryptedResponse = req.body?.encrypted_response
      || req.body?.transaction_response
      || req.body?.msg
      || req.query?.msg
      || req.body?.response
      || req.query?.response;

    if (!encryptedResponse) {
      console.error("❌ No encrypted response received");
      console.error("Available keys in body:", req.body ? Object.keys(req.body) : 'body is undefined');
      console.error("Available keys in query:", req.query ? Object.keys(req.query) : 'query is undefined');
      return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=no_response`);
    }

    console.log("✅ Found encrypted response in:",
      req.body?.encrypted_response ? 'encrypted_response' :
        req.body?.transaction_response ? 'transaction_response' : 'msg');

    const encKey = process.env.BILLDESK_ENCRYPTION_KEY;
    const signKey = process.env.BILLDESK_SIGNING_KEY;

    // Verify signature
    const isValid = await verifySignature(encryptedResponse, signKey);
    if (!isValid) {
      console.error("Invalid signature");
      return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=invalid_signature`);
    }

    // Decrypt response
    const decryptedResponse = await decryptResponse(encryptedResponse, encKey);
    console.log("Decrypted Response:", JSON.stringify(decryptedResponse, null, 2));

    const {
      orderid: bookingId,
      transactionid,
      auth_status,
      amount,
      transaction_error_type,
      transaction_error_desc
    } = decryptedResponse;

    // Find reservation
    const reservation = await TouristSpotReservation.findOne({ bookingId });
    if (!reservation) {
      console.error("Reservation not found:", bookingId);
      return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=reservation_not_found`);
    }

    // Find payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({ bookingId });

    // Update payment transaction
    if (paymentTransaction) {
      paymentTransaction.transactionId = transactionid;
      paymentTransaction.authStatus = auth_status;
      paymentTransaction.decryptedResponse = decryptedResponse;

      // Determine status based on auth_status
      if (auth_status === '0300') {
        // Success
        paymentTransaction.status = 'Success';
        reservation.status = 'Reserved';
        reservation.paymentStatus = 'Paid';
        reservation.expiresAt = null; // Clear expiry
        // Store transaction ID in rawSource for easy access
        if (!reservation.rawSource) reservation.rawSource = {};
        reservation.rawSource.transactionId = transactionid;
        reservation.rawSource.bankRefNo = decryptedResponse.bank_ref_no;
        reservation.rawSource.authCode = decryptedResponse.authcode;
        // Mark rawSource as modified for Mongoose to save it
        reservation.markModified('rawSource');
      } else if (auth_status === '0399') {
        // Failed
        paymentTransaction.status = 'Failed';
        paymentTransaction.errorMessage = transaction_error_desc;
        reservation.status = 'Not-Reserved';
        reservation.paymentStatus = 'Unpaid';
        // Store error info
        if (!reservation.rawSource) reservation.rawSource = {};
        reservation.rawSource.paymentError = transaction_error_desc;
      } else if (auth_status === '0002') {
        // Pending - but check if it's actually successful (BillDesk UAT quirk)
        console.log('⏳ Payment pending, but checking if actually successful...');
        paymentTransaction.status = 'Pending';
        reservation.paymentStatus = 'Unpaid';

        // If transaction_error_desc says "successful", immediately retrieve real status
        if (transaction_error_desc && transaction_error_desc.toLowerCase().includes('successful')) {
          console.log('🔍 Transaction says "successful" but status is pending - will retrieve immediately');
          // Import at top if not already: import { retrieveTransaction } from '../services/retrieveTransaction.js';
          // Schedule immediate check (after 10 seconds to allow BillDesk to update)
          setTimeout(async () => {
            try {
              console.log(`🔍 Immediate status check for ${bookingId}`);
              const authToken = reservation?.rawSource?.authToken || null;
              const result = await retrieveTransaction(bookingId, process.env.BILLDESK_MERCID, authToken);

              if (result.success && result.data.auth_status === '0300') {
                console.log('✅ Payment actually successful! Updating now...');

                await TouristSpotReservation.findOneAndUpdate(
                  { bookingId },
                  {
                    status: 'Reserved',
                    paymentStatus: 'Paid',
                    expiresAt: null,
                    $set: {
                      'rawSource.transactionId': result.data.transactionid,
                      'rawSource.authStatus': '0300',
                      'rawSource.bankRefNo': result.data.bank_ref_no,
                      'rawSource.authCode': result.data.authcode
                    }
                  }
                );

                await PaymentTransaction.findOneAndUpdate(
                  { bookingId },
                  {
                    status: 'Success',
                    authStatus: '0300',
                    decryptedResponse: result.data
                  }
                );

                // Stop polling and send emails
                const { stopTransactionPolling } = await import('../services/transactionPoller.js');
                stopTransactionPolling(bookingId);

                const updatedReservation = await TouristSpotReservation.findOne({ bookingId }).lean();
                const updatedPaymentTransaction = await PaymentTransaction.findOne({ bookingId }).lean();

                const { sendTrekReservationEmails } = await import('../services/trekReservationEmailService.js');
                sendTrekReservationEmails(updatedReservation, updatedPaymentTransaction)
                  .catch(err => console.error('Trek email error:', err.message));
                sendTrekReservationSMS(updatedReservation, updatedPaymentTransaction)
                  .catch(err => console.error('Trek SMS error:', err.message));
              }
            } catch (err) {
              console.error('Immediate check error:', err.message);
            }
          }, 10000); // Check after 10 seconds
        }
      } else if (auth_status === '0398') {
        // User cancelled
        paymentTransaction.status = 'Cancelled';
        reservation.status = 'Not-Reserved';
        reservation.paymentStatus = 'Unpaid';
      } else {
        // Unknown status - keep as unpaid
        paymentTransaction.status = 'Pending';
        reservation.paymentStatus = 'Unpaid';
      }

      await paymentTransaction.save();
      await reservation.save();

      console.log("Payment Status:", paymentTransaction.status);
      console.log("Reservation Status:", reservation.status);
      console.log("================================\n");

      // Send email notifications for successful payments
      if (paymentTransaction.status === 'Success') {
        const userEmail = reservation.user?.email || reservation.email;
        console.log(`📧 Sending trek confirmation emails to ${userEmail}...`);
        // Stop polling since payment is confirmed
        stopTransactionPolling(bookingId);
        // Send emails asynchronously (don't wait for completion)
        sendTrekReservationEmails(reservation, paymentTransaction)
          .then(() => console.log('✅ Trek emails sent successfully'))
          .catch(err => console.error('❌ Trek email sending failed:', err.message));

        // Send trek SMS asynchronously (don't wait for completion)
        sendTrekReservationSMS(reservation, paymentTransaction)
          .then(() => console.log('✅ Trek reservation SMS sent successfully'))
          .catch(err => console.error('❌ Trek SMS sending failed:', err.message));
      }

      // Redirect based on status (Angular uses hash routing with type=trek)
      if (paymentTransaction.status === 'Success') {
        return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&type=trek`);
      } else if (paymentTransaction.status === 'Pending') {
        return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&status=pending&type=trek`);
      } else {
        // URL encode the error message to handle special characters
        const errorMsg = encodeURIComponent(transaction_error_desc || 'payment_failed');
        return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&status=failed&error=${errorMsg}&type=trek`);
      }
    } else {
      console.error("Payment transaction not found");
      return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=transaction_not_found`);
    }

  } catch (err) {
    console.error("handlePaymentCallback Error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/booking-failed?error=callback_error`);
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
