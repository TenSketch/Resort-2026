import mongoose from 'mongoose';

const tentReservationSchema = new mongoose.Schema({
  tentSpot: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TentSpot',
    required: true 
  },
  tentTypes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TentType'
  }],
  tents: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tent',
    required: true 
  }],
  checkinDate: { 
    type: Date, 
    required: true 
  },
  checkoutDate: { 
    type: Date, 
    required: true 
  },
  guests: { 
    type: Number, 
    required: true 
  },
  children: {
    type: Number,
    default: 0
  },
  numberOfTents: {
    type: Number,
    default: 1
  },
  status: { type: String, default: 'pending', enum: ['pending', 'reserved', 'cancelled', 'not-reserved'] },
  bookingId: { 
    type: String, 
    unique: true,
    required: true 
  },
  reservationDate: { 
    type: Date, 
    default: Date.now 
  },
  totalPayable: { 
    type: Number, 
    required: true 
  },
  tentPrice: {
    type: Number,
    default: 0
  },
  paymentStatus: { 
    type: String, 
    default: 'unpaid', 
    enum: ['unpaid', 'paid', 'refunded'] 
  },
  refundPercentage: Number,
  
  // Guest Information
  fullName: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  address1: String,
  address2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  existingGuest: String,
  
  // Payment Information
  paymentTransactionId: String,
  
  // Expiry for pending bookings (15 mins)
  expiresAt: Date,
  
  // Raw payment response
  rawSource: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// Index for efficient queries
tentReservationSchema.index({ tentSpot: 1, checkinDate: 1, checkoutDate: 1 });
tentReservationSchema.index({ bookingId: 1 });
tentReservationSchema.index({ status: 1 });
tentReservationSchema.index({ expiresAt: 1 });

const TentReservation = mongoose.models.TentReservation || mongoose.model('TentReservation', tentReservationSchema);
export default TentReservation;
