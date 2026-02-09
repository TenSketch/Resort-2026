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
    <div className="min-h-screen p-8">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Add Trek Spot Booking
          </h1>
          <p className="text-slate-600">Create a new trek spot booking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trek Spot Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 border-b border-slate-200 pb-3">
              Trek Spot
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Select Trek Spots <span className="text-red-500">*</span>
                </Label>
                <MultiSelect
                  options={touristSpots.map((spot) => ({
                    label: spot.name,
                    value: spot._id,
                  }))}
                  selected={formData.touristSpotIds}
                  onChange={(values) =>
                    handleMultiSelect("touristSpotIds", values)
                  }
                  placeholder={
                    loading.spots
                      ? "Loading trek spots..."
                      : "Choose Trek Spots"
                  }
                  disabled={loading.spots}
                />
              </div>
            </div>
          </div>

          {/* Booking Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 border-b border-slate-200 pb-3">
              Booking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Visit Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  min={dateLimits.minDate}
                  max={dateLimits.maxDate}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  No. of Guests <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  No. of Cameras
                </Label>
                <Input
                  type="number"
                  name="cameras"
                  value={formData.cameras}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Reservation Date
                </Label>
                <Input
                  type="date"
                  name="reservationDate"
                  value={formData.reservationDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelect("status", value)}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="not-reserved">Not Reserved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Payment Status
                </Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) =>
                    handleSelect("paymentStatus", value)
                  }
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50">
                    <SelectValue placeholder="Select Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Booking ID
                </Label>
                <Input
                  name="bookingId"
                  value={formData.bookingId}
                  readOnly
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* User Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 border-b border-slate-200 pb-3">
              User Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Add Existing User
                </Label>
                <Select
                  value={formData.existingUser}
                  onValueChange={(value) => handleSelect("existingUser", value)}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50">
                    <SelectValue
                      placeholder={
                        loading.users ? "Loading users..." : "Select User"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Address Line 1
                </Label>
                <Input
                  name="address1"
                  value={formData.address1}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Address Line 2
                </Label>
                <Input
                  name="address2"
                  value={formData.address2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  City / District
                </Label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  State / Province
                </Label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Postal Code
                </Label>
                <Input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Country
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleSelect("country", value)}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">
                      United Kingdom
                    </SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Trek Amount Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 border-b border-slate-200 pb-3">
              Trek Amount
            </h3>
            <div className="space-y-4">
              {/* Show per-spot breakdown */}
              {formData.touristSpotIds.length > 0 && touristSpots
                .filter((spot) => formData.touristSpotIds.includes(spot._id))
                .map((spot, index) => {
                  const guests = parseInt(formData.guests) || 0;
                  const cameras = parseInt(formData.cameras) || 0;
                  const spotEntry = guests * (spot.entryFees || 0);
                  const spotCamera = cameras * (spot.cameraFees || 0);
                  const spotTotal = spotEntry + spotCamera;

                  return (
                    <div key={spot._id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <div className="font-medium text-slate-800 mb-3">
                        {index + 1}. {spot.name}
                      </div>
                      
                      {/* Entry fees for this spot */}
                      {spotEntry > 0 && (
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-slate-600">
                            Entry: {guests} Guest{guests > 1 ? 's' : ''} × ₹{(spot.entryFees || 0).toFixed(2)}
                          </span>
                          <span className="font-medium text-slate-800">₹{spotEntry}</span>
                        </div>
                      )}
                      
                      {/* Camera fees for this spot */}
                      {spotCamera > 0 && (
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-slate-600">
                            Camera: {cameras} Camera{cameras > 1 ? 's' : ''} × ₹{(spot.cameraFees || 0).toFixed(2)}
                          </span>
                          <span className="font-medium text-slate-800">₹{spotCamera}</span>
                        </div>
                      )}
                      
                      {/* Spot subtotal */}
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-300">
                        <span className="font-medium text-slate-700">Spot Subtotal</span>
                        <span className="font-semibold text-slate-800">₹{spotTotal}</span>
                      </div>
                    </div>
                  );
                })}

              {/* Grand Total */}
              {pricing.grandTotal > 0 && (
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-base font-semibold text-white">Grand Total</span>
                    <span className="text-xl font-bold text-white">₹{pricing.grandTotal}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {pricing.entryFees > 0 && `Entry: ₹${pricing.entryFees}`}
                    {pricing.entryFees > 0 && pricing.cameraFees > 0 && ' + '}
                    {pricing.cameraFees > 0 && `Camera: ₹${pricing.cameraFees}`}
                  </div>
                </div>
              )}

              {/* No spots selected message */}
              {formData.touristSpotIds.length === 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center text-slate-500">
                  Select trek spots to see pricing
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Submit
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTouristBooking;
