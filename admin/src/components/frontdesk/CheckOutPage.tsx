import React, { useState } from "react";
import bookings from "./testdata.json";

const todayStr = new Date().toISOString().split("T")[0];

const CheckoutPanel = () => {
  const [bookingId, setBookingId] = useState("");
  const [formData, setFormData] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.value.toUpperCase();
    setBookingId(id);

    if (id.trim() === "") {
      setFormData(null);
      setError("");
      return;
    }

    const booking = bookings.find((b) => b.bookingId === id);
    if (!booking) {
      setFormData(null);
      setError("Booking ID not found");
      return;
    }

    if (booking.status === "Checked Out") {
      setError("Guest already checked out");
      setFormData(null);
      return;
    }

    if (booking.isCancelled) {
      setError("Booking was cancelled");
      setFormData(null);
      return;
    }

    const stayComplete = booking.checkOutDate === todayStr;
    const earlyLate =
      new Date(todayStr).getTime() !== new Date(booking.checkOutDate).getTime();

    setFormData({
      ...booking,
      actualCheckOutDate: todayStr,
      earlyLate,
      stayComplete,
    });
    setError("");

    const dues = Math.floor(Math.random() * 1000); // mock dues
    setPendingAmount(dues);
  };

  const handleCheckout = () => {
    if (!formData) return;
    alert(
      `${formData.guestName} checked out.\nPayment: ₹${pendingAmount} via ${paymentMode}\nNotes: ${notes}`
    );
  };

  return (
    <div className="max-w-xl p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4">Guest Check-Out</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Booking ID:</label>
        <input
          value={bookingId}
          onChange={handleBookingChange}
          placeholder="Enter or Scan Booking ID"
          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />

        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      {formData && (
        <div className="mt-6 space-y-4 border rounded-md p-4 bg-gray-50">
          <div className="text-sm space-y-1">
            <p><strong>Guest:</strong> {formData.guestName}</p>
            <p><strong>Room(s):</strong> {formData.rooms.join(", ")}</p>
            <p><strong>Check-In:</strong> {formData.checkInDate}</p>
            <p><strong>Planned Check-Out:</strong> {formData.checkOutDate}</p>
            <p><strong>Today:</strong> {todayStr}</p>
            {formData.earlyLate && (
              <p className="text-orange-600 font-medium">
                ⚠ Guest is checking out {new Date(todayStr) < new Date(formData.checkOutDate) ? "early" : "late"}!
              </p>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <h4 className="font-medium text-base">Payment Summary</h4>
            <p><strong>Paid:</strong> ₹{formData.paidAmount}</p>
            <p><strong>Pending Dues:</strong> ₹{pendingAmount}</p>

            {pendingAmount > 0 && (
              <>
                <label className="block text-sm font-medium">Payment Mode:</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  required
                  className="w-full border border-gray-300 px-2 py-2 rounded-md"
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                </select>

                <label className="block text-sm font-medium">Transaction ID (if any):</label>
                <input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md"
                />
              </>
            )}

            <label className="block text-sm font-medium">Checkout Notes:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional (e.g., 'Lost key - ₹200 collected')"
              className="w-full border border-gray-300 px-3 py-2 rounded-md resize-none"
              rows={3}
            />

            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 text-white py-2 mt-2 rounded-md hover:bg-green-700 transition"
            >
              Confirm Check-Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPanel;
