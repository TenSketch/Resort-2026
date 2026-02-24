import Notification from '../models/notificationModel.js'

export const getNotifications = async (req, res) => {
    try {
        const { username, role } = req.admin

        // Fetch notifications that:
        // 1. Are targeted to this user specifically OR targeted to this user's role
        // 2. AND are NOT cleared by this user

        const notifications = await Notification.find({
            $and: [
                {
                    $or: [
                        { targetUser: username },
                        { targetRoles: role },
                        { targetRoles: { $exists: false }, targetUser: null } // System-wide fallback
                    ]
                },
                { clearedBy: { $ne: username } }
            ]
        }).sort({ createdAt: -1 }).limit(50) // Return the latest 50

        // Compute 'read' status for each notification for the current user
        const formattedNotifications = notifications.map(n => {
            const isRead = n.readBy.includes(username)
            return {
                ...n.toObject(),
                read: isRead
            }
        })

        res.status(200).json(formattedNotifications)
    } catch (error) {
        console.error('Error fetching notifications:', error)
        res.status(500).json({ message: 'Error fetching notifications' })
    }
}

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.admin;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { $addToSet: { readBy: username } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const { username, role } = req.admin;

        await Notification.updateMany(
            {
                $or: [
                    { targetUser: username },
                    { targetRoles: role }
                ],
                readBy: { $ne: username }
            },
            { $addToSet: { readBy: username } }
        );

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const clearNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.admin;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { $addToSet: { clearedBy: username } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification cleared' });
    } catch (error) {
        console.error('Error clearing notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const clearAllNotifications = async (req, res) => {
    try {
        const { username, role } = req.admin;

        // We only clear notifications that are currently visible to the user
        await Notification.updateMany(
            {
                $or: [
                    { targetUser: username },
                    { targetRoles: role }
                ],
                clearedBy: { $ne: username }
            },
            { $addToSet: { clearedBy: username } }
        );

        res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error('Error clearing all notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
