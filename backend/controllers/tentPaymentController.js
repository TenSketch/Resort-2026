import { encryptRequest, signEncryptedRequest, decryptResponse, verifySignature } from "../services/billdeskCrypto.js";
import { sendToBillDesk } from "../services/sendToBilldesk.js";
import { retrieveTransaction } from "../services/retrieveTransaction.js";
import { startTransactionPolling, stopTransactionPolling } from "../services/transactionPoller.js";
import { sendTentReservationSMS } from "../services/reservationSmsService.js";
import TentReservation from "../models/tentReservationModel.js";
import PaymentTransaction from "../models/paymentTransactionModel.js";
import TentSpot from "../models/tentSpotModel.js";
import Tent from "../models/tentModel.js";
import transporter from "../config/nodemailer.js";
import { TENT_RESERVATION_SUCCESS_EMAIL_TEMPLATE, TENT_RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE } from "../config/emailTemplates.js";

// Initiate tent payment - creates BillDesk order and returns data for form submission
export const initiateTentPayment = async (req, res) => {
  let debugInfo = {};

  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required' });
    }

    // Fetch tent reservation details
    const reservation = await TentReservation.findOne({ bookingId }).lean();
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Tent reservation not found' });
    }

    // Check if reservation is pending and not expired
    if (reservation.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Reservation is not in pending state' });
    }

    if (reservation.expiresAt && new Date() > new Date(reservation.expiresAt)) {
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
    if (!clientIp || !ipv4Regex.test(clientIp)) {
      // Use a placeholder public IP if we can't get real one
      clientIp = "103.0.0.1";
    }

    // Truncate user agent to reasonable length
    let userAgent = req.headers['user-agent'] || "Mozilla/5.0";
    if (userAgent.length > 100) {
      userAgent = "Mozilla/5.0";
    }

    // Prepare order data - match BillDesk expected format exactly
    const orderData = {
      mercid: process.env.BILLDESK_MERCID,
      orderid: orderId,
      amount: reservation.totalPayable.toFixed(2),
      currency: "356",
      order_date: orderDate,
      settlement_lob: process.env.BILLDESK_SETTLEMENT_LOB,
      ru: process.env.BILLDESK_TENT_RETURN_URL || process.env.BILLDESK_RETURN_URL,
      itemcode: "DIRECT",
      additional_info: {
        additional_info1: (reservation.fullName || 'NA').substring(0, 50),
        additional_info2: (reservation.phone || 'NA').substring(0, 20),
        additional_info3: (reservation.email || 'NA').substring(0, 50),
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

    const encKey = process.env.BILLDESK_ENCRYPTION_KEY;
    const signKey = process.env.BILLDESK_SIGNING_KEY;
    const keyId = process.env.KEY_ID;
    const clientId = process.env.BILLDESK_CLIENTID;

    console.log("\n=== TENT PAYMENT INITIATION ===");
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
    console.log("Trace ID:", traceId);
    console.log("Timestamp:", timestamp);
    console.log("=========================\n");

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
        status: 'initiated',
        traceId: traceId,
        timestamp: timestamp,
        encryptedRequest: signed,
        customerDetails: {
          name: reservation.fullName,
          phone: reservation.phone,
          email: reservation.email
        },
        bookingType: 'tent' // Mark as tent booking
      });
      await paymentTransaction.save();

      // Extract authorization token from BillDesk response
      const authToken = billdeskResponse.links?.[1]?.headers?.authorization || null;
      
      // Update reservation with payment transaction reference
      await TentReservation.findOneAndUpdate(
        { bookingId },
        { 
          paymentTransactionId: paymentTransaction._id.toString(),
          $set: { 'rawSource.authToken': authToken }
        }
      );

      // Return data for frontend to submit form
      const merchantId = billdeskResponse.mercid || billdeskResponse.links?.[1]?.parameters?.mercid || process.env.BILLDESK_MERCID;
      const bdorderid = billdeskResponse.bdorderid;
      const rdata = billdeskResponse.links?.[1]?.parameters?.rdata;
      
      // Start polling for transaction status
      startTransactionPolling(bookingId, bdorderid, merchantId, authToken, 'tent');
      console.log(`🔄 Started transaction polling for tent booking: ${bookingId}`);
      
      const formAction = billdeskResponse.links?.[1]?.href || 'https://uat1.billdesk.com/u2/web/v1_2/embeddedsdk';
      
      console.log('\n=== Tent Payment Data for Frontend ===');
      console.log('merchantid:', merchantId);
      console.log('bdorderid:', bdorderid);
      console.log('rdata:', rdata?.substring(0, 50) + '...');
      console.log('formAction:', formAction);
      console.log('================================\n');
      
      // Validate all required fields are present
      if (!merchantId || !bdorderid || !rdata) {
        console.error('Missing required payment fields!');
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
    console.error("initiateTentPayment Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      debug: debugInfo
    });
  }
};

