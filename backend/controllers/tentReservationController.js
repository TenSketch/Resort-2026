import TentReservation from '../models/tentReservationModel.js';
import Tent from '../models/tentModel.js';
import TentSpot from '../models/tentSpotModel.js';

// Generate unique booking ID
const generateBookingId = async () => {
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
  const count = await TentReservation.countDocuments({
    createdAt: { $gte: today, $lt: tomorrow }
  });
  const serial = String(count + 1).padStart(3, '0');

  // Generate booking ID: TENT-VM3015072512001 (TENT- + DateTime + Serial)
  return `TENT-VM${day}${hour}${minute}${year}${month}${serial}`;
};

// Create a new tent reservation
export const createTentReservation = async (req, res) => {
  try {
    const {
      tentSpotId,
      tentSpot: tentSpotFromBody,
      tentIds,
      tents: tentsFromBody,
      tentTypes,
      checkinDate,
      checkoutDate,
      guests,
      children,
      numberOfTents,
      totalPayable: providedTotal,
      tentPrice,
      fullName,
      phone,
      email,
      address1,
      address2,
      city,
      state,
      postalCode,
      country,
      existingGuest,
      status,
      bookingId: providedBookingId,
      reservationDate,
      paymentStatus,
      refundPercentage,
    } = req.body;

    // Support both tentSpotId and tentSpot field names
    const tentSpotIdFinal = tentSpotId || tentSpotFromBody;
    // Support both tentIds and tents field names
    const tentIdsFinal = tentIds || tentsFromBody;

    // Validation
    if (!tentSpotIdFinal || !tentIdsFinal || !tentIdsFinal.length || !checkinDate || !checkoutDate || !fullName || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Verify tent spot exists
    const tentSpot = await TentSpot.findById(tentSpotIdFinal);
    if (!tentSpot || tentSpot.isDisabled) {
      return res.status(404).json({
        success: false,
        error: 'Tent spot not found or disabled'
      });
    }

    // Verify all tents exist and belong to the tent spot
    const tents = await Tent.find({
      _id: { $in: tentIdsFinal },
      tentSpot: tentSpotIdFinal,
      isDisabled: false
    });

    if (tents.length !== tentIdsFinal.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more tents are invalid or not available'
      });
    }

    // Check if tents are available for the requested dates based on tentCount
    if (status !== 'reserved') {
      // For each tent, count existing bookings and compare with tentCount
      for (const tent of tents) {
        const overlappingCount = await TentReservation.countDocuments({
          tentSpot: tentSpotIdFinal,
          status: { $in: ['pending', 'reserved'] },
          tents: tent._id,
          $or: [
            { checkinDate: { $gte: new Date(checkinDate), $lt: new Date(checkoutDate) } },
            { checkoutDate: { $gt: new Date(checkinDate), $lte: new Date(checkoutDate) } },
            { checkinDate: { $lte: new Date(checkinDate) }, checkoutDate: { $gte: new Date(checkoutDate) } }
          ]
        });

        const maxBookings = tent.tentCount || 1;
        const requestedTents = numberOfTents || 1;

        if (overlappingCount + requestedTents > maxBookings) {
          return res.status(409).json({
            success: false,
            error: `Tent ${tent.tentId} is fully booked for the selected dates. Only ${maxBookings - overlappingCount} slot(s) available.`
          });
        }
      }
    }

    // Calculate total payable if not provided
    const calculatedTotal = tents.reduce((sum, tent) => sum + tent.rate, 0);
    const finalTotal = providedTotal || calculatedTotal;

    // Generate booking ID if not provided
    const bookingId = providedBookingId || await generateBookingId();

    // Set expiry time (15 minutes from now) only for pending bookings
    let expiresAt = null;
    if (!status || status === 'pending') {
      expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    }

    // Get user ID from auth middleware if available
    const userId = req.user?._id?.toString() || existingGuest || null;

    // Create reservation
    const reservation = new TentReservation({
      tentSpot: tentSpotIdFinal,
      tentTypes: tentTypes || [],
      tents: tentIdsFinal,
      checkinDate: new Date(checkinDate),
      checkoutDate: new Date(checkoutDate),
      guests: guests || tents.reduce((sum, tent) => sum + tent.noOfGuests, 0),
      children: children || 0,
      numberOfTents: numberOfTents || tentIdsFinal.length,
      bookingId,
      totalPayable: finalTotal,
      tentPrice: tentPrice || calculatedTotal,
      fullName,
      phone,
      email,
      address1,
      address2,
      city,
      state,
      postalCode,
      country,
      existingGuest: userId,
      expiresAt,
      status: status || 'pending',
      paymentStatus: paymentStatus || 'unpaid',
      refundPercentage,
      reservationDate: reservationDate ? new Date(reservationDate) : new Date(),
    });

    await reservation.save();

    // Populate references
    await reservation.populate('tentSpot tents');

    res.status(201).json({
      success: true,
      message: 'Tent reservation created successfully',
      reservation
    });
  } catch (error) {
    console.error('Error creating tent reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tent reservation'
    });
  }
};

