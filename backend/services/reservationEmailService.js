import Resort from '../models/resortModel.js';
import Room from '../models/roomModel.js';
import Admin from '../models/adminModel.js';
import transporter from '../config/nodemailer.js';
import { RESERVATION_SUCCESS_EMAIL_TEMPLATE, RESERVATION_SUCCESS_EMAIL_ADMIN_TEMPLATE, RESERVATION_REFUND_EMAIL_TEMPLATE, APPROVAL_REQUEST_EMAIL_TEMPLATE, APPROVAL_RESULT_EMAIL_TEMPLATE, AUTO_RELEASE_EMAIL_TEMPLATE } from '../config/emailTemplates.js';

/**
 * Send reservation success emails to user and admin (for room bookings only)
 * Note: Trek bookings use trekReservationEmailService.js
 * @param {Object} reservation - Reservation document
 * @param {Object} paymentTransaction - Payment transaction document
 */
export async function sendReservationSuccessEmails(reservation, paymentTransaction) {
  try {
    // Fetch resort details
    let resortData = null;
    if (reservation.resort) {
      resortData = await Resort.findById(reservation.resort).lean();
    }

    // Fetch room details
    let roomsData = [];
    if (reservation.rooms && Array.isArray(reservation.rooms)) {
      roomsData = await Room.find({ _id: { $in: reservation.rooms } }).lean();
    }

    const resortName = resortData?.resortName || reservation.rawSource?.resortName || 'Resort';
    const roomList = roomsData.map(r => r.roomName || r.roomNumber).join(', ') || 'N/A';
    const foodProviding = resortName.includes('Jungle Star') ? 'Yes' : 'No';
    
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
      Check_In: formatDate(reservation.checkIn),
      Check_Out: formatDate(reservation.checkOut),
      Total_Guests: (reservation.guests || 0) + (reservation.extraGuests || 0) + (reservation.children || 0),
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

/**
 * Send cancellation and refund email to guest
 * @param {Object} reservation - Updated reservation document
 * @param {number} refundAmount - Calculated refund amount
 */
export async function sendCancellationEmail(reservation, refundAmount = 0) {
  try {
    // Fetch resort details for the email context
    let resortData = null;
    if (reservation.resort) {
      resortData = await Resort.findById(reservation.resort).lean();
    }

    // Fetch room details
    let roomsData = [];
    if (reservation.rooms && Array.isArray(reservation.rooms)) {
      roomsData = await Room.find({ _id: { $in: reservation.rooms } }).lean();
    }

    const resortName = resortData?.resortName || reservation.rawSource?.resortName || 'VANAVIHARI';
    const roomList = roomsData.map(r => r.roomName || r.roomNumber).join(', ') || 'N/A';
    const cottageList = Array.isArray(reservation.cottageTypeNames) ? reservation.cottageTypeNames.join(', ') : 'N/A';

    // Format dates
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric'
    }) : 'N/A';

    const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'N/A';

    // Prepare email data placeholders
    const emailData = {
      Full_Name: reservation.fullName || 'Guest',
      Booking_Id: reservation.bookingId || 'N/A',
      Resort_Name: resortName,
      Cottage_Names: cottageList,
      Room_Names: roomList,
      Reservation_Date: formatDate(reservation.reservationDate),
      Cancellation_Request_Date: formatDateTime(reservation.refundRequestedDateTime || new Date()),
      Refund_Amount: refundAmount.toFixed(2),
      Refund_Percentage: reservation.refundPercentage || 0,
      Payment_Amount: reservation.totalPayable?.toFixed(2) || '0.00'
    };

    // Replace placeholders in template
    let htmlContent = RESERVATION_REFUND_EMAIL_TEMPLATE;
    Object.keys(emailData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, emailData[key]);
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: reservation.email,
      subject: `Booking Cancellation Confirmation - ${reservation.bookingId}`,
      html: htmlContent
    });

    console.log(`✅ Cancellation email sent to user: ${reservation.email}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error sending cancellation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email notification to all DFOs when a reservation requires approval
 * @param {Object} reservation - Reservation document
 */
export async function sendApprovalRequestEmail(reservation) {
  try {
    // 1. Fetch DFO emails
    const dfoAdmins = await Admin.find({ role: 'dfo' }).select('username name').lean();
    if (!dfoAdmins || dfoAdmins.length === 0) {
      console.log('ℹ️ No DFO admins found to notify.');
      return { success: false, error: 'No DFO found' };
    }

    const dfoEmails = dfoAdmins.map(admin => admin.username);

    // 2. Fetch Resort details for context
    let resortName = 'Vanavihari';
    if (reservation.resort) {
      const resort = await Resort.findById(reservation.resort).select('resortName').lean();
      if (resort) resortName = resort.resortName;
    }

    // 3. Prepare Email Data
    const approvalLink = `${process.env.ADMIN_URL || 'https://admin.vanavihari.com'}/approvals/${reservation._id}`;
    
    const emailData = {
      BOOKING_ID: reservation.bookingId || '(Pending)',
      GUEST_NAME: reservation.fullName || reservation.user?.name || 'Guest',
      RESORT_NAME: resortName,
      CHECK_IN: reservation.checkIn ? new Date(reservation.checkIn).toLocaleDateString() : 'N/A',
      AMOUNT: reservation.totalPayable?.toFixed(2) || '0.00',
      APPROVAL_LINK: approvalLink
    };

    // 4. Populate Template
    let htmlContent = APPROVAL_REQUEST_EMAIL_TEMPLATE;
    Object.keys(emailData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, emailData[key]);
    });

    // 5. Send Emails
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: dfoEmails.join(','), // Send to all DFOs
      subject: `Action Required: Approval Needed for Booking ${emailData.BOOKING_ID}`,
      html: htmlContent
    });

    console.log(`✅ Approval request emails sent to DFOs: ${dfoEmails.join(', ')}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error sending approval request email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email to the booking creator when DFO approves or rejects a reservation
 * @param {Object} reservation - Updated reservation document
 * @param {string} status - 'APPROVED' or 'REJECTED'
 */
export async function sendApprovalResultEmail(reservation, status) {
  try {
    // 1. Determine the creator's email (username is email in this system)
    const creatorUsername = reservation.createdBy;
    if (!creatorUsername) {
      console.log('ℹ️ No createdBy on reservation, skipping approval result email.');
      return { success: false, error: 'No creator found' };
    }

    // The creator username IS the email for admin accounts
    const creatorEmail = creatorUsername;

    // 2. Fetch Resort details
    let resortName = 'Vanavihari';
    if (reservation.resort) {
      const resort = await Resort.findById(reservation.resort).select('resortName').lean();
      if (resort) resortName = resort.resortName;
    }

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) : 'N/A';

    const isApproved = status === 'APPROVED';

    // 3. Prepare email data
    const emailData = {
      STATUS: isApproved ? 'Approved ✅' : 'Rejected ❌',
      STATUS_COLOR: isApproved ? '#4d9900' : '#dc3545',
      STATUS_MESSAGE: isApproved
        ? `Great news! Your reservation request has been approved by DFO. The booking is now confirmed.`
        : `Unfortunately, your reservation request has been rejected by DFO. Please see the details below.`,
      CREATOR_NAME: creatorUsername,
      BOOKING_ID: reservation.bookingId || 'N/A',
      GUEST_NAME: reservation.fullName || 'Guest',
      RESORT_NAME: resortName,
      CHECK_IN: formatDate(reservation.checkIn),
      CHECK_OUT: formatDate(reservation.checkOut),
      AMOUNT: reservation.totalPayable?.toFixed(2) || '0.00',
      APPROVED_BY: reservation.approved_by || 'DFO',
      REMARKS: reservation.approval_remarks || (isApproved ? 'Approved' : 'No remarks provided'),
      DASHBOARD_LINK: `${process.env.ADMIN_URL || 'https://admin.vanavihari.com'}/reservation/all`
    };

    // 4. Populate template
    let htmlContent = APPROVAL_RESULT_EMAIL_TEMPLATE;
    Object.keys(emailData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, emailData[key]);
    });

    // 5. Send email
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: creatorEmail,
      subject: `Reservation ${isApproved ? 'Approved' : 'Rejected'} - ${reservation.bookingId || 'Booking'}`,
      html: htmlContent
    });

    console.log(`✅ Approval result email (${status}) sent to: ${creatorEmail}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error sending approval result email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email to the booking creator when a reservation auto-releases after 12h
 * @param {Object} reservation - The expired reservation document (lean object)
 */
export async function sendAutoReleaseEmail(reservation) {
  try {
    const creatorUsername = reservation.createdBy;
    if (!creatorUsername) {
      console.log('ℹ️ No createdBy on reservation, skipping auto-release email.');
      return { success: false, error: 'No creator found' };
    }

    const creatorEmail = creatorUsername;

    // Fetch Resort details
    let resortName = 'Vanavihari';
    if (reservation.resort) {
      const resort = await Resort.findById(reservation.resort).select('resortName').lean();
      if (resort) resortName = resort.resortName;
    }

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) : 'N/A';

    const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'N/A';

    const emailData = {
      CREATOR_NAME: creatorUsername,
      BOOKING_ID: reservation.bookingId || reservation._id?.toString() || 'N/A',
      GUEST_NAME: reservation.fullName || 'Guest',
      RESORT_NAME: resortName,
      CHECK_IN: formatDate(reservation.checkIn),
      CHECK_OUT: formatDate(reservation.checkOut),
      AMOUNT: reservation.totalPayable?.toFixed(2) || '0.00',
      CREATED_AT: formatDateTime(reservation.createdAt),
      EXPIRED_AT: formatDateTime(reservation.expiresAt),
      DASHBOARD_LINK: `${process.env.ADMIN_URL || 'https://admin.vanavihari.com'}/reservation/all`
    };

    let htmlContent = AUTO_RELEASE_EMAIL_TEMPLATE;
    Object.keys(emailData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, emailData[key]);
    });

    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: creatorEmail,
      subject: `⏰ Reservation Auto-Released - ${emailData.BOOKING_ID}`,
      html: htmlContent
    });

    console.log(`✅ Auto-release email sent to: ${creatorEmail} for booking ${emailData.BOOKING_ID}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error sending auto-release email:', error);
    return { success: false, error: error.message };
  }
}
