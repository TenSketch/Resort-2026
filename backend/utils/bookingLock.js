import BookingLock from '../models/bookingLockModel.js'

/**
 * Generate an array of dates between checkIn and checkOut (exclusive of checkOut)
 * @param {Date} checkIn 
 * @param {Date} checkOut 
 * @returns {Array<string>} Array of date strings in YYYY-MM-DD format
 */
const getDatesInRange = (checkIn, checkOut) => {
  const dates = []
  const curr = new Date(checkIn)
  const end = new Date(checkOut)
  
  // Normalize to midnight for consistent comparisons
  curr.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  while (curr < end) {
    dates.push(curr.toISOString().split('T')[0])
    curr.setDate(curr.getDate() + 1)
  }
  return dates
}

/**
 * Attempt to lock rooms for a specific time range
 * @param {Array<string>} roomIds 
 * @param {Date} checkIn 
 * @param {Date} checkOut 
 * @param {string} reservationId 
 * @param {Date} expiresAt - When the lock should automatically expire
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const lockRooms = async (roomIds, checkIn, checkOut, reservationId, expiresAt) => {
  if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
    return { success: true }
  }

  const dates = getDatesInRange(checkIn, checkOut)
  const lockDocs = []

  for (const roomId of roomIds) {
    for (const date of dates) {
      lockDocs.push({
        roomId,
        date,
        reservationId,
        expiresAt
      })
    }
  }

  try {
    // Attempt to insert all locks. 
    // { ordered: true } will stop at the first duplicate key error
    await BookingLock.insertMany(lockDocs, { ordered: true })
    return { success: true }
  } catch (err) {
    // If it's a duplicate key error (11000), someone else booked these dates
    if (err.code === 11000) {
      // Rollback: delete any locks we just managed to create for this reservation
      await BookingLock.deleteMany({ reservationId })
      return { 
        success: false, 
        error: 'Double booking conflict: One or more rooms were just booked by someone else.' 
      }
    }
    throw err
  }
}

/**
 * Release all locks associated with a reservation
 * @param {string} reservationId 
 */
export const releaseLocks = async (reservationId) => {
  await BookingLock.deleteMany({ reservationId: String(reservationId) })
}