// Get all tent reservations
export const getAllTentReservations = async (req, res) => {
  try {
    const { status, tentSpotId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (tentSpotId) query.tentSpot = tentSpotId;

    const reservations = await TentReservation.find(query)
      .populate('tentSpot', 'spotName location')
      .populate('tents', 'tentId tentType rate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reservations
    });
  } catch (error) {
    console.error('Error fetching tent reservations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tent reservations'
    });
  }
};

// Get tent reservation by ID
export const getTentReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await TentReservation.findById(id)
      .populate('tentSpot', 'spotName location contactPerson contactNo')
      .populate('tents', 'tentId tentType rate noOfGuests');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Tent reservation not found'
      });
    }

    res.status(200).json({
      success: true,
      reservation
    });
  } catch (error) {
    console.error('Error fetching tent reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tent reservation'
    });
  }
};

// Get tent reservation by booking ID
export const getTentReservationByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const reservation = await TentReservation.findOne({ bookingId })
      .populate('tentSpot', 'spotName location contactPerson contactNo')
      .populate('tents', 'tentId tentType rate noOfGuests');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Tent reservation not found'
      });
    }

    res.status(200).json({
      success: true,
      reservation
    });
  } catch (error) {
    console.error('Error fetching tent reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tent reservation'
    });
  }
};

// Update tent reservation
export const updateTentReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating certain fields
    delete updateData.bookingId;
    delete updateData.createdAt;

    const reservation = await TentReservation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('tentSpot tents');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Tent reservation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tent reservation updated successfully',
      reservation
    });
  } catch (error) {
    console.error('Error updating tent reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tent reservation'
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentTransactionId, rawSource } = req.body;

    const updateData = { paymentStatus };
    if (paymentTransactionId) updateData.paymentTransactionId = paymentTransactionId;
    if (rawSource) updateData.rawSource = rawSource;

    // If payment is successful, confirm the reservation
    if (paymentStatus === 'paid') {
      updateData.status = 'reserved';
      updateData.expiresAt = null; // Remove expiry
    }

    const reservation = await TentReservation.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('tentSpot tents');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Tent reservation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      reservation
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update payment status'
    });
  }
};

// Cancel tent reservation
export const cancelTentReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundPercentage } = req.body;

    const reservation = await TentReservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Tent reservation not found'
      });
    }

    reservation.status = 'cancelled';
    if (refundPercentage !== undefined) {
      reservation.refundPercentage = refundPercentage;
    }

    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Tent reservation cancelled successfully',
      reservation
    });
  } catch (error) {
    console.error('Error cancelling tent reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel tent reservation'
    });
  }
};

// Delete tent reservation (hard delete)
export const deleteTentReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await TentReservation.findByIdAndDelete(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: 'Tent reservation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tent reservation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tent reservation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete tent reservation'
    });
  }
};

// Expire pending tent reservations (called by cron job)
export const expirePendingTentReservations = async () => {
  try {
    const now = new Date();

    const result = await TentReservation.updateMany(
      {
        status: 'pending',
        paymentStatus: { $ne: 'paid' },
        expiresAt: { $lte: now }
      },
      {
        $set: {
          status: 'not-reserved',
          paymentStatus: 'unpaid'
        }
      }
    );

    console.log(`Expired ${result.modifiedCount} pending tent reservations`);
    return result;
  } catch (error) {
    console.error('Error expiring tent reservations:', error);
    throw error;
  }
};

// Get next serial number for booking ID generation
export const getNextSerial = async (req, res) => {
  try {
    const count = await TentReservation.countDocuments();
    res.json({ success: true, serial: count + 1 });
  } catch (error) {
    console.error('Error getting next serial:', error);
    res.status(500).json({ success: false, error: 'Failed to get next serial' });
  }
};

// Get user's own tent bookings
export const getUserTentBookings = async (req, res) => {
  try {
    // Get user ID from auth middleware
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Find all tent reservations for this user
    const bookings = await TentReservation.find({ existingGuest: userId })
      .populate('tentSpot', 'spotName location')
      .populate('tents', 'tentId name rate')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching user tent bookings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tent bookings'
    });
  }
};
