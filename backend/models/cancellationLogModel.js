import mongoose from 'mongoose'

const cancellationLogSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: false // Optional if user is not logged in or doesn't exist
  },
  refundAmount: {
    type: Number,
    required: true,
    default: 0
  },
  refundStatus: {
    type: String,
    required: true,
    enum: ['NotInitiated', 'Initiated', 'Success', 'Failed', 'Pending'],
    default: 'Pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

const CancellationLog = mongoose.models.CancellationLog || mongoose.model('CancellationLog', cancellationLogSchema)

export default CancellationLog
