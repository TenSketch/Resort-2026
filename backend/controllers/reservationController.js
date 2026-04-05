import Reservation from '../models/reservationModel.js'
import Resort from '../models/resortModel.js'
import CottageType from '../models/cottageTypeModel.js'
import Room from '../models/roomModel.js'
import Notification from '../models/notificationModel.js'
import mongoose from 'mongoose'
import transporter from '../config/nodemailer.js'
import { checkRoomAvailability } from '../utils/roomAvailability.js'
import { sendCancellationSMS } from '../services/reservationSmsService.js'
import { calculateRefundAmount } from '../utils/refundCalculator.js'
import PaymentTransaction from '../models/paymentTransactionModel.js'
import { initiateBilldeskRefund } from '../services/refundBillDesk.js'



// Utility function to expire pending reservations
export const expirePendingReservations = async () => {
  try {
    const now = new Date()

    // 1. Expire 15-min user-facing pending reservations (Unpaid, Pending, expired)
    const expiredUserReservations = await Reservation.updateMany(
      {
        status: 'pending',
        paymentStatus: 'unpaid',
        approval_status: { $in: [null, undefined] },
        expiresAt: { $lte: now }
      },
      {
        $set: {
          status: 'not-reserved',
          paymentStatus: 'unpaid'
        }
      }
    )

    if (expiredUserReservations.modifiedCount > 0) {
      console.log(`Expired ${expiredUserReservations.modifiedCount} user pending reservations`)
    }

    // 2. Auto-release 12-hour DFO-pending bookings that were never approved/rejected
    //    Find them individually so we can send notifications to the creator
    const dfoExpired = await Reservation.find({
      approval_status: 'PENDING_DFO_APPROVAL',
      expiresAt: { $lte: now }
    }).lean()

    if (dfoExpired.length > 0) {
      const ids = dfoExpired.map(r => r._id)
      await Reservation.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            status: 'not-reserved',
            paymentStatus: 'unpaid',
            approval_status: 'REJECTED',
            approval_remarks: 'Auto-released: DFO did not approve within 12 hours.'
          }
        }
      )

      // Send a notification to each booking creator
      const notifPromises = dfoExpired.map(r => {
        if (!r.createdBy) return Promise.resolve()
        return Notification.create({
          title: 'Reservation Auto-Released',
          message: `Booking ${r.bookingId || r._id} was not approved by DFO within 12 hours and has been automatically released.`,
          type: 'RESERVATION_CANCELLED',
          targetUser: r.createdBy,
          link: `/reservation/all`
        }).catch(e => console.error('Notification error for auto-release', e))
      })
      await Promise.all(notifPromises)

      console.log(`Auto-released ${dfoExpired.length} DFO-pending reservations (12-hour timeout)`)
    }

    return { expiredUserReservations, dfoReleasedCount: dfoExpired.length }
  } catch (err) {
    console.error('Error expiring pending reservations:', err)
    return null
  }
}


