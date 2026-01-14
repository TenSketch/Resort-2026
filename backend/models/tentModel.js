import mongoose from "mongoose";

const tentSchema = new mongoose.Schema(
  {
    tentSpot: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "TentSpot",
      required: true 
    },
    tentType: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "TentType",
      required: true 
    },
    noOfGuests: { type: Number, required: true },
    noOfChildren: { type: Number, default: 0 },
    tentId: { type: String, required: true, unique: true },
    rate: { type: Number, required: true },
    tentCount: { type: Number, required: true, default: 1 },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    isDisabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Tent = mongoose.models.Tent || mongoose.model("Tent", tentSchema);
export default Tent;
