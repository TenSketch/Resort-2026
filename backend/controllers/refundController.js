import Reservation from "../models/reservationModel.js";
import PaymentTransaction from "../models/paymentTransactionModel.js";
import { initiateBilldeskRefund } from "../services/refundBillDesk.js";

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

    const paymentTransaction = await PaymentTransaction.findOne({ 
      $or: [
        { transactionId: Payment_Transaction_Id },
        { _id: Payment_Transaction_Id }
      ]
    });

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
      console.log(`Initiating BillDesk Refund for ${booking_id1}`);
      const refundResponse = await initiateBilldeskRefund(refundRequestData, encKey, signKey, keyId, clientId);
      reservation.amountRefunded = refundAmountNum;
      reservation.dateOfRefund = new Date();
      if (!reservation.rawSource) reservation.rawSource = {};
      reservation.rawSource.refundResponse = refundResponse.data;
    } else {
      reservation.amountRefunded = 0;
    }

    await reservation.save();

    res.json({ success: true, message: 'Reservation cancelled and refund initiated successfully' });

  } catch (err) {
    console.error("Refund processing error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
