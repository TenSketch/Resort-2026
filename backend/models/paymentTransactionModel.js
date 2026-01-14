import mongoose from 'mongoose'

const paymentTransactionSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, index: true },
  reservationId: { type: String, required: true },
  bdOrderId: String, // BillDesk order ID
  amount: { type: Number, required: true },
  currency: { type: String, default: '356' }, // INR
  status: { 
    type: String, 
    enum: ['initiated', 'success', 'failed', 'pending', 'cancelled'],
    default: 'initiated'
  },
  transactionId: String, // BillDesk transaction ID
  authStatus: String, // BillDesk auth status code
  traceId: String,
  timestamp: String,
  encryptedRequest: String, // Store for debugging
  decryptedResponse: mongoose.Schema.Types.Mixed, // Store full response
  errorMessage: String,
  customerDetails: {
    name: String,
    phone: String,
    email: String
  },
  bookingType: { 
    type: String, 
    enum: ['room', 'tent', 'tourist'],
    default: 'room'
  }
}, { timestamps: true })

const PaymentTransaction = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', paymentTransactionSchema)
export default PaymentTransaction
