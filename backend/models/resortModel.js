import mongoose from 'mongoose'

const resortSchema = new mongoose.Schema({
  resortName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  contactPersonName: String,
  contactNumber: String,
  email: String,
  address: {
    line1: String,
    line2: String,
    cityDistrict: String,
    stateProvince: String,
    postalCode: String,
    country: String,
  },
  website: String,
  foodProviding: String,
  foodDetails: String,
  roomIdPrefix: String,
  extraGuestCharges: Number,
  supportNumber: String,
  logo: {
    url: String,
    public_id: String,
  },
}, { timestamps: true })

const Resort = mongoose.models.Resort || mongoose.model('Resort', resortSchema)
export default Resort