// admin only
export const createReservation = async (req, res) => {
  try {
    const payload = { ...req.body }
    // Convert numeric and date-like fields
    if (payload.checkIn) payload.checkIn = new Date(payload.checkIn)
    if (payload.checkOut) payload.checkOut = new Date(payload.checkOut)
    if (payload.reservationDate) payload.reservationDate = new Date(payload.reservationDate)
    if (payload.guests) payload.guests = Number(payload.guests)
    if (payload.extraGuests) payload.extraGuests = Number(payload.extraGuests)
    if (payload.children) payload.children = Number(payload.children)
    if (payload.numberOfRooms) payload.numberOfRooms = Number(payload.numberOfRooms)
    if (payload.refundPercentage) payload.refundPercentage = Number(payload.refundPercentage)
    if (payload.roomPrice) payload.roomPrice = Number(String(payload.roomPrice).replace(/[₹,\s]/g, ''))
    if (payload.extraBedCharges) payload.extraBedCharges = Number(String(payload.extraBedCharges).replace(/[₹,\s]/g, ''))
    if (payload.totalPayable) payload.totalPayable = Number(String(payload.totalPayable).replace(/[₹,\s]/g, ''))

    // Track who created it
    if (req.admin) payload.createdBy = req.admin.username || req.admin.name || String(req.admin._id)

    const role = req.admin?.role

    if (role === 'superadmin') {
      // Superadmin: immediately confirmed
      payload.status = 'pending'
      payload.paymentStatus = 'unpaid'

      payload.approval_status = 'PENDING_DFO_APPROVAL'
    } else if (role === 'dfo') {
      // DFO: immediately confirmed — set valid enums before save, then confirm after
      payload.status = 'reserved'
      payload.paymentStatus = 'paid'
    } else {
      // Admin / staff: pending + 1-hour room block, needs DFO approval
      payload.status = 'pending'
      payload.paymentStatus = 'unpaid'
      payload.approval_status = 'PENDING_DFO_APPROVAL'
      const expiryTime = new Date()
      expiryTime.setHours(expiryTime.getHours() + 12)  // 12-hour DFO approval window
      payload.expiresAt = expiryTime
    }

    // Check room availability (unless admin explicitly bypasses with forceBook flag)
    if (!payload.forceBook && payload.rooms && Array.isArray(payload.rooms) && payload.rooms.length > 0) {
      await expirePendingReservations()

      const availabilityCheck = await checkRoomAvailability(
        payload.rooms,
        payload.checkIn,
        payload.checkOut
      )

      if (!availabilityCheck.available) {
        return res.status(409).json({
          success: false,
          error: 'One or more selected rooms are not available for the chosen dates.',
          conflictingRooms: availabilityCheck.conflictingRooms
        })
      }
    }

    const reservation = new Reservation(payload)
    await reservation.save()

    // DFO auto-confirm: save was pending/unpaid, now immediately set to reserved+paid
    if (role === 'dfo') {
      await Reservation.findByIdAndUpdate(reservation._id, {
        status: 'reserved',
        paymentStatus: 'paid',
        approved_by: payload.createdBy,
        approved_at: new Date(),
      })
    }

    // Trigger Notification if requires DFO approval (admin-created bookings)
    if (reservation.approval_status === 'PENDING_DFO_APPROVAL') {
      try {
        await Notification.create({
          title: 'New Reservation Pending Approval',
          message: `Booking ${reservation.bookingId || '(Pending)'} requires DFO approval.`,
          type: 'NEW_RESERVATION',
          targetRoles: ['superadmin', 'dfo'],
          link: `/approvals/${reservation._id}`
        });
      } catch (notifErr) {
        console.error('Failed to create notification for new reservation', notifErr);
      }
    }

    // Return the final saved state
    const finalReservation = await Reservation.findById(reservation._id).lean()
    res.status(201).json({ success: true, reservation: finalReservation })
  } catch (err) {
    console.error('createReservation error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 }).lean()
    res.json({ success: true, reservations })
  } catch (err) {
    console.error('getReservations error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params
    const reservation = await Reservation.findById(id).lean()
    if (!reservation) return res.status(404).json({ success: false, error: 'Reservation not found' })
    res.json({ success: true, reservation })
  } catch (err) {
    console.error('getReservationById error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// Get bookings for authenticated user
export const getUserBookings = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const userId = req.user._id.toString()

    // Find all reservations for this user
    const reservations = await Reservation.find({
      existingGuest: userId
    })
      .sort({ createdAt: -1 })
      .lean()

    // Manually populate related data since fields are stored as strings
    const populatedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        // Fetch resort details
        let resortData = null
        if (reservation.resort && mongoose.Types.ObjectId.isValid(reservation.resort)) {
          resortData = await Resort.findById(reservation.resort).select('resortName slug').lean()
        }

        // Fetch cottage type details
        let cottageTypesData = []
        if (reservation.cottageTypes && Array.isArray(reservation.cottageTypes)) {
          const validCottageIds = reservation.cottageTypes.filter(id => mongoose.Types.ObjectId.isValid(id))
          if (validCottageIds.length > 0) {
            cottageTypesData = await CottageType.find({
              _id: { $in: validCottageIds }
            }).select('name').lean()
          }
        }

        // Fetch room details with cottage type populated
        let roomsData = []
        if (reservation.rooms && Array.isArray(reservation.rooms)) {
          const validRoomIds = reservation.rooms.filter(id => mongoose.Types.ObjectId.isValid(id))
          if (validRoomIds.length > 0) {
            const rooms = await Room.find({
              _id: { $in: validRoomIds }
            }).select('roomNumber roomId roomName cottageType').lean()

            // Populate cottageType for each room
            roomsData = await Promise.all(
              rooms.map(async (room) => {
                let cottageTypeData = null
                if (room.cottageType && mongoose.Types.ObjectId.isValid(room.cottageType)) {
                  cottageTypeData = await CottageType.findById(room.cottageType).select('name description').lean()
                }
                return {
                  ...room,
                  cottageType: cottageTypeData
                }
              })
            )
          }
        }

        return {
          ...reservation,
          resort: resortData,
          cottageTypes: cottageTypesData,
          rooms: roomsData
        }
      })
    )

    res.json({
      success: true,
      bookings: populatedReservations,
      count: populatedReservations.length
    })
  } catch (err) {
    console.error('getUserBookings error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params
    const payload = { ...req.body }
    // normalize known fields
    if (payload.checkIn) payload.checkIn = new Date(payload.checkIn)
    if (payload.checkOut) payload.checkOut = new Date(payload.checkOut)
    if (payload.reservationDate) payload.reservationDate = new Date(payload.reservationDate)
    if (payload.guests) payload.guests = Number(payload.guests)
    if (payload.extraGuests) payload.extraGuests = Number(payload.extraGuests)
    if (payload.children) payload.children = Number(payload.children)
    if (payload.rooms) payload.numberOfRooms = Number(payload.rooms)
    if (payload.refundPercent) payload.refundPercentage = Number(payload.refundPercent)
    // allow toggling disabled flag
    if (typeof payload.disabled !== 'undefined') payload.disabled = Boolean(payload.disabled)

    // Check pre-update status
    const previousReservation = await Reservation.findById(id).lean()

    const updated = await Reservation.findByIdAndUpdate(id, payload, { new: true }).lean()
    if (!updated) return res.status(404).json({ success: false, error: 'Reservation not found' })

    // 2. Trigger Notifications for status changes (Approval, Rejection, Cancellation)
    if (previousReservation && updated.createdBy) {
      try {
        // Approval
        if (previousReservation.approval_status !== 'APPROVED' && updated.approval_status === 'APPROVED') {
          await Notification.create({
            title: 'Reservation Approved',
            message: `Booking ${updated.bookingId || ''} was approved by DFO.`,
            type: 'RESERVATION_APPROVED',
            targetUser: updated.createdBy,
            link: `/reservation/all`
          });
        }
        // Rejection
        else if (previousReservation.approval_status !== 'REJECTED' && updated.approval_status === 'REJECTED') {
          await Notification.create({
            title: 'Reservation Rejected',
            message: `Booking ${updated.bookingId || ''} was rejected by DFO.`,
            type: 'RESERVATION_REJECTED',
            targetUser: updated.createdBy,
            link: `/reservation/all`
          });
        }
        // Cancellation
        else if (previousReservation.status !== 'cancelled' && updated.status === 'cancelled') {
          await Notification.create({
            title: 'Reservation Cancelled',
            message: `Booking ${updated.bookingId || ''} was cancelled.`,
            type: 'RESERVATION_CANCELLED',
            targetRoles: ['superadmin', 'dfo'],
            link: `/reservation/all`
          });

          // 1. Calculate refund according to policy (Automated)
          const { refundPercentage, refundAmount, diffInHours } = calculateRefundAmount(updated.checkIn, updated.totalPayable || 0);
          console.log(`💰 Refund Logic: ${diffInHours}h before check-in. Percentage: ${refundPercentage}%. Amount: ${refundAmount}`);

          // 2. Update Reservation record with calculated values
          await Reservation.findByIdAndUpdate(id, {
            refundPercentage,
            refundableAmount: refundAmount,
            refundRequestedDateTime: new Date()
          });

          // 3. If online payment exists, initiate BillDesk Refund
          let refundSuccess = false;
          if (updated.paymentStatus === 'paid' && updated.paymentTransactionId) {
            try {
              const paymentTx = await PaymentTransaction.findById(updated.paymentTransactionId);
              if (paymentTx && paymentTx.transactionId && refundAmount > 0) {
                const refundRefNo = "REF" + Math.random().toString(36).slice(2, 10).toUpperCase();
                
                const refundPayload = {
                  mercid: process.env.BILLDESK_MERCID,
                  transactionid: paymentTx.transactionId,
                  amount: refundAmount.toFixed(2),
                  orderid: updated.bookingId,
                  refund_ref_no: refundRefNo
                };

                const billdeskResult = await initiateBilldeskRefund(
                  refundPayload,
                  process.env.BILLDESK_ENCRYPTION_KEY,
                  process.env.BILLDESK_SIGNING_KEY,
                  process.env.KEY_ID,
                  process.env.BILLDESK_CLIENTID
                );

                if (billdeskResult.success) {
                  refundSuccess = true;
                  // Update PaymentTransaction with refund proof
                  await PaymentTransaction.findByIdAndUpdate(paymentTx._id, {
                    refundId: billdeskResult.data.refundid || refundRefNo,
                    refundAmount: refundAmount,
                    refundStatus: 'Success',
                    refundTraceId: billdeskResult.traceId,
                    refundDateTime: new Date(),
                    refundRawResponse: billdeskResult.data
                  });

                  // Update Reservation with amount refunded
                  await Reservation.findByIdAndUpdate(id, {
                    amountRefunded: refundAmount,
                    dateOfRefund: new Date()
                  });
                  console.log(`✅ BillDesk Refund Successful: ${refundAmount} for ${updated.bookingId}`);
                } else {
                  console.error(`❌ BillDesk Refund Failed for ${updated.bookingId}:`, billdeskResult.error);
                  await PaymentTransaction.findByIdAndUpdate(paymentTx._id, {
                    refundStatus: 'Failed',
                    refundRawResponse: billdeskResult.data
                  });
                }
              } else if (!paymentTx) {
                console.warn(`⚠️ Payment transaction not found for refund: ${updated.paymentTransactionId}`);
              } else if (refundAmount === 0) {
                console.log(`ℹ️ Refund amount is 0 according to policy. No BillDesk call made.`);
              }
            } catch (refundErr) {
              console.error(`❌ Automated Refund Error for ${updated.bookingId}:`, refundErr.message);
            }
          } else {
            console.log(`ℹ️ Booking ${updated.bookingId} is either unpaid or offline. Skipping BillDesk refund.`);
          }

          // 4. Derive human-readable resort name
          let resortName = 'VANAVIHARI';
          if (updated.resort) {
            try {
              const resortDoc = await Resort.findById(updated.resort).lean();
              if (resortDoc?.resortName) resortName = resortDoc.resortName.toUpperCase();
            } catch (_) { /* ignore */ }
          }

          // 5. Send guest + admin cancellation SMS (non-blocking)
          sendCancellationSMS(updated, refundAmount, resortName)
            .then(r => console.log(`📱 Cancellation SMS: ${r.success ? '✅ sent' : '❌ failed - ' + r.error}`))
            .catch(err => console.error('❌ Cancellation SMS error:', err.message));
        }
      } catch (notifErr) {
        console.error('Failed to create notification for reservation update', notifErr);
      }
    }

    res.json({ success: true, reservation: updated })
  } catch (err) {
    console.error('updateReservation error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getNextSerial = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Count reservations created today
    const count = await Reservation.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })

    // Next serial is count + 1
    const serial = count + 1

    res.json({ success: true, serial })
  } catch (err) {
    console.error('getNextSerial error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}

// User booking endpoint (requires user authentication) - creates pre-reservation
export const createPublicBooking = async (req, res) => {
  try {
    const payload = { ...req.body }

    // Add authenticated user info
    if (req.user) {
      payload.existingGuest = req.user._id.toString()
      // Store user reference in rawSource for tracking
      if (!payload.rawSource) payload.rawSource = {}
      payload.rawSource.userId = req.user._id.toString()
      payload.rawSource.userEmail = req.user.email
    }

    // Convert numeric and date-like fields
    if (payload.checkIn) payload.checkIn = new Date(payload.checkIn)
    if (payload.checkOut) payload.checkOut = new Date(payload.checkOut)
    if (payload.reservationDate) payload.reservationDate = new Date(payload.reservationDate)
    if (payload.guests) payload.guests = Number(payload.guests)
    if (payload.extraGuests) payload.extraGuests = Number(payload.extraGuests)
    if (payload.children) payload.children = Number(payload.children)
    if (payload.numberOfRooms) payload.numberOfRooms = Number(payload.numberOfRooms)
    if (payload.refundPercentage) payload.refundPercentage = Number(payload.refundPercentage)
    if (payload.roomPrice) payload.roomPrice = Number(String(payload.roomPrice).replace(/[₹,\s]/g, ''))
    if (payload.extraBedCharges) payload.extraBedCharges = Number(String(payload.extraBedCharges).replace(/[₹,\s]/g, ''))
    if (payload.totalPayable) payload.totalPayable = Number(String(payload.totalPayable).replace(/[₹,\s]/g, ''))

    // CRITICAL: Check room availability before creating reservation
    // First, expire any pending reservations that have timed out
    await expirePendingReservations()

    // Check if any of the requested rooms are already booked for overlapping dates
    if (payload.rooms && Array.isArray(payload.rooms) && payload.rooms.length > 0) {
      const availabilityCheck = await checkRoomAvailability(
        payload.rooms,
        payload.checkIn,
        payload.checkOut
      )

      if (!availabilityCheck.available) {
        console.log('Room availability conflict:', {
          requestedRooms: payload.rooms,
          conflictingRooms: availabilityCheck.conflictingRooms,
          checkIn: payload.checkIn,
          checkOut: payload.checkOut
        })

        return res.status(409).json({
          success: false,
          error: 'One or more selected rooms are not available for the chosen dates. Please select different rooms or dates.',
          conflictingRooms: availabilityCheck.conflictingRooms,
          message: 'Room availability conflict detected'
        })
      }
    }

    // Set pending status and expiry (15 minutes)
    payload.status = 'pending'
    payload.paymentStatus = 'unpaid'
    const expiryTime = new Date()
    expiryTime.setMinutes(expiryTime.getMinutes() + 15)
    payload.expiresAt = expiryTime

    // Auto-generate booking ID if not provided
    if (!payload.bookingId) {
      // Get resort first letter
      let resortLetter = 'X'; // Default if no resort
      if (payload.resort) {
        // If resort name is provided in rawSource, use first letter
        const resortName = payload.rawSource?.resortName || '';
        if (resortName && resortName.length > 0) {
          resortLetter = resortName.charAt(0).toUpperCase();
        }
      }

      // Get current date/time
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, '0');

      // Get today's serial
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const count = await Reservation.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      });
      const serial = String(count + 1).padStart(3, '0');

      // Generate booking ID: BV1606402512001 (B + Resort First Letter + DateTime + Serial)
      payload.bookingId = `B${resortLetter}${day}${hour}${minute}${year}${month}${serial}`;
    }

    const reservation = new Reservation(payload)
    await reservation.save()

    // Return reservation without populated fields (just IDs)
    const savedReservation = await Reservation.findById(reservation._id).lean()
    res.status(201).json({ success: true, reservation: savedReservation })
  } catch (err) {
    console.error('createPublicBooking error', err)
    res.status(500).json({ success: false, error: err.message })
  }
}
