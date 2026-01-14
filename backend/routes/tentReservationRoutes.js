import express from 'express';
import {
  createTentReservation,
  getAllTentReservations,
  getTentReservationById,
  getTentReservationByBookingId,
  updateTentReservation,
  updatePaymentStatus,
  cancelTentReservation,
  deleteTentReservation,
  getNextSerial,
  getUserTentBookings,
} from '../controllers/tentReservationController.js';
import requirePermission from '../middlewares/requirePermission.js';
import auth from '../middlewares/auth.js';

const tentReservationRouter = express.Router();

// Public routes
tentReservationRouter.get('/booking/:bookingId', getTentReservationByBookingId);
tentReservationRouter.get('/next-serial', getNextSerial);

// User booking endpoints (requires user login)
tentReservationRouter.post('/', auth, createTentReservation);
tentReservationRouter.get('/my-bookings', auth, getUserTentBookings);

// Protected routes (require admin authentication and permissions)
tentReservationRouter.get('/', requirePermission('canView'), getAllTentReservations);
tentReservationRouter.get('/:id', requirePermission('canView'), getTentReservationById);
tentReservationRouter.put('/:id', requirePermission('canEdit'), updateTentReservation);
tentReservationRouter.patch('/:id/payment', updatePaymentStatus);
tentReservationRouter.patch('/:id/cancel', requirePermission('canEdit'), cancelTentReservation);
tentReservationRouter.delete('/:id', requirePermission('canEdit'), deleteTentReservation);

export default tentReservationRouter;
