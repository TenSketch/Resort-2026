import React, { useState } from "react";
import bookings from "./testdata.json";

const CheckInPanel = () => {
  const [formData, setFormData] = useState<any>({
    bookingId: "",
    guestName: "",
    phone: "",
    checkInDate: "",
    checkOutDate: "",
    rooms: [],
    numberOfGuests: 0,
    guestIdType: "",
    guestIdNumber: "",
    guestIdFile: null,
    isAlreadyCheckedIn: false,
    isCancelled: false,
  });
  const [bookingError, setBookingError] = useState("");

  const detectIdType = (id: string): string => {
    if (/^\d{12}$/.test(id)) return "Aadhaar";
    if (/^[A-Z]\d{7}$/.test(id)) return "Passport";
    if (/^[A-Z]{2}\d{2}\s?\d{11}$/.test(id)) return "Driving License";
    return "Unknown";
  };

  const handleBookingIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setFormData((prev: any) => ({
      ...prev,
      bookingId: id,
    }));

    const booking = bookings.find((b) => b.bookingId === id);

    if (booking) {
      setFormData((prev: any) => ({
        ...prev,
        ...booking,
      }));
      setBookingError("");
    } else {
      setFormData((prev: any) => ({
        ...prev,
        guestName: "",
        phone: "",
        checkInDate: "",
        checkOutDate: "",
        rooms: [],
        numberOfGuests: 0,
        isAlreadyCheckedIn: false,
        isCancelled: false,
      }));
      setBookingError(id ? "Booking ID not found" : "");
    }
  };

  const handleGuestIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value;
    setFormData((prev: any) => ({
      ...prev,
      guestIdNumber: id,
      guestIdType: detectIdType(id),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      alert("Only JPEG, PNG or PDF allowed.");
      return;
    }
    setFormData((prev: any) => ({
      ...prev,
      guestIdFile: file,
    }));
  };

  const handleCheckIn = () => {
    if (formData.isCancelled) return alert("Cannot check-in: Booking is cancelled.");
    if (formData.isAlreadyCheckedIn) return alert("Guest already checked in.");
    if (!formData.guestIdNumber || !formData.guestIdFile) {
      return alert("Please provide ID number and upload valid ID.");
    }

    alert(`✅ ${formData.guestName} checked in successfully.`);
  };

  return (
    <div className="max-w-xl p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4">Guest Check-In</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Booking ID:</label>
        <input
          value={formData.bookingId}
          onChange={handleBookingIdChange}
          placeholder="Enter Booking ID"
          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />
        {bookingError && <p className="text-red-500 text-sm mt-1">{bookingError}</p>}
      </div>

      {formData.guestName && (
        <div className="mt-6 space-y-4 border rounded-md p-4 bg-gray-50">
          <div className="text-sm space-y-1">
            <p><strong>Guest:</strong> {formData.guestName}</p>
            <p><strong>Phone:</strong> {formData.phone}</p>
            <p><strong>Check-In:</strong> {formData.checkInDate}</p>
            <p><strong>Check-Out:</strong> {formData.checkOutDate}</p>
            <p><strong>No. of Guests:</strong> {formData.numberOfGuests}</p>
            <p><strong>Room(s):</strong> {formData.rooms.join(", ")}</p>
            {formData.isAlreadyCheckedIn && (
              <p className="text-orange-600 font-medium">⚠ Guest already checked in</p>
            )}
            {formData.isCancelled && (
              <p className="text-red-600 font-medium">❌ Booking cancelled</p>
            )}
          </div>

          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium">Guest ID Number:</label>
              <input
                value={formData.guestIdNumber}
                onChange={handleGuestIdChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-md"
              />
              {formData.guestIdType && (
                <p className="text-sm text-gray-500 mt-1">Detected: {formData.guestIdType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Upload ID (JPEG/PDF):</label>
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileUpload}
                className="w-full border border-gray-300 px-3 py-2 rounded-md"
              />
            </div>

            <button
              onClick={handleCheckIn}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
            >
              Confirm Check-In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPanel;
