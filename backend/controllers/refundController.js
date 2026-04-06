import { initiateBilldeskRefund } from "../services/refundBillDesk.js";
import { sendCancellationSMS } from "../services/reservationSmsService.js";
import { sendCancellationEmail } from "../services/reservationEmailService.js";
import Resort from "../models/resortModel.js";
import Reservation from "../models/reservationModel.js";
import PaymentTransaction from "../models/paymentTransactionModel.js";

export const processRefund = async (req, res) => {
  try {
    const { 
      booking_id1, 
      Payment_Transaction_Id, 
      refundableAmount, 
      cancel_reason, 
      more_details, 
      uniqueKey, 
      refund_percent 
    } = req.body;

    if (!booking_id1 || !Payment_Transaction_Id) {
      return res.status(400).json({ success: false, error: 'Booking ID and Transaction ID are required' });
    }

    const reservation = await Reservation.findOne({ bookingId: booking_id1 });
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reservation not found' });
    }

    let transactionQuery = { 
      $or: [
        { transactionId: Payment_Transaction_Id }
      ]
    };
    
    // Only check _id if the provided string is a valid MongoDB ObjectId
    if (Payment_Transaction_Id.length === 24 && /^[0-9a-fA-F]{24}$/.test(Payment_Transaction_Id)) {
      transactionQuery.$or.push({ _id: Payment_Transaction_Id });
    }

    const paymentTransaction = await PaymentTransaction.findOne(transactionQuery);

    if (!paymentTransaction) {
      return res.status(404).json({ success: false, error: 'Payment transaction not found' });
    }

    if (paymentTransaction.status !== 'Success') {
      return res.status(400).json({ success: false, error: 'Only successful payments can be refunded' });
    }

    const refundAmountNum = parseFloat(refundableAmount);
    if (isNaN(refundAmountNum) || refundAmountNum < 0 || refundAmountNum > paymentTransaction.amount) {
      return res.status(400).json({ success: false, error: 'Invalid refund amount' });
    }

    const encKey = process.env.BILLDESK_ENCRYPTION_KEY;
    const signKey = process.env.BILLDESK_SIGNING_KEY;
    const keyId = process.env.KEY_ID;
    const clientId = process.env.BILLDESK_CLIENTID;

    const refundRequestData = {
      mercid: process.env.BILLDESK_MERCID,
      orderid: paymentTransaction.bdOrderId || booking_id1,
      transactionid: paymentTransaction.transactionId,
      refund_amount: refundAmountNum.toFixed(2),
      refund_type: "refund",
      refund_ref_no: uniqueKey || ("RF" + Date.now().toString().slice(-10))
    };

    reservation.status = 'cancelled';
    reservation.cancelBookingReason = cancel_reason;
    reservation.cancellationMessage = more_details;
    reservation.refundRequestedDateTime = new Date();
    reservation.refundableAmount = refundAmountNum;
    reservation.refundPercentage = refund_percent;
    reservation.paymentStatus = 'refunded';

    if (refundAmountNum > 0) {
      console.log(`💳 [BillDesk] Initiating Refund for ${booking_id1} | Amount: ₹${refundAmountNum}`);
      const refundResponse = await initiateBilldeskRefund(refundRequestData, encKey, signKey, keyId, clientId);
      reservation.amountRefunded = refundAmountNum;
      reservation.dateOfRefund = new Date();
      if (!reservation.rawSource) reservation.rawSource = {};
      reservation.rawSource.refundResponse = refundResponse.data;
      console.log(`✅ [BillDesk] Refund SUCCESS for ${booking_id1}`);
    } else {
      console.log(`ℹ️ [Policy] Refund amount is 0 for ${booking_id1}. Skipping BillDesk API call.`);
      reservation.amountRefunded = 0;
      reservation.dateOfRefund = new Date(); // Record the cancellation completion date
    }


    // 6. Save final changes
    await reservation.save();

    // 7. Derive human-readable resort name for notifications
    let resortName = 'VANAVIHARI';
    if (reservation.resort) {
      try {
        const resortDoc = await Resort.findById(reservation.resort).lean();
        if (resortDoc?.resortName) resortName = resortDoc.resortName.toUpperCase();
      } catch (_) { /* ignore */ }
    }

    // 8. Re-fetch the final state for notifications
    const finalReservation = await Reservation.findById(reservation._id).lean();

    // 9. Send Guest Notifications (Non-blocking)
    if (finalReservation) {
      console.log(`📡 Triggering cancellation notifications for ${finalReservation.bookingId}...`);
      
      // SMS
      sendCancellationSMS(finalReservation, refundAmountNum, resortName)
        .then(r => console.log(`📱 Cancellation SMS for ${finalReservation.bookingId}: ${r.success ? '✅ sent' : '❌ failed'}`))
        .catch(err => console.error(`❌ Cancellation SMS error:`, err.message));

      // Email
      sendCancellationEmail(finalReservation, refundAmountNum)
        .then(r => console.log(`📧 Cancellation Email for ${finalReservation.bookingId}: ${r.success ? '✅ sent' : '❌ failed'}`))
        .catch(err => console.error(`❌ Cancellation Email error:`, err.message));
    }

    res.json({ 
      success: true, 
      message: 'Reservation cancelled and refund initiated successfully',
      reservation: finalReservation
    });

  } catch (err) {
    console.error("Refund processing error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