// Handle tent payment callback from BillDesk
export const handleTentPaymentCallback = async (req, res) => {
  try {
    console.log("\n=== TENT PAYMENT CALLBACK RECEIVED ===");
    console.log("Request Method:", req.method);
    console.log("Request Body:", req.body);

    const encryptedResponse = req.body?.encrypted_response
      || req.body?.transaction_response 
      || req.body?.msg 
      || req.query?.msg 
      || req.body?.response 
      || req.query?.response;

    if (!encryptedResponse) {
      console.error("❌ No encrypted response received");
      return res.redirect(`${process.env.FRONTEND_URL}/#/tent-booking-failed?error=no_response`);
    }

    const encKey = process.env.BILLDESK_ENCRYPTION_KEY;
    const signKey = process.env.BILLDESK_SIGNING_KEY;

    // Verify signature
    const isValid = await verifySignature(encryptedResponse, signKey);
    if (!isValid) {
      console.error("Invalid signature");
      return res.redirect(`${process.env.FRONTEND_URL}/#/tent-booking-failed?error=invalid_signature`);
    }

    // Decrypt response
    const decryptedResponse = await decryptResponse(encryptedResponse, encKey);
    console.log("Decrypted Response:", JSON.stringify(decryptedResponse, null, 2));

    const {
      orderid: bookingId,
      transactionid,
      auth_status,
      transaction_error_desc
    } = decryptedResponse;

    console.log(`📋 Processing tent booking: ${bookingId}`);
    console.log(`📋 Transaction ID: ${transactionid}`);
    console.log(`📋 Auth Status: ${auth_status}`);

    // Find tent reservation
    const reservation = await TentReservation.findOne({ bookingId });
    if (!reservation) {
      console.error("❌ Tent reservation not found:", bookingId);
      return res.redirect(`${process.env.FRONTEND_URL}/#/tent-booking-failed?error=reservation_not_found`);
    }

    console.log(`✅ Found tent reservation: ${reservation._id}`);

    // Find payment transaction
    const paymentTransaction = await PaymentTransaction.findOne({ bookingId });
    if (!paymentTransaction) {
      console.error("❌ Payment transaction not found:", bookingId);
      return res.redirect(`${process.env.FRONTEND_URL}/#/tent-booking-failed?error=transaction_not_found`);
    }

    console.log(`✅ Found payment transaction: ${paymentTransaction._id}`);

    paymentTransaction.transactionId = transactionid;
    paymentTransaction.authStatus = auth_status;
    paymentTransaction.decryptedResponse = decryptedResponse;
      
      if (auth_status === '0300') {
        // Success
        console.log('✅ Payment successful, updating records...');
        paymentTransaction.status = 'success';
        reservation.status = 'reserved';
        reservation.paymentStatus = 'paid';
        reservation.expiresAt = null;
        if (!reservation.rawSource) reservation.rawSource = {};
        reservation.rawSource.transactionId = transactionid;
        reservation.rawSource.bankRefNo = decryptedResponse.bank_ref_no;
        reservation.rawSource.authCode = decryptedResponse.authcode;
        reservation.markModified('rawSource');
      } else if (auth_status === '0399') {
        // Failed - set to not-reserved (not cancelled)
        console.log('❌ Payment failed');
        paymentTransaction.status = 'failed';
        paymentTransaction.errorMessage = transaction_error_desc;
        reservation.status = 'not-reserved';
        reservation.paymentStatus = 'unpaid';
        // Store error info
        if (!reservation.rawSource) reservation.rawSource = {};
        reservation.rawSource.paymentError = transaction_error_desc;
        reservation.markModified('rawSource');
      } else if (auth_status === '0002') {
        // Pending - but check if it's actually successful (BillDesk UAT quirk)
        console.log('⏳ Payment pending, but checking if actually successful...');
        paymentTransaction.status = 'pending';
        reservation.paymentStatus = 'unpaid';
        
        // If transaction_error_desc says "successful", immediately retrieve real status
        if (transaction_error_desc && transaction_error_desc.toLowerCase().includes('successful')) {
          console.log('🔍 Transaction says "successful" but status is pending - will retrieve immediately');
          // Schedule immediate check (after 10 seconds to allow BillDesk to update)
          setTimeout(async () => {
            try {
              console.log(`🔍 Immediate status check for tent booking ${bookingId}`);
              const authToken = reservation?.rawSource?.authToken || null;
              const result = await retrieveTransaction(bookingId, process.env.BILLDESK_MERCID, authToken);
              
              if (result.success && result.data.auth_status === '0300') {
                console.log('✅ Tent payment actually successful! Updating now...');
                
                await TentReservation.findOneAndUpdate(
                  { bookingId },
                  {
                    status: 'reserved',
                    paymentStatus: 'paid',
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
                    status: 'success',
                    authStatus: '0300',
                    decryptedResponse: result.data
                  }
                );
                
                // Stop polling and send emails
                stopTransactionPolling(bookingId);
                
                const updatedReservation = await TentReservation.findOne({ bookingId }).lean();
                const updatedPaymentTransaction = await PaymentTransaction.findOne({ bookingId }).lean();
                
                sendTentReservationEmails(updatedReservation, updatedPaymentTransaction)
                  .catch(err => console.error('Tent email error:', err.message));
                sendTentReservationSMS(updatedReservation, updatedPaymentTransaction)
                  .catch(err => console.error('Tent SMS error:', err.message));
              }
            } catch (err) {
              console.error('Immediate tent check error:', err.message);
            }
          }, 10000); // Check after 10 seconds
        }
      } else if (auth_status === '0398') {
        // User cancelled
        console.log('🚫 Payment cancelled by user');
        paymentTransaction.status = 'cancelled';
        reservation.status = 'not-reserved';
        reservation.paymentStatus = 'unpaid';
      } else {
        console.log('⚠️ Unknown payment status:', auth_status);
        paymentTransaction.status = 'pending';
        reservation.paymentStatus = 'unpaid';
      }

      console.log('💾 Saving payment transaction...');
      await paymentTransaction.save();
      console.log('💾 Saving tent reservation...');
      await reservation.save();

      console.log("Tent Payment Status:", paymentTransaction.status);
      console.log("Tent Reservation Status:", reservation.status);

      // Send email notifications for successful payments
      if (paymentTransaction.status === 'success') {
        console.log('📧 Stopping polling and sending emails...');
        stopTransactionPolling(bookingId);
        sendTentReservationEmails(reservation, paymentTransaction)
          .then(() => console.log('✅ Tent booking emails sent'))
          .catch(err => console.error('❌ Tent email sending failed:', err.message));
        
        // Send SMS asynchronously (don't wait for completion)
        sendTentReservationSMS(reservation, paymentTransaction)
          .then(() => console.log('✅ Tent booking SMS sent'))
          .catch(err => console.error('❌ Tent SMS sending failed:', err.message));
      }

      // Redirect based on status
      console.log('🔄 Redirecting user...');
      if (paymentTransaction.status === 'success') {
        return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&type=tent`);
      } else if (paymentTransaction.status === 'pending') {
        return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&status=pending&type=tent`);
      } else {
        const errorMsg = encodeURIComponent(transaction_error_desc || 'payment_failed');
        return res.redirect(`${process.env.FRONTEND_URL}/#/booking-status?bookingId=${bookingId}&status=failed&error=${errorMsg}&type=tent`);
      }

  } catch (err) {
    console.error("❌ handleTentPaymentCallback Error:", err);
    console.error("Error stack:", err.stack);
    return res.redirect(`${process.env.FRONTEND_URL}/#/tent-booking-failed?error=callback_error`);
  }
};

