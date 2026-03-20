import { fetchWithAuth } from '@/lib/apiUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface TouristBooking {
    id: string;
    bookingId: string;
    fullName: string;
    phone: string;
    email: string;
    touristSpotName?: string;
    packageType?: string;
    visitDate?: string;
    visitTime?: string;
    adults?: number;
    children?: number;
    totalVisitors?: number;
    guideRequired?: string;
    transportRequired?: string;
    pickupLocation?: string;
    reservedFrom?: string;
    reservationDate?: string;
    status?: string;
    amountPayable?: number;
    paymentStatus?: string;
    amountPaid?: number;
    paymentTransactionId?: string;
    cancelBookingReason?: string;
    cancellationMessage?: string;
    refundableAmount?: number;
    amountRefunded?: number;
    dateOfRefund?: string;
    internalNotes?: string;
}

export const getAllTouristBookings = async (): Promise<TouristBooking[]> => {
    try {
        const response = await fetchWithAuth(`${API_URL}/tourist-booking/all-bookings`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch bookings');
        }

        const data = await response.json();
        const reservations = data.reservations || [];

        // Map backend data to frontend interface
        return reservations.map((r: any) => ({
            id: r._id,
            bookingId: r.bookingId,
            fullName: r.user?.name || 'N/A',
            phone: r.user?.phone || 'N/A',
            email: r.user?.email || 'N/A',
            touristSpotName: r.touristSpots?.map((s: any) => s.name).join(', ') || 'N/A',
            packageType: 'Standard', // Placeholder as package type isn't explicit in backend model yet
            visitDate: r.touristSpots?.[0]?.visitDate || r.createdAt,
            visitTime: r.touristSpots?.[0]?.visitTime || 'N/A', // If you add time later
            adults: r.touristSpots?.reduce((sum: number, s: any) => sum + (s.counts?.adults || 0), 0) || 0,
            children: r.touristSpots?.reduce((sum: number, s: any) => sum + (s.counts?.children || 0), 0) || 0,
            totalVisitors: (r.touristSpots?.reduce((sum: number, s: any) => sum + (s.counts?.adults || 0), 0) || 0) + (r.touristSpots?.reduce((sum: number, s: any) => sum + (s.counts?.children || 0), 0) || 0),
            guideRequired: r.guideRequired ? 'Yes' : 'No', // Assuming these fields exist or will exist
            transportRequired: r.transportRequired ? 'Yes' : 'No',
            reservedFrom: 'Website',
            reservationDate: r.createdAt,
            status: r.status,
            amountPayable: r.totalPayable,
            paymentStatus: r.paymentStatus,
            amountPaid: r.paymentStatus === 'paid' ? r.totalPayable : 0,
            paymentTransactionId: r.rawSource?.transactionId || r.paymentTransactionId,
            internalNotes: r.internalNotes
        }));
    } catch (error) {
        console.error('Error fetching tourist bookings:', error);
        throw error;
    }
};
