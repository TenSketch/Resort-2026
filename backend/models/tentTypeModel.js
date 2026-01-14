import mongoose from "mongoose";

const tentTypeSchema = new mongoose.Schema(
  {
    tentType: { type: String, required: true },
    accommodationType: { type: String, required: true },
    tentBase: { type: String, required: true },
    dimensions: { type: String, default: "" },
    brand: { type: String, default: "" },
    features: { type: String, default: "" },
    pricePerDay: { type: Number, required: true },
    amenities: [{ type: String }],
    isDisabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const TentType = mongoose.models.TentType || mongoose.model("TentType", tentTypeSchema);
export default TentType;
