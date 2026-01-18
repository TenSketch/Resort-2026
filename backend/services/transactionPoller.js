import { retrieveTransaction } from './retrieveTransaction.js';
import { sendReservationSuccessEmails } from './reservationEmailService.js';
import { sendRoomReservationSMS } from './reservationSmsService.js';
import Reservation from '../models/reservationModel.js';
import PaymentTransaction from '../models/paymentTransactionModel.js';

// Store active polling intervals
const activePolls = new Map();

/**
 * Start polling for a transaction status
 * Checks every 5 minutes for 15 minutes (3 checks total)
 */
export function startTransactionPolling(bookingId, bdOrderId, mercid, authToken = null) {
  // Don't start if already polling
  if (activePolls.has(bookingId)) {
    console.log(`⏭️ Already polling for booking: ${bookingId}`);
    return;
  }

  console.log(`🔄 Starting transaction polling for booking: ${bookingId}`);
  console.log(`   Order ID (bookingId): ${bookingId}`);
  console.log(`   BD Order ID: ${bdOrderId}`);
  console.log(`   Will check at 5, 10, and 15 minutes`);

  let checkCount = 0;
  const maxChecks = 3; // 3 checks over 15 minutes
  const intervalMinutes = 5;

  // Set up interval - first check will be after 5 minutes (not immediate)
  const intervalId = setInterval(async () => {
    // Pass bookingId (orderid) not bdOrderId
    await pollTransaction(bookingId, bookingId, mercid, authToken, checkCount);
    
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
async function pollTransaction(bookingId, orderid, mercid, authToken, checkNumber) {
  console.log(`\n📊 Poll Check #${checkNumber + 1} for booking: ${bookingId}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    // First check if reservation is still pending
    const reservation = await Reservation.findOne({ bookingId }).lean();
    
    if (!reservation) {
      console.log(`❌ Reservation not found: ${bookingId}`);
      stopTransactionPolling(bookingId);
      return;
    }
    
    // If status is already resolved (not pending), stop polling
    if (reservation.status !== 'pending') {
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
      console.log(`💰 Payment successful! Updating reservation to paid/reserved...`);
      
      await Reservation.findOneAndUpdate(
        { bookingId },
        {
          status: 'reserved',
          paymentStatus: 'paid',
          expiresAt: null,
          $set: {
            'rawSource.transactionId': transactionId,
            'rawSource.authStatus': authStatus,
            'rawSource.transactionDate': result.data.transaction_date
          }
        }
      );
      
      await PaymentTransaction.findOneAndUpdate(
        { bookingId },
        {
          status: 'success',
          transactionId: transactionId,
          authStatus: authStatus,
          decryptedResponse: result.data
        }
      );
      
      console.log(`✅ Reservation updated to reserved/paid`);
      
      // Stop polling since payment is confirmed
      stopTransactionPolling(bookingId);
      
      // Send confirmation emails
      console.log(`📧 Sending confirmation emails...`);
      const updatedReservation = await Reservation.findOne({ bookingId }).lean();
      const updatedPaymentTransaction = await PaymentTransaction.findOne({ bookingId }).lean();
      
      // Send emails asynchronously (don't wait for completion)
      sendReservationSuccessEmails(updatedReservation, updatedPaymentTransaction)
        .then((result) => {
          if (result.success) {
            console.log(`✅ Confirmation emails sent successfully`);
          } else {
            console.error(`❌ Email sending failed: ${result.error}`);
          }
        })
        .catch(err => console.error(`❌ Email sending error: ${err.message}`));
      
      // Send SMS asynchronously (don't wait for completion)
      sendRoomReservationSMS(updatedReservation, updatedPaymentTransaction)
        .then((result) => {
          if (result.success) {
            console.log(`✅ Room reservation SMS sent successfully`);
          } else {
            console.error(`❌ SMS sending failed: ${result.error}`);
          }
        })
        .catch(err => console.error(`❌ SMS sending error: ${err.message}`));
      
    } else if (authStatus === '0399') {
      // Payment failed
      console.log(`❌ Payment failed. Updating reservation to not-reserved/unpaid...`);
      
      await Reservation.findOneAndUpdate(
        { bookingId },
        {
          status: 'not-reserved',
          paymentStatus: 'unpaid',
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
          status: 'failed',
          transactionId: transactionId,
          authStatus: authStatus,
          errorMessage: result.data.transaction_error_desc,
          decryptedResponse: result.data
        }
      );
      
      console.log(`✅ Reservation updated to not-reserved/unpaid`);
      
      // Stop polling since payment failed
      stopTransactionPolling(bookingId);
      
    } else if (authStatus === '0398') {
      // User cancelled
      console.log(`🚫 Payment cancelled by user. Updating reservation...`);
      
      await Reservation.findOneAndUpdate(
        { bookingId },
        {
          status: 'cancelled',
          paymentStatus: 'unpaid',
          $set: {
            'rawSource.transactionId': transactionId,
            'rawSource.authStatus': authStatus
          }
        }
      );
      
      await PaymentTransaction.findOneAndUpdate(
        { bookingId },
        {
          status: 'cancelled',
          transactionId: transactionId,
          authStatus: authStatus,
          decryptedResponse: result.data
        }
      );
      
      console.log(`✅ Reservation updated to cancelled/unpaid`);
      
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
