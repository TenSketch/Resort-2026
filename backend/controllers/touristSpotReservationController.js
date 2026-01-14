import TouristSpotReservation from '../models/touristSpotReservationModel.js'
import mongoose from 'mongoose'

// Utility to generate Booking ID
const generateBookingId = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const count = await TouristSpotReservation.countDocuments({
        createdAt: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
        }
    });
    // Format: TS-YYMMDD-SEQ (e.g., TS-231215-001)
    const seq = String(count + 1).padStart(3, '0');
    return `TS-${dateStr}-${seq}`;
};

export const createReservation = async (req, res) => {
    try {
        const payload = { ...req.body };

        // Generate Booking ID
        if (!payload.bookingId) {
            payload.bookingId = await generateBookingId();
        }

        // Set expiry for pending bookings (e.g., 15 mins)
        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 15);
        payload.expiresAt = expiryTime;
        
        payload.status = 'pending';
        payload.paymentStatus = 'unpaid';

        // Map frontend customer data to user field
        if (payload.customer) {
            payload.user = {
               name: payload.customer.gname,
               email: payload.customer.gemail,
               phone: payload.customer.gphone,
               address: payload.customer.gaddress,
               city: payload.customer.gcity,
               state: payload.customer.gstate,
               pincode: payload.customer.gpincode,
               country: payload.customer.gcountry
            };
        }

        // Map spots data if needed (assuming frontend sends structurally compatible 'spots' array)
        if (payload.spots) {
            payload.touristSpots = payload.spots.map(s => ({
                spotId: s.id,
                name: s.name,
                visitDate: new Date(), // Or from payload if selected
                counts: s.counts,
                amounts: s.breakdown, // Mapping breakdown to amounts
                addOns: s.addOns
            }));
            payload.totalPayable = payload.total;
        }

        // Associate with logged-in user if token present
        if (req.user) {
            payload.userId = req.user._id;
        }

        const reservation = new TouristSpotReservation(payload);
        await reservation.save();

        res.status(201).json({ success: true, bookingId: reservation.bookingId, reservation });

    } catch (err) {
        console.error('Create Tourist Booking Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const getReservations = async (req, res) => {
    try {
        const query = {};
        
        // If user is requesting their own bookings
        if (req.user && !req.admin) {
             query.userId = req.user._id;
        }

        const reservations = await TouristSpotReservation.find(query).sort({ createdAt: -1 });
        res.json({ success: true, reservations });
    } catch (err) {
        console.error('Get Tourist Bookings Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const getReservationByBookingId = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const reservation = await TouristSpotReservation.findOne({ bookingId });
        
        if (!reservation) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        res.json({ success: true, reservation });
    } catch (err) {
        console.error('Get Booking Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}
