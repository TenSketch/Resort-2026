import webpush from 'web-push';
import PushSubscription from '../models/pushSubscriptionModel.js';

// Setup web-push
const setupWebPush = () => {
    webpush.setVapidDetails(
        'mailto:info@vanavihari.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
};

// Subscribe a user
export const subscribeUser = async (req, res) => {
    try {
        const { subscription, username, role } = req.body;

        if (!subscription || !username || !role) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if subscription already exists for this endpoint
        let existingSub = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });

        if (existingSub) {
            existingSub.username = username;
            existingSub.role = role;
            existingSub.subscription = subscription;
            await existingSub.save();
        } else {
            const newSub = new PushSubscription({
                username,
                role,
                subscription
            });
            await newSub.save();
        }

        res.status(201).json({ success: true, message: 'Subscription saved successfully' });
    } catch (error) {
        console.error('Error in subscribeUser:', error);
        res.status(500).json({ success: false, message: 'Server error while subscribing' });
    }
};

// Unsubscribe a user
export const unsubscribeUser = async (req, res) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({ success: false, message: 'Endpoint is required' });
        }

        await PushSubscription.findOneAndDelete({ 'subscription.endpoint': endpoint });

        res.status(200).json({ success: true, message: 'Subscription removed successfully' });
    } catch (error) {
        console.error('Error in unsubscribeUser:', error);
        res.status(500).json({ success: false, message: 'Server error while unsubscribing' });
    }
};

// Get VAPID Public Key
export const getVapidPublicKey = (req, res) => {
    res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

// Send Push Notification Helper
export const sendPushNotification = async (targetRoles, title, message, url = '/') => {
    setupWebPush();

    try {
        // Find all subscriptions for targeted roles
        const subscriptions = await PushSubscription.find({ role: { $in: targetRoles } });

        const payload = JSON.stringify({
            notification: {
                title,
                body: message,
                icon: '/assets/logo.png', // Fallback icon
                badge: '/assets/favicon.ico',
                data: {
                    url: url
                }
            }
        });

        const pushPromises = subscriptions.map(sub => 
            webpush.sendNotification(sub.subscription, payload)
                .catch(err => {
                    console.error('Error sending push notification to', sub.username, err);
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Subscription expired or no longer valid, delete it
                        return PushSubscription.findByIdAndDelete(sub._id);
                    }
                })
        );

        await Promise.all(pushPromises);
    } catch (error) {
        console.error('Error in sendPushNotification helper:', error);
    }
};
