import axios from 'axios';
import Resort from '../models/resortModel.js';
import TentSpot from '../models/tentSpotModel.js';
import { SMS_TEMPLATES, SMS_CONFIG } from '../config/smsTemplates.js';

/**
 * Format phone number with country code
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number with 91 prefix
 */
function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  let mobile = phone.toString().trim();
  
  // Remove any non-digit characters
  mobile = mobile.replace(/\D/g, '');
  
  // Add country code if not present
  if (!mobile.startsWith('91')) {
    mobile = '91' + mobile;
  }
  
  return mobile;
}

/**
 * Format date to DD-MMM-YYYY format
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Send SMS via API
 * @param {string} mobile - Mobile number with country code
 * @param {string} message - SMS message content
 * @param {string} source - SMS source/sender ID
 * @param {string} tempid - Template ID
 * @returns {Promise<Object>} - API response
 */
async function sendSMS(mobile, message, source, tempid) {
  try {
    const params = {
      username: SMS_CONFIG.username,
      password: SMS_CONFIG.password,
      type: 0,
      dlr: 1,
      destination: mobile,
      source,
      message,
      entityid: SMS_CONFIG.entityid,
      tempid,
      tmid: SMS_CONFIG.tmid
    };

    const response = await axios.get(SMS_CONFIG.url, { params });
    console.log('📱 SMS API Response:', response.data);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ SMS API Error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Resolve resort slug from reservation (direct or via DB lookup)
 */
async function resolveResortSlug(reservation) {
  let slug = reservation.resortSlug;
  if (!slug && reservation.resort) {
    const resortData = await Resort.findById(reservation.resort).lean();
    if (resortData) slug = resortData.slug;
  }
  return (slug || '').toLowerCase();
}

/**
 * Pick room booking template (full format) based on resort slug.
 * Returns { template, isJungleStar }
 */
function pickRoomTemplate(slug) {
  if (slug === 'jungle-star' || slug === 'junglestar') {
    return { template: SMS_TEMPLATES.JUNGLESTAR_BOOKING_FULL, isJungleStar: true };
  }
  // Default → Vanavihari
  return { template: SMS_TEMPLATES.VANAVIHARI_BOOKING_FULL, isJungleStar: false };
}

/**
 * Send room reservation SMS to customer
 * @param {Object} reservation - Reservation document
 * @param {Object} paymentTransaction - Payment transaction document
 * @returns {Promise<Object>} - Result object
 */
export async function sendRoomReservationSMS(reservation, paymentTransaction) {
  try {
    console.log(`\n📱 Preparing room reservation SMS for booking: ${reservation.bookingId}`);

    // Validate phone number
    const mobile = formatPhoneNumber(reservation.phone);
    if (!mobile) {
      console.log('⚠️ No valid phone number found, skipping SMS');
      return { success: false, error: 'No valid phone number' };
    }

    const slug = await resolveResortSlug(reservation);
    const { template, isJungleStar } = pickRoomTemplate(slug);
    const adminTemplate = isJungleStar
      ? SMS_TEMPLATES.JUNGLESTAR_ADMIN_BOOKING
      : SMS_TEMPLATES.VANAVIHARI_ADMIN_BOOKING;

    // Prepare SMS data
    const smsData = {
      fullName: reservation.fullName || 'Guest',
      bookingId: reservation.bookingId,
      checkIn: formatDate(reservation.checkIn),
      checkOut: formatDate(reservation.checkOut),
      guests: reservation.guests || 1,
      rooms: reservation.roomNumbers || reservation.numberOfRooms || 'N/A',
      cottages: reservation.cottageNames || reservation.cottageType || 'N/A',
      amount: reservation.totalPayable?.toFixed(2) || reservation.amount?.toFixed(2) || '0.00',
      phone: reservation.phone || 'N/A',
    };

    const message = template.getMessage(smsData);
    const source = template.source;
    const tempid = template.tempid;

    console.log(`📱 Sending guest SMS to: ${mobile} | Resort: ${slug || 'vanavihari'} | Template: ${tempid}`);

    // Send Guest SMS
    const result = await sendSMS(mobile, message, source, tempid);

    if (result.success) {
      console.log(`✅ Room reservation guest SMS sent successfully to ${mobile}`);
    } else {
      console.log(`❌ Failed to send room reservation guest SMS: ${result.error}`);
    }

    // Admin / coordinator SMS
    const adminMobile = formatPhoneNumber(SMS_CONFIG.adminPhone);
    if (adminMobile) {
      const adminResult = await sendSMS(adminMobile, adminTemplate.getMessage(smsData), adminTemplate.source, adminTemplate.tempid);
      if (adminResult.success) {
        console.log(`✅ Room reservation admin SMS sent to ${adminMobile}`);
      } else {
        console.log(`❌ Room reservation admin SMS failed: ${adminResult.error}`);
      }
    }

    return result;

  } catch (error) {
    console.error('❌ Error in sendRoomReservationSMS:', error);
    // Don't throw - SMS failure shouldn't break the payment flow
    return { success: false, error: error.message };
  }
}

/**
 * Send tent reservation SMS to customer
 * @param {Object} reservation - Tent reservation document
 * @param {Object} paymentTransaction - Payment transaction document
 * @returns {Promise<Object>} - Result object
 */
export async function sendTentReservationSMS(reservation, paymentTransaction) {
  try {
    console.log(`\n📱 Preparing tent reservation SMS for booking: ${reservation.bookingId}`);

    // Validate phone number
    const mobile = formatPhoneNumber(reservation.phone);
    if (!mobile) {
      console.log('⚠️ No valid phone number found, skipping SMS');
      return { success: false, error: 'No valid phone number' };
    }

    // Get tent spot name
    let tentSpotName = 'Tent Spot';
    
    if (reservation.tentSpot) {
      const tentSpotData = await TentSpot.findById(reservation.tentSpot).lean();
      if (tentSpotData) {
        tentSpotName = tentSpotData.spotName || 'Tent Spot';
      }
    }

    // Prepare SMS data
    const smsData = {
      fullName: reservation.fullName || 'Guest',
      bookingId: reservation.bookingId,
      checkIn: formatDate(reservation.checkinDate),
      tentSpotName: tentSpotName
    };

    // Use common tent template for all tent bookings
    const template = SMS_TEMPLATES.TENT_COMMON;

    const message = template.getMessage(smsData);
    const source = template.source;
    const tempid = template.tempid;

    console.log(`📱 Sending SMS to: ${mobile}`);
    console.log(`📱 Tent Spot: ${tentSpotName}`);
    console.log(`📱 Source: ${source}, Template ID: ${tempid}`);

    // Send SMS
    const result = await sendSMS(mobile, message, source, tempid);

    if (result.success) {
      console.log(`✅ Tent reservation SMS sent successfully to ${mobile}`);
    } else {
      console.log(`❌ Failed to send tent reservation SMS: ${result.error}`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error in sendTentReservationSMS:', error);
    // Don't throw - SMS failure shouldn't break the payment flow
    return { success: false, error: error.message };
  }
}

/**
 * Sends trek booking confirmation SMS to guest.
 * Uses the approved Trek template (DLT: 1107177200964168936, source VANVHR).
 */
export async function sendTrekReservationSMS(reservation, paymentTransaction) {
  try {
    console.log(`\n📱 Preparing trek reservation SMS for booking: ${reservation.bookingId}`);

    // Trek reservations store phone under reservation.user.phone or reservation.phone
    const phone = reservation.user?.phone || reservation.phone;
    const mobile = formatPhoneNumber(phone);
    if (!mobile) {
      console.log('⚠️  No valid phone number, skipping trek SMS');
      return { success: false, error: 'No valid phone number' };
    }

    // Derive visit date from the first tourist spot entry
    const visitDate = reservation.touristSpots?.[0]?.visitDate
      ? formatDate(reservation.touristSpots[0].visitDate)
      : formatDate(reservation.visitDate || reservation.reservationDate);

    const smsData = {
      fullName:  reservation.user?.name || reservation.fullName || 'Guest',
      bookingId: reservation.bookingId,
      visitDate,
      amount:    (reservation.totalPayable ?? reservation.amount ?? 0).toFixed(2),
    };

    const template = SMS_TEMPLATES.TREK_BOOKING;
    console.log(`📱 Sending trek SMS → ${mobile} | Template: ${template.tempid}`);

    const result = await sendSMS(mobile, template.getMessage(smsData), template.source, template.tempid);

    if (result.success) {
      console.log(`✅ Trek reservation SMS sent to ${mobile}`);
    } else {
      console.log(`❌ Trek reservation SMS failed: ${result.error}`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error in sendTrekReservationSMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends cancellation SMS to guest AND admin coordinator.
 *
 * @param {Object}  reservation   - Reservation document (must have bookingId, phone, resortSlug/resort)
 * @param {number}  refundAmount  - Refund amount in INR (0 = no refund)
 * @param {string}  resortName    - Human-readable resort name (e.g. "VANAVIHARI")
 */
export async function sendCancellationSMS(reservation, refundAmount = 0, resortName = 'VANAVIHARI') {
  try {
    console.log(`\n📱 Preparing cancellation SMS for booking: ${reservation.bookingId}`);

    const mobile = formatPhoneNumber(reservation.phone);
    if (!mobile) {
      console.log('⚠️  No valid guest phone, skipping cancellation SMS');
      return { success: false, error: 'No valid phone number' };
    }

    const slug = await resolveResortSlug(reservation);
    const isJungleStar = slug === 'jungle-star' || slug === 'junglestar';
    const hasRefund = refundAmount > 0;

    const smsData = {
      bookingId:    reservation.bookingId,
      resortName:   resortName || (isJungleStar ? 'JUNGLE STAR' : 'VANAVIHARI'),
      refundAmount: refundAmount.toFixed ? refundAmount.toFixed(2) : String(refundAmount),
    };

    // ── Pick guest cancellation template ──────────────────────
    let guestTemplate;
    if (isJungleStar) {
      guestTemplate = hasRefund
        ? SMS_TEMPLATES.JUNGLESTAR_CANCEL_REFUND
        : SMS_TEMPLATES.JUNGLESTAR_CANCEL_REFUND; // Jungle Star only has one template (refund)
    } else {
      guestTemplate = hasRefund
        ? SMS_TEMPLATES.VANAVIHARI_CANCEL_REFUND
        : SMS_TEMPLATES.VANAVIHARI_CANCEL_NO_REFUND;
    }

    console.log(`📱 Sending cancellation guest SMS → ${mobile} | Template: ${guestTemplate.tempid}`);
    const guestResult = await sendSMS(mobile, guestTemplate.getMessage(smsData), guestTemplate.source, guestTemplate.tempid);
    if (guestResult.success) {
      console.log(`✅ Cancellation guest SMS sent to ${mobile}`);
    } else {
      console.log(`❌ Cancellation guest SMS failed: ${guestResult.error}`);
    }

    // ── Admin / coordinator cancellation alert ────────────────
    const adminMobile = formatPhoneNumber(SMS_CONFIG.adminPhone);
    if (adminMobile) {
      // Admin templates are only VANVHR-sourced (both resort types use VANVHR for admin alerts)
      const adminTemplate = hasRefund
        ? SMS_TEMPLATES.VANAVIHARI_CANCEL_ADMIN_REFUND
        : SMS_TEMPLATES.VANAVIHARI_CANCEL_ADMIN_NO_REFUND;

      console.log(`📱 Sending cancellation admin SMS → ${adminMobile} | Template: ${adminTemplate.tempid}`);
      const adminResult = await sendSMS(adminMobile, adminTemplate.getMessage(smsData), adminTemplate.source, adminTemplate.tempid);
      if (adminResult.success) {
        console.log(`✅ Cancellation admin SMS sent to ${adminMobile}`);
      } else {
        console.log(`❌ Cancellation admin SMS failed: ${adminResult.error}`);
      }
    }

    return guestResult;

  } catch (error) {
    console.error('❌ Error in sendCancellationSMS:', error);
    return { success: false, error: error.message };
  }
}
