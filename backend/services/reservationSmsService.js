import axios from 'axios';
import Resort from '../models/resortModel.js';
import Room from '../models/roomModel.js';
import TentSpot from '../models/tentSpotModel.js';
import Tent from '../models/tentModel.js';
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

    // Fetch resort details
    let resortData = null;
    let resortSlug = reservation.resortSlug;
    
    if (reservation.resort) {
      resortData = await Resort.findById(reservation.resort).lean();
      if (resortData && !resortSlug) {
        resortSlug = resortData.slug;
      }
    }

    // Fetch room details
    let roomsData = [];
    if (reservation.rooms && Array.isArray(reservation.rooms)) {
      roomsData = await Room.find({ _id: { $in: reservation.rooms } }).lean();
    }

    // Extract room and cottage names
    const roomNames = [...new Set(roomsData.map(r => r.roomName || r.roomNumber).filter(Boolean))].join(', ') || 'N/A';
    const cottageNames = [...new Set(roomsData.map(r => r.cottageName).filter(Boolean))].join(', ') || 'N/A';

    // Calculate total guests
    const totalGuests = 
      Number(reservation.adults || 0) + 
      Number(reservation.guests || 0) + 
      Number(reservation.children || 0);

    // Prepare SMS data
    const smsData = {
      fullName: reservation.fullName || 'Guest',
      bookingId: reservation.bookingId,
      checkIn: formatDate(reservation.checkIn),
      checkOut: formatDate(reservation.checkOut),
      totalGuests,
      roomNames,
      cottageNames,
      amount: reservation.totalPayable?.toFixed(2) || reservation.amount?.toFixed(2) || '0.00'
    };

    // Select template based on resort slug
    let template;
    if (resortSlug === 'jungle-star' || resortSlug === 'junglestar') {
      template = SMS_TEMPLATES.ROOM_JUNGLESTAR;
    } else {
      // Default to Vanavihari
      template = SMS_TEMPLATES.ROOM_VANAVIHARI;
    }

    const message = template.getMessage(smsData);
    const source = template.source;
    const tempid = template.tempid;

    console.log(`📱 Sending SMS to: ${mobile}`);
    console.log(`📱 Resort: ${resortSlug || 'vanavihari'}`);
    console.log(`📱 Source: ${source}, Template ID: ${tempid}`);

    // Send SMS
    const result = await sendSMS(mobile, message, source, tempid);

    if (result.success) {
      console.log(`✅ Room reservation SMS sent successfully to ${mobile}`);
    } else {
      console.log(`❌ Failed to send room reservation SMS: ${result.error}`);
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

    // Fetch tent spot details
    let tentSpotData = null;
    let resortSlug = reservation.resortSlug;
    
    if (reservation.tentSpot) {
      tentSpotData = await TentSpot.findById(reservation.tentSpot).lean();
      if (tentSpotData && !resortSlug) {
        resortSlug = tentSpotData.slug;
      }
    }

    // Fetch tent details
    let tentsData = [];
    if (reservation.tents && Array.isArray(reservation.tents)) {
      tentsData = await Tent.find({ _id: { $in: reservation.tents } }).lean();
    }

    const tentSpotName = tentSpotData?.spotName || 'Tent Spot';
    const tentList = tentsData.map(t => t.tentId || t.name || 'Tent').join(', ') || 'N/A';

    // Calculate total guests
    const totalGuests = 
      Number(reservation.guests || 0) + 
      Number(reservation.children || 0);

    // Prepare SMS data
    const smsData = {
      fullName: reservation.fullName || 'Guest',
      bookingId: reservation.bookingId,
      checkIn: formatDate(reservation.checkinDate),
      checkOut: formatDate(reservation.checkoutDate),
      totalGuests,
      tentSpotName,
      tentList,
      amount: reservation.totalPayable?.toFixed(2) || reservation.amount?.toFixed(2) || '0.00'
    };

    // Select template based on resort slug
    let template;
    if (resortSlug === 'jungle-star' || resortSlug === 'junglestar') {
      template = SMS_TEMPLATES.TENT_JUNGLESTAR;
    } else {
      // Default to Vanavihari
      template = SMS_TEMPLATES.TENT_VANAVIHARI;
    }

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
