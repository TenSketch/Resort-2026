import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";

interface TouristSpot {
  _id: string;
  name: string;
  slug: string;
  entryFees: number;
  parking2W: number;
  parking4W: number;
  cameraFees: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

interface FormData {
  // Trek Spot
  touristSpotIds: string[];

  // Booking Details
  visitDate: string;
  guests: string;
  cameras: string;
  reservationDate: string;
  status: string;
  paymentStatus: string;
  bookingId: string;

  // User Details
  existingUser: string;
  fullName: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;

  // Internal
}

const AddTouristBooking = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [formData, setFormData] = useState<FormData>({
    touristSpotIds: [],
    visitDate: "",
    guests: "1",
    cameras: "0",
    reservationDate: new Date().toISOString().slice(0, 10),
    status: "reserved",
    paymentStatus: "paid",
    bookingId: "",
    existingUser: "",
    fullName: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const [touristSpots, setTouristSpots] = useState<TouristSpot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState({ spots: false, users: false });
  const [pricing, setPricing] = useState({
    entryFees: 0,
    cameraFees: 0,
    grandTotal: 0,
    perGuestRate: 0,
    perCameraRate: 0,
  });

  // Fetch tourist spots on mount
  useEffect(() => {
    const fetchSpots = async () => {
      setLoading((prev) => ({ ...prev, spots: true }));
      try {
        const res = await fetch(`${apiUrl}/api/touristspots`);
        const data = await res.json();
        if (data.touristSpots) {
          setTouristSpots(data.touristSpots);
        }
      } catch (err) {
        console.error("Error fetching tourist spots:", err);
      } finally {
        setLoading((prev) => ({ ...prev, spots: false }));
      }
    };
    fetchSpots();
  }, [apiUrl]);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading((prev) => ({ ...prev, users: true }));
      try {
        const token = localStorage.getItem("admin_token");
        const res = await fetch(`${apiUrl}/api/user/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.users) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading((prev) => ({ ...prev, users: false }));
      }
    };
    fetchUsers();
  }, [apiUrl]);

  // Auto-generate booking ID when form loads
  useEffect(() => {
    const generateBookingId = () => {
      const now = new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      return `TS-${dateStr}-${random}`;
    };
    setFormData((prev) => ({ ...prev, bookingId: generateBookingId() }));
  }, []);

  // Calculate pricing whenever relevant fields change
  useEffect(() => {
    if (formData.touristSpotIds.length === 0) {
      setPricing({ entryFees: 0, cameraFees: 0, grandTotal: 0, perGuestRate: 0, perCameraRate: 0 });
      return;
    }

    const selectedSpots = touristSpots.filter((spot) =>
      formData.touristSpotIds.includes(spot._id)
    );

    const guests = parseInt(formData.guests) || 0;
    const cameras = parseInt(formData.cameras) || 0;

    let totalEntry = 0;
    let totalCamera = 0;
    let avgGuestRate = 0;
    let avgCameraRate = 0;

    selectedSpots.forEach((spot) => {
      totalEntry += guests * (spot.entryFees || 0);
      totalCamera += cameras * (spot.cameraFees || 0);
      avgGuestRate += (spot.entryFees || 0);
      avgCameraRate += (spot.cameraFees || 0);
    });

    // Calculate average rates across all selected spots
    if (selectedSpots.length > 0) {
      avgGuestRate = avgGuestRate / selectedSpots.length;
      avgCameraRate = avgCameraRate / selectedSpots.length;
    }

    const grandTotal = totalEntry + totalCamera;

    setPricing({
      entryFees: totalEntry,
      cameraFees: totalCamera,
      grandTotal: grandTotal,
      perGuestRate: avgGuestRate,
      perCameraRate: avgCameraRate,
    });
  }, [
    formData.touristSpotIds,
    formData.guests,
    formData.cameras,
    touristSpots,
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: string) => {
    if (name === "existingUser") {
      const selectedUser = users.find((u) => u._id === value);
      if (selectedUser) {
        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            existingUser: value,
            fullName: selectedUser.name || "",
            phone: selectedUser.phone || "",
            email: selectedUser.email || "",
            address1: selectedUser.address1 || "",
            address2: selectedUser.address2 || "",
            city: selectedUser.city || "",
            state: selectedUser.state || "",
            postalCode: selectedUser.pincode || "",
            country: selectedUser.country || "",
          }));
        }, 0);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelect = (name: string, values: string[]) => {
    setFormData((prev) => ({ ...prev, [name]: values }));
  };

  const handleReset = () => {
    setFormData({
      touristSpotIds: [],
      visitDate: "",
      guests: "1",
      cameras: "0",
      reservationDate: new Date().toISOString().slice(0, 10),
      status: "reserved",
      paymentStatus: "paid",
      bookingId: "",
      existingUser: "",
      fullName: "",
      phone: "",
      email: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    });
    setPricing({ entryFees: 0, cameraFees: 0, grandTotal: 0, perGuestRate: 0, perCameraRate: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.touristSpotIds.length === 0) {
      alert("Please select at least one trek spot");
      return;
    }
    if (!formData.visitDate) {
      alert("Please select a visit date");
      return;
    }
    if (!formData.fullName || !formData.phone) {
      alert("Please fill in user name and phone");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      
      // Prepare data with userId if an existing user was selected
      const submitData = {
        touristSpotIds: formData.touristSpotIds,
        visitDate: formData.visitDate,
        guests: formData.guests,
        cameras: formData.cameras,
        reservationDate: formData.reservationDate,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        bookingId: formData.bookingId,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        userId: formData.existingUser || null, // Map existingUser to userId
      };
      
      const res = await fetch(`${apiUrl}/api/trek-reservations/admin-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      alert(`Trek spot booking created successfully! Booking ID: ${data.bookingId}`);
      handleReset();
    } catch (err) {
      console.error("Error creating booking:", err);
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Get date limits
  const getDateLimits = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 90);

    return {
      minDate: tomorrow.toISOString().split("T")[0],
      maxDate: maxDate.toISOString().split("T")[0],
    };
  };

  const dateLimits = getDateLimits();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Add Trek Spot Booking
          </h1>
          <p className="text-slate-600">Create a new trek spot booking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg md:text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2 md:pb-3 mb-4 md:mb-6">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></Label>
              <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
          </div>

          <h3 className="text-lg md:text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2 md:pb-3 mb-4 md:mb-6 mt-6 md:mt-8">Booking Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Visit Date <span className="text-red-500">*</span></Label>
              <Input type="date" name="visitDate" value={formData.visitDate} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Visit Time/Slot</Label>
              <Input name="visitTime" value={formData.visitTime} onChange={handleChange} placeholder="e.g., 09:00 - 11:00" />
            </div>
            <div className="space-y-2">
              <Label>Trek Spot Name</Label>
              <Input name="touristSpotName" value={formData.touristSpotName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Package / Ticket Type</Label>
              <select name="packageType" value={formData.packageType} onChange={handleChange} className="w-full h-10 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm">
                <option value="">-- Select Package --</option>
                <option value="adult">Adult</option>
                <option value="child">Child</option>
                <option value="group">Group</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Adults</Label>
              <Input type="number" min="0" name="adults" value={formData.adults} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Children</Label>
              <Input type="number" min="0" name="children" value={formData.children} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Guide Required</Label>
              <select name="guideRequired" value={formData.guideRequired} onChange={handleChange} className="w-full h-10 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Guide Language</Label>
              <Input name="guideLanguage" value={formData.guideLanguage} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Transport Required</Label>
              <select name="transportRequired" value={formData.transportRequired} onChange={handleChange} className="w-full h-10 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pickup Location</Label>
              <Input name="pickupLocation" value={formData.pickupLocation} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Reserved From</Label>
              <select name="reservedFrom" value={formData.reservedFrom} onChange={handleChange} className="w-full h-10 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm">
                <option value="Admin">Admin</option>
                <option value="Online">Online</option>
                <option value="Phone">Phone</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Booking Status</Label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full h-10 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm">
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <h3 className="text-lg md:text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2 md:pb-3 mb-4 md:mb-6 mt-6 md:mt-8">Payment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Ticket Price (₹)</Label>
              <Input type="number" min="0" step="0.01" name="ticketPrice" value={formData.ticketPrice} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Amount Payable (₹)</Label>
              <Input type="number" min="0" step="0.01" name="amountPayable" value={formData.amountPayable} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="w-full h-10 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount Paid (₹)</Label>
              <Input type="number" min="0" step="0.01" name="amountPaid" value={formData.amountPaid} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Payment Transaction ID</Label>
              <Input name="paymentTransactionId" value={formData.paymentTransactionId} onChange={handleChange} />
            </div>
          </div>

          <h3 className="text-lg md:text-xl font-semibold text-slate-800 border-b border-slate-200 pb-2 md:pb-3 mb-4 md:mb-6 mt-6 md:mt-8">Cancellation & Refund</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Cancel Booking Reason</Label>
              <Input name="cancelBookingReason" value={formData.cancelBookingReason} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Refundable Amount (₹)</Label>
              <Input type="number" min="0" step="0.01" name="refundableAmount" value={formData.refundableAmount} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Amount Refunded (₹)</Label>
              <Input type="number" min="0" step="0.01" name="amountRefunded" value={formData.amountRefunded} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Date of Refund</Label>
              <Input type="date" name="dateOfRefund" value={formData.dateOfRefund} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <Label>Cancellation Message</Label>
            <textarea name="cancellationMessage" value={formData.cancellationMessage} onChange={handleChange} rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50" />
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <textarea name="internalNotes" value={formData.internalNotes} onChange={handleChange} rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
            <Button type="submit" className="w-full sm:flex-1 bg-slate-800 text-white py-6 sm:py-3">Submit</Button>
            <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:flex-1 py-6 sm:py-3">Reset</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTouristBooking;
