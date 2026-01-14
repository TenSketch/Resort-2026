import express from 'express'
import { createReservation, getReservations, updateReservation, getNextSerial, createPublicBooking, getUserBookings } from '../controllers/reservationController.js'
import requirePermission from '../middlewares/requirePermission.js'
import auth from '../middlewares/auth.js'

const router = express.Router()

// User booking endpoint (requires user login) - must be before admin routes
router.post('/book', auth, createPublicBooking)

// Get user's own bookings (requires user login)
router.get('/my-bookings', auth, getUserBookings)

// Get next serial number for booking ID generation
router.get('/next-serial', getNextSerial)
// creating reservations requires canAddReservations (admin only)
router.post('/', requirePermission('canAddReservations'), createReservation)
router.get('/', getReservations)
// updates require editing rights (canEdit)
router.patch('/:id', requirePermission('canEdit'), updateReservation)

export default router
