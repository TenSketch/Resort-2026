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
import { usePermissions } from '@/lib/AdminProvider'
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

DataTable.use(DT);

/**
 * DATE HANDLING NOTES:
 * - Backend stores dates as ISO timestamps (e.g., 2025-11-10T00:00:00.000Z)
 * - We display dates as MM/DD/YYYY in the table (matches frontend date picker)
 * - We export dates as DD-MMM-YY (e.g., 10-Nov-25) for Excel
 * - Always use UTC methods to avoid timezone issues
 * - Date inputs in edit mode use HTML5 date input (YYYY-MM-DD format internally)
 */

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
  cancellationMessage: string;
  refundRequestedDateTime: string;
  refundableAmount: number;
  amountRefunded: number;
  dateOfRefund: string;
}


// (Export function moved into component so it can use fetched reservations)

export default function ReservationTable() {
  const tableRef = useRef(null);
  const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
  const perms = usePermissions()
  const permsRef = useRef(perms)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'view' | 'edit'>('view')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isConfirmDisableOpen, setIsConfirmDisableOpen] = useState(false)
  const [disablingReservation, setDisablingReservation] = useState<Reservation | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const reservationsRef = useRef<Reservation[]>([])

  // keep ref in sync so non-react handlers can access latest data
  useEffect(() => { reservationsRef.current = reservations }, [reservations])

  // edit form state for side sheet
  const [editForm, setEditForm] = useState<Partial<Reservation> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // populate edit form when selection changes
  useEffect(() => {
    if (selectedReservation) {
      setEditForm({ ...selectedReservation })
    } else {
      setEditForm(null)
    }
  }, [selectedReservation])

  // keep perms ref up-to-date for event handlers attached to document
  useEffect(() => { permsRef.current = perms }, [perms])

  const handleEditChange = (field: keyof Reservation, value: any) => {
    setEditForm(prev => ({ ...(prev || {}), [field]: value }))
  }

  const saveChanges = async () => {
    if (!permsRef.current.canEdit) return
    if (!editForm || !selectedReservation) return
    setIsSaving(true)
    // optimistic local update
    const updatedLocal: Reservation = { ...(selectedReservation), ...(editForm as any) }
    setReservations(prev => prev.map(r => r.id === selectedReservation.id ? updatedLocal : r))
    setSelectedReservation(updatedLocal)

    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(selectedReservation.id))
      if (!isObjectId) {
        alert('Demo data - changes saved locally only')
        setIsSaving(false)
        return
      }

      const payload: any = { ...editForm }
      // normalize some fields
      if (payload.noOfDays) delete payload.noOfDays
      if (payload.totalGuests) delete payload.totalGuests
      
      // Ensure dates are in YYYY-MM-DD format (HTML5 date input already provides this)
      // Backend will convert to ISO timestamp

      const token = localStorage.getItem('admin_token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${apiUrl}/api/reservations/${selectedReservation.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let parsed: any = null
      try { parsed = text ? JSON.parse(text) : null } catch (e) { parsed = text }
      if (!res.ok) {
        throw new Error(parsed?.error || parsed?.message || res.statusText)
      }

      // update with server response if provided
      const server = parsed?.reservation || parsed
      if (server) {
        const mapped: Reservation = {
          id: String(server._id || server.id || selectedReservation.id),
          fullName: server.fullName || updatedLocal.fullName,
          phone: server.phone || updatedLocal.phone,
          email: server.email || updatedLocal.email,
          checkIn: server.checkIn ? new Date(server.checkIn).toISOString().slice(0, 10) : updatedLocal.checkIn,
          checkOut: server.checkOut ? new Date(server.checkOut).toISOString().slice(0, 10) : updatedLocal.checkOut,
          guests: Number(server.guests) || updatedLocal.guests,
          children: Number(server.children) || updatedLocal.children,
          extraGuests: Number(server.extraGuests) || updatedLocal.extraGuests,
          totalGuests: (Number(server.guests) || 0) + (Number(server.extraGuests) || 0) + (Number(server.children) || 0),
          noOfDays: (server.checkIn && server.checkOut) ? Math.max(1, Math.round((new Date(server.checkOut).getTime() - new Date(server.checkIn).getTime()) / (1000 * 60 * 60 * 24))) : updatedLocal.noOfDays,
          resort: server.resort || updatedLocal.resort,
          resortName: updatedLocal.resortName,
          cottageTypes: server.cottageTypes || updatedLocal.cottageTypes,
          cottageTypeNames: updatedLocal.cottageTypeNames,
          rooms: server.rooms || updatedLocal.rooms,
          roomNames: updatedLocal.roomNames,
          numberOfRooms: Number(server.numberOfRooms) || updatedLocal.numberOfRooms,
          bookingId: server.bookingId || updatedLocal.bookingId,
          status: server.status || updatedLocal.status,
          reservationDate: server.reservationDate ? new Date(server.reservationDate).toISOString().slice(0, 10) : updatedLocal.reservationDate,
          paymentStatus: server.paymentStatus || updatedLocal.paymentStatus,
          refundPercentage: server.refundPercentage != null ? Number(server.refundPercentage) : updatedLocal.refundPercentage,
          roomPrice: Number(server.roomPrice) || updatedLocal.roomPrice,
          extraBedCharges: Number(server.extraBedCharges) || updatedLocal.extraBedCharges,
          totalPayable: Number(server.totalPayable) || updatedLocal.totalPayable,
          address1: server.address1 || updatedLocal.address1,
          address2: server.address2 || updatedLocal.address2,
          city: server.city || updatedLocal.city,
          state: server.state || updatedLocal.state,
          postalCode: server.postalCode || updatedLocal.postalCode,
          country: server.country || updatedLocal.country,
          existingGuest: server.existingGuest || updatedLocal.existingGuest,
          reservedFrom: server.reservedFrom || server.rawSource?.reservedFrom || updatedLocal.reservedFrom,
          foodPreference: server.foodPreference || server.rawSource?.foodPreference || updatedLocal.foodPreference,
          paymentTransactionId: server.rawSource?.transactionId || server.paymentTransactionId || updatedLocal.paymentTransactionId,
          paymentTransactionDateTime: server.paymentTransactionDateTime || server.createdAt || updatedLocal.paymentTransactionDateTime,
          cancelBookingReason: server.cancelBookingReason || updatedLocal.cancelBookingReason,
          cancellationMessage: server.cancellationMessage || updatedLocal.cancellationMessage,
          refundRequestedDateTime: server.refundRequestedDateTime || updatedLocal.refundRequestedDateTime,
          refundableAmount: Number(server.refundableAmount) || updatedLocal.refundableAmount,
          amountRefunded: Number(server.amountRefunded) || updatedLocal.amountRefunded,
          dateOfRefund: server.dateOfRefund || updatedLocal.dateOfRefund,
        }

        setReservations(prev => prev.map(r => r.id === mapped.id ? mapped : r))
        setSelectedReservation(mapped)
      }

      setIsSaving(false)
      setSheetMode('view')
    } catch (err: any) {
      console.error('Save failed', err)
      alert('Failed to save: ' + (err?.message || String(err)))
      // simple revert: reload to get authoritative data
      window.location.reload()
      setIsSaving(false)
    }
  }

  // Helper function to format date for display (MM/DD/YYYY)
  const formatDateForDisplay = (value: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    
    // Use UTC methods to avoid timezone shifts
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${month}/${day}/${year}`;
  };

  // Export to CSV (uses current reservations)
  const exportToExcel = () => {
    // Format date to DD-MMM-YY (e.g. 07-Nov-25). If value is empty or invalid,
    // return an empty string or the original value.
    // Uses UTC methods to avoid timezone issues
    const formatDateForExcel = (value: string) => {
      if (!value) return '';
      // Parse ISO date string (YYYY-MM-DD or full ISO timestamp)
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      
      // Use UTC methods to avoid timezone shifts
      const day = String(d.getUTCDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mon = months[d.getUTCMonth()] || '';
      const yy = String(d.getUTCFullYear()).slice(-2);
      return `${day}-${mon}-${yy}`;
    }

    const headers = [
      "S No", "Booking ID", "Full Name", "Phone", "Email", "Address", "Resort", 
      "Cottage Type", "Room name(s)", "No. of rooms", "Reservation Date", "Reserved From",
      "Check In", "Check Out", "No. of days", "Guests", "Extra Guests", "Children", 
      "Total guests", "Foods billed", "Food Preference", "Status", "Amount Payable", 
      "Payment Status", "Amount Paid", "Payment Transaction Id", 
      "Payment Transaction Date & Time", "Payment Transaction SubBillerId",
      "Verification Proof Type", "Verification Proof Id", "Cancel Booking Reason",
      "Cancellation message", "Refund Requested Date & Time", "Refundable Amount",
      "Amount Refunded", "Date of refund"
    ];

    const csvContent = [
      headers.join(","),
      ...reservationsRef.current.map((row, idx) => {
        const address = [row.address1, row.address2, row.city, row.state, row.postalCode, row.country].filter(Boolean).join(', ');
        const foodsBilled = (Number(row.guests) || 0) + (Number(row.extraGuests) || 0);
        
        return [
          // Serial number as first column (starting at 1)
          idx + 1,
          `"${row.bookingId}"`,
          `"${row.fullName}"`,
          `"${row.phone}"`,
          `"${row.email}"`,
          `"${address || 'N/A'}"`,
          `"${row.resortName}"`,
          `"${row.cottageTypeNames.join(', ') || 'N/A'}"`,
          `"${row.roomNames.join(', ') || 'N/A'}"`,
          row.numberOfRooms,
          `"'${formatDateForExcel(row.reservationDate)}"`,
          `"${row.reservedFrom || 'N/A'}"`,
          // Prefix formatted dates with an apostrophe so Excel treats them as text
          // and doesn't auto-format/overflow them to '#######' when column is narrow
          `"'${formatDateForExcel(row.checkIn)}"`,
          `"'${formatDateForExcel(row.checkOut)}"`,
          row.noOfDays,
          row.guests,
          row.extraGuests,
          row.children,
          row.totalGuests,
          foodsBilled,
          `"${row.foodPreference || 'N/A'}"`,
          `"${row.status}"`,
          row.totalPayable,
          `"${row.paymentStatus}"`,
          row.totalPayable,
          `"${row.paymentTransactionId || 'N/A'}"`,
          `"'${row.paymentTransactionDateTime ? formatDateForExcel(row.paymentTransactionDateTime.slice(0, 10)) : 'N/A'}"`,
          `"N/A"`,
          `"N/A"`,
          `"N/A"`,
          `"${row.cancelBookingReason || 'N/A'}"`,
          `"${row.cancellationMessage || 'N/A'}"`,
          `"'${row.refundRequestedDateTime ? formatDateForExcel(row.refundRequestedDateTime.slice(0, 10)) : 'N/A'}"`,
          row.refundableAmount || 0,
          row.amountRefunded || 0,
          `"'${row.dateOfRefund ? formatDateForExcel(row.dateOfRefund.slice(0, 10)) : 'N/A'}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
    if (!permsRef.current.canDisable) return
    if (!reservation) return

    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(reservation.id))
      if (!isObjectId) {
        // demo/local only - remove from list
        setReservations(prev => prev.filter(r => r.id !== reservation.id))
        alert('This is demo data; changes are local only.')
        return
      }

      const token = localStorage.getItem('admin_token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${apiUrl}/api/reservations/${reservation.id}`, {
        method: 'DELETE',
        headers,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const msg = data?.error || data?.message || res.statusText
        throw new Error(msg || 'Failed to delete')
      }

      // Remove from list on successful delete
      setReservations(prev => prev.filter(r => r.id !== reservation.id))

      // Close detail sheet if it's open for this reservation
      if (selectedReservation && selectedReservation.id === reservation.id) {
        setIsDetailSheetOpen(false)
        setSelectedReservation(null)
      }
    } catch (err: any) {
      console.error('Delete error', err)
      alert('Error deleting reservation: ' + (err?.message || String(err)))
    }
  }

  // Row click opens view-only details
  const handleRowClick = (reservation: Reservation) => {
    if (!reservation) return
    setSelectedReservation(reservation)
    setSheetMode('view')
    setIsDetailSheetOpen(true)
  }

  const confirmDisable = async () => {
    if (!disablingReservation) return
    await disableReservation(disablingReservation)
    setIsConfirmDisableOpen(false)
    setDisablingReservation(null)
  }

  const cancelDisable = () => {
    setIsConfirmDisableOpen(false)
    setDisablingReservation(null)
  }

  useEffect(() => {
    // fetch reservations and setup table event listeners/styles
    const fetchReservations = async () => {
      try {
        // Fetch all data in parallel
        const [resRes, resortsRes, cottagesRes, roomsRes] = await Promise.all([
          fetch(`${apiUrl}/api/reservations`),
          fetch(`${apiUrl}/api/resorts`),
          fetch(`${apiUrl}/api/cottage-types`),
          fetch(`${apiUrl}/api/rooms`)
        ]);

        const resData = await resRes.json();
        const resortsData = await resortsRes.json();
        const cottagesData = await cottagesRes.json();
        const roomsData = await roomsRes.json();

        if (!resRes.ok) throw new Error(resData?.error || resRes.statusText);

        // Create lookup maps
        const resortMap = new Map((resortsData.resorts || []).map((r: any) => [r._id, r.resortName]));
        const cottageMap = new Map((cottagesData.cottageTypes || []).map((c: any) => [c._id, c.name]));
        const roomMap = new Map((roomsData.rooms || []).map((r: any) => [r._id, r.roomName || r.roomId || r.roomNumber]));

        const raw = resData.reservations || resData || [];
        const mapped: Reservation[] = raw.map((r: any) => {
          // Parse dates using UTC to avoid timezone issues
          const checkIn = r.checkIn ? new Date(r.checkIn).toISOString().slice(0, 10) : '';
          const checkOut = r.checkOut ? new Date(r.checkOut).toISOString().slice(0, 10) : '';
          
          // Calculate days using normalized dates (start of day UTC)
          let noOfDays = 0;
          if (r.checkIn && r.checkOut) {
            const d1 = new Date(r.checkIn);
            const d2 = new Date(r.checkOut);
            d1.setUTCHours(0, 0, 0, 0);
            d2.setUTCHours(0, 0, 0, 0);
            noOfDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
          }
          
          const totalGuests = (Number(r.guests) || 0) + (Number(r.extraGuests) || 0) + (Number(r.children) || 0);

          return {
            id: String(r._id || r.id || ''),
            fullName: r.fullName || '',
            phone: r.phone || '',
            email: r.email || '',
            address1: r.address1 || '',
            address2: r.address2 || '',
            city: r.city || '',
            state: r.state || '',
            postalCode: r.postalCode || '',
            country: r.country || '',
            checkIn,
            checkOut,
            guests: Number(r.guests) || 0,
            children: Number(r.children) || 0,
            extraGuests: Number(r.extraGuests) || 0,
            numberOfRooms: Number(r.numberOfRooms) || 0,
            totalGuests,
            noOfDays,
            resort: r.resort || '',
            resortName: resortMap.get(r.resort) || r.resort || '',
            cottageTypes: Array.isArray(r.cottageTypes) ? r.cottageTypes : [],
            cottageTypeNames: Array.isArray(r.cottageTypes) ? r.cottageTypes.map((id: string) => cottageMap.get(id) || id) : [],
            rooms: Array.isArray(r.rooms) ? r.rooms : [],
            roomNames: Array.isArray(r.rooms) ? r.rooms.map((id: string) => roomMap.get(id) || id) : [],
            bookingId: r.bookingId || '',
            status: r.status || '',
            reservationDate: r.reservationDate ? new Date(r.reservationDate).toISOString().slice(0, 10) : '',
            paymentStatus: r.paymentStatus || '',
            refundPercentage: Number(r.refundPercentage) || 0,
            roomPrice: Number(r.roomPrice) || 0,
            extraBedCharges: Number(r.extraBedCharges) || 0,
            totalPayable: Number(r.totalPayable) || 0,
            existingGuest: r.existingGuest || '',
            reservedFrom: r.reservedFrom || r.rawSource?.reservedFrom || '',
            foodPreference: r.foodPreference || r.rawSource?.foodPreference || '',
            paymentTransactionId: r.rawSource?.transactionId || r.paymentTransactionId || '',
            paymentTransactionDateTime: r.paymentTransactionDateTime || r.createdAt ? new Date(r.createdAt).toISOString() : '',
            cancelBookingReason: r.cancelBookingReason || '',
            cancellationMessage: r.cancellationMessage || '',
            refundRequestedDateTime: r.refundRequestedDateTime || '',
            refundableAmount: Number(r.refundableAmount) || 0,
            amountRefunded: Number(r.amountRefunded) || 0,
            dateOfRefund: r.dateOfRefund || '',
          };
        });

        setReservations(mapped);
      } catch (err) {
        console.error('Failed to load reservations', err);
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
        margin-bottom: 1rem;
      }
      .dataTables_wrapper .dataTables_length {
        margin-bottom: 1rem;
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
    `;
    document.head.appendChild(style);

    const handleButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      // support clicks on inner text/nodes by finding the closest button
      const btn = target.closest('.edit-btn, .delete-btn') as HTMLElement | null;
      if (!btn) return;

      // Stop propagation to prevent row click when button is clicked
      event.stopPropagation();

      const reservationId = btn.getAttribute('data-id');
      const reservation = reservationsRef.current.find(r => r.id === reservationId);
      if (!reservation) return;

      if (btn.classList.contains('edit-btn')) {
        if (!permsRef.current.canEdit) return
        // Open detail sheet in edit mode
        setSelectedReservation(reservation);
        setSheetMode('edit')
        setIsDetailSheetOpen(true);
      } else if (btn.classList.contains('delete-btn')) {
        if (!permsRef.current.canDisable) return
        setDisablingReservation(reservation)
        setIsConfirmDisableOpen(true)
      }
    };

    const handleTableRowClick = (event: Event) => {
      const target = event.target as HTMLElement;

      // Don't trigger row click if a button was clicked
      if (target.closest('.edit-btn, .delete-btn')) {
        return;
      }

      const row = target.closest('tr');
      if (row && row.parentElement?.tagName === 'TBODY') {
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        const reservation = reservationsRef.current[rowIndex];
        if (reservation) {
          handleRowClick(reservation);
        }
      }
    };

    // Add event listener for edit and disable buttons
    document.addEventListener('click', handleButtonClick);
    document.addEventListener('click', handleTableRowClick);

    return () => {
      document.removeEventListener('click', handleButtonClick);
      document.removeEventListener('click', handleTableRowClick);
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
      searchable: false
    },
    { data: "bookingId", title: "Booking ID" },
    { data: "fullName", title: "Full Name" },
    { data: "phone", title: "Phone" },
    { data: "email", title: "Email" },
    {
      data: null,
      title: "Address",
      render: (_data: any, _type: any, row: Reservation) => {
        const parts = [row.address1, row.address2, row.city, row.state, row.postalCode, row.country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
      }
    },
    { data: "resortName", title: "Resort" },
    {
      data: "cottageTypeNames",
      title: "Cottage Type",
      render: (data: string[]) => data.join(", ") || 'N/A',
    },
    {
      data: "roomNames",
      title: "Room name(s)",
      render: (data: string[]) => data.join(", ") || 'N/A',
    },
    { data: "numberOfRooms", title: "No. of rooms" },
    { 
      data: "reservationDate", 
      title: "Reservation Date",
      render: (data: string) => formatDateForDisplay(data)
    },
    { 
      data: "reservedFrom", 
      title: "Reserved From",
      render: (data: string) => data || 'N/A'
    },
    { 
      data: "checkIn", 
      title: "Check In",
      render: (data: string) => formatDateForDisplay(data)
    },
    { 
      data: "checkOut", 
      title: "Check Out",
      render: (data: string) => formatDateForDisplay(data)
    },
    { data: "noOfDays", title: "No. of days" },
    { data: "guests", title: "Guests" },
    { data: "extraGuests", title: "Extra Guests" },
    { data: "children", title: "Children" },
    { data: "totalGuests", title: "Total guests" },
    {
      data: null,
      title: "Foods billed",
      render: (_data: any, _type: any, row: Reservation) => {
        return (Number(row.guests) || 0) + (Number(row.extraGuests) || 0);
      }
    },
    { 
      data: "foodPreference", 
      title: "Food Preference",
      render: (data: string) => data || 'N/A'
    },
    { data: "status", title: "Status" },
    {
      data: "totalPayable",
      title: "Amount Payable",
      render: (data: number) => `₹${data}`
    },
    { data: "paymentStatus", title: "Payment Status" },
    {
      data: "totalPayable",
      title: "Amount Paid",
      render: (data: number) => `₹${data}`
    },
    { 
      data: "paymentTransactionId", 
      title: "Payment Transaction Id",
      render: (data: string) => data || 'N/A'
    },
    { 
      data: "paymentTransactionDateTime", 
      title: "Payment Transaction Date & Time",
      render: (data: string) => data ? formatDateForDisplay(data.slice(0, 10)) : 'N/A'
    },
    { 
      data: null, 
      title: "Payment Transaction SubBillerId",
      render: () => 'N/A'
    },
    { 
      data: null, 
      title: "Verification Proof Type",
      render: () => 'N/A'
    },
    { 
      data: null, 
      title: "Verification Proof Id",
      render: () => 'N/A'
    },
    { 
      data: "cancelBookingReason", 
      title: "Cancel Booking Reason",
      render: (data: string) => data || 'N/A'
    },
    { 
      data: "cancellationMessage", 
      title: "Cancellation message",
      render: (data: string) => data || 'N/A'
    },
    { 
      data: "refundRequestedDateTime", 
      title: "Refund Requested Date & Time",
      render: (data: string) => data ? formatDateForDisplay(data.slice(0, 10)) : 'N/A'
    },
    {
      data: "refundableAmount",
      title: "Refundable Amount",
      render: (data: number) => data ? `₹${data}` : 'N/A'
    },
    {
      data: "amountRefunded",
      title: "Amount Refunded",
      render: (data: number) => data ? `₹${data}` : 'N/A'
    },
    { 
      data: "dateOfRefund", 
      title: "Date of refund",
      render: (data: string) => data ? formatDateForDisplay(data.slice(0, 10)) : 'N/A'
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: Reservation) => {
        return `
          <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
            ${perms.canEdit ? `
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
            ` : ''}
          </div>
        `;
      },
    },
  ];


  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Reservations</h2>
        <button
          onClick={() => perms.canViewDownload ? exportToExcel() : null}
          className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${perms.canViewDownload ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-gray-300 cursor-not-allowed'}`}
          disabled={!perms.canViewDownload}
          title={perms.canViewDownload ? 'Export to Excel' : 'You do not have permission to download/export'}
        >
          ⬇ Export to Excel
        </button>
      </div>

      <div ref={tableRef} className="w-full">
        <DataTable
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
            layout: {
              topStart: "buttons",
              bottom1Start: "pageLength",
            },
            buttons: [
              {
                extend: "colvis",
                text: "Column Visibility",
                collectionLayout: "fixed two-column",
              },
            ],
            columnControl: ["order", ["orderAsc", "orderDesc", "spacer", "search"]],

          }}
        />
      </div>

      {/* Removed edit & confirmation dialogs */}

      {/* Confirm Disable Dialog */}
      <Dialog open={isConfirmDisableOpen} onOpenChange={setIsConfirmDisableOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Disable</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable this reservation record?
            </DialogDescription>
          </DialogHeader>
          {disablingReservation && (
            <div className="py-4 space-y-2 text-sm text-gray-700">
              <p><strong>Reservation ID:</strong> {disablingReservation.id}</p>
              <p><strong>Booking ID:</strong> {disablingReservation.bookingId}</p>
              <p><strong>Name:</strong> {disablingReservation.fullName}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={cancelDisable}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDisable}>Yes, Disable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation Details Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[700px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Reservation Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected reservation
            </SheetDescription>
          </SheetHeader>

          {selectedReservation && (
            <>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  {/* Guest Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Guest Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.fullName || ''} onChange={(e) => handleEditChange('fullName', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.fullName}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.phone || ''} onChange={(e) => handleEditChange('phone', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.email || ''} onChange={(e) => handleEditChange('email', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Address Line 1</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.address1 || ''} onChange={(e) => handleEditChange('address1', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.address1 || 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Address Line 2</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.address2 || ''} onChange={(e) => handleEditChange('address2', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.address2 || 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">City</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.city || ''} onChange={(e) => handleEditChange('city', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.city || 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">State</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.state || ''} onChange={(e) => handleEditChange('state', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.state || 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Postal Code</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.postalCode || ''} onChange={(e) => handleEditChange('postalCode', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.postalCode || 'N/A'}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Country</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" value={editForm?.country || ''} onChange={(e) => handleEditChange('country', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{selectedReservation.country || 'N/A'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Booking ID</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900 font-mono">{selectedReservation.bookingId}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Reservation Date</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{formatDateForDisplay(selectedReservation.reservationDate)}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Check In</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" type="date" value={editForm?.checkIn || ''} onChange={(e) => handleEditChange('checkIn', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{formatDateForDisplay(selectedReservation.checkIn)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Check Out</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="mt-1" type="date" value={editForm?.checkOut || ''} onChange={(e) => handleEditChange('checkOut', e.target.value)} />
                        ) : (
                          <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                            <span className="text-sm text-gray-900">{formatDateForDisplay(selectedReservation.checkOut)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">No. of Days</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.noOfDays}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Resort</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.resortName}</span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Cottage Types</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.cottageTypeNames.join(', ') || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Rooms</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.roomNames.join(', ') || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Details */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Guest Details</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Guests</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="h-12 text-center text-base font-medium" type="number" value={String(editForm?.guests ?? 0)} onChange={(e) => handleEditChange('guests', parseInt(e.target.value) || 0)} />
                        ) : (
                          <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                            <span className="text-base font-medium text-gray-900">{selectedReservation.guests}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Children</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="h-12 text-center text-base font-medium" type="number" value={String(editForm?.children ?? 0)} onChange={(e) => handleEditChange('children', parseInt(e.target.value) || 0)} />
                        ) : (
                          <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                            <span className="text-base font-medium text-gray-900">{selectedReservation.children}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Extra Guests</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="h-12 text-center text-base font-medium" type="number" value={String(editForm?.extraGuests ?? 0)} onChange={(e) => handleEditChange('extraGuests', parseInt(e.target.value) || 0)} />
                        ) : (
                          <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                            <span className="text-base font-medium text-gray-900">{selectedReservation.extraGuests}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Total Guests</Label>
                        <div className="h-12 flex items-center justify-center bg-blue-50 rounded-md border border-blue-200">
                          <span className="text-xl font-bold text-blue-900">{(Number(editForm?.guests || 0) + Number(editForm?.children || 0) + Number(editForm?.extraGuests || 0))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Room Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Room Information</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex flex-col max-w-xs">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Number of Rooms</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="h-12 text-center text-base font-medium" type="number" value={String(editForm?.numberOfRooms ?? 0)} onChange={(e) => handleEditChange('numberOfRooms', parseInt(e.target.value) || 0)} />
                        ) : (
                          <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                            <span className="text-base font-medium text-gray-900">{selectedReservation.numberOfRooms}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Information</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Room Price</Label>
                        <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                          <span className="text-base font-semibold text-gray-900">₹{selectedReservation.roomPrice.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Extra Bed Charges</Label>
                        <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                          <span className="text-base font-semibold text-gray-900">₹{selectedReservation.extraBedCharges.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Total Payable</Label>
                        <div className="h-12 flex items-center justify-center bg-green-50 rounded-md border border-green-200">
                          <span className="text-xl font-bold text-green-900">₹{selectedReservation.totalPayable.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Food & Reservation Source */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Food & Reservation Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Reserved From</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.reservedFrom || 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Food Preference</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.foodPreference || 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Foods Billed</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{(Number(selectedReservation.guests) || 0) + (Number(selectedReservation.extraGuests) || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Status Information</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Reservation Status</Label>
                        {sheetMode === 'edit' ? (
                          <Select value={editForm?.status || ''} onValueChange={(value) => handleEditChange('status', value)}>
                            <SelectTrigger className="h-12 text-base font-medium">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Reserved">Reserved</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Not Reserved">Not Reserved</SelectItem>
                              <SelectItem value="Canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                            <span className="text-base font-medium text-gray-900">{selectedReservation.status}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Payment Status</Label>
                        {sheetMode === 'edit' ? (
                          <Select value={editForm?.paymentStatus || ''} onValueChange={(value) => handleEditChange('paymentStatus', value)}>
                            <SelectTrigger className="h-12 text-base font-medium">
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                            <span className="text-base font-medium text-gray-900">{selectedReservation.paymentStatus}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <Label className="text-xs font-medium text-gray-600 mb-1.5">Refund Percentage</Label>
                        {sheetMode === 'edit' ? (
                          <Input className="h-12 text-center text-base font-medium" type="number" value={String(editForm?.refundPercentage ?? 0)} onChange={(e) => handleEditChange('refundPercentage', parseFloat(e.target.value) || 0)} />
                        ) : (
                          <div className="h-12 flex items-center justify-center bg-gray-50 rounded-md border">
                            <span className="text-base font-medium text-gray-900">{selectedReservation.refundPercentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Amount Payable</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm font-semibold text-gray-900">₹{selectedReservation.totalPayable.toLocaleString()}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Amount Paid</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm font-semibold text-gray-900">₹{selectedReservation.totalPayable.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Payment Transaction Id</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900 font-mono">{selectedReservation.paymentTransactionId || 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Payment Transaction Date & Time</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.paymentTransactionDateTime ? formatDateForDisplay(selectedReservation.paymentTransactionDateTime.slice(0, 10)) : 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Payment Transaction SubBillerId</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Verification Proof Type</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">N/A</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Verification Proof Id</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cancellation & Refund Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation & Refund Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Cancel Booking Reason</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.cancelBookingReason || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Cancellation Message</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.cancellationMessage || 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Refund Requested Date & Time</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.refundRequestedDateTime ? formatDateForDisplay(selectedReservation.refundRequestedDateTime.slice(0, 10)) : 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Date of Refund</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedReservation.dateOfRefund ? formatDateForDisplay(selectedReservation.dateOfRefund.slice(0, 10)) : 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Refundable Amount</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm font-semibold text-gray-900">{selectedReservation.refundableAmount ? `₹${selectedReservation.refundableAmount.toLocaleString()}` : 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Amount Refunded</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm font-semibold text-gray-900">{selectedReservation.amountRefunded ? `₹${selectedReservation.amountRefunded.toLocaleString()}` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Action Buttons */}
              <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-white">
                {sheetMode === 'view' ? (
                  <>
                    <Button
                      onClick={() => {
                        if (!perms.canEdit) return
                        setSheetMode('edit')
                        setEditForm({ ...(selectedReservation as Reservation) })
                      }}
                      className="flex-1"
                      disabled={!perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to edit' : undefined}
                    >
                      Edit Reservation
                    </Button>

                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => { setSheetMode('view') }}>
                      Cancel
                    </Button>
                    <Button
                      onClick={saveChanges}
                      disabled={isSaving || !perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to update' : undefined}
                    >
                      {isSaving ? 'Saving...' : 'Update'}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
