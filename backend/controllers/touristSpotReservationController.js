import TouristSpotReservation from '../models/touristSpotReservationModel.js'
import TouristSpot from '../models/touristSpotModel.js'
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
        
        payload.status = 'Pending';
        payload.paymentStatus = 'Unpaid';

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
        } else {
            // Fallback for flat structure from checkout page
            payload.user = {
                name: payload.fullName,
                email: payload.email,
                phone: payload.phone,
                address: payload.address1,
                city: payload.city,
                state: payload.state,
                pincode: payload.postalCode,
                country: payload.country
            };
        }

        // Validate required user fields manually if needed, or let Mongoose handle it
        if (!payload.user.name || !payload.user.email || !payload.user.phone) {
            console.error('Missing user details in payload:', payload);
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

        const reservations = await TouristSpotReservation.find(query).sort({ createdAt: -1 }).lean();
        
        // Enrich touristSpots with images from TouristSpot collection
        for (let reservation of reservations) {
            if (reservation.touristSpots && Array.isArray(reservation.touristSpots)) {
                for (let spot of reservation.touristSpots) {
                    if (spot.spotId) {
                        // Fetch the full spot data to get images
                        const fullSpot = await TouristSpot.findById(spot.spotId).select('images').lean();
                        if (fullSpot && fullSpot.images) {
                            spot.images = fullSpot.images;
                        }
                    }
                }
            }
        }
        
        res.json({ success: true, bookings: reservations });
    } catch (err) {
        console.error('Get Tourist Bookings Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const getReservationByBookingId = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const reservation = await TouristSpotReservation.findOne({ bookingId }).lean();
        
        if (!reservation) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // Enrich touristSpots with images from TouristSpot collection
        if (reservation.touristSpots && Array.isArray(reservation.touristSpots)) {
            for (let spot of reservation.touristSpots) {
                if (spot.spotId) {
                    // Fetch the full spot data to get images
                    const fullSpot = await TouristSpot.findById(spot.spotId).select('images').lean();
                    if (fullSpot && fullSpot.images) {
                        spot.images = fullSpot.images;
                    }
                }
            }
        }

        res.json({ success: true, reservation });
    } catch (err) {
        console.error('Get Booking Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}

// Admin-specific booking creation with auto-calculation
export const createAdminReservation = async (req, res) => {
    try {
        const payload = { ...req.body };

        // Generate Booking ID if not provided
        if (!payload.bookingId) {
            payload.bookingId = await generateBookingId();
        }

        // Validate required fields
        if (!payload.touristSpotIds || payload.touristSpotIds.length === 0) {
            return res.status(400).json({ success: false, error: 'At least one trek spot must be selected' });
        }

        if (!payload.visitDate) {
            return res.status(400).json({ success: false, error: 'Visit date is required' });
        }

        if (!payload.guests || payload.guests < 1) {
            return res.status(400).json({ success: false, error: 'At least one guest is required' });
        }

        // Fetch selected tourist spots to get pricing
        const spotIds = payload.touristSpotIds;
        const spots = await TouristSpot.find({ _id: { $in: spotIds } });

        if (spots.length === 0) {
            return res.status(404).json({ success: false, error: 'Selected trek spots not found' });
        }

        // Calculate amounts for each spot
        const guests = parseInt(payload.guests) || 0;
        const cameras = parseInt(payload.cameras) || 0;

        let totalPayable = 0;
        const touristSpots = spots.map(spot => {
            // Calculate entry fees
            const entryAmount = guests * (spot.entryFees || 0);
            
            // Calculate camera fees
            const cameraAmount = cameras * (spot.cameraFees || 0);
            
            const spotTotal = entryAmount + cameraAmount;
            totalPayable += spotTotal;

            return {
                spotId: spot._id.toString(),
                name: spot.name,
                visitDate: new Date(payload.visitDate),
                counts: {
                    guests: guests,
                    cameras: cameras,
                },
                amounts: {
                    entry: entryAmount,
                    camera: cameraAmount,
                    parking: 0,
                    addOns: 0,
                    total: spotTotal
                },
                addOns: []
            };
        });

        // Build user object
        const user = {
            name: payload.fullName || payload.name,
            email: payload.email,
            phone: payload.phone,
            address: payload.address1 || payload.address,
            address2: payload.address2,
            city: payload.city,
            state: payload.state,
            pincode: payload.postalCode || payload.pincode,
            country: payload.country
        };

        // Validate user required fields
        if (!user.name || !user.email || !user.phone) {
            return res.status(400).json({ success: false, error: 'User name, email, and phone are required' });
        }

        // Create reservation object
        const reservationData = {
            bookingId: payload.bookingId,
            touristSpots: touristSpots,
            totalPayable: totalPayable,
            status: payload.status || 'Reserved',
            paymentStatus: payload.paymentStatus || 'Paid',
            paymentTransactionId: payload.paymentTransactionId || '',
            user: user,
            reservationDate: payload.reservationDate ? new Date(payload.reservationDate) : new Date(),
            bookingDate: payload.reservationDate ? new Date(payload.reservationDate) : new Date(),
            reservedFrom: payload.reservedFrom || 'Admin',
            userId: payload.userId && mongoose.Types.ObjectId.isValid(payload.userId) ? payload.userId : null
        };

        // Don't set expiry for admin bookings
        // Only set expiry for pending online bookings
        if (reservationData.status === 'Pending' && reservationData.reservedFrom === 'Online') {
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() + 15);
            reservationData.expiresAt = expiryTime;
        }

        const reservation = new TouristSpotReservation(reservationData);
        await reservation.save();

        res.status(201).json({ 
            success: true, 
            bookingId: reservation.bookingId, 
            reservation,
            message: 'Trek spot booking created successfully'
        });

    } catch (err) {
        console.error('Create Admin Tourist Booking Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
