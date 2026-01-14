import mongoose from "mongoose";

const billdeskWebhookSchema = new mongoose.Schema({
  // Raw webhook data
  rawPayload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Parsed data (if available)
  orderid: String,
  transactionid: String,
  auth_status: String,
  amount: String,
  
  // Request metadata
  headers: mongoose.Schema.Types.Mixed,
  method: String,
  ip: String,
  
  // Processing status
  processed: {
    type: Boolean,
    default: false
  },
  
  processedAt: Date,
  
  error: String
}, {
  timestamps: true
});

const BilldeskWebhook = mongoose.model("BilldeskWebhook", billdeskWebhookSchema);

export default BilldeskWebhook;
