import { retrieveTransaction } from './retrieveTransaction.js';
import { sendReservationSuccessEmails } from './reservationEmailService.js';
import { sendRoomReservationSMS, sendTentReservationSMS, sendTrekReservationSMS } from './reservationSmsService.js';
import Reservation from '../models/reservationModel.js';
import TentReservation from '../models/tentReservationModel.js';
import PaymentTransaction from '../models/paymentTransactionModel.js';
import TentSpot from '../models/tentSpotModel.js';
import Tent from '../models/tentModel.js';
import transporter from '../config/nodemailer.js';
import { TENT_RESERVATION_SUCCESS_EMAIL_TEMPLATE, TENT_RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE } from '../config/emailTemplates.js';

// Store active polling intervals
const activePolls = new Map();

/**
 * Start polling for a transaction status
 * Checks every 5 minutes for 15 minutes (3 checks total)
 * @param {string} bookingId - The booking ID
 * @param {string} bdOrderId - BillDesk order ID
 * @param {string} mercid - Merchant ID
 * @param {string} authToken - Authorization token
 * @param {string} bookingType - 'room' or 'tent'
 */
export function startTransactionPolling(bookingId, bdOrderId, mercid, authToken = null, bookingType = 'room') {
  // Don't start if already polling
  if (activePolls.has(bookingId)) {
    console.log(`⏭️ Already polling for booking: ${bookingId}`);
    return;
  }

  console.log(`🔄 Starting transaction polling for ${bookingType} booking: ${bookingId}`);
  console.log(`   Order ID (bookingId): ${bookingId}`);
  console.log(`   BD Order ID: ${bdOrderId}`);
  console.log(`   Booking Type: ${bookingType}`);
  console.log(`   Will check at 5, 10, and 15 minutes`);

  let checkCount = 0;
  const maxChecks = 3; // 3 checks over 15 minutes
  const intervalMinutes = 5;

  // Set up interval - first check will be after 5 minutes (not immediate)
  const intervalId = setInterval(async () => {
    // Pass bookingId (orderid) not bdOrderId
    await pollTransaction(bookingId, bookingId, mercid, authToken, checkCount, bookingType);

    checkCount++;

    if (checkCount >= maxChecks) {
      console.log(`⏹️ Stopping polling for ${bookingId} - max checks reached`);
      stopTransactionPolling(bookingId);
      return;
    }
  }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

  // Store interval ID
  activePolls.set(bookingId, intervalId);
}

/**
 * Stop polling for a transaction
 */
export function stopTransactionPolling(bookingId) {
  const intervalId = activePolls.get(bookingId);
  if (intervalId) {
    clearInterval(intervalId);
    activePolls.delete(bookingId);
    console.log(`✅ Stopped polling for booking: ${bookingId}`);
  }
}

/**
 * Perform a single poll check
 */
async function pollTransaction(bookingId, orderid, mercid, authToken, checkNumber, bookingType = 'room') {
  console.log(`\n📊 Poll Check #${checkNumber + 1} for ${bookingType} booking: ${bookingId}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    // Get the appropriate model based on booking type
    let ReservationModel;
    if (bookingType === 'tent') {
      ReservationModel = TentReservation;
    } else if (bookingType === 'trek') {
      // Trek uses a dynamic import to avoid circular deps
      const { default: TouristSpotReservation } = await import('../models/touristSpotReservationModel.js');
      ReservationModel = TouristSpotReservation;
    } else {
      ReservationModel = Reservation;
    }

    // First check if reservation is still pending
    const reservation = await ReservationModel.findOne({ bookingId }).lean();

    if (!reservation) {
      console.log(`❌ ${bookingType} reservation not found: ${bookingId}`);
      stopTransactionPolling(bookingId);
      return;
    }

    // If status is already resolved (not pending), stop polling
    if (reservation.status !== 'Pending') {
      console.log(`✅ Reservation already resolved with status: ${reservation.status}`);
      console.log(`   No need to poll further. Stopping poller.`);
      stopTransactionPolling(bookingId);
      return;
    }

    console.log(`   Current status: ${reservation.status} - continuing poll...`);

    // Retrieve transaction from BillDesk using orderid (bookingId)
    const result = await retrieveTransaction(orderid, mercid, authToken);

    if (!result.success) {
      console.log(`❌ Failed to retrieve transaction: ${result.error}`);
      return;
    }

    console.log(`✅ Transaction retrieved successfully`);
    console.log(`   Response:`, JSON.stringify(result.data, null, 2));

    // Parse response and update reservation status
    const authStatus = result.data.auth_status;
    const transactionId = result.data.transactionid;

    console.log(`   Auth Status: ${authStatus}`);

    // Handle different payment statuses
    if (authStatus === '0300') {
      // Payment successful
      console.log(`💰 Payment successful! Updating ${bookingType} reservation to paid/reserved...`);

      await ReservationModel.findOneAndUpdate(
        { bookingId },
        {
          status: 'Reserved',
          paymentStatus: 'Paid',
          expiresAt: null,
          $set: {
            'rawSource.transactionId': transactionId,
            'rawSource.authStatus': authStatus,
            'rawSource.bankRefNo': result.data.bank_ref_no,
            'rawSource.authCode': result.data.authcode,
            'rawSource.transactionDate': result.data.transaction_date
          }
        }
      );

      await PaymentTransaction.findOneAndUpdate(
        { bookingId },
        {
          status: 'Success',
          transactionId: transactionId,
          authStatus: authStatus,
          decryptedResponse: result.data
        }
      );

      console.log(`✅ ${bookingType} reservation updated to reserved/paid`);

      // Stop polling since payment is confirmed
      stopTransactionPolling(bookingId);

      // Send confirmation emails and SMS based on booking type
      console.log(`📧 Sending confirmation emails and SMS...`);
      const updatedReservation = await ReservationModel.findOne({ bookingId }).lean();
      const updatedPaymentTransaction = await PaymentTransaction.findOne({ bookingId }).lean();

      if (bookingType === 'tent') {
        // Send tent booking emails
        sendTentReservationEmails(updatedReservation, updatedPaymentTransaction)
          .then(() => console.log(`✅ Tent confirmation emails sent`))
          .catch(err => console.error(`❌ Tent email sending error: ${err.message}`));

        // Send tent SMS
        sendTentReservationSMS(updatedReservation, updatedPaymentTransaction)
          .then(() => console.log(`✅ Tent reservation SMS sent`))
          .catch(err => console.error(`❌ Tent SMS sending error: ${err.message}`));

      } else if (bookingType === 'trek') {
        // Send trek booking emails
        const { sendTrekReservationEmails } = await import('./trekReservationEmailService.js');
        sendTrekReservationEmails(updatedReservation, updatedPaymentTransaction)
          .then(() => console.log(`✅ Trek confirmation emails sent`))
          .catch(err => console.error(`❌ Trek email sending error: ${err.message}`));

        // Send trek SMS (dedicated trek template)
        sendTrekReservationSMS(updatedReservation, updatedPaymentTransaction)
          .then(() => console.log(`✅ Trek reservation SMS sent`))
          .catch(err => console.error(`❌ Trek SMS sending error: ${err.message}`));
      } else {
        // Send room booking emails
        sendReservationSuccessEmails(updatedReservation, updatedPaymentTransaction)
          .then((result) => {
            if (result.success) {
              console.log(`✅ Room confirmation emails sent successfully`);
            } else {
              console.error(`❌ Room email sending failed: ${result.error}`);
            }
          })
          .catch(err => console.error(`❌ Room email sending error: ${err.message}`));

        // Send room SMS
        sendRoomReservationSMS(updatedReservation, updatedPaymentTransaction)
          .then(() => console.log(`✅ Room reservation SMS sent`))
          .catch(err => console.error(`❌ Room SMS sending error: ${err.message}`));
      }

    } else if (authStatus === '0399') {
      // Payment failed
      console.log(`❌ Payment failed. Updating ${bookingType} reservation to not-reserved/unpaid...`);

      await ReservationModel.findOneAndUpdate(
        { bookingId },
        {
          status: 'Not-Reserved',
          paymentStatus: 'Unpaid',
          $set: {
            'rawSource.transactionId': transactionId,
            'rawSource.authStatus': authStatus,
            'rawSource.paymentError': result.data.transaction_error_desc
          }
        }
      );

      await PaymentTransaction.findOneAndUpdate(
        { bookingId },
        {
          status: 'Failed',
          transactionId: transactionId,
          authStatus: authStatus,
          errorMessage: result.data.transaction_error_desc,
          decryptedResponse: result.data
        }
      );

      console.log(`✅ ${bookingType} reservation updated to not-reserved/unpaid`);

      // Stop polling since payment failed
      stopTransactionPolling(bookingId);

    } else if (authStatus === '0398') {
      // User cancelled
      console.log(`🚫 Payment cancelled by user. Updating ${bookingType} reservation...`);

      await ReservationModel.findOneAndUpdate(
        { bookingId },
        {
          status: 'Not-Reserved',
          paymentStatus: 'Unpaid',
          $set: {
            'rawSource.transactionId': transactionId,
            'rawSource.authStatus': authStatus
          }
        }
      );

      await PaymentTransaction.findOneAndUpdate(
        { bookingId },
        {
          status: 'Cancelled',
          transactionId: transactionId,
          authStatus: authStatus,
          decryptedResponse: result.data
        }
      );

      console.log(`✅ ${bookingType} reservation updated to not-reserved/unpaid`);

      // Stop polling
      stopTransactionPolling(bookingId);

    } else if (authStatus === '0002') {
      // Payment pending
      console.log(`⏳ Payment still pending, will check again in 5 minutes...`);

    } else {
      // Unknown status
      console.log(`⚠️ Unknown auth status: ${authStatus}, will keep polling...`);
    }

  } catch (error) {
    console.error(`❌ Error polling transaction:`, error.message);
  }
}

/**
 * Get all active polling bookings
 */
export function getActivePolls() {
  return Array.from(activePolls.keys());
}

/**
 * Send tent reservation confirmation emails
 */
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
