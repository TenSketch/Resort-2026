import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TouristBookingFormData {
  // Customer
  fullName: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;

  // Booking
  bookingId: string;
  reservationDate: string;
  visitDate: string;
  visitTime: string;
  touristSpotId: string;
  touristSpotName: string;
  packageType: string;
  adults: string;
  children: string;
  totalVisitors: string;
  guideRequired: string;
  guideLanguage: string;
  transportRequired: string;
  pickupLocation: string;
  reservedFrom: string;
  status: string;

  // Payment
  ticketPrice: string;
  amountPayable: string;
  paymentStatus: string;
  amountPaid: string;
  paymentTransactionId: string;

  // Cancellation
  cancelBookingReason: string;
  cancellationMessage: string;
  refundableAmount: string;
  amountRefunded: string;
  dateOfRefund: string;

  // Notes
  internalNotes: string;
}

const AddTouristBooking = () => {
  const [formData, setFormData] = useState<TouristBookingFormData>({
    fullName: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    

    bookingId: "",
    reservationDate: new Date().toISOString().slice(0,10),
    visitDate: "",
    visitTime: "",
    touristSpotId: "",
    touristSpotName: "",
    packageType: "",
    adults: "1",
    children: "0",
    totalVisitors: "1",
    guideRequired: "No",
    guideLanguage: "",
    transportRequired: "No",
    pickupLocation: "",
    reservedFrom: "Admin",
    status: "Pending",

    ticketPrice: "",
    amountPayable: "",
    paymentStatus: "Pending",
    amountPaid: "0",
    paymentTransactionId: "",

    cancelBookingReason: "",
    cancellationMessage: "",
    refundableAmount: "0",
    amountRefunded: "0",
    dateOfRefund: "",

    internalNotes: "",
  });

  useEffect(() => {
    const total = (parseInt(formData.adults || '0') || 0) + (parseInt(formData.children || '0') || 0);
    setFormData((prev) => ({ ...prev, totalVisitors: String(total) }));
  }, [formData.adults, formData.children]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as any;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateBookingId = () => {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 1000);
    return `TS-${ts}-${rand}`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // basic validation
    if (!formData.fullName || !formData.phone || !formData.visitDate) {
      alert('Please fill required fields: Name, Phone, Visit Date');
      return;
    }

    const submitData = {
      ...formData,
      bookingId: formData.bookingId || generateBookingId(),
      adults: parseInt(formData.adults) || 0,
      children: parseInt(formData.children) || 0,
      totalVisitors: (parseInt(formData.adults) || 0) + (parseInt(formData.children) || 0),
      ticketPrice: parseFloat(formData.ticketPrice) || 0,
      amountPayable: parseFloat(formData.amountPayable) || 0,
      amountPaid: parseFloat(formData.amountPaid) || 0,
      reservationDate: formData.reservationDate || new Date().toISOString().slice(0,10),
    };

    console.log('Tourist Spot Booking:', submitData);
    alert('Tourist spot booking created (demo).');
    handleReset();
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postalCode: "",
    

      bookingId: "",
      reservationDate: new Date().toISOString().slice(0,10),
      visitDate: "",
      visitTime: "",
      touristSpotId: "",
      touristSpotName: "",
      packageType: "",
      adults: "1",
      children: "0",
      totalVisitors: "1",
      guideRequired: "No",
      guideLanguage: "",
      transportRequired: "No",
      pickupLocation: "",
      reservedFrom: "Admin",
      status: "Pending",

      ticketPrice: "",
      amountPayable: "",
      paymentStatus: "Pending",
      amountPaid: "0",
      paymentTransactionId: "",

      cancelBookingReason: "",
      cancellationMessage: "",
      refundableAmount: "0",
      amountRefunded: "0",
      dateOfRefund: "",

      internalNotes: "",
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Add Tourist Spot Booking</h1>
          <p className="text-slate-600">Create a new tourist spot booking (demo)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></Label>
              <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone <span className="text-red-500">*</span></Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address1" className="text-sm font-medium text-slate-700">Address Line 1</Label>
              <Input id="address1" name="address1" value={formData.address1} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address2" className="text-sm font-medium text-slate-700">Address Line 2</Label>
              <Input id="address2" name="address2" value={formData.address2} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-slate-700">City</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-slate-700">State</Label>
              <Input id="state" name="state" value={formData.state} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium text-slate-700">Postal Code</Label>
              <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleChange} />
            </div>
            
          </div>

          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Booking Details</h3>
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
              <Label>Tourist Spot Name</Label>
              <Input name="touristSpotName" value={formData.touristSpotName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Package / Ticket Type</Label>
              <select name="packageType" value={formData.packageType} onChange={handleChange} className="w-full px-4 py-3 border rounded">
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
              <select name="guideRequired" value={formData.guideRequired} onChange={handleChange} className="w-full px-4 py-3 border rounded">
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
              <select name="transportRequired" value={formData.transportRequired} onChange={handleChange} className="w-full px-4 py-3 border rounded">
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
              <select name="reservedFrom" value={formData.reservedFrom} onChange={handleChange} className="w-full px-4 py-3 border rounded">
                <option value="Admin">Admin</option>
                <option value="Online">Online</option>
                <option value="Phone">Phone</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Booking Status</Label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 border rounded">
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Payment</h3>
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
              <select name="paymentStatus" value={formData.paymentStatus} onChange={handleChange} className="w-full px-4 py-3 border rounded">
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

          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Cancellation & Refund</h3>
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

          <div className="space-y-2">
            <Label>Cancellation Message</Label>
            <textarea name="cancellationMessage" value={formData.cancellationMessage} onChange={handleChange} rows={4} className="w-full px-4 py-3 border rounded" />
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <textarea name="internalNotes" value={formData.internalNotes} onChange={handleChange} rows={3} className="w-full px-4 py-3 border rounded" />
          </div>

          <div className="flex gap-4 pt-6">
            <Button type="submit" className="flex-1 bg-slate-800 text-white">Submit</Button>
            <Button type="button" variant="outline" onClick={handleReset} className="flex-1">Reset</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTouristBooking;
