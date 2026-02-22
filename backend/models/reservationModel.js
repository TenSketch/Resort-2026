import mongoose from 'mongoose'

const reservationSchema = new mongoose.Schema({
  resort: mongoose.Schema.Types.Mixed, // Can be ObjectId or String for flexibility
  cottageTypes: [String], // Array of cottage type IDs
  rooms: [String], // Array of room IDs (can be ObjectId strings, roomId, or roomName)
  checkIn: Date,
  checkOut: Date,
  guests: Number,
  extraGuests: Number,
  children: Number,
  status: { type: String, default: 'pending', enum: ['pending', 'reserved', 'cancelled', 'not-reserved'] },
  bookingId: String,
  reservationDate: Date,
  numberOfRooms: Number,
  totalPayable: Number,
  paymentStatus: { type: String, default: 'unpaid', enum: ['unpaid', 'paid', 'refunded'] },
  refundPercentage: Number,
  existingGuest: String,
  fullName: String,
  phone: String,
  email: String,
  address1: String,
  address2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  roomPrice: Number,
  extraBedCharges: Number,
  paymentTransactionId: String,
  paymentTransactionDateTime: Date,
  reservedFrom: String, // Website | Phone | Walk-in | Email | Agent | Other
  foodPreference: String,
  expiresAt: Date, // For pre-reserved bookings (15 mins expiry)
  rawSource: { type: mongoose.Schema.Types.Mixed },
  // Cancellation & Refund
  cancelBookingReason: String,
  cancellationMessage: String,
  refundRequestedDateTime: Date,
  refundableAmount: Number,
  amountRefunded: Number,
  dateOfRefund: Date,
  // DFO Approval Workflow
  approval_status: {
    type: String,
    enum: ['PENDING_DFO_APPROVAL', 'APPROVED', 'REJECTED'],
    default: null,
  },
  approved_by: String,        // Username of the DFO who approved/rejected
  approved_at: Date,          // Timestamp of approval/rejection
  discount: Number,           // Discount applied by DFO (optional)
  approval_remarks: String,   // DFO remarks (mandatory on reject)
  createdBy: String,          // Username of admin who created the booking
}, { timestamps: true })

const Reservation = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema)
export default Reservation
