import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import PermissionButton from "@/components/shared/PermissionButton";
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
import { DatePickerField } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { useAdmin } from "@/lib/AdminProvider";

interface Resort {
  _id: string;
  resortName: string;
  slug: string;
  extraGuestCharges?: number;
}

interface Room {
  _id: string;
  roomNumber: string;
  roomId?: string;
  roomName?: string;
  cottageType: string | { _id: string; name?: string };
  resort: string | { _id: string; resortName?: string };
  price?: number;
  weekdayRate?: number;
  weekendRate?: number;
  guests?: number;
  extraGuests?: number;
  children?: number;
}

export default function AddReservationForm() {
  const { isDFO, isSuperAdmin } = useAdmin();
  const [showDFOModal, setShowDFOModal] = useState(false);
  const [formData, setFormData] = useState({
    resort: "",
    cottageTypes: [] as string[],
    rooms: [] as string[],
    checkIn: "",
    checkOut: "",
    guests: "",
    extraGuests: "",
    children: "",
    status: "pending",
    paymentStatus: "unpaid",
    bookingId: "",
    reservationDate: format(new Date(), "yyyy-MM-dd"),
    numberOfRooms: "",
    totalPayable: 0,
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
    roomPrice: 0,
    extraBedCharges: 0,
    referredBy: "",
  });

  const [resorts, setResorts] = useState<Resort[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cottageTypesList, setCottageTypesList] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedResortData, setSelectedResortData] = useState<Resort | null>(
    null,
  );
  const [loading, setLoading] = useState({
    resorts: false,
    cottageTypes: false,
    rooms: false,
    users: false,
  });

  const apiUrl =
    (import.meta.env && import.meta.env.VITE_API_URL) ||
    "http://localhost:5000";

  // Calculate maximum allowed guests based on selected rooms
  const guestLimits = useMemo(() => {
    if (formData.rooms.length === 0) {
      return { maxGuests: 0, maxExtraGuests: 0, maxChildren: 0 };
    }

    const selectedRooms = rooms.filter((room) =>
      formData.rooms.includes(room._id),
    );

    const maxGuests = selectedRooms.length * 2;
    const maxExtraGuests = selectedRooms.length * 1;
    const maxChildren = selectedRooms.length * 2;

    return { maxGuests, maxExtraGuests, maxChildren };
  }, [formData.rooms, rooms]);

  // Calculate days and nights from check-in and check-out
  const bookingDuration = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) {
      return { days: 0, nights: 0 };
    }
    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: diffDays > 0 ? diffDays + 1 : 0,
      nights: diffDays > 0 ? diffDays : 0,
    };
  }, [formData.checkIn, formData.checkOut]);

  // Auto-generate booking ID when resort is selected
  useEffect(() => {
    const generateBookingId = async () => {
      if (!formData.resort) {
        setFormData((prev) => ({ ...prev, bookingId: "" }));
        return;
      }

      try {
        // Get resort details
        const selectedResort = resorts.find((r) => r._id === formData.resort);
        if (!selectedResort) return;

        // Get resort initials (first letter of each word)
        const resortInitials = selectedResort.resortName
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase())
          .join("");

        // Get current date/time
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const year = String(now.getFullYear()).slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, "0");

        // Fetch last booking serial from backend
        const res = await fetch(`${apiUrl}/api/reservations/next-serial`);
        const data = await res.json();
        const serial = String(data.serial || 1).padStart(3, "0");

        // Generate booking ID: BB2109072510008
        const bookingId = `${resortInitials}${day}${hour}${minute}${year}${month}${serial}`;

        setFormData((prev) => ({ ...prev, bookingId }));
      } catch (err) {
        console.error("Error generating booking ID:", err);
      }
    };

    generateBookingId();
  }, [formData.resort, resorts, apiUrl]);

  // Auto-update number of rooms based on selected rooms
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      numberOfRooms: String(formData.rooms.length),
    }));
  }, [formData.rooms]);

  // Fetch selected resort data when resort changes
  useEffect(() => {
    if (!formData.resort) {
      setSelectedResortData(null);
      return;
    }

    const fetchResortData = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/resorts/${formData.resort}`);
        const data = await res.json();
        if (data.resort) {
          setSelectedResortData(data.resort);
        }
      } catch (err) {
        console.error("Error fetching resort data:", err);
      }
    };
    fetchResortData();
  }, [formData.resort, apiUrl]);

  // Calculate min and max dates based on selected resort
  const getDateLimits = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 90);

    // Format dates as YYYY-MM-DD for HTML date input
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Determine min date based on resort
    let minDate = formatDate(today);

    if (selectedResortData) {
      const resortName = selectedResortData.resortName.toLowerCase();
      // Jungle Star, Valamuru: next day onwards
      if (
        resortName.includes("jungle star") ||
        resortName.includes("valamuru")
      ) {
        minDate = formatDate(tomorrow);
      }
      // Vanavihari, Maredumilli: today onwards (default)
    }

    return {
      minDate,
      maxDate: formatDate(maxDate),
    };
  };

  const dateLimits = getDateLimits();

  // Calculate pricing whenever relevant fields change
  useEffect(() => {
    if (formData.rooms.length === 0) {
      setFormData((prev) => ({
        ...prev,
        roomPrice: 0,
        totalPayable: 0,
      }));
      return;
    }

    const selectedRooms = rooms.filter((room) =>
      formData.rooms.includes(room._id),
    );

    // Calculate number of days (User requested 23-24 to be 2 days)
    let days = 1;
    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      const diffTime = checkOutDate.getTime() - checkInDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      days = diffDays > 0 ? diffDays + 1 : 1;
    }

    // Calculate room price (sum of all selected rooms × number of days)
    const roomPricePerDay = selectedRooms.reduce((sum, room) => {
      return sum + (room.price || room.weekdayRate || 0);
    }, 0);
    const roomPrice = roomPricePerDay * days;

    // Calculate extra bed charges
    const extraGuests = parseInt(formData.extraGuests) || 0;
    const extraGuestCharges = selectedResortData?.extraGuestCharges || 0;
    const extraBedCharges = extraGuests * extraGuestCharges * days;

    // Calculate grand total
    const grandTotal = roomPrice + extraBedCharges;

    setFormData((prev) => ({
      ...prev,
      roomPrice: roomPrice,
      extraBedCharges: extraBedCharges,
      totalPayable: grandTotal,
    }));
  }, [
    formData.rooms,
    formData.extraGuests,
    formData.checkIn,
    formData.checkOut,
    rooms,
    selectedResortData,
  ]);

  // Fetch all resorts on mount
  useEffect(() => {
    const fetchResorts = async () => {
      setLoading((prev) => ({ ...prev, resorts: true }));
      try {
        const res = await fetch(`${apiUrl}/api/resorts`);
        const data = await res.json();
        if (data.resorts) {
          setResorts(data.resorts);
        }
      } catch (err) {
        console.error("Error fetching resorts:", err);
      } finally {
        setLoading((prev) => ({ ...prev, resorts: false }));
      }
    };
    fetchResorts();
  }, []);

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading((prev) => ({ ...prev, users: true }));
      try {
        const res = await fetch(`${apiUrl}/api/user/all`);
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

  // Fetch cottage types when resort changes
  useEffect(() => {
    if (!formData.resort) {
      setCottageTypesList([]);
      return;
    }

    const fetchCottageTypes = async () => {
      setLoading((prev) => ({ ...prev, cottageTypes: true }));
      try {
        const res = await fetch(`${apiUrl}/api/cottage-types`);
        const data = await res.json();
        if (data.cottageTypes) {
          // Filter by selected resort
          const filtered = data.cottageTypes.filter((ct: any) => {
            const resortId =
              typeof ct.resort === "string" ? ct.resort : ct.resort?._id;
            return resortId === formData.resort;
          });
          setCottageTypesList(filtered);
        }
      } catch (err) {
        console.error("Error fetching cottage types:", err);
      } finally {
        setLoading((prev) => ({ ...prev, cottageTypes: false }));
      }
    };
    fetchCottageTypes();
  }, [apiUrl, formData.resort]);

  // Fetch rooms when resort changes
  useEffect(() => {
    if (!formData.resort) {
      setRooms([]);
      return;
    }

    const fetchRooms = async () => {
      setLoading((prev) => ({ ...prev, rooms: true }));
      try {
        const res = await fetch(`${apiUrl}/api/rooms`);
        const data = await res.json();
        if (data.rooms) {
          // Filter rooms by selected resort
          const filtered = data.rooms.filter((room: Room) => {
            const resortId =
              typeof room.resort === "string" ? room.resort : room.resort?._id;
            return resortId === formData.resort;
          });
          console.log("Filtered rooms by resort:", filtered);
          setRooms(filtered);
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading((prev) => ({ ...prev, rooms: false }));
      }
    };
    fetchRooms();
  }, [apiUrl, formData.resort]);

  // Filter rooms based on selected cottage types
  const filteredRoomsList = useMemo(() => {
    if (formData.cottageTypes.length === 0) return rooms;
    return rooms.filter((room) => {
      const ctId =
        typeof room.cottageType === "string"
          ? room.cottageType
          : room.cottageType?._id;
      return formData.cottageTypes.includes(ctId || "");
    });
  }, [rooms, formData.cottageTypes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Validate guest limits
    if (name === "guests" || name === "extraGuests" || name === "children") {
      const numValue = parseInt(value) || 0;

      if (name === "guests" && numValue > guestLimits.maxGuests) {
        alert(
          `Maximum ${guestLimits.maxGuests} guests allowed for selected rooms`,
        );
        return;
      }
      if (name === "extraGuests" && numValue > guestLimits.maxExtraGuests) {
        alert(
          `Maximum ${guestLimits.maxExtraGuests} extra guests allowed for selected rooms`,
        );
        return;
      }
      if (name === "children" && numValue > guestLimits.maxChildren) {
        alert(
          `Maximum ${guestLimits.maxChildren} children allowed for selected rooms`,
        );
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSelect = (name: string, value: string) => {
    // Reset dependent fields when parent selection changes
    if (name === "resort") {
      setFormData({ ...formData, resort: value, cottageTypes: [], rooms: [] });
    } else if (name === "existingGuest") {
      // When a user is selected, populate all their details
      const selectedUser = users.find((u) => u._id === value);
      if (selectedUser) {
        // Use setTimeout to ensure country Select component updates properly
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
    if (name === "cottageTypes") {
      setFormData({
        ...formData,
        cottageTypes: values,
        rooms: [],
        guests: "",
        extraGuests: "",
        children: "",
      });
    } else if (name === "rooms") {
      // Clear guest counts when rooms change to avoid invalid values
      setFormData({
        ...formData,
        rooms: values,
        guests: "",
        extraGuests: "",
        children: "",
      });
    }
  };

  const handleReset = () => {
    setFormData({
      resort: "",
      cottageTypes: [],
      rooms: [],
      checkIn: "",
      checkOut: "",
      guests: "",
      extraGuests: "",
      children: "",
      status: "pending",
      paymentStatus: "unpaid",
      bookingId: "",
      reservationDate: format(new Date(), "yyyy-MM-dd"),
      numberOfRooms: "",
      totalPayable: 0,
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
      roomPrice: 0,
      extraBedCharges: 0,
      referredBy: "",
    });
    setRooms([]);
    setSelectedResortData(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // send to backend
    (async () => {
      try {
        const payload = { ...formData };
        if (isDFO || isSuperAdmin) {
          payload.status = "reserved";
          payload.paymentStatus = "paid";
        }

        const apiUrl =
          (import.meta.env && import.meta.env.VITE_API_URL) ||
          "http://localhost:5000";

        // Get admin token from localStorage
        const token = localStorage.getItem("admin_token");
        const headers: any = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${apiUrl}/api/reservations`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        const contentType = res.headers.get("content-type") || "";
        let data: { error?: string } | null = null;
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          // if server returns HTML (e.g. index.html) or plain text, capture it for debugging
          const text = await res.text();
          throw new Error(
            `Unexpected response from server: ${text.slice(0, 200)}`,
          );
        }
        if (!res.ok)
          throw new Error(data?.error || "Failed to save reservation");
        // Success message differs by role
        if (isDFO || isSuperAdmin) {
          alert(
            "Booking created & confirmed! Status: " + payload.status + ", Payment: " + payload.paymentStatus,
          );
        } else {
          setShowDFOModal(true);
        }
        // reset form
        setFormData({
          resort: "",
          cottageTypes: [],
          rooms: [],
          checkIn: "",
          checkOut: "",
          guests: "",
          extraGuests: "",
          children: "",
          status: "pending",
          paymentStatus: "unpaid",
          bookingId: "",
          reservationDate: format(new Date(), "yyyy-MM-dd"),
          numberOfRooms: "",
          totalPayable: 0,
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
          roomPrice: 0,
          extraBedCharges: 0,
          referredBy: "",
        });
        setRooms([]);
        setSelectedResortData(null);
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        alert("Error saving reservation: " + errorMessage);
      }
    })();
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Add Reservation
          </h1>
          <p className="text-slate-600">
            Please fill in all the required details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ROOM DETAILS */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
              Room Details
            </h3>

            {/* Row 1: Resort + Cottage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Select Resort <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.resort}
                  onValueChange={(value) => handleSelect("resort", value)}
                >
                  <SelectTrigger className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-50">
                    <SelectValue
                      placeholder={
                        loading.resorts ? "Loading..." : "Choose Resort"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {resorts.map((resort) => (
                      <SelectItem key={resort._id} value={resort._id}>
                        {resort.resortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Select Cottage <span className="text-red-500">*</span>
                </Label>
                <MultiSelect
                  options={cottageTypesList.map((ct) => ({
                    label: ct.name,
                    value: ct._id,
                  }))}
                  selected={formData.cottageTypes}
                  onChange={(values) =>
                    handleMultiSelect("cottageTypes", values)
                  }
                  placeholder={
                    !formData.resort
                      ? "Select Resort First"
                      : loading.cottageTypes
                        ? "Loading..."
                        : cottageTypesList.length === 0
                          ? "No Cottages Found"
                          : "Choose Cottages"
                  }
                  disabled={!formData.resort}
                />
              </div>
            </div>

            {/* Row 2: Rooms (wide) + No. of Rooms (narrow) */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2 col-span-3">
                <Label className="text-sm font-medium text-slate-700">
                  Choose Rooms <span className="text-red-500">*</span>
                </Label>
                <MultiSelect
                  options={filteredRoomsList.map((room) => ({
                    label: room.roomName || room.roomId || room.roomNumber,
                    value: room._id,
                  }))}
                  selected={formData.rooms}
                  onChange={(values) => handleMultiSelect("rooms", values)}
                  placeholder={
                    !formData.resort
                      ? "Select Resort First"
                      : loading.rooms
                        ? "Loading..."
                        : rooms.length === 0
                          ? "No Rooms Available"
                          : "Choose Rooms"
                  }
                  disabled={!formData.resort}
                />
              </div>
              <div className="space-y-2 col-span-1">
                <Label className="text-sm font-medium text-slate-700">
                  No. of Rooms
                </Label>
                <Input
                  name="numberOfRooms"
                  value={formData.numberOfRooms}
                  readOnly
                  placeholder="Auto"
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm bg-slate-100 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* BOOKING DETAILS - DATES */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
              Booking Details
            </h3>

            {/* Row 1: Dates and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3 space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Check In <span className="text-red-500">*</span>
                </Label>
                <DatePickerField
                  value={formData.checkIn}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      checkIn: val,
                      checkOut:
                        prev.checkOut && val && prev.checkOut <= val
                          ? ""
                          : prev.checkOut,
                    }))
                  }
                  placeholder="Select check-in"
                  minDate={dateLimits.minDate}
                  maxDate={dateLimits.maxDate}
                  disabled={!formData.resort}
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Check Out <span className="text-red-500">*</span>
                </Label>
                <DatePickerField
                  value={formData.checkOut}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, checkOut: val }))
                  }
                  placeholder="Select check-out"
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
                  disabled={!formData.resort || !formData.checkIn}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Days
                  </Label>
                  <Input
                    value={bookingDuration.days}
                    readOnly
                    className="w-full h-11 px-2 border border-slate-300 rounded-sm bg-slate-50 cursor-not-allowed text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Nights
                  </Label>
                  <Input
                    value={bookingDuration.nights}
                    readOnly
                    className="w-full h-11 px-2 border border-slate-300 rounded-sm bg-slate-50 cursor-not-allowed text-center"
                  />
                </div>
              </div>
              <div className="md:col-span-4 space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Reservation Date <span className="text-red-500">*</span>
                </Label>
                <DatePickerField
                  disabled
                  value={formData.reservationDate}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, reservationDate: val }))
                  }
                  placeholder="Reservation date"
                />
              </div>
            </div>

            {/* Row 2: Booking ID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Booking ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="bookingId"
                  value={formData.bookingId}
                  readOnly
                  placeholder="Auto-generated"
                  className="w-full h-11 px-3 border border-slate-300 rounded-sm bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* GUEST COUNTS & STATUS */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
              Guest Counts & Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              <div className="space-y-2" style={{ minWidth: "140px" }}>
                <Label className="text-sm font-medium text-slate-700">
                  Guests{" "}
                  {formData.rooms.length > 0 && (
                    <span className="text-xs text-slate-500">
                      (Max: {guestLimits.maxGuests})
                    </span>
                  )}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  min="0"
                  max={guestLimits.maxGuests || undefined}
                  disabled={formData.rooms.length === 0}
                  placeholder={
                    formData.rooms.length === 0
                      ? "Select rooms"
                      : "Enter guests"
                  }
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
              <div className="space-y-2" style={{ minWidth: "140px" }}>
                <Label className="text-sm font-medium text-slate-700">
                  Extra Guests{" "}
                  {formData.rooms.length > 0 && (
                    <span className="text-xs text-slate-500">
                      (Max: {guestLimits.maxExtraGuests})
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  name="extraGuests"
                  value={formData.extraGuests}
                  onChange={handleChange}
                  min="0"
                  max={guestLimits.maxExtraGuests || undefined}
                  disabled={formData.rooms.length === 0}
                  placeholder={
                    formData.rooms.length === 0 ? "Select rooms" : "Enter extra"
                  }
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
              <div className="space-y-2" style={{ minWidth: "140px" }}>
                <Label className="text-sm font-medium text-slate-700">
                  Children{" "}
                  {formData.rooms.length > 0 && (
                    <span className="text-xs text-slate-500">
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
                  disabled={formData.rooms.length === 0}
                  placeholder={
                    formData.rooms.length === 0
                      ? "Select rooms"
                      : "Enter children"
                  }
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
                <p className="text-xs text-slate-400">Up to 5 years</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  disabled
                  value={formData.status}
                  onValueChange={(value) => handleSelect("status", value)}
                >
                  <SelectTrigger className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50">
                    <SelectValue placeholder="Choose Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="not-reserved">Not Reserved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2 md:col-span-2 xl:col-span-2">
                <Label className="text-sm font-medium text-slate-700">
                  Payment Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  disabled
                  value={formData.paymentStatus}
                  onValueChange={(value) =>
                    handleSelect("paymentStatus", value)
                  }
                >
                  <SelectTrigger className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* USER DETAILS */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
              User Details
            </h3>
          
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Select User
                </Label>
                <Select
                  value={formData.existingGuest}
                  onValueChange={(value) =>
                    handleSelect("existingGuest", value)
                  }
                >
                  <SelectTrigger className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50">
                    <SelectValue
                      placeholder={loading.users ? "Loading..." : "Select User"}
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
                  Guest Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Referred By
                </Label>
                <Input
                  name="referredBy"
                  value={formData.referredBy}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
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
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-8 gap-4">
              <div className="space-y-2 col-span-2 xl:col-span-2">
                <Label className="text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
              <div className="space-y-2 col-span-2 xl:col-span-3">
                <Label className="text-sm font-medium text-slate-700">
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="address1"
                  value={formData.address1}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
              <div className="space-y-2 col-span-2 xl:col-span-3">
                <Label className="text-sm font-medium text-slate-700">
                  Address Line 2
                </Label>
                <Input
                  name="address2"
                  value={formData.address2}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Postal Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleSelect("country", value)}
                >
                  <SelectTrigger className="w-full h-10 px-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-slate-500 bg-slate-50">
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

          {/* AMOUNT */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
              Amount
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Room Price
                </Label>
                <Input
                  value={`₹${formData.roomPrice}`}
                  readOnly
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm bg-slate-100 text-sm text-slate-800 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Extra Guest Charges
                </Label>
                <Input
                  value={`₹${formData.extraBedCharges}`}
                  readOnly
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm bg-slate-100 text-sm text-slate-800 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Grand Total
                </Label>
                <Input
                  value={`₹${formData.totalPayable}`}
                  readOnly
                  className="w-full h-10 px-3 border border-slate-300 rounded-sm bg-slate-100 text-sm font-semibold text-slate-800 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-4 sticky bottom-0 bg-white pb-4 border-t border-slate-200">
            <PermissionButton
              permission="canAddReservations"
              type="submit"
              className="h-10 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-sm transition-colors"
            >
              Submit
            </PermissionButton>
            <Button
              type="button"
              onClick={handleReset}
              className="h-10 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-sm transition-colors"
            >
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* ── DFO Approval Modal ─────────────────────────────── */}
      {showDFOModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onClick={() => setShowDFOModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-300 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-amber-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">
                Reservation Submitted
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                This reservation needs to be approved by{" "}
                <span className="font-semibold text-slate-700">DFO</span>{" "}
                within{" "}
                <span className="font-semibold text-amber-600">1 hour</span>.
                <br />
                After 1 hour, if not approved,{" "}
                <span className="font-medium text-slate-700">
                  rooms will be released
                </span>
                .
              </p>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
              <span className="text-xs text-amber-700 font-medium">
                Rooms are blocked for 12 hour — awaiting DFO approval
              </span>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setShowDFOModal(false)}
              className="w-full mt-1 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

