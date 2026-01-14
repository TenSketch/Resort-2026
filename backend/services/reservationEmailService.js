import Resort from '../models/resortModel.js';
import Room from '../models/roomModel.js';
import transporter from '../config/nodemailer.js';
import { RESERVATION_SUCCESS_EMAIL_TEMPLATE, RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE } from '../config/emailTemplates.js';

/**
 * Send reservation success emails to user and admin
 * @param {Object} reservation - Reservation document
 * @param {Object} paymentTransaction - Payment transaction document
 */
export async function sendReservationSuccessEmails(reservation, paymentTransaction) {
  try {
    // Fetch resort details
    // Detect if it's a Tourist Spot Reservation
    const isTouristSpot = reservation.touristSpots && reservation.touristSpots.length > 0;
    
    let resortName = 'Resort';
    let roomList = 'N/A';
    let checkInVal = reservation.checkIn;
    let checkOutVal = reservation.checkOut;
    let foodProviding = 'No';

    if (isTouristSpot) {
      resortName = 'Tourist Spot Booking';
      roomList = reservation.touristSpots.map(s => `${s.name} (${s.counts?.adults || 0} Adults)`).join(', ');
      // Use visitDate for both checkin/checkout or just one
      const visitDate = reservation.touristSpots[0]?.visitDate || reservation.createdAt;
      checkInVal = visitDate;
      checkOutVal = visitDate;
    } else {
      // Fetch resort details for Resort Booking
      let resortData = null;
      if (reservation.resort) {
        resortData = await Resort.findById(reservation.resort).lean();
      }

      // Fetch room details
      let roomsData = [];
      if (reservation.rooms && Array.isArray(reservation.rooms)) {
        roomsData = await Room.find({ _id: { $in: reservation.rooms } }).lean();
      }

      resortName = resortData?.resortName || reservation.rawSource?.resortName || 'Resort';
      roomList = roomsData.map(r => r.roomName || r.roomNumber).join(', ') || 'N/A';
      foodProviding = resortName.includes('Jungle Star') ? 'Yes' : 'No';
    }
    
    // Format dates
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    }) : 'N/A';

    // Prepare email data
    const emailData = {
      Full_Name: reservation.fullName || reservation.user?.name,
      Guest_Details: `${reservation.fullName || reservation.user?.name}\n${reservation.email || reservation.user?.email}\n${reservation.phone || reservation.user?.phone}\n${reservation.address1 || reservation.user?.address || ''}, ${reservation.city || reservation.user?.city || ''}`,
      Reservation_Date: formatDate(reservation.reservationDate || reservation.createdAt),
      Booking_Id: reservation.bookingId,
      Room_List: roomList,
      Check_In: formatDate(checkInVal),
      Check_Out: formatDate(checkOutVal),
      Total_Guests: isTouristSpot 
        ? reservation.touristSpots.reduce((sum, s) => sum + (s.counts?.adults || 0) + (s.counts?.children || 0), 0)
        : (reservation.guests || 0) + (reservation.extraGuests || 0) + (reservation.children || 0),
      Payment_Amount: `INR ${reservation.totalPayable?.toFixed(2)}`,
      Transaction_ID: reservation.rawSource?.transactionId || paymentTransaction?.transactionId || 'N/A',
      Payment_Date: formatDate(paymentTransaction?.updatedAt || new Date()),
      Payment_Status: 'Confirmed',
      Food_Providing: foodProviding,
      Contact_Person_Name: 'Mr. Veerababu',
      Resort_Name: resortName,
      Support_Number: '+919494151617',
      Email: 'info@vanavihari.com',
      Website: 'www.vanavihari.com'
    };

    // Replace placeholders in templates
    let userEmail = RESERVATION_SUCCESS_EMAIL_TEMPLATE;
    let adminEmail = RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE;

    Object.keys(emailData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      userEmail = userEmail.replace(regex, emailData[key]);
      adminEmail = adminEmail.replace(regex, emailData[key]);
    });

    // Handle conditional food menu (Nunjucks-style)
    if (emailData.Food_Providing === 'Yes') {
      userEmail = userEmail.replace(/{% if Food_Providing == "Yes" %}/g, '');
      userEmail = userEmail.replace(/{% endif %}/g, '');
    } else {
      userEmail = userEmail.replace(/{% if Food_Providing == "Yes" %}[\s\S]*?{% endif %}/g, '');
    }

    // Send email to user
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: reservation.email,
      subject: `Booking Confirmation - ${reservation.bookingId}`,
      html: userEmail
    });

    console.log(`✅ Confirmation email sent to user: ${reservation.email}`);

    // Send email to admin
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: process.env.ADMIN_EMAIL || 'info@vanavihari.com',
      subject: `New Booking - ${reservation.bookingId} - ${resortName}`,
      html: adminEmail
    });

    console.log(`✅ Notification email sent to admin`);

    return { success: true };

  } catch (error) {
    console.error('❌ Error sending reservation emails:', error);
    // Don't throw error - email failure shouldn't break the payment flow
    return { success: false, error: error.message };
  }
}
