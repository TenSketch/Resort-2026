import mongoose from 'mongoose'

const touristSpotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: String,
  entryFees: { type: Number, default: 0 },
  parking2W: { type: Number, default: 0 },
  parking4W: { type: Number, default: 0 },
  cameraFees: { type: Number, default: 0 },
  description: String,
  address: String,
  mapEmbed: String,
  images: [
    {
      url: String,
      public_id: String,
    }
  ],
}, { timestamps: true })

const TouristSpot = mongoose.models.TouristSpot || mongoose.model('TouristSpot', touristSpotSchema)
export default TouristSpot
