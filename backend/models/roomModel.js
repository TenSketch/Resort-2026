import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true },
    roomId: String,
    roomName: String,
    status: {
      type: String,
      enum: ['available', 'disabled'],
      default: "available",
    },
    price: { type: Number },
    weekdayRate: { type: Number },
    weekendRate: { type: Number },
    guests: { type: Number },
    extraGuests: { type: Number },
    children: { type: Number },
    bedChargeWeekday: { type: Number },
    bedChargeWeekend: { type: Number },
    resort: { type: mongoose.Schema.Types.ObjectId, ref: "Resort" },
    cottageType: { type: mongoose.Schema.Types.ObjectId, ref: "CottageType" },
    amenities: [String],
    notes: String,
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    // keep a copy of the original import object to avoid losing any fields
    rawSource: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);
export default Room;
