import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

// Required plugins
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.js";
import "datatables.net-columncontrol";

// Styles
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
import "datatables.net-columncontrol-dt/css/columnControl.dataTables.css";

import "datatables.net-fixedcolumns";
import "datatables.net-fixedcolumns-dt/css/fixedColumns.dataTables.css";

// Using backend data instead of local JSON
import { useEffect, useRef, useState } from "react";
import { usePermissions, useAdmin } from "@/lib/AdminProvider";
// Removed small modals (edit & confirm disable)
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageLoader from "@/components/shared/PageLoader";
import { DatePickerField } from "@/components/ui/date-picker";

DataTable.use(DT);
(DT.ext.pager as any).numbers_length = 3;

interface Reservation {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  children: number;
  extraGuests: number;
  numberOfRooms: number;
  totalGuests: number;
  noOfDays: number;
  noOfNights: number;
  resort: string;
  resortName: string;
  cottageTypes: string[];
  cottageTypeNames: string[];
  rooms: string[];
  roomNames: string[];
  bookingId: string;
  status: string;
  reservationDate: string;
  paymentStatus: string;
  refundPercentage: number;
  roomPrice: number;
  extraBedCharges: number;
  totalPayable: number;
  existingGuest: string;
  reservedFrom: string;
  foodPreference: string;
  paymentTransactionId: string;
  paymentTransactionDateTime: string;
  cancelBookingReason: string;
  refundRequestedDateTime: string;
  refundableAmount: number;
  amountRefunded: number;
  dateOfRefund: string;
  // DFO approval fields
  approval_status?: string;
  approval_remarks?: string;
  discount?: number;
  occupiedDates?: string; // Calculated column
}

// (Export function moved into component so it can use fetched reservations)

export default function ReservationTable() {
  const tableRef = useRef(null);
  const dtRef = useRef<any>(null);
  const apiUrl =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const perms = usePermissions();
  const { isDFO } = useAdmin();
  const permsRef = useRef(perms);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isConfirmDisableOpen, setIsConfirmDisableOpen] = useState(false);
  const [disablingReservation, setDisablingReservation] =
    useState<Reservation | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const reservationsRef = useRef<Reservation[]>([]);

  // keep ref in sync so non-react handlers can access latest data
  useEffect(() => {
    reservationsRef.current = reservations;
  }, [reservations]);

  // edit form state for side sheet
  const [editForm, setEditForm] = useState<Partial<Reservation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // populate edit form when selection changes
  useEffect(() => {
    if (selectedReservation) {
      setEditForm({ ...selectedReservation });
    } else {
      setEditForm(null);
    }
  }, [selectedReservation]);

  // keep perms ref up-to-date for event handlers attached to document
  useEffect(() => {
    permsRef.current = perms;
  }, [perms]);

  // Helper function to format date for display (DD/MMM/YYYY)
  const formatDateForDisplay = (value: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;

    // Use UTC methods to avoid timezone shifts
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getUTCMonth()];
    const day = String(d.getUTCDate()).padStart(2, "0");
    const year = d.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDateTimeForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = hours.toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
  };

  const handleEditChange = (field: keyof Reservation, value: any) => {
    const numRooms = parseInt(
      String(
        editForm?.numberOfRooms ?? selectedReservation?.numberOfRooms ?? 0,
      ),
    );

    if (field === "children" && value > numRooms * 2) {
      alert(`Maximum ${numRooms * 2} children allowed for ${numRooms} rooms`);
      return;
    }
    if (field === "guests" && value > numRooms * 2) {
      alert(`Maximum ${numRooms * 2} guests allowed for ${numRooms} rooms`);
      return;
    }
    if (field === "extraGuests" && value > numRooms * 1) {
      alert(
        `Maximum ${numRooms * 1} extra guests allowed for ${numRooms} rooms`,
      );
      return;
    }

    setEditForm((prev) => {
      const updated = { ...(prev || {}), [field]: value };

      // Recalculate duration if dates change
      if (field === "checkIn" || field === "checkOut") {
        const checkIn = updated.checkIn || selectedReservation?.checkIn;
        const checkOut = updated.checkOut || selectedReservation?.checkOut;

        if (checkIn && checkOut) {
          const d1 = new Date(checkIn);
          const d2 = new Date(checkOut);
          d1.setUTCHours(0, 0, 0, 0);
          d2.setUTCHours(0, 0, 0, 0);

          const diff = Math.round(
            (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24),
          );
          updated.noOfNights = Math.max(0, diff);
          updated.noOfDays = updated.noOfNights + 1;
        }
      }

      return updated;
    });
  };

  const saveChanges = async () => {
    if (!permsRef.current.canEdit) return;
    if (!editForm || !selectedReservation) return;
    setIsSaving(true);
    // optimistic local update
    const updatedLocal: Reservation = {
      ...selectedReservation,
      ...(editForm as any),
    };
    setReservations((prev) =>
      prev.map((r) => (r.id === selectedReservation.id ? updatedLocal : r)),
    );
    setSelectedReservation(updatedLocal);

    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(
        String(selectedReservation.id),
      );
      if (!isObjectId) {
        alert("Demo data - changes saved locally only");
        setIsSaving(false);
        return;
      }

      const payload: any = { ...editForm };
      // normalize some fields
      if (payload.noOfDays) delete payload.noOfDays;
      if (payload.totalGuests) delete payload.totalGuests;

      // DFO-specific fields should only be sent if the user is a DFO
      if (!isDFO) {
        delete payload.refundPercentage;
        delete payload.refundableAmount;
        delete payload.amountRefunded;
        delete payload.dateOfRefund;
      }

      // Ensure dates are in YYYY-MM-DD format (HTML5 date input already provides this)
      // Backend will convert to ISO timestamp

      const token = localStorage.getItem("admin_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(
        `${apiUrl}/api/reservations/${selectedReservation.id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        },
      );

      const text = await res.text();
      let parsed: any = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch (e) {
        parsed = text;
      }
      if (!res.ok) {
        throw new Error(parsed?.error || parsed?.message || res.statusText);
      }

      // update with server response if provided
      const server = parsed?.reservation || parsed;
      if (server) {
        const mapped: Reservation = {
          id: String(server._id || server.id || selectedReservation.id),
          fullName: server.fullName || updatedLocal.fullName,
          phone: server.phone || updatedLocal.phone,
          email: server.email || updatedLocal.email,
          checkIn: server.checkIn
            ? new Date(server.checkIn).toISOString().slice(0, 10)
            : updatedLocal.checkIn,
          checkOut: server.checkOut
            ? new Date(server.checkOut).toISOString().slice(0, 10)
            : updatedLocal.checkOut,
          guests: Number(server.guests) || updatedLocal.guests,
          children: Number(server.children) || updatedLocal.children,
          extraGuests: Number(server.extraGuests) || updatedLocal.extraGuests,
          totalGuests:
            (Number(server.guests) || 0) +
            (Number(server.extraGuests) || 0) +
            (Number(server.children) || 0),
          noOfDays:
            server.checkIn && server.checkOut
              ? Math.max(
                0,
                Math.round(
                  (new Date(server.checkOut).getTime() -
                    new Date(server.checkIn).getTime()) /
                  (1000 * 60 * 60 * 24),
                ),
              ) + 1
              : updatedLocal.noOfDays,
          noOfNights:
            server.checkIn && server.checkOut
              ? Math.max(
                0,
                Math.round(
                  (new Date(server.checkOut).getTime() -
                    new Date(server.checkIn).getTime()) /
                  (1000 * 60 * 60 * 24),
                ),
              )
              : updatedLocal.noOfNights || 0,
          resort: server.resort || updatedLocal.resort,
          resortName: updatedLocal.resortName,
          cottageTypes: server.cottageTypes || updatedLocal.cottageTypes,
          cottageTypeNames: updatedLocal.cottageTypeNames,
          rooms: server.rooms || updatedLocal.rooms,
          roomNames: updatedLocal.roomNames,
          numberOfRooms:
            Number(server.numberOfRooms) || updatedLocal.numberOfRooms,
          bookingId: server.bookingId || updatedLocal.bookingId,
          status: server.status || updatedLocal.status,
          reservationDate: server.reservationDate
            ? new Date(server.reservationDate).toISOString().slice(0, 10)
            : updatedLocal.reservationDate,
          paymentStatus: server.paymentStatus || updatedLocal.paymentStatus,
          refundPercentage:
            server.refundPercentage != null
              ? Number(server.refundPercentage)
              : updatedLocal.refundPercentage,
          roomPrice: Number(server.roomPrice) || updatedLocal.roomPrice,
          extraBedCharges:
            Number(server.extraBedCharges) || updatedLocal.extraBedCharges,
          totalPayable:
            Number(server.totalPayable) || updatedLocal.totalPayable,
          address1: server.address1 || updatedLocal.address1,
          address2: server.address2 || updatedLocal.address2,
          city: server.city || updatedLocal.city,
          state: server.state || updatedLocal.state,
          postalCode: server.postalCode || updatedLocal.postalCode,
          country: server.country || updatedLocal.country,
          existingGuest: server.existingGuest || updatedLocal.existingGuest,
          reservedFrom:
            server.reservedFrom ||
            server.rawSource?.reservedFrom ||
            updatedLocal.reservedFrom,
          foodPreference:
            server.foodPreference ||
            server.rawSource?.foodPreference ||
            updatedLocal.foodPreference,
          paymentTransactionId:
            server.rawSource?.transactionId ||
            server.paymentTransactionId ||
            updatedLocal.paymentTransactionId,
          paymentTransactionDateTime:
            server.paymentTransactionDateTime ||
            server.createdAt ||
            updatedLocal.paymentTransactionDateTime,
          cancelBookingReason:
            server.cancelBookingReason || updatedLocal.cancelBookingReason,
          refundRequestedDateTime:
            server.refundRequestedDateTime ||
            updatedLocal.refundRequestedDateTime,
          refundableAmount:
            Number(server.refundableAmount) || updatedLocal.refundableAmount,
          amountRefunded:
            Number(server.amountRefunded) || updatedLocal.amountRefunded,
          dateOfRefund: server.dateOfRefund || updatedLocal.dateOfRefund,
        };

        setReservations((prev) =>
          prev.map((r) => (r.id === mapped.id ? mapped : r)),
        );
        setSelectedReservation(mapped);
      }

      setIsSaving(false);
      setSheetMode("view");
    } catch (err: any) {
      console.error("Save failed", err);
      alert("Failed to save: " + (err?.message || String(err)));
      // simple revert: reload to get authoritative data
      window.location.reload();
      setIsSaving(false);
    }
  };

  // Download single reservation as PDF
  // Download single reservation as PDF
  const downloadPDF = (reservation: Reservation) => {
    const fmt = formatDateForDisplay;
    const address = [reservation.address1, reservation.address2, reservation.city, reservation.state, reservation.postalCode, reservation.country].filter(Boolean).join(", ") || "N/A";
    const fileName = `${reservation.bookingId || "N/A"}-${reservation.fullName || "Guest"}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${fileName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: 'Inter', -apple-system, system-ui, sans-serif; 
    background: #fff; 
    color: #1a1a1a; 
    font-size: 11px; 
    line-height: 1.4; 
    padding: 0; 
    -webkit-print-color-adjust: exact; 
  }
  .receipt-wrapper { 
    max-width: 800px; 
    margin: 0 auto; 
    padding: 20px;
  }
  
  .receipt-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-start; 
    margin-bottom: 15px; 
    border-bottom: 1.5px solid #000; 
    padding-bottom: 10px; 
  }
  .resort-logo h1 { 
    font-size: 18px; 
    color: #000; 
    font-weight: 700; 
    text-transform: uppercase; 
    margin-bottom: 2px; 
  }
  
  .booking-id-tag { text-align: right; }
  .booking-id-tag h2 { 
    font-size: 14px; 
    font-weight: 700; 
    color: #000; 
    margin-bottom: 4px; 
  }
  .status-label { 
    font-size: 10px; 
    font-weight: 700; 
    text-transform: uppercase; 
    color: #000;
  }

  .print-date { 
    text-align: right; 
    font-size: 8px; 
    color: #666; 
    margin-bottom: 10px; 
  }
  
  .voucher-title {
    text-align: center; 
    font-size: 14px; 
    font-weight: 700; 
    color: #000; 
    margin-bottom: 15px; 
    text-transform: uppercase; 
    border-bottom: 1px solid #eee; 
    padding-bottom: 5px;
    letter-spacing: 0.5px;
  }

  .details-table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 10px;
  }
  .details-table td { 
    padding: 3px 0; 
    vertical-align: top; 
  }
  .label-cell { 
    width: 110px; 
    color: #555; 
    font-size: 9px; 
    font-weight: 600; 
    text-transform: uppercase; 
  }
  .value-cell { 
    color: #000; 
    font-weight: 500; 
    font-size: 10px; 
  }
  .value-cell.bold { 
    font-weight: 700; 
  }

  .section-title { 
    font-size: 10px; 
    font-weight: 700; 
    text-transform: uppercase; 
    color: #000; 
    margin: 12px 0 6px 0; 
    border-bottom: 1.5px solid #f0f0f0; 
    padding-bottom: 2px; 
  }

  .billing-summary { 
    margin-top: 15px; 
    width: 100%; 
    border-collapse: collapse; 
  }
  .billing-summary th { 
    background-color: #fcfcfc; 
    text-align: left; 
    padding: 8px; 
    color: #000; 
    font-size: 9px; 
    border-bottom: 1.5px solid #000; 
    text-transform: uppercase;
    font-weight: 700;
  }
  .billing-summary td { 
    padding: 8px; 
    border-bottom: 1px solid #f9f9f9; 
  }
  .total-row { 
    background-color: #fafafa; 
  }
  .total-row td { 
    border-top: 1.5px solid #000;
    border-bottom: 2px solid #000; 
    font-weight: 700; 
    color: #000; 
    font-size: 12px; 
  }

  .footer-sig-area { 
    margin-top: 40px; 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-end; 
  }
  .sig-line { 
    width: 160px; 
    border-top: 1px solid #000; 
    margin-bottom: 5px; 
  }
  .sig-text { 
    font-size: 9px; 
    color: #333; 
    font-weight: 600; 
  }
  
  .disclaimer-box { 
    font-size: 8px; 
    color: #666; 
    font-style: italic; 
    max-width: 400px;
    line-height: 1.4;
  }

  @media print {
    body { padding: 0; }
    .receipt-wrapper { border: none; padding: 0; }
    @page { 
      margin: 12mm; 
      size: A4 portrait; 
    }
  }
