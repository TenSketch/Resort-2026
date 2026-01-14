import mongoose from 'mongoose'

const logSchema = new mongoose.Schema({
  bookingId: String,
  username: String,
  logType: String,
  logMessage: String,
  logEntryDate: Date,
  raw: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

const Log = mongoose.models.Log || mongoose.model('Log', logSchema)
export default Log
