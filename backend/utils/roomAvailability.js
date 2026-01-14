import Reservation from '../models/reservationModel.js'

/**
 * Check if rooms are available for the given date range
 * @param {Array<string>} roomIds - Array of room IDs to check
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @param {string} excludeReservationId - Optional reservation ID to exclude from check (for updates)
 * @returns {Promise<{available: boolean, conflictingRooms: Array<string>, conflictingReservations: Array}>}
 */
export const checkRoomAvailability = async (roomIds, checkIn, checkOut, excludeReservationId = null) => {
  if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
    return { available: true, conflictingRooms: [], conflictingReservations: [] }
  }

  const query = {
    rooms: { $in: roomIds },
    status: { $in: ['pending', 'pre-reserved', 'reserved'] },
    paymentStatus: { $in: ['paid', 'unpaid'] },
    $or: [
      // New booking starts during existing booking
      {
        checkIn: { $lte: checkIn },
        checkOut: { $gt: checkIn }
      },
      // New booking ends during existing booking
      {
        checkIn: { $lt: checkOut },
        checkOut: { $gte: checkOut }
      },
      // New booking completely contains existing booking
      {
        checkIn: { $gte: checkIn },
        checkOut: { $lte: checkOut }
      }
    ]
  }

  // Exclude specific reservation if provided (useful for updates)
  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId }
  }

  const overlappingReservations = await Reservation.find(query).lean()

  if (overlappingReservations.length > 0) {
    const bookedRoomIds = [...new Set(overlappingReservations.flatMap(r => r.rooms))]
    const conflictingRooms = roomIds.filter(roomId => bookedRoomIds.includes(roomId))
    
    return {
      available: false,
      conflictingRooms,
      conflictingReservations: overlappingReservations
    }
  }

  return { available: true, conflictingRooms: [], conflictingReservations: [] }
}

/**
 * Get available rooms for a resort and date range
 * @param {string} resortId - Resort ID
 * @param {Date} checkIn - Check-in date
 * @param {Date} checkOut - Check-out date
 * @param {Array<string>} allRoomIds - All room IDs for the resort
 * @returns {Promise<Array<string>>} - Array of available room IDs
 */
export const getAvailableRooms = async (resortId, checkIn, checkOut, allRoomIds) => {
  const bookedReservations = await Reservation.find({
    resort: resortId,
    status: { $in: ['pending', 'pre-reserved', 'reserved'] },
    paymentStatus: { $in: ['paid', 'unpaid'] },
    $or: [
      {
        checkIn: { $lte: checkIn },
        checkOut: { $gt: checkIn }
      },
      {
        checkIn: { $lt: checkOut },
        checkOut: { $gte: checkOut }
      },
      {
        checkIn: { $gte: checkIn },
        checkOut: { $lte: checkOut }
      }
    ]
  }).lean()

  const bookedRoomIds = [...new Set(bookedReservations.flatMap(r => r.rooms))]
  const availableRoomIds = allRoomIds.filter(roomId => !bookedRoomIds.includes(roomId))

  return availableRoomIds
}
