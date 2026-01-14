import mongoose from 'mongoose'

const cottageTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  amenities: [String],
  resort: { type: mongoose.Schema.Types.ObjectId, ref: 'Resort', required: true },
  isDisabled: { type: Boolean, default: false },
}, { timestamps: true })

const CottageType = mongoose.models.CottageType || mongoose.model('CottageType', cottageTypeSchema)
export default CottageType
