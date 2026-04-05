
/**
 * Calculates refund percentage and amount based on cancellation policy:
 * - 90% refund if > 48 hours before check-in
 * - 80% refund if 24-48 hours before check-in
 * - No refund if < 24 hours before check-in
 * 
 * Check-in time is fixed at 12:00 PM.
 * 
 * @param {Date|string} checkInDate - The scheduled check-in date
 * @param {number} totalAmount - Total amount paid
 * @returns {Object} { refundPercentage, refundAmount, diffInHours }
 */
export const calculateRefundAmount = (checkInDate, totalAmount) => {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  
  // Apply fixed check-in time: 12:00 PM
  checkIn.setHours(12, 0, 0, 0);

  const diffInMs = checkIn.getTime() - now.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  let refundPercentage = 0;
  if (diffInHours > 48) {
    refundPercentage = 90;
  } else if (diffInHours >= 24) {
    refundPercentage = 80;
  } else {
    refundPercentage = 0;
  }

  const refundAmount = Number(((refundPercentage / 100) * totalAmount).toFixed(2));

  return {
    refundPercentage,
    refundAmount,
    diffInHours: Math.round(diffInHours * 10) / 10 // Rounded to 1 decimal
  };
};
