import mongoose from 'mongoose'

const touristSpotReservationSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  
  // Snapshotted details of the booked spots (in case prices change later)
  touristSpots: [{
    spotId: { type: String, required: true },
    name: String,
    visitDate: Date,
    counts: {
        adults: { type: Number, default: 0 },
        children: { type: Number, default: 0 },
        vehicles: { type: Number, default: 0 },
        cameras: { type: Number, default: 0 },
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
    default: 'pending', 
    enum: ['pending', 'reserved', 'cancelled', 'failed'] 
  },
  
  paymentStatus: { 
    type: String, 
    default: 'unpaid', 
    enum: ['unpaid', 'paid', 'failed', 'pending', 'refunded'] 
  },
  
  paymentTransactionId: String, // Link to PaymentTransaction model
  
  // User Details
  user: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },

  bookingDate: { type: Date, default: Date.now },
  expiresAt: Date, // For pending bookings cleanup
  
  // Metadata for payment gateway
  rawSource: { type: mongoose.Schema.Types.Mixed },
  
  // Link to registered user if applicable
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, { timestamps: true })

const TouristSpotReservation = mongoose.models.TouristSpotReservation || mongoose.model('TouristSpotReservation', touristSpotReservationSchema)
export default TouristSpotReservation
