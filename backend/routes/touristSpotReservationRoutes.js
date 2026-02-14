import express from 'express';
import { createReservation, getReservations, getReservationByBookingId, createAdminReservation } from '../controllers/touristSpotReservationController.js';
import auth from '../middlewares/auth.js';
import adminAuth from '../middlewares/adminAuth.js';

const router = express.Router();

// User booking endpoint (requires user login) - matches tent booking pattern
router.post('/', auth, createReservation); 

// Admin routes
router.post('/admin-create', adminAuth, createAdminReservation);
router.get('/all-bookings', adminAuth, getReservations);

// Authenticated routes
router.get('/my-bookings', auth, getReservations);
router.get('/:bookingId', auth, getReservationByBookingId);

export default router;
