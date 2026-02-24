import express from 'express'
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
} from '../controllers/notificationController.js'
import adminAuth from '../middlewares/adminAuth.js'

const router = express.Router()

// All notification routes require authentication
router.use(adminAuth)

router.get('/', getNotifications)
router.put('/mark-all-read', markAllAsRead)
router.put('/:id/read', markAsRead)
router.put('/clear-all', clearAllNotifications)
router.put('/:id/clear', clearNotification)

export default router
