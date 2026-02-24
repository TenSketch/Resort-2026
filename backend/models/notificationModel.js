import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['NEW_RESERVATION', 'RESERVATION_APPROVED', 'RESERVATION_REJECTED', 'RESERVATION_CANCELLED', 'SYSTEM', 'OTHER'],
        default: 'OTHER'
    },
    // Which roles should see this notification (e.g. ['superadmin', 'dfo'])
    targetRoles: [{
        type: String,
        enum: ['superadmin', 'admin', 'dfo', 'staff']
    }],
    // If targeted at a specific user (e.g. the creator of a reservation)
    targetUser: {
        type: String, // username
    },
    // Link to a specific resource if applicable
    link: {
        type: String,
    },
    // Array of usernames who have marked this as read
    readBy: [{
        type: String
    }],
    // Array of usernames who have dismissed/cleared this notification
    clearedBy: [{
        type: String
    }]
}, { timestamps: true })

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema)

export default Notification
