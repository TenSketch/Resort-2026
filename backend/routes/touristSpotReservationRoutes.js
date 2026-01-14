import express from 'express';
import { createReservation, getReservations, getReservationByBookingId } from '../controllers/touristSpotReservationController.js';
import verifyToken from '../middlewares/auth.js'; // Assuming you have an auth middleware

import adminAuth from '../middlewares/adminAuth.js';

const router = express.Router();

// Public route (optionally protected if you require login for booking)
router.post('/book', verifyToken, createReservation); 

// Authenticated routes
router.get('/my-bookings', verifyToken, getReservations);
router.get('/all-bookings', adminAuth, getReservations); // Admin route
router.get('/:bookingId', verifyToken, getReservationByBookingId);

export default router;
