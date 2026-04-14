import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'dfo', 'staff'],
        required: true
    },
    subscription: {
        endpoint: {
            type: String,
            required: true,
            unique: true
        },
        expirationTime: {
            type: Number,
            default: null
        },
        keys: {
            p256dh: {
                type: String,
                required: true
            },
            auth: {
                type: String,
                required: true
            }
        }
    }
}, { timestamps: true });

const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;
