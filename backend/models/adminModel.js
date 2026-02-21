import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  // role: superadmin | admin | dfo | staff
  role: { type: String, enum: ['superadmin', 'admin', 'dfo', 'staff'], default: 'admin' },
  // permissions object gives fine-grained control per user
  permissions: {
    canEdit: { type: Boolean, default: false },
    canDisable: { type: Boolean, default: false },
    canAddReservations: { type: Boolean, default: false },
    canAddGuests: { type: Boolean, default: false },
    canViewDownload: { type: Boolean, default: true },
    canExport: { type: Boolean, default: true },
    visiblePages: [{ type: String }], // Array of page IDs the user can access
  }
}, { timestamps: true })

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)

export default Admin