</style>
</head>
<body>
<div class="receipt-wrapper">
  <div class="receipt-header">
    <div class="resort-logo">
      <h1>Vanavihari Resort</h1>
    </div>
    <div class="booking-id-tag">
      <h2>BOOKING ID: ${reservation.bookingId || "N/A"}</h2>
      <div class="status-label">Status: ${(reservation.status || "N/A").toUpperCase()}</div>
    </div>
  </div>

  <p class="print-date">Date Issued: ${new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

  <div class="voucher-title">Official Booking Confirmation Receipt</div>

  <div style="display: flex; gap: 40px; margin-bottom: 10px;">
    <div style="flex: 1;">
      <div class="section-title" style="margin-top: 0;">Guest Information</div>
      <table class="details-table">
        <tr>
          <td class="label-cell">Primary Guest</td>
          <td class="value-cell bold">${reservation.fullName || "N/A"}</td>
        </tr>
        <tr>
          <td class="label-cell">Contact No.</td>
          <td class="value-cell">${reservation.phone || "N/A"}</td>
        </tr>
        <tr>
          <td class="label-cell">Email ID</td>
          <td class="value-cell">${reservation.email || "N/A"}</td>
        </tr>
        <tr>
          <td class="label-cell">Address</td>
          <td class="value-cell">${address}</td>
        </tr>
      </table>
    </div>
    <div style="flex: 1;">
      <div class="section-title" style="margin-top: 0;">Stay Details</div>
      <table class="details-table">
        <tr>
          <td class="label-cell">Check-In Date</td>
          <td class="value-cell bold">${fmt(reservation.checkIn) || "N/A"}</td>
        </tr>
        <tr>
          <td class="label-cell">Check-Out Date</td>
          <td class="value-cell bold">${fmt(reservation.checkOut) || "N/A"}</td>
        </tr>
        <tr>
          <td class="label-cell">Stay Duration</td>
          <td class="value-cell">${reservation.noOfDays} Days / ${reservation.noOfNights} Nights</td>
        </tr>
        <tr>
          <td class="label-cell">Property</td>
          <td class="value-cell">${reservation.resortName || "N/A"}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="section-title">Accommodation Details</div>
  <table class="details-table">
    <tr>
      <td class="label-cell" style="width: 140px;">Cottage / Room Type</td>
      <td class="value-cell">${(reservation.cottageTypeNames || []).join(", ") || "N/A"}</td>
    </tr>
    <tr>
      <td class="label-cell" style="width: 140px;">Room Details</td>
      <td class="value-cell">${reservation.numberOfRooms} Room(s) — ${(reservation.roomNames || []).join(", ") || "N/A"}</td>
    </tr>
    <tr>
      <td class="label-cell" style="width: 140px;">Total Guests</td>
      <td class="value-cell">${reservation.guests} Adults, ${reservation.extraGuests} Extra, ${reservation.children} Children (Total: ${reservation.totalGuests})</td>
    </tr>
    <tr>
      <td class="label-cell" style="width: 140px;">Food Preference</td>
      <td class="value-cell">${reservation.foodPreference || "N/A"}</td>
    </tr>
  </table>

  <table class="billing-summary">
    <thead>
      <tr>
        <th style="width: 75%;">Description of Charges</th>
        <th style="text-align: right;">Amount (INR)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="value-cell">Room Accommodation Charges (Base Price)</td>
        <td class="value-cell bold" style="text-align: right;">₹${(reservation.roomPrice || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td class="value-cell">Extra Guest / Additional Facility Charges</td>
        <td class="value-cell bold" style="text-align: right;">₹${(reservation.extraBedCharges || 0).toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL NET AMOUNT PAID</td>
        <td style="text-align: right;">₹${(reservation.totalPayable || 0).toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 15px;">
    <div style="display: flex; margin-bottom: 2px;">
      <span class="label-cell" style="width: 110px;">Transaction ID:</span>
      <span class="value-cell" style="font-family: monospace;">${reservation.paymentTransactionId || "N/A"}</span>
    </div>
    <div style="display: flex;">
      <span class="label-cell" style="width: 110px;">Payment Status:</span>
      <span class="value-cell bold">${(reservation.paymentStatus || "N/A").toUpperCase()}</span>
    </div>
  </div>

  </div>

<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // Export to CSV (uses current reservations)
  const exportToExcel = () => {
    // Format date to DD-MMM-YY (e.g. 07-Nov-25). If value is empty or invalid,
    // return an empty string or the original value.
    // Uses UTC methods to avoid timezone issues
    const formatDateForExcel = (value: string) => {
      if (!value) return "";
      // Parse ISO date string (YYYY-MM-DD or full ISO timestamp)
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;

      // Use UTC methods to avoid timezone shifts
      const day = String(d.getUTCDate()).padStart(2, "0");
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const mon = months[d.getUTCMonth()] || "";
      const year = d.getUTCFullYear();
      return `${day}/${mon}/${year}`;
    };

    const headers = [
      "S No",
      "Booking ID",
      "Full Name",
      "Phone",
      "Email",
      "Address",
      "Resort",
      "Cottage Type",
      "Room name(s)",
      "No. of rooms",
      "Reservation Date",
      "Reserved From",
      "Check In",
      "Occupied Dates",
      "Check Out",
      "No. of days",
      "No. of Nights",
      "Guests",
      "Extra Guests",
      "Children",
      "Total guests",
      "Foods billed",
      "Food Preference",
      "Status",
      "Amount Payable",
      "Payment Status",
      "Amount Paid",
      "Payment Transaction Id",
      "Payment Transaction Date & Time",
      "Payment Transaction SubBillerId",
      "Verification Proof Type",
      "Verification Proof Id",
      "Cancel Booking Reason",
      "Refund Requested Date & Time",
      "Refundable Amount",
      "Amount Refunded",
      "Date of refund",
    ];

    const dtApi = (dtRef.current as any)?.dt?.();
    const dataToExport: Reservation[] = dtApi
      ? dtApi.rows({ search: "applied" }).data().toArray()
      : reservationsRef.current;

    const csvContent = [
      headers.join(","),
      ...dataToExport.map((row, idx) => {
        const address = [
          row.address1,
          row.address2,
          row.city,
          row.state,
          row.postalCode,
          row.country,
        ]
          .filter(Boolean)
          .join(", ");
        const isVana =
          row.resort?.toLowerCase().includes("vana") ||
          row.resortName?.toLowerCase().includes("vana");
        const foodsBilled = isVana
          ? "NA"
          : (Number(row.guests) || 0) + (Number(row.extraGuests) || 0);

        return [
          // Serial number as first column (starting at 1)
          idx + 1,
          `"${row.bookingId}"`,
          `"${row.fullName}"`,
          `"${row.phone}"`,
          `"${row.email}"`,
          `"${address || "NA"}"`,
          `"${row.resortName}"`,
          `"${(row.cottageTypeNames || []).join(", ") || "NA"}"`,
          `"${(row.roomNames || []).join(", ") || "NA"}"`,
          row.numberOfRooms,
          `"'${formatDateForExcel(row.reservationDate)}"`,
          `"${row.reservedFrom || "NA"}"`,
          // Prefix formatted dates with an apostrophe so Excel treats them as text
          // and doesn't auto-format/overflow them to '#######' when column is narrow
          `"'${formatDateForExcel(row.checkIn)}"`,
          `"${row.occupiedDates || "NA"}"`,
          `"'${formatDateForExcel(row.checkOut)}"`,
          row.noOfDays,
          row.noOfNights,
          row.guests,
          row.extraGuests,
          row.children,
          row.totalGuests,
          typeof foodsBilled === "string" ? `"${foodsBilled}"` : foodsBilled,
          `"${row.foodPreference || "NA"}"`,
          `"${row.status}"`,
          row.totalPayable,
          `"${row.paymentStatus}"`,
          row.totalPayable,
          `"${row.paymentTransactionId || "NA"}"`,
          `"'${row.paymentTransactionDateTime ? formatDateTimeForDisplay(row.paymentTransactionDateTime) : "NA"}"`,
          `"NA"`,
          `"NA"`,
          `"NA"`,
          `"${row.cancelBookingReason || "NA"}"`,
          `"'${row.refundRequestedDateTime ? formatDateForExcel(row.refundRequestedDateTime.slice(0, 10)) : "NA"}"`,
          row.refundableAmount || 0,
          row.amountRefunded || 0,
          `"'${row.dateOfRefund ? formatDateForExcel(row.dateOfRefund.slice(0, 10)) : "NA"}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Guest_Reservations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Removed edit & disable confirmation logic; actions now happen directly

  // Delete a reservation
  const disableReservation = async (reservation: Reservation | null) => {
    if (!permsRef.current.canDisable) return;
    if (!reservation) return;

    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(reservation.id));
      if (!isObjectId) {
        // demo/local only - remove from list
        setReservations((prev) => prev.filter((r) => r.id !== reservation.id));
        alert("This is demo data; changes are local only.");
        return;
      }

      const token = localStorage.getItem("admin_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${apiUrl}/api/reservations/${reservation.id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error || data?.message || res.statusText;
        throw new Error(msg || "Failed to delete");
      }

      // Remove from list on successful delete
      setReservations((prev) => prev.filter((r) => r.id !== reservation.id));

      // Close detail sheet if it's open for this reservation
      if (selectedReservation && selectedReservation.id === reservation.id) {
        setIsDetailSheetOpen(false);
        setSelectedReservation(null);
      }
    } catch (err: any) {
      console.error("Delete error", err);
      alert("Error deleting reservation: " + (err?.message || String(err)));
    }
  };

  // Row click opens view-only details
  const handleRowClick = (reservation: Reservation) => {
    if (!reservation) return;
    setSelectedReservation(reservation);
    setSheetMode("view");
    setIsDetailSheetOpen(true);
  };

  const confirmDisable = async () => {
    if (!disablingReservation) return;
    await disableReservation(disablingReservation);
    setIsConfirmDisableOpen(false);
    setDisablingReservation(null);
  };

  const cancelDisable = () => {
    setIsConfirmDisableOpen(false);
    setDisablingReservation(null);
  };

  useEffect(() => {
    // fetch reservations and setup table event listeners/styles
    const fetchReservations = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [resRes, resortsRes, cottagesRes, roomsRes] = await Promise.all([
          fetch(`${apiUrl}/api/reservations`),
          fetch(`${apiUrl}/api/resorts`),
          fetch(`${apiUrl}/api/cottage-types`),
          fetch(`${apiUrl}/api/rooms`),
        ]);

        const resData = await resRes.json();
        const resortsData = await resortsRes.json();
        const cottagesData = await cottagesRes.json();
        const roomsData = await roomsRes.json();

        if (!resRes.ok) throw new Error(resData?.error || resRes.statusText);

        // Create lookup maps
        const resortMap = new Map(
          (resortsData.resorts || []).map((r: any) => [r._id, r.resortName]),
        );
        const cottageMap = new Map(
          (cottagesData.cottageTypes || []).map((c: any) => [c._id, c.name]),
        );
        const roomMap = new Map(
          (roomsData.rooms || []).map((r: any) => [
            r._id,
            r.roomName || r.roomId || r.roomNumber,
          ]),
        );

        const raw = resData.reservations || resData || [];
        const mapped: Reservation[] = raw.map((r: any) => {
          // Parse dates using UTC to avoid timezone issues
          const checkIn = r.checkIn
            ? new Date(r.checkIn).toISOString().slice(0, 10)
            : "";
          const checkOut = r.checkOut
            ? new Date(r.checkOut).toISOString().slice(0, 10)
            : "";

          // Calculate days using normalized dates (start of day UTC)
          let noOfDays = 0;
          let noOfNights = 0;
          let diffDaysForLoop = 0;
          if (r.checkIn && r.checkOut) {
            const d1 = new Date(r.checkIn);
            const d2 = new Date(r.checkOut);
            d1.setUTCHours(0, 0, 0, 0);
            d2.setUTCHours(0, 0, 0, 0);
            const diff = Math.round(
              (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24),
            );
            noOfNights = Math.max(0, diff);
            noOfDays = noOfNights + 1;
            diffDaysForLoop = Math.max(1, diff);
          }

          // Calculate occupied dates
          let occupiedDatesStr = "—";
          if (r.checkIn && r.checkOut && diffDaysForLoop > 0) {
            const d1 = new Date(r.checkIn);
            d1.setUTCHours(0, 0, 0, 0);

            const datesList: string[] = [];
            let currentDate = new Date(d1);

            // Collect dates from checkIn up to (but not including) checkOut
            for (let i = 0; i < diffDaysForLoop; i++) {
              datesList.push(String(currentDate.getUTCDate()));
              currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }

            if (datesList.length <= 5) {
              occupiedDatesStr = datesList.join(", ");
            } else {
              occupiedDatesStr =
                datesList.slice(0, 5).join(", ") +
                ` ... +${datesList.length - 5} more dates`;
            }
          }

          const totalGuests =
            (Number(r.guests) || 0) +
            (Number(r.extraGuests) || 0) +
            (Number(r.children) || 0);

          return {
            id: String(r._id || r.id || ""),
            fullName: r.fullName || "",
            phone: r.phone || "",
            email: r.email || "",
            address1: r.address1 || "",
            address2: r.address2 || "",
            city: r.city || "",
            state: r.state || "",
            postalCode: r.postalCode || "",
            country: r.country || "",
            checkIn,
            checkOut,
            guests: Number(r.guests) || 0,
            children: Number(r.children) || 0,
            extraGuests: Number(r.extraGuests) || 0,
            numberOfRooms: Number(r.numberOfRooms) || 0,
            totalGuests,
            noOfDays,
            noOfNights,
            resort: r.resort || "",
            resortName: resortMap.get(r.resort) || r.resort || "",
            cottageTypes: Array.isArray(r.cottageTypes) ? r.cottageTypes : [],
            cottageTypeNames: Array.isArray(r.cottageTypes)
              ? r.cottageTypes.map((id: string) => cottageMap.get(id) || id)
              : [],
            rooms: Array.isArray(r.rooms) ? r.rooms : [],
            roomNames: Array.isArray(r.rooms)
              ? r.rooms.map((id: string) => roomMap.get(id) || id)
              : [],
            bookingId: r.bookingId || "",
            status: r.status || "",
            reservationDate: r.reservationDate
              ? new Date(r.reservationDate).toISOString().slice(0, 10)
              : "",
            paymentStatus: r.paymentStatus || "",
            refundPercentage: Number(r.refundPercentage) || 0,
            roomPrice: Number(r.roomPrice) || 0,
            extraBedCharges: Number(r.extraBedCharges) || 0,
            totalPayable: Number(r.totalPayable) || 0,
            existingGuest: r.existingGuest || "",
            reservedFrom: r.reservedFrom || r.rawSource?.reservedFrom || "",
            foodPreference:
              r.foodPreference || r.rawSource?.foodPreference || "",
            paymentTransactionId:
              r.rawSource?.transactionId || r.paymentTransactionId || "",
            paymentTransactionDateTime:
              r.paymentTransactionDateTime || r.createdAt
                ? new Date(r.createdAt).toISOString()
                : "",
            cancelBookingReason: r.cancelBookingReason || "",
            refundRequestedDateTime: r.refundRequestedDateTime || "",
            refundableAmount: Number(r.refundableAmount) || 0,
            amountRefunded: Number(r.amountRefunded) || 0,
            dateOfRefund: r.dateOfRefund || "",
            approval_status: r.approval_status || "",
            approval_remarks: r.approval_remarks || "",
            discount: Number(r.discount) || 0,
            occupiedDates: occupiedDatesStr,
          };
        });

        // Deduplicate reservations by booking ID (or ID as fallback) to prevent cloned duplicate data rendering
        const uniqueMapped = Array.from(new Map(mapped.map((m) => [m.bookingId || m.id, m])).values());
        setReservations(uniqueMapped);
      } catch (err) {
        console.error("Failed to load reservations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
    const style = document.createElement("style");
    style.innerHTML = `
      .dt-button-collection {
        position: fixed !important;
        z-index: 9999 !important;
        background: white !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
      }
      .dataTables_wrapper .dataTables_filter {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 0;
      }
      .dataTables_wrapper .dataTables_length {
        margin-bottom: 0;
      }
      .dataTables_wrapper {
        width: 100%;
        overflow: visible;
      }
      /* Fixed header + scrollable body */
      .dataTables_wrapper .dataTables_scrollBody {
        overflow-y: auto !important;
        overflow-x: auto !important;
        border: 1px solid #ddd;
        border-radius: 0.5rem;
      }
      .dataTables_wrapper table {
        width: max-content !important;
        min-width: 100%;
        margin: 0 !important;
      }
      .dataTables_wrapper .dataTables_scrollHead {
        border-radius: 0.5rem 0.5rem 0 0;
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .dataTables_wrapper .dataTables_scrollHeadInner {
        width: 100% !important;
      }
      table.dataTable thead tr th,
      table.dataTable thead tr td {
        font-weight: 700 !important;
      }
      /* Disabled row styling - subtle fade */
      table.dataTable tbody tr.disabled-row {
        background-color: #fbfbfb !important;
        opacity: 0.55 !important;
        filter: grayscale(0.08) brightness(0.98) !important;
        transition: background-color 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
      }
      table.dataTable tbody tr.disabled-row td {
        color: rgba(0,0,0,0.65) !important;
      }
      table.dataTable tbody tr.disabled-row:hover {
        background-color: #f6f6f6 !important;
        opacity: 0.65 !important;
        filter: grayscale(0.03) brightness(1) !important;
      }
      /* Action button styling */
      .edit-btn:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      .disable-btn:active:not([disabled]) {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      .reset-filters-btn {
        height: 38px !important;
        padding: 6px 16px !important;
        border-radius: 6px !important;
        border: 1px solid #D5DCE5 !important;
        background: #EEF2F6 !important;
        color: #475467 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all .15s ease !important;
      }
      .reset-filters-btn:hover {
        background: #e2e8f0 !important;
      }
      /* Clickable row styling */
      table.dataTable tbody tr {
        cursor: pointer !important;
        transition: background-color 0.2s ease !important;
      }
      table.dataTable tbody tr:hover:not(.disabled-row) {
        background-color: #f8fafc !important;
      }
      table.dataTable tbody tr:hover.disabled-row {
        background-color: #eeeeee !important;
      }
      /* Pagination styling - Clear & Professional */
      .dt-paging {
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        margin-top: 0 !important;
        margin-left: auto !important;
        justify-content: flex-end !important;
      }
      .dt-paging-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 2rem !important;
        height: 2rem !important;
        padding: 0 0.5rem !important;
        margin: 0 !important;
        border: none !important;
        background: transparent !important;
        color: #64748b !important;
        font-size: 1.1rem !important;
        font-weight: normal !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        border-radius: 9999px !important;
      }
      .dt-paging-button:hover:not(.disabled):not(.current) {
        background: linear-gradient(to bottom, #585858 0%, #111111 100%) !important;
        color: white !important;
        border: 1px solid #111111 !important;
      }
      .dt-paging-button.current {
        background: linear-gradient(to bottom, #ffffff 0%, #dcdcdc 100%) !important;
        color: #333333 !important;
        font-weight: normal !important;
        border: 1px solid #979797 !important;
        box-shadow: none !important;
      }
      .dt-paging-button.disabled {
        color: #cbd5e1 !important;
        cursor: not-allowed !important;
        opacity: 0.5 !important;
      }
      /* Pagination styling - Final Refined Look */
      .dt-paging {
        display: flex !important;
        align-items: center !important;
        gap: 0.25rem !important;
        margin-top: 0 !important;
        margin-left: auto !important;
        justify-content: flex-end !important;
      }
      .dt-paging .dt-paging-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0.25rem 0.5rem !important;
        margin: 0 !important;
        border: 1px solid transparent !important;
        background: transparent !important;
        color: #333333 !important;
        font-size: 1.1rem !important;
        font-weight: normal !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        border-radius: 2px !important;
      }
      /* Specific sizing for symbols to make them 'medium' and 'clear' */
      .dt-paging .dt-paging-button.first,
      .dt-paging .dt-paging-button.last,
      .dt-paging .dt-paging-button.previous,
      .dt-paging .dt-paging-button.next {
        font-size: 1.4rem !important;
        font-weight: normal !important;
      }
      .dt-paging .dt-paging-button:hover:not(.disabled):not(.current) {
        background: linear-gradient(to bottom, #585858 0%, #111111 100%) !important;
        color: white !important;
        border: 1px solid #111111 !important;
      }
      .dt-paging .dt-paging-button.current {
        background: linear-gradient(to bottom, #ffffff 0%, #dcdcdc 100%) !important;
        color: #333333 !important;
        font-weight: normal !important;
        border: 1px solid #979797 !important;
        padding-left: 0.75rem !important;
        padding-right: 0.75rem !important;
      }
      .dt-paging .dt-paging-button.disabled {
        color: #666666 !important;
        cursor: not-allowed !important;
        opacity: 0.7 !important; /* Keep it clear but indicate disabled */
      }
      /* --- UNIFIED TOP CONTROLS STYLING (Column Visibility, Reset Filters, Search) --- */
      .dt-buttons .dt-button,
      .dt-length select {
        height: 38px !important;
        padding: 0 16px !important;
        border-radius: 6px !important;
        border: 1px solid #cbd5e1 !important;
        background: #ffffff !important;
        color: #334155 !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        display: inline-flex !important;
        align-items: center !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
      }

      .dt-search input {
        height: 38px !important;
        padding: 0 16px !important;
        border-radius: 6px !important;
        border: 1px solid #cbd5e1 !important;
        background: #ffffff !important;
        color: #334155 !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        display: inline-flex !important;
        align-items: center !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
      }

      .dt-buttons .dt-button:hover,
      .reset-filters-btn:hover {
        background: #f1f5f9 !important;
        border-color: #94a3b8 !important;
        color: #1e293b !important;
      }

      .dt-search input:focus {
        outline: none !important;
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
      }

      /* Desktop Alignment */
      @media (min-width: 1024px) {
        .dt-layout-row:first-child .dt-layout-end {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 1rem !important;
        }
        .dt-buttons {
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .dt-search {
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .dt-search label {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          font-weight: 600 !important;
          color: #64748b !important;
          margin: 0 !important;
          font-size: 15px !important;
        }
        .dt-search input {
          width: 200px !important;
        }
        .dt-layout-row:last-child {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
          margin-top: 20px !important;
        }
        .dt-layout-row:last-child .dt-layout-end {
          display: flex !important;
          justify-content: flex-end !important;
          flex-grow: 1 !important;
        }
      }

      /* Mobile Sizing & Scaling */
      @media (max-width: 768px) {
        .dt-table-container .dt-layout-row {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 12px !important;
          margin: 12px 0 !important;
        }
        .dt-layout-row .dt-layout-end {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
          gap: 12px !important;
        }
        .dt-search {
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
        }
        .dt-search label {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          font-size: 15px !important;
        }
        .dt-search input {
          width: 180px !important;
        }
        .dt-buttons {
          display: flex !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          gap: 8px !important;
          width: 100% !important;
        }
        .dt-buttons .dt-button, 
        .reset-filters-btn {
          height: 36px !important;
          padding: 0 12px !important;
          font-size: 12px !important;
        }
      }

      /* Sheet Close Button Styling - Enlarged for better visibility */
      [data-slot="sheet-content"] > button {
        width: 36px !important;
        height: 36px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        top: 1rem !important;
        right: 1rem !important;
        background: #f1f5f9 !important;
        border-radius: 8px !important;
        transition: all 0.2s ease !important;
        opacity: 0.8 !important;
      }
      [data-slot="sheet-content"] > button:hover {
        opacity: 1 !important;
        background: #e2e8f0 !important;
        transform: scale(1.05);
      }
      [data-slot="sheet-content"] > button svg {
        width: 24px !important;
        height: 24px !important;
        stroke-width: 2.5 !important;
      }

    `;
    document.head.appendChild(style);

    const handleButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      // support clicks on inner text/nodes by finding the closest button
      const btn = target.closest(
        ".view-btn, .edit-btn, .delete-btn",
      ) as HTMLElement | null;
      if (!btn) return;

      // Stop propagation to prevent row click when button is clicked
      event.stopPropagation();

      const reservationId = btn.getAttribute("data-id");
      const reservation = reservationsRef.current.find(
        (r) => r.id === reservationId,
      );
      if (!reservation) return;

      if (btn.classList.contains("view-btn")) {
        // Open detail sheet in view mode
        setSelectedReservation(reservation);
        setSheetMode("view");
        setIsDetailSheetOpen(true);
      } else if (btn.classList.contains("edit-btn")) {
        if (!permsRef.current.canEdit) return;
        // Open detail sheet in edit mode
        setSelectedReservation(reservation);
        setSheetMode("edit");
        setIsDetailSheetOpen(true);
      } else if (btn.classList.contains("delete-btn")) {
        if (!permsRef.current.canDisable) return;
        setDisablingReservation(reservation);
        setIsConfirmDisableOpen(true);
      }
    };

    const handleTableRowClick = (event: Event) => {
      const target = event.target as HTMLElement;

      // Don't trigger row click if a button was clicked
      if (target.closest(".view-btn, .edit-btn, .delete-btn")) {
        return;
      }

      const row = target.closest("tr");
      if (row && row.parentElement?.tagName === "TBODY") {
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        const reservation = reservationsRef.current[rowIndex];
        if (reservation) {
          handleRowClick(reservation);
        }
      }
    };

    // Add event listener for edit and disable buttons
    document.addEventListener("click", handleButtonClick);
    document.addEventListener("click", handleTableRowClick);

    return () => {
      document.removeEventListener("click", handleButtonClick);
      document.removeEventListener("click", handleTableRowClick);
      if (style.parentElement) style.parentElement.removeChild(style);
    };
  }, []);

  const columns = [
    {
      title: "S No",
      data: null,
      render: (_data: any, _type: any, _row: any, meta: any) => {
        return meta.row + 1 + meta.settings._iDisplayStart;
      },
      orderable: false,
      searchable: false,
    },
    { data: "bookingId", title: "Booking ID" },
    { data: "fullName", title: "Full Name" },
    { data: "phone", title: "Phone" },
    { data: "email", title: "Email" },
    {
      data: null,
      title: "Address",
      render: (_data: any, _type: any, row: Reservation) => {
        const parts = [
          row.address1,
          row.address2,
          row.city,
          row.state,
          row.postalCode,
          row.country,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "NA";
      },
    },
    { data: "resortName", title: "Resort" },
    {
      data: "cottageTypeNames",
      title: "Cottage Type",
      render: (data: string[]) => (data || []).join(", ") || "NA",
    },
    {
      data: "roomNames",
      title: "Room name(s)",
      render: (data: string[]) => (data || []).join(", ") || "NA",
    },
    { data: "numberOfRooms", title: "No. of rooms" },
    {
      data: "reservationDate",
      title: "Reservation Date",
      width: "140px",
      render: (data: string) => formatDateForDisplay(data),
    },
    {
      data: "reservedFrom",
      title: "Reserved From",
      width: "120px",
      render: (data: string) => data || "NA",
    },
    {
      data: "checkIn",
      title: "Check In",
      width: "120px",
      render: (data: string) => formatDateForDisplay(data),
    },
    {
      data: "occupiedDates",
      title: "Occupied Dates",
      render: (data: string) => data || "NA",
    },
    {
      data: "checkOut",
      title: "Check Out",
      width: "120px",
      render: (data: string) => formatDateForDisplay(data),
    },
    { data: "noOfDays", title: "No. of days" },
    { data: "noOfNights", title: "No. of Nights" },
    { data: "guests", title: "Guests" },
    { data: "extraGuests", title: "Extra Guests" },
    { data: "children", title: "Children" },
    { data: "totalGuests", title: "Total guests" },
    {
      data: null,
      title: "Foods billed",
      render: (_data: any, _type: any, row: Reservation) => {
        const isVana =
          row.resort?.toLowerCase().includes("vana") ||
          row.resortName?.toLowerCase().includes("vana");
        if (isVana) return "NA FOR VANA RESORT";
        return (Number(row.guests) || 0) + (Number(row.extraGuests) || 0);
      },
    },
    {
      data: "foodPreference",
      title: "Food Preference",
      render: (data: string) => data || "NA",
    },
    {
      data: null,
      title: "Status",
      render: (_data: any, _type: any, row: Reservation) => {
        const approvalBadge = row.approval_status === 'PENDING_DFO_APPROVAL'
          ? `<span style="display:inline-flex;align-items:center;gap:4px;margin-top:3px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;background:#fef3c7;color:#92400e;border:1px solid #fde68a;">⏳ Awaiting DFO</span>`
          : row.approval_status === 'APPROVED'
            ? `<span style="display:inline-flex;align-items:center;gap:4px;margin-top:3px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;">✓ DFO Approved</span>`
            : row.approval_status === 'REJECTED'
              ? `<span style="display:inline-flex;align-items:center;gap:4px;margin-top:3px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;">✗ DFO Rejected</span>`
              : '';
        return `<div style="display:flex;flex-direction:column;gap:2px;">${row.status || ''}${approvalBadge}</div>`;
      },
    },
    {
      data: "totalPayable",
      title: "Amount Payable",
      render: (data: number) => `₹${data}`,
    },
    { data: "paymentStatus", title: "Payment Status" },
    {
      data: "totalPayable",
      title: "Amount Paid",
      render: (data: number) => `₹${data}`,
    },
    {
      data: "paymentTransactionId",
      title: "Payment Transaction Id",
      render: (data: string) => data || "NA",
    },
    {
      data: "paymentTransactionDateTime",
      title: "Payment Transaction Date & Time",
      render: (data: string) => (data ? formatDateTimeForDisplay(data) : "NA"),
    },
    {
      data: null,
      title: "Payment Transaction SubBillerId",
      render: () => "NA",
    },
    {
      data: null,
      title: "Verification Proof Type",
      render: () => "NA",
    },
    {
      data: null,
      title: "Verification Proof Id",
      render: () => "NA",
    },
    {
      data: "cancelBookingReason",
      title: "Cancel Booking Reason",
      render: (data: string) => data || "NA",
    },
    {
      data: "refundRequestedDateTime",
      title: "Refund Requested Date & Time",
      render: (data: string) =>
        data ? formatDateForDisplay(data.slice(0, 10)) : "NA",
    },
    {
      data: "refundableAmount",
      title: "Refundable Amount",
      render: (data: number) => (data ? `₹${data}` : "NA"),
    },
    {
      data: "amountRefunded",
      title: "Amount Refunded",
      render: (data: number) => (data ? `₹${data}` : "NA"),
    },
    {
      data: "dateOfRefund",
      title: "Date of refund",
      render: (data: string) =>
        data ? formatDateForDisplay(data.slice(0, 10)) : "NA",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: Reservation) => {
        return `
          <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
            <button 
              class="view-btn" 
              data-id="${row.id}" 
              title="View Reservation"
              style="
                background: #10b981;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              "
              onmouseover="this.style.background='#059669'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'"
              onmouseout="this.style.background='#10b981'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.1)'"
            >
              View
            </button>
            ${perms.canEdit
            ? `
            <button 
              class="edit-btn" 
              data-id="${row.id}" 
              title="Edit Reservation"
              style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              "
              onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'"
              onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.1)'"
            >
              Edit
            </button>
            `
            : ""
          }
          </div>
        `;
      },
    },
  ];

  if (loading) {
    return <PageLoader message="Loading reservations..." />;
  }

  return (
    <>
      <div className="w-full max-w-full overflow-hidden dt-table-container">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Reservations</h2>
          <button
            onClick={() => (perms.canExport ? exportToExcel() : null)}
            className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${perms.canExport ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : "bg-gray-300 cursor-not-allowed"}`}
            disabled={!perms.canExport}
            title={
              perms.canExport
                ? "Export to Excel"
                : "You do not have permission to export data"
            }
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export to Excel
          </button>
        </div>

        <div ref={tableRef} className="w-full">
          <DataTable
            ref={dtRef}
            data={reservations}
            columns={columns}
            className="display nowrap w-full border border-gray-400"
            options={{
              pageLength: 10,
              lengthMenu: [5, 10, 25, 50, 100],
              order: [[0, "asc"]],
              searching: true,
              paging: true,
              info: true,
              scrollX: true,
              scrollCollapse: true,
              scrollY: "400px",
              language: {
                paginate: {
                  first: "«",
                  last: "»",
                  next: "›",
                  previous: "‹",
                },
              } as any,
              layout: {
                topStart: "info",
                topEnd: ["search", "buttons"],
                bottomStart: "pageLength",
                bottomEnd: "paging",
              },
              buttons: [
                {
                  extend: "colvis",
                  text: "Column Visibility",
                  collectionLayout: "fixed two-column",
                },
              ],
              columnControl: [
                "order",
                ["orderAsc", "orderDesc", "spacer", "search"],
              ],
              initComplete: function () {
                const api = (this as any).api();
                const wrapper = api.table().container();
                const buttonsContainer = wrapper.querySelector(".dt-buttons");

                if (buttonsContainer && !wrapper.querySelector(".reset-filters-btn")) {
                  const btn = document.createElement("button");
                  btn.className = "reset-filters-btn";
                  btn.textContent = "Reset Filters";

                  btn.onclick = () => {
                    api.search("").columns().search("");
                    if (api.columns().ccSearchClear) {
                      (api.columns() as any).ccSearchClear();
                    }

                    wrapper.querySelectorAll("input").forEach((input: any) => {
                      input.value = "";
                      input.dispatchEvent(new Event("input", { bubbles: true }));
                      input.dispatchEvent(new Event("change", { bubbles: true }));
                    });

                    wrapper.querySelectorAll("select").forEach((select: any) => {
                      if (select.options.length > 0) {
                        select.selectedIndex = 0;
                        select.dispatchEvent(new Event("change", { bubbles: true }));
                      }
                    });

                    wrapper.querySelectorAll(".dtcc-button_active").forEach((btn: any) => {
                      btn.classList.remove("dtcc-button_active");
                    });

                    api.draw();
                  };
                  buttonsContainer.appendChild(btn);
                }
              },
            }}
          />
        </div>

        {/* Removed edit & confirmation dialogs */}

        {/* Confirm Disable Dialog */}
        <Dialog
          open={isConfirmDisableOpen}
          onOpenChange={setIsConfirmDisableOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Disable</DialogTitle>
              <DialogDescription>
                Are you sure you want to disable this reservation record?
              </DialogDescription>
            </DialogHeader>
            {disablingReservation && (
              <div className="py-4 space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Reservation ID:</strong> {disablingReservation.id}
                </p>
                <p>
                  <strong>Booking ID:</strong> {disablingReservation.bookingId}
                </p>
                <p>
                  <strong>Name:</strong> {disablingReservation.fullName}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={cancelDisable}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDisable}>
                Yes, Disable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reservation Details Sheet */}
        <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
          <SheetContent className="w-full max-w-none sm:max-w-full sm:w-[800px] lg:w-[900px] xl:w-[1000px] flex flex-col p-0">
            <SheetHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <SheetTitle className="text-xl">Reservation Details</SheetTitle>
              <SheetDescription>
                Complete information about the selected reservation
              </SheetDescription>
            </SheetHeader>

            {selectedReservation && (
              <>
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  {/* Guest Information */}
                  <div className="border-b pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Guest Information
                      </h3>
                      {selectedReservation && (
                        <button
                          onClick={() => downloadPDF(selectedReservation)}
                          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200"
                          style={{
                            background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
                            outline: 'none',
                          }}
                          onMouseOver={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                          }}
                          onMouseOut={e => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                          }}
                          title="Download reservation as PDF"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                          </svg>
                          Download PDF
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2 md:col-span-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Full Name
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full"
                            value={editForm?.fullName || ""}
                            onChange={(e) =>
                              handleEditChange("fullName", e.target.value)
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.fullName}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Phone
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full mt-auto"
                            value={editForm?.phone || ""}
                            onChange={(e) =>
                              handleEditChange("phone", e.target.value)
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border flex-1 flex items-center">
                            <span className="text-sm text-gray-900 break-all">
                              {selectedReservation.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 md:col-span-3 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Email
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full mt-auto"
                            value={editForm?.email || ""}
                            onChange={(e) =>
                              handleEditChange("email", e.target.value)
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border flex-1 flex items-center">
                            <span className="text-sm text-gray-900 break-all">
                              {selectedReservation.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Address Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2 md:col-span-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Address Line 1
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full"
                            value={editForm?.address1 || ""}
                            onChange={(e) =>
                              handleEditChange("address1", e.target.value)
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.address1 || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 md:col-span-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Address Line 2
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full"
                            value={editForm?.address2 || ""}
                            onChange={(e) =>
                              handleEditChange("address2", e.target.value)
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.address2 || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          City
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full"
                            value={editForm?.city || ""}
                            onChange={(e) =>
                              handleEditChange("city", e.target.value)
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.city || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          State
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full"
                            value={editForm?.state || ""}
                            onChange={(e) =>
                              handleEditChange("state", e.target.value)
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.state || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Postal Code
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full"
                            value={editForm?.postalCode || ""}
                            onChange={(e) =>
                              handleEditChange("postalCode", e.target.value)
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.postalCode || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Country
                        </Label>
                        {sheetMode === "edit" ? (
                          <Select
                            value={editForm?.country || ""}
                            onValueChange={(value) =>
                              handleEditChange("country", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="India">India</SelectItem>
                              <SelectItem value="USA">USA</SelectItem>
                              <SelectItem value="UK">UK</SelectItem>
                              <SelectItem value="United States">
                                United States
                              </SelectItem>
                              <SelectItem value="Australia">
                                Australia
                              </SelectItem>
                              <SelectItem value="Canada">Canada</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.country || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking Information */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Booking Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {/* Row 1: Check In & Check Out */}
                      <div className="col-span-1 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Check In
                        </Label>
                        {sheetMode === "edit" ? (
                          <DatePickerField
                            className="w-full mt-auto"
                            value={editForm?.checkIn || ""}
                            onChange={(val) => handleEditChange("checkIn", val)}
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border flex-1 flex items-center">
                            <span className="text-sm text-gray-900">
                              {formatDateForDisplay(selectedReservation.checkIn)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Check Out
                        </Label>
                        {sheetMode === "edit" ? (
                          <DatePickerField
                            className="w-full mt-auto"
                            value={editForm?.checkOut || ""}
                            onChange={(val) => handleEditChange("checkOut", val)}
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border flex-1 flex items-center">
                            <span className="text-sm text-gray-900">
                              {formatDateForDisplay(selectedReservation.checkOut)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Row 2: Day/Night in Col 1, Reservation Date in Col 2 */}
                      <div className="col-span-1">
                        <div className="flex gap-2">
                          <div className="flex flex-col">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Days
                            </Label>
                            <div className="p-3 bg-gray-100 rounded-md border border-gray-300 w-20 flex items-center justify-center">
                              <span className="text-sm text-gray-600 font-medium">
                                {editForm?.noOfDays ?? selectedReservation.noOfDays}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Nights
                            </Label>
                            <div className="p-3 bg-gray-100 rounded-md border border-gray-300 w-20 flex items-center justify-center">
                              <span className="text-sm text-gray-600 font-medium">
                                {editForm?.noOfNights ?? selectedReservation.noOfNights}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Reservation Date
                        </Label>
                        {sheetMode === "edit" ? (
                          <DatePickerField
                            className="w-full bg-gray-100 cursor-not-allowed mt-auto"
                            value={editForm?.reservationDate || ""}
                            onChange={() => { }}
                            disabled
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border flex-1 flex items-center">
                            <span className="text-sm text-gray-900">
                              {formatDateForDisplay(selectedReservation.reservationDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="col-span-2 md:col-span-4 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Resort
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-md border flex-1 flex items-center min-h-[46px]">
                          <span className="text-sm text-gray-900">
                            {selectedReservation.resortName}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Booking ID
                        </Label>
                        <div className="p-3 bg-gray-100 rounded-md border border-gray-300 flex-1 flex items-center">
                          <span className="text-sm text-gray-600 font-mono">
                            {selectedReservation.bookingId}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Cottage Types
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-md border flex-1 flex items-center">
                          <span className="text-sm text-gray-900">
                            {selectedReservation.cottageTypeNames.join(", ") ||
                              "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-3 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Rooms
                        </Label>
                        <div className="p-3 bg-gray-50 rounded-md border flex-1 flex items-center">
                          <span className="text-sm text-gray-900">
                            {selectedReservation.roomNames.join(", ") || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-1 flex flex-col">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block truncate" title="No. of Rooms">
                          No. of Rooms
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full mt-auto"
                            type="number"
                            value={String(editForm?.numberOfRooms ?? 0)}
                            onChange={(e) =>
                              handleEditChange(
                                "numberOfRooms",
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-100 rounded-md border border-gray-300 w-full flex items-center justify-center flex-1">
                            <span className="text-sm text-gray-600 font-medium">
                              {selectedReservation.numberOfRooms}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Guest Details */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Guest Details
                    </h3>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      <div className="flex flex-col h-full">
                        <Label className="text-xs md:text-sm font-semibold text-gray-700 mb-1 truncate block" title="Guests">
                          Guests
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full h-11"
                            type="number"
                            value={String(editForm?.guests ?? 0)}
                            onChange={(e) =>
                              handleEditChange(
                                "guests",
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        ) : (
                          <div className="p-2 bg-gray-50 rounded-md border h-11 flex items-center justify-center">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.guests}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col h-full">
                        <Label className="text-xs md:text-sm font-semibold text-gray-700 mb-1 truncate block" title="Children">
                          Children
                        </Label>
                        {sheetMode === "edit" ? (
                          <div className="flex flex-col gap-1 mt-auto">
                            <Input
                              className="w-full h-11"
                              type="number"
                              value={String(editForm?.children ?? 0)}
                              onChange={(e) =>
                                handleEditChange(
                                  "children",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                            />
                            <span className="text-[8px] text-gray-400 leading-none font-medium">
                              Max: {parseInt(String(editForm?.numberOfRooms ?? selectedReservation?.numberOfRooms ?? 0)) * 2}
                            </span>
                          </div>
                        ) : (
                          <div className="p-2 bg-gray-50 rounded-md border h-11 flex items-center justify-center">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.children}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col h-full">
                        <Label className="text-xs md:text-sm font-semibold text-gray-700 mb-1 truncate block" title="Extra Guests">
                          Extra Guests
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full h-11 mt-auto"
                            type="number"
                            value={String(editForm?.extraGuests ?? 0)}
                            onChange={(e) =>
                              handleEditChange(
                                "extraGuests",
                                parseInt(e.target.value) || 0,
                              )
                            }
                          />
                        ) : (
                          <div className="p-2 bg-gray-50 rounded-md border h-11 flex items-center justify-center">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.extraGuests}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col h-full">
                        <Label className="text-xs md:text-sm font-semibold text-gray-700 mb-1 truncate block" title="Total Guests">
                          Total Guests
                        </Label>
                        <div className="p-2 bg-blue-50 rounded-md border border-blue-200 h-11 flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-900">
                            {Number(editForm?.guests || 0) +
                              Number(editForm?.children || 0) +
                              Number(editForm?.extraGuests || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>



                  {/* Pricing Information */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Pricing Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Room Price
                        </Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm font-semibold text-gray-900">
                            ₹{selectedReservation.roomPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Extra Bed Charges
                        </Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm font-semibold text-gray-900">
                            ₹
                            {selectedReservation.extraBedCharges.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <Label className="text-sm font-medium text-gray-700">
                          Grand Total
                          {isDFO && sheetMode === "edit" && (
                            <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                              Editable by DFO only
                            </span>
                          )}
                        </Label>
                        {isDFO && sheetMode === "edit" ? (
                          <div className="mt-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <Input
                              className="w-full pl-8 border-amber-300 focus:ring-amber-400"
                              type="number"
                              value={String(editForm?.totalPayable ?? 0)}
                              onChange={(e) =>
                                handleEditChange(
                                  "totalPayable",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div className="mt-1 p-3 bg-green-50 rounded-md border border-green-200">
                            <span className="text-sm font-semibold text-green-900">
                              ₹
                              {selectedReservation.totalPayable.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Food & Reservation Source */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Food & Reservation Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Reserved From
                        </Label>
                        {sheetMode === "edit" ? (
                          <Select
                            value={editForm?.reservedFrom || ""}
                            onValueChange={(value) =>
                              handleEditChange("reservedFrom", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Phone">Phone</SelectItem>
                              <SelectItem value="Walk-in">Walk-in</SelectItem>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="Agent">Agent</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.reservedFrom || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      {!(selectedReservation.resortName || "")
                        .toLowerCase()
                        .includes("vanavihari") && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Food Preference
                            </Label>
                            {sheetMode === "edit" ? (
                              <Select
                                value={editForm?.foodPreference || ""}
                                onValueChange={(value) =>
                                  handleEditChange("foodPreference", value)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select preference" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Vegetarian">
                                    Vegetarian
                                  </SelectItem>
                                  <SelectItem value="Non-Vegetarian">
                                    Non-Vegetarian
                                  </SelectItem>
                                  <SelectItem value="Vegan">Vegan</SelectItem>
                                  <SelectItem value="Jain">Jain</SelectItem>
                                  <SelectItem value="No Preference">
                                    No Preference
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="p-3 bg-gray-50 rounded-md border">
                                <span className="text-sm text-gray-900">
                                  {selectedReservation.foodPreference || "N/A"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                      {!(selectedReservation.resortName || "")
                        .toLowerCase()
                        .includes("vanavihari") && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                              Foods Billed
                            </Label>
                            <div className="p-3 bg-gray-100 rounded-md border border-gray-300">
                              <span className="text-sm text-gray-600">
                                {(Number(selectedReservation.guests) || 0) +
                                  (Number(selectedReservation.extraGuests) || 0)}
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Status Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Reservation Status
                        </Label>
                        {sheetMode === "edit" ? (
                          <Select
                            value={editForm?.status || ""}
                            onValueChange={(value) =>
                              handleEditChange("status", value)
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Reserved">Reserved</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Not-Reserved">
                                Not Reserved
                              </SelectItem>
                              <SelectItem value="Cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900 capitalize">
                              {selectedReservation.status}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Payment Status
                        </Label>
                        {sheetMode === "edit" ? (
                          <Select
                            value={editForm?.paymentStatus || ""}
                            onValueChange={(value) =>
                              handleEditChange("paymentStatus", value)
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Unpaid">Unpaid</SelectItem>
                              <SelectItem value="Refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900 capitalize">
                              {selectedReservation.paymentStatus}
                            </span>
                          </div>
                        )}
                      </div>

                      {selectedReservation.status === "Cancelled" && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Refund Percentage
                          </Label>
                          {sheetMode === "edit" && isDFO ? (
                            <Input
                              className="mt-1 border-amber-300 focus:ring-amber-400"
                              type="number"
                              value={String(editForm?.refundPercentage ?? 0)}
                              onChange={(e) =>
                                handleEditChange(
                                  "refundPercentage",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          ) : (
                            <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                              <span className="text-sm text-gray-900">
                                {selectedReservation.refundPercentage != null
                                  ? `${selectedReservation.refundPercentage}%`
                                  : "--"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* DFO Approval Status — shown only if approval flow applies */}
                  {selectedReservation.approval_status && (
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        DFO Approval Status
                      </h3>
                      {selectedReservation.approval_status === 'PENDING_DFO_APPROVAL' && (
                        <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
                          <div>
                            <span className="text-sm font-semibold text-amber-800">Awaiting DFO Approval</span>
                            <p className="text-xs text-amber-600 mt-0.5">Room is blocked. Rooms will be auto-released if not approved within 1 hour.</p>
                          </div>
                        </div>
                      )}
                      {selectedReservation.approval_status === 'APPROVED' && (
                        <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded-md">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                          <span className="text-sm font-semibold text-green-800">Approved by DFO</span>
                        </div>
                      )}
                      {selectedReservation.approval_status === 'REJECTED' && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center gap-2.5 mb-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-red-800">Rejected / Auto-Released by DFO</span>
                          </div>
                          {selectedReservation.approval_remarks && (
                            <p className="text-xs text-red-600 mt-1 pl-5">{selectedReservation.approval_remarks}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Information */}

                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col justify-between h-full">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Amount Payable
                        </Label>
                        {/* Only non-DFO admins can edit Amount Payable here; DFO edits via the DFO Decision section */}
                        {sheetMode === "edit" && !isDFO ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <Input
                              className="w-full pl-8"
                              type="number"
                              value={String(editForm?.totalPayable ?? 0)}
                              onChange={(e) =>
                                handleEditChange(
                                  "totalPayable",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm font-semibold text-gray-900">
                              ₹
                              {selectedReservation.totalPayable.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between h-full">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Amount Paid
                        </Label>
                        <div className="p-3 bg-gray-100 rounded-md border border-gray-300">
                          <span className="text-sm font-semibold text-gray-600">
                            ₹{selectedReservation.totalPayable.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 md:col-span-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Payment Transaction Id
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full"
                            value={editForm?.paymentTransactionId || ""}
                            onChange={(e) =>
                              handleEditChange(
                                "paymentTransactionId",
                                e.target.value,
                              )
                            }
                            placeholder="Enter transaction ID"
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900 font-mono">
                              {selectedReservation.paymentTransactionId ||
                                "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between h-full">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Payment Transaction Date & Time
                        </Label>
                        {sheetMode === "edit" ? (
                          <DatePickerField
                            className="w-full"
                            value={
                              editForm?.paymentTransactionDateTime
                                ? editForm.paymentTransactionDateTime.slice(
                                  0,
                                  10,
                                )
                                : ""
                            }
                            onChange={(val) =>
                              handleEditChange(
                                "paymentTransactionDateTime",
                                val ? new Date(val).toISOString() : "",
                              )
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.paymentTransactionDateTime
                                ? formatDateTimeForDisplay(
                                  selectedReservation.paymentTransactionDateTime,
                                )
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between h-full">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Payment Transaction SubBillerId
                        </Label>
                        <div className="p-3 bg-gray-100 rounded-md border border-gray-300">
                          <span className="text-sm text-gray-600">N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Information */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Verification Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Verification Proof Type
                        </Label>
                        <div className="p-3 bg-gray-100 rounded-md border border-gray-300">
                          <span className="text-sm text-gray-600">N/A</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Verification Proof Id
                        </Label>
                        <div className="p-3 bg-gray-100 rounded-md border border-gray-300">
                          <span className="text-sm text-gray-600">N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation & Refund Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Cancellation & Refund Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2 md:col-span-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Cancel Booking Reason
                        </Label>
                        {sheetMode === "edit" ? (
                          <Input
                            className="w-full"
                            value={editForm?.cancelBookingReason || ""}
                            onChange={(e) =>
                              handleEditChange(
                                "cancelBookingReason",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.cancelBookingReason || "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between h-full">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Refund Requested Date & Time
                        </Label>
                        {sheetMode === "edit" ? (
                          <DatePickerField
                            className="w-full"
                            value={
                              editForm?.refundRequestedDateTime
                                ? editForm.refundRequestedDateTime.slice(0, 10)
                                : ""
                            }
                            onChange={(val) =>
                              handleEditChange(
                                "refundRequestedDateTime",
                                val ? new Date(val).toISOString() : "",
                              )
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.refundRequestedDateTime
                                ? formatDateForDisplay(
                                  selectedReservation.refundRequestedDateTime.slice(
                                    0,
                                    10,
                                  ),
                                )
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between h-full">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Date of Refund
                        </Label>
                        {sheetMode === "edit" ? (
                          <DatePickerField
                            className="w-full"
                            value={
                              editForm?.dateOfRefund
                                ? editForm.dateOfRefund.slice(0, 10)
                                : ""
                            }
                            onChange={(val) =>
                              handleEditChange(
                                "dateOfRefund",
                                val ? new Date(val).toISOString() : "",
                              )
                            }
                          />
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">
                              {selectedReservation.dateOfRefund
                                ? formatDateForDisplay(
                                  selectedReservation.dateOfRefund.slice(
                                    0,
                                    10,
                                  ),
                                )
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between h-full">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Refundable Amount
                        </Label>
                        {sheetMode === "edit" ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <Input
                              className="w-full pl-8"
                              type="number"
                              value={String(editForm?.refundableAmount ?? 0)}
                              onChange={(e) =>
                                handleEditChange(
                                  "refundableAmount",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm font-semibold text-gray-900">
                              {selectedReservation.refundableAmount
                                ? `₹${selectedReservation.refundableAmount.toLocaleString()}`
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between h-full">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Amount Refunded
                        </Label>
                        {sheetMode === "edit" ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <Input
                              className="w-full pl-8"
                              type="number"
                              value={String(editForm?.amountRefunded ?? 0)}
                              onChange={(e) =>
                                handleEditChange(
                                  "amountRefunded",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                            />
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm font-semibold text-gray-900">
                              {selectedReservation.amountRefunded
                                ? `₹${selectedReservation.amountRefunded.toLocaleString()}`
                                : "N/A"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* DFO Decision Section — only visible when DFO edits */}
                {isDFO && sheetMode === "edit" && (
                  <div className="border border-amber-200 rounded-lg p-5 bg-amber-50 mx-6 mt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        🔒 DFO Decision (Editable by DFO only)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-1 block">
                          Discount (₹){" "}
                          <span className="text-gray-400 font-normal text-xs">
                            (optional)
                          </span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            ₹
                          </span>
                          <Input
                            className="w-full pl-8 border-amber-300 focus:ring-amber-400"
                            type="number"
                            min="0"
                            value={String(editForm?.discount ?? "")}
                            onChange={(e) =>
                              handleEditChange(
                                "discount",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <div className="text-xs text-amber-700 bg-amber-100 rounded p-2 w-full">
                          Edit Grand Total in{" "}
                          <strong>Pricing Information</strong> section above ↑
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700 mb-1 block">
                          Remarks <span className="text-red-500">*</span>
                          <span className="text-gray-400 font-normal text-xs ml-1">
                            (mandatory if rejecting)
                          </span>
                        </Label>
                        <textarea
                          rows={3}
                          value={editForm?.approval_remarks ?? ""}
                          onChange={(e) =>
                            handleEditChange("approval_remarks", e.target.value)
                          }
                          placeholder="Add DFO remarks here…"
                          className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Fixed Action Buttons */}
                <div className="flex-shrink-0 flex flex-wrap gap-2 p-6 pt-4 border-t bg-white">
                  {sheetMode === "view" ? (
                    <>
                      <Button
                        onClick={() => setSheetMode("edit")}
                        disabled={!perms.canEdit}
                        title={
                          !perms.canEdit
                            ? "You do not have permission to edit"
                            : undefined
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsDetailSheetOpen(false)}
                        className="flex-1 sm:flex-none"
                      >
                        Close
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSheetMode("view");
                          if (selectedReservation) {
                            setEditForm({ ...selectedReservation });
                          }
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={saveChanges}
                        disabled={isSaving || !perms.canEdit}
                        className="flex-1"
                        title={
                          !perms.canEdit
                            ? "You do not have permission to update"
                            : undefined
                        }
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsDetailSheetOpen(false)}
                        className="flex-1 sm:flex-none"
                      >
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
