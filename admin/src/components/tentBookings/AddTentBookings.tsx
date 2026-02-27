import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { DatePickerField } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface TentSpot {
  _id: string;
  spotName: string;
  location: string;
  tentIdPrefix?: string;
}

interface TentType {
  _id: string;
  tentType: string;
  accommodationType: string;
  pricePerDay: number;
}

interface Tent {
  _id: string;
  tentId: string;
  tentSpot: string | { _id: string; spotName?: string };
  tentType: string | { _id: string; tentType?: string };
  noOfGuests: number;
  noOfChildren?: number;
  rate: number;
  tentCount?: number;
  availableSlots?: number;
}

export default function AddTentBookings() {
  const [formData, setFormData] = useState({
    tentSpot: "",
    tentTypes: [] as string[],
    tents: [] as string[],
    checkIn: "",
    checkOut: "",
    guests: "",
    children: "",
    status: "Reserved",
    bookingId: "",
    reservationDate: format(new Date(), "yyyy-MM-dd"),
    numberOfTents: "",
    totalPayable: 0,
    paymentStatus: "Paid",
    refundPercentage: "",
    existingGuest: "",
    fullName: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    tentPrice: 0,
  });

  const [tentSpots, setTentSpots] = useState<TentSpot[]>([]);
  const [tentTypes, setTentTypes] = useState<TentType[]>([]);
  const [tents, setTents] = useState<Tent[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    tentSpots: false,
    tentTypes: false,
    tents: false,
    users: false,
  });

  const apiUrl =
    (import.meta.env && import.meta.env.VITE_API_URL) ||
    "http://localhost:5000";

  const guestLimits = useMemo(() => {
    if (formData.tents.length === 0)
      return { maxGuests: 0, maxChildren: 0, maxTentCount: 0 };
    const selectedTents = tents.filter((tent) =>
      formData.tents.includes(tent._id),
    );
    const maxGuests = selectedTents.reduce(
      (sum, tent) => sum + (tent.noOfGuests || 0),
      0,
    );
    const maxChildren = selectedTents.reduce(
      (sum, tent) => sum + (tent.noOfChildren || tent.noOfGuests || 0),
      0,
    );
    // Max tent count is the minimum availableSlots among selected tents (or tentCount if availableSlots not set)
    const maxTentCount =
      selectedTents.length > 0
        ? Math.min(
            ...selectedTents.map(
              (tent) => tent.availableSlots ?? tent.tentCount ?? 1,
            ),
          )
        : 0;
    return { maxGuests, maxChildren, maxTentCount };
  }, [formData.tents, tents]);

  useEffect(() => {
    const generateBookingId = async () => {
      if (!formData.tentSpot) {
        setFormData((prev) => ({ ...prev, bookingId: "" }));
        return;
      }
      try {
        const selectedSpot = tentSpots.find((s) => s._id === formData.tentSpot);
        if (!selectedSpot) return;
        const prefix =
          selectedSpot.tentIdPrefix ||
          selectedSpot.spotName.substring(0, 2).toUpperCase();
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const year = String(now.getFullYear()).slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const res = await fetch(`${apiUrl}/api/tent-reservations/next-serial`);
        const data = await res.json();
        const serial = String(data.serial || 1).padStart(3, "0");
        setFormData((prev) => ({
          ...prev,
          bookingId: `TENT-${prefix}${day}${hour}${minute}${year}${month}${serial}`,
        }));
      } catch {
        setFormData((prev) => ({
          ...prev,
          bookingId: `TENT-${Date.now().toString(36).toUpperCase()}`,
        }));
      }
    };
    generateBookingId();
  }, [formData.tentSpot, tentSpots, apiUrl]);

  useEffect(() => {
    // Auto-set numberOfTents to 1 when tents are selected, user can change up to maxTentCount
    if (formData.tents.length > 0 && !formData.numberOfTents) {
      setFormData((prev) => ({ ...prev, numberOfTents: "1" }));
    } else if (formData.tents.length === 0) {
      setFormData((prev) => ({ ...prev, numberOfTents: "" }));
    }
  }, [formData.tents]);

  useEffect(() => {
    if (formData.tents.length === 0) {
      setFormData((prev) => ({ ...prev, tentPrice: 0, totalPayable: 0 }));
      return;
    }
    const selectedTents = tents.filter((tent) =>
      formData.tents.includes(tent._id),
    );
    let days = 1;
    if (formData.checkIn && formData.checkOut) {
      const diffTime =
        new Date(formData.checkOut).getTime() -
        new Date(formData.checkIn).getTime();
      days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    const tentPrice =
      selectedTents.reduce((sum, tent) => sum + (tent.rate || 0), 0) * days;
    setFormData((prev) => ({ ...prev, tentPrice, totalPayable: tentPrice }));
  }, [formData.tents, formData.checkIn, formData.checkOut, tents]);

  useEffect(() => {
    const fetchTentSpots = async () => {
      setLoading((prev) => ({ ...prev, tentSpots: true }));
      try {
        const res = await fetch(`${apiUrl}/api/tent-spots`);
        const data = await res.json();
        if (data.success && data.tentSpots) setTentSpots(data.tentSpots);
      } catch (err) {
        console.error("Error fetching tent spots:", err);
      } finally {
        setLoading((prev) => ({ ...prev, tentSpots: false }));
      }
    };
    fetchTentSpots();
  }, [apiUrl]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading((prev) => ({ ...prev, users: true }));
      try {
        const res = await fetch(`${apiUrl}/api/user/all`);
        const data = await res.json();
        if (data.success && data.users) setUsers(data.users);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading((prev) => ({ ...prev, users: false }));
      }
    };
    fetchUsers();
  }, [apiUrl]);

  useEffect(() => {
    if (!formData.tentSpot) {
      setTentTypes([]);
      setTents([]);
      return;
    }
    const fetchTentTypes = async () => {
      setLoading((prev) => ({ ...prev, tentTypes: true }));
      try {
        const res = await fetch(`${apiUrl}/api/tent-types`);
        const data = await res.json();
        if (data.success && data.tentTypes) setTentTypes(data.tentTypes);
      } catch (err) {
        console.error("Error fetching tent types:", err);
      } finally {
        setLoading((prev) => ({ ...prev, tentTypes: false }));
      }
    };
    fetchTentTypes();
  }, [formData.tentSpot, apiUrl]);

  useEffect(() => {
    if (!formData.tentTypes || formData.tentTypes.length === 0) {
      setTents([]);
      return;
    }
    const fetchTents = async () => {
      setLoading((prev) => ({ ...prev, tents: true }));
      try {
        // If dates are selected, use availability API to get tents with available slots
        let url = `${apiUrl}/api/tents?tentSpotId=${formData.tentSpot}`;
        if (formData.checkIn && formData.checkOut) {
          url = `${apiUrl}/api/tents/available?tentSpotId=${formData.tentSpot}&checkinDate=${formData.checkIn}&checkoutDate=${formData.checkOut}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.tents) {
          const filtered = data.tents.filter((tent: Tent) => {
            const tentTypeId =
              typeof tent.tentType === "string"
                ? tent.tentType
                : tent.tentType?._id;
            return formData.tentTypes.includes(tentTypeId);
          });
          setTents(filtered);
        }
      } catch (err) {
        console.error("Error fetching tents:", err);
      } finally {
        setLoading((prev) => ({ ...prev, tents: false }));
      }
    };
    fetchTents();
  }, [
    apiUrl,
    formData.tentTypes,
    formData.tentSpot,
    formData.checkIn,
    formData.checkOut,
  ]);

  const getDateLimits = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 90);
    const formatDate = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { minDate: formatDate(today), maxDate: formatDate(maxDate) };
  };
  const dateLimits = getDateLimits();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "guests" || name === "children") {
      const numValue = parseInt(value) || 0;
      if (name === "guests" && numValue > guestLimits.maxGuests) {
        alert(`Maximum ${guestLimits.maxGuests} guests allowed`);
        return;
      }
      if (name === "children" && numValue > guestLimits.maxChildren) {
        alert(`Maximum ${guestLimits.maxChildren} children allowed`);
        return;
      }
    }
    if (name === "numberOfTents") {
      const numValue = parseInt(value) || 0;
      if (numValue > guestLimits.maxTentCount) {
        alert(
          `Maximum ${guestLimits.maxTentCount} tents available for booking on selected dates`,
        );
        return;
      }
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSelect = (name: string, value: string) => {
    if (name === "tentSpot") {
      setFormData({ ...formData, tentSpot: value, tentTypes: [], tents: [] });
    } else if (name === "existingGuest") {
      const selectedUser = users.find((u) => u._id === value);
      if (selectedUser) {
        setTimeout(() => {
          setFormData({
            ...formData,
            existingGuest: value,
            fullName: selectedUser.name || "",
            phone: selectedUser.phone || "",
            email: selectedUser.email || "",
            address1: selectedUser.address1 || "",
            address2: selectedUser.address2 || "",
            city: selectedUser.city || "",
            state: selectedUser.state || "",
            postalCode: selectedUser.pincode || "",
            country: selectedUser.country || "",
          });
        }, 0);
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMultiSelect = (name: string, values: string[]) => {
    if (name === "tentTypes")
      setFormData({
        ...formData,
        tentTypes: values,
        tents: [],
        guests: "",
        children: "",
      });
    else if (name === "tents")
      setFormData({ ...formData, tents: values, guests: "", children: "" });
  };

  const handleReset = () => {
    setFormData({
      tentSpot: "",
      tentTypes: [],
      tents: [],
      checkIn: "",
      checkOut: "",
      guests: "",
      children: "",
      status: "Reserved",
      bookingId: "",
      reservationDate: format(new Date(), "yyyy-MM-dd"),
      numberOfTents: "",
      totalPayable: 0,
      paymentStatus: "Paid",
      refundPercentage: "",
      existingGuest: "",
      fullName: "",
      phone: "",
      email: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      tentPrice: 0,
    });
    setTentTypes([]);
    setTents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("admin_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        tentSpot: formData.tentSpot,
        tentTypes: formData.tentTypes,
        tents: formData.tents,
        checkinDate: formData.checkIn,
        checkoutDate: formData.checkOut,
        guests: parseInt(formData.guests) || 0,
        children: parseInt(formData.children) || 0,
        status: formData.status,
        bookingId: formData.bookingId,
        reservationDate: formData.reservationDate,
        numberOfTents: parseInt(formData.numberOfTents) || 0,
        totalPayable: formData.totalPayable,
        tentPrice: formData.tentPrice,
        paymentStatus: formData.paymentStatus,
        refundPercentage: formData.refundPercentage
          ? parseFloat(formData.refundPercentage)
          : null,
        existingGuest: formData.existingGuest,
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      };

      const res = await fetch(`${apiUrl}/api/tent-reservations`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to save tent reservation");
      alert("Tent reservation saved successfully");
      handleReset();
    } catch (err) {
      console.error(err);
      alert(
        "Error saving tent reservation: " +
          (err instanceof Error ? err.message : String(err)),
      );
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Add Tent Booking
          </h1>
          <p className="text-slate-600">
            Please fill in all the required details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tent Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">Tent Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Select Tent Spot
                </Label>
                <Select
                  value={formData.tentSpot}
                  onValueChange={(value) => handleSelect("tentSpot", value)}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                    <SelectValue
                      placeholder={
                        loading.tentSpots ? "Loading..." : "Choose Tent Spot"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tentSpots.map((spot) => (
                      <SelectItem key={spot._id} value={spot._id}>
                        {spot.spotName} - {spot.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Tent Type
                </Label>
                <MultiSelect
                  options={tentTypes.map((tt) => ({
                    label: `${tt.tentType} - ${tt.accommodationType}`,
                    value: tt._id,
                  }))}
                  selected={formData.tentTypes}
                  onChange={(values) => handleMultiSelect("tentTypes", values)}
                  placeholder={
                    !formData.tentSpot
                      ? "Select Tent Spot First"
                      : loading.tentTypes
                        ? "Loading..."
                        : "Choose Tent Types"
                  }
                  disabled={!formData.tentSpot}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Choose Tents
                </Label>
                <MultiSelect
                  options={tents.map((tent) => ({
                    label:
                      tent.availableSlots !== undefined
                        ? `${tent.tentId} (${tent.availableSlots} available)`
                        : tent.tentId,
                    value: tent._id,
                  }))}
                  selected={formData.tents}
                  onChange={(values) => handleMultiSelect("tents", values)}
                  placeholder={
                    formData.tentTypes.length === 0
                      ? "Select Tent Type First"
                      : loading.tents
                        ? "Loading..."
                        : "Choose Tents"
                  }
                  disabled={formData.tentTypes.length === 0}
                />
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">
              Booking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="col-span-full grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Check In
                  </Label>
                  <DatePickerField
                    value={formData.checkIn}
                    onChange={(val) => handleSelect("checkIn", val)}
                    minDate={dateLimits.minDate}
                    maxDate={dateLimits.maxDate}
                    disabled={!formData.tentSpot}
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Check Out
                  </Label>
                  <DatePickerField
                    value={formData.checkOut}
                    onChange={(val) => handleSelect("checkOut", val)}
                    minDate={
                      formData.checkIn
                        ? (() => {
                            const d = new Date(formData.checkIn);
                            d.setDate(d.getDate() + 1);
                            return d.toISOString().split("T")[0];
                          })()
                        : dateLimits.minDate
                    }
                    maxDate={dateLimits.maxDate}
                    disabled={!formData.tentSpot || !formData.checkIn}
                    className="bg-slate-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Guests{" "}
                  {formData.tents.length > 0 && (
                    <span className="text-slate-500">
                      (Max: {guestLimits.maxGuests})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  min="0"
                  max={guestLimits.maxGuests || undefined}
                  disabled={formData.tents.length === 0}
                  placeholder={
                    formData.tents.length === 0
                      ? "Select tents first"
                      : "Enter guests"
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Children (under 5){" "}
                  {formData.tents.length > 0 && (
                    <span className="text-slate-500">
                      (Max: {guestLimits.maxChildren})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  name="children"
                  value={formData.children}
                  onChange={handleChange}
                  min="0"
                  max={guestLimits.maxChildren || undefined}
                  disabled={formData.tents.length === 0}
                  placeholder={
                    formData.tents.length === 0
                      ? "Select tents first"
                      : "Enter children"
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
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
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                    <SelectValue placeholder="Choose Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reserved">Reserved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Not-Reserved">Not Reserved</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                  placeholder="Auto-generated"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Reservation Date
                </Label>
                <DatePickerField
                  value={formData.reservationDate}
                  onChange={(val) => handleSelect("reservationDate", val)}
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  No. of Tents{" "}
                  {formData.tents.length > 0 &&
                    guestLimits.maxTentCount > 0 && (
                      <span className="text-slate-500">
                        (Max: {guestLimits.maxTentCount})
                      </span>
                    )}
                </Label>
                <Input
                  type="number"
                  name="numberOfTents"
                  value={formData.numberOfTents}
                  onChange={handleChange}
                  min="1"
                  max={guestLimits.maxTentCount || undefined}
                  disabled={formData.tents.length === 0}
                  placeholder={
                    formData.tents.length === 0
                      ? "Select tents first"
                      : "Enter number of tents"
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Refund %
                </Label>
                <Input
                  type="number"
                  name="refundPercentage"
                  value={formData.refundPercentage}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
                />
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
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">User Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Add Existing User
                </Label>
                <Select
                  value={formData.existingGuest}
                  onValueChange={(value) =>
                    handleSelect("existingGuest", value)
                  }
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
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
                  Full Name
                </Label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Phone
                </Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
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
                  <SelectTrigger className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">Tent Amount</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Tent Price
                </Label>
                <p className="text-sm text-slate-800 mt-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                  ₹{formData.tentPrice}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Grand Total
                </Label>
                <p className="text-sm text-slate-800 mt-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50">
                  ₹{formData.totalPayable}
                </p>
              </div>
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
}
