import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    lastVerificationEmailSent: { type: Date }, // Track last resend time
    // Password reset
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    lastPasswordResetEmailSent: { type: Date }, // Track last reset email time
    // Personal details for settings page
    dob: { type: Date },
    nationality: { type: String },
    address1: { type: String },
    address2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String },
    profileCompleted: { type: Boolean, default: false },
    // Registration tracking
    registrationDate: { type: Date, default: Date.now },
    registerThrough: { type: String, default: 'frontend' } // 'frontend' or 'admin'
}, { minimize: false })

const userModel = mongoose.models.user || mongoose.model('user', userSchema)

export default userModel