// Retrieve tent transaction status
export const retrieveTentTransactionStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required' });
    }

    const paymentTransaction = await PaymentTransaction.findOne({ bookingId }).lean();
    if (!paymentTransaction) {
      return res.status(404).json({ success: false, error: 'Payment transaction not found' });
    }

    const reservation = await TentReservation.findOne({ bookingId }).lean();
    const authToken = reservation?.rawSource?.authToken || null;

    const bdOrderId = paymentTransaction.bdOrderId;
    const mercid = process.env.BILLDESK_MERCID;

    console.log(`\n🔍 Manual tent transaction retrieval for booking: ${bookingId}`);

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
    console.error("retrieveTentTransactionStatus Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Send tent reservation confirmation emails
async function sendTentReservationEmails(reservation, paymentTransaction) {
  try {
    // Fetch tent spot details
    let tentSpotData = null;
    if (reservation.tentSpot) {
      tentSpotData = await TentSpot.findById(reservation.tentSpot).lean();
    }

    // Fetch tent details
    let tentsData = [];
    if (reservation.tents && Array.isArray(reservation.tents)) {
      tentsData = await Tent.find({ _id: { $in: reservation.tents } }).lean();
    }

    const tentSpotName = tentSpotData?.spotName || 'Tent Spot';
    const tentList = tentsData.map(t => `${t.tentId || t.name} (${t.tentType || 'Tent'})`).join(', ') || 'N/A';
    
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    // Prepare email data
    const emailData = {
      Full_Name: reservation.fullName,
      Guest_Details: `${reservation.fullName}\n${reservation.email}\n${reservation.phone}\n${reservation.address1}, ${reservation.city}, ${reservation.state} - ${reservation.postalCode}`,
      Reservation_Date: formatDate(reservation.reservationDate),
      Booking_Id: reservation.bookingId,
      Tent_Spot_Name: tentSpotName,
      Tent_List: tentList,
      Check_In: formatDate(reservation.checkinDate),
      Check_Out: formatDate(reservation.checkoutDate),
      Total_Guests: reservation.guests || 0,
      Total_Children: reservation.children || 0,
      Payment_Amount: `INR ${reservation.totalPayable?.toFixed(2)}`,
      Transaction_ID: paymentTransaction.transactionId || 'N/A',
      Payment_Date: formatDate(paymentTransaction.updatedAt || new Date()),
      Payment_Status: 'Confirmed',
      Contact_Person_Name: 'Mr. Veerababu',
      Support_Number: '+919494151617',
      Email: 'info@vanavihari.com',
      Website: 'www.vanavihari.com'
    };

    // Replace placeholders in templates
    let userEmail = TENT_RESERVATION_SUCCESS_EMAIL_TEMPLATE;
    let adminEmail = TENT_RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE;

    Object.keys(emailData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      userEmail = userEmail.replace(regex, emailData[key]);
      adminEmail = adminEmail.replace(regex, emailData[key]);
    });

    // Send email to user
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: reservation.email,
      subject: `Tent Booking Confirmation - ${reservation.bookingId}`,
      html: userEmail
    });

    console.log(`✅ Tent confirmation email sent to: ${reservation.email}`);

    // Send email to admin
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: process.env.ADMIN_EMAIL || 'info@vanavihari.com',
      subject: `New Tent Booking - ${reservation.bookingId} - ${tentSpotName}`,
      html: adminEmail
    });

    console.log(`✅ Tent notification email sent to admin`);

  } catch (error) {
    console.error('❌ Error sending tent reservation emails:', error);
  }
}
