import mongoose from 'mongoose'

const touristSpotReservationSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },

  // Snapshotted details of the booked spots (in case prices change later)
  touristSpots: [{
    spotId: { type: String, required: true },
    name: String,
    visitDate: Date,
    counts: {
      guests: { type: Number, default: 0 }, // Total guests
      cameras: { type: Number, default: 0 },
      // Legacy fields for backward compatibility
      adults: { type: Number, default: 0 },
      children: { type: Number, default: 0 },
      vehicles: { type: Number, default: 0 },
      twoWheelers: { type: Number, default: 0 },
      fourWheelers: { type: Number, default: 0 }
    },
    amounts: {
      entry: Number,
      parking: Number,
      camera: Number,
      addOns: Number,
      total: Number
    },
    addOns: [String] // Array of add-on IDs or names
  }],

  totalPayable: { type: Number, required: true },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Reserved', 'Not-Reserved', 'Cancelled', 'Failed']
  },

  paymentStatus: {
    type: String,
    default: 'Unpaid',
    enum: ['Unpaid', 'Paid', 'Failed', 'Pending', 'Refunded', 'Cancelled']
  },

  paymentTransactionId: String, // Link to PaymentTransaction model

  // User Details
  user: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    address2: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },

  reservationDate: { type: Date, default: Date.now }, // When booking was made
  bookingDate: { type: Date, default: Date.now }, // Alias for reservationDate
  expiresAt: Date, // For pending bookings cleanup

  // Admin-specific fields
  reservedFrom: { type: String, default: 'Online', enum: ['Online', 'Admin', 'Phone', 'Walk-in'] },
  internalNotes: String,

  // Metadata for payment gateway
  rawSource: { type: mongoose.Schema.Types.Mixed },

  // Link to registered user if applicable
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true })

const TouristSpotReservation = mongoose.models.TouristSpotReservation || mongoose.model('TouristSpotReservation', touristSpotReservationSchema)
export default TouristSpotReservation
