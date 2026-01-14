import mongoose from "mongoose";

const tentSpotSchema = new mongoose.Schema(
  {
    spotName: { type: String, required: true },
    tentIdPrefix: { type: String, required: true }, // NEW: Tent ID Prefix (e.g., "VM", "VH")
    location: { type: String, required: true },
    slugUrl: { type: String, required: true, unique: true },
    contactPerson: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: true },
    rules: { type: String, default: "" },
    accommodation: { type: String, required: true },
    foodAvailable: { 
      type: String, 
      enum: ['Yes', 'No', 'On Request'],
      required: true 
    },
    kidsStay: { 
      type: String, 
      enum: ['Allowed', 'Not Allowed', 'With Supervision'],
      required: true 
    },
    womenStay: { 
      type: String, 
      enum: ['Allowed', 'Not Allowed'],
      required: true 
    },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    isDisabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Helper function to generate slug
const generateSlug = (spotName, location) => {
  return `${spotName}-${location}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Pre-save middleware to auto-generate slugUrl if not provided
tentSpotSchema.pre('save', function(next) {
  if (!this.slugUrl && this.spotName && this.location) {
    this.slugUrl = generateSlug(this.spotName, this.location);
  }
  next();
});

const TentSpot = mongoose.models.TentSpot || mongoose.model("TentSpot", tentSpotSchema);
export default TentSpot;
