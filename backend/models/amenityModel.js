import mongoose from 'mongoose'

const amenitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

const Amenity = mongoose.models.Amenity || mongoose.model('Amenity', amenitySchema)
export default Amenity
