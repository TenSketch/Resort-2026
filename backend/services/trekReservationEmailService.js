import transporter from "../config/nodemailer.js";
import { TREK_RESERVATION_SUCCESS_EMAIL_TEMPLATE, TREK_RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE } from "../config/emailTemplates.js";

/**
 * Send trek reservation confirmation emails to user and admin
 * @param {Object} reservation - Trek reservation object from database
 * @param {Object} paymentTransaction - Payment transaction object
 */
export async function sendTrekReservationEmails(reservation, paymentTransaction) {
  try {
    console.log('📧 Preparing trek reservation emails...');
    
    // Format date helper
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    // Build spot list with details
    let spotList = 'N/A';
    let totalGuests = 0;
    let totalCameras = 0;
    let visitDate = 'N/A';

    if (reservation.touristSpots && Array.isArray(reservation.touristSpots) && reservation.touristSpots.length > 0) {
      spotList = reservation.touristSpots.map(spot => {
        // Use adults + children if guests is 0 (legacy data structure)
        const adults = spot.counts?.adults || 0;
        const children = spot.counts?.children || 0;
        const guests = spot.counts?.guests || (adults + children);
        const cameras = spot.counts?.cameras || 0;
        
        totalGuests += guests;
        totalCameras += cameras;
        
        return `${spot.name} (${guests} guests, ${cameras} cameras)`;
      }).join('<br>');

      // Use first spot's visit date
      visitDate = formatDate(reservation.touristSpots[0].visitDate);
    }

    // Prepare email data
    const emailData = {
      Full_Name: reservation.user?.name || 'Guest',
      Guest_Details: `${reservation.user?.name || 'N/A'}\n${reservation.user?.email || 'N/A'}\n${reservation.user?.phone || 'N/A'}\n${reservation.user?.address || ''}, ${reservation.user?.city || ''}, ${reservation.user?.state || ''} - ${reservation.user?.pincode || ''}`,
      Reservation_Date: formatDate(reservation.reservationDate || reservation.bookingDate),
      Booking_Id: reservation.bookingId,
      Spot_List: spotList,
      Visit_Date: visitDate,
      Total_Guests: totalGuests,
      Total_Cameras: totalCameras,
      Payment_Amount: `INR ${reservation.totalPayable?.toFixed(2) || '0.00'}`,
      Transaction_ID: paymentTransaction?.transactionId || reservation.rawSource?.transactionId || 'N/A',
      Payment_Date: formatDate(paymentTransaction?.updatedAt || new Date()),
      Payment_Status: 'Confirmed',
      Contact_Person_Name: 'Mr. Veerababu',
      Support_Number: '+919494151617',
      Email: 'info@vanavihari.com',
      Website: 'www.vanavihari.com'
    };

    // Replace placeholders in templates
    let userEmail = TREK_RESERVATION_SUCCESS_EMAIL_TEMPLATE;
    let adminEmail = TREK_RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE;

    Object.keys(emailData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      userEmail = userEmail.replace(regex, emailData[key]);
      adminEmail = adminEmail.replace(regex, emailData[key]);
    });

    const userEmailAddress = reservation.user?.email || reservation.email;
    
    if (!userEmailAddress) {
      console.error('❌ No email address found for user');
      return;
    }

    // Send email to user
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: userEmailAddress,
      subject: `Tourist Spot Booking Confirmation - ${reservation.bookingId}`,
      html: userEmail
    });

    console.log(`✅ Trek confirmation email sent to: ${userEmailAddress}`);

    // Send email to admin
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: process.env.ADMIN_EMAIL || 'info@vanavihari.com',
      subject: `New Tourist Spot Booking - ${reservation.bookingId}`,
      html: adminEmail
    });

    console.log(`✅ Trek notification email sent to admin`);

  } catch (error) {
    console.error('❌ Error sending trek reservation emails:', error);
    // Don't throw error - email failure shouldn't break the payment flow
  }
}
