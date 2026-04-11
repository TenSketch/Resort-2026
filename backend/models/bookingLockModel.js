import mongoose from 'mongoose'

const bookingLockSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  reservationId: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index - document deleted at this time
  }
}, { timestamps: true })

// CRITICAL: Unique index on roomId and date to prevent double booking
bookingLockSchema.index({ roomId: 1, date: 1 }, { unique: true })

const BookingLock = mongoose.models.BookingLock || mongoose.model('BookingLock', bookingLockSchema)
export default BookingLock
