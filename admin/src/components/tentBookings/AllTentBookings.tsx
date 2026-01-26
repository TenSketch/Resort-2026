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

import { useEffect, useRef, useState } from "react";
import { usePermissions } from "@/lib/AdminProvider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

DataTable.use(DT);

interface TentBooking {
  _id: string;
  bookingId: string;
  fullName: string;
  phone: string;
  email: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  tentSpot?: { _id: string; spotName: string; location: string } | string;
  tentTypes?: string[];
  tents?: { _id: string; tentId: string; rate: number }[] | string[];
  numberOfTents?: number;
  reservationDate?: string;
  checkinDate?: string;
  checkoutDate?: string;
  guests?: number;
  children?: number;
  status?: string;
  totalPayable?: number;
  tentPrice?: number;
  paymentStatus?: string;
  paymentTransactionId?: string;
  refundPercentage?: number;
}

export default function AllTentBookings() {
  const tableRef = useRef(null);
  const perms = usePermissions();
  const permsRef = useRef(perms);
  const [bookings, setBookings] = useState<TentBooking[]>([]);
  const bookingsRef = useRef<TentBooking[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<TentBooking | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [editForm, setEditForm] = useState<Partial<TentBooking> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const apiUrl =
    (import.meta.env && import.meta.env.VITE_API_URL) ||
    "http://localhost:5000";

  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);
  useEffect(() => {
    permsRef.current = perms;
  }, [perms]);

  const formatDateForDisplay = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
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

  const formatAddress = (b?: TentBooking) => {
    if (!b) return "N/A";
    const parts = [
      b.address1,
      b.address2,
      b.city,
      b.state,
      b.postalCode,
      b.country,
    ].filter(Boolean);
    return parts.join(", ") || "N/A";
  };

  const getTentSpotName = (b: TentBooking) => {
    if (!b.tentSpot) return "N/A";
    if (typeof b.tentSpot === "string") return b.tentSpot;
    return b.tentSpot.spotName || "N/A";
  };

  const getTentIds = (b: TentBooking) => {
    if (!b.tents || b.tents.length === 0) return "N/A";
    return b.tents
      .map((t) => (typeof t === "string" ? t : t.tentId))
      .join(", ");
  };

  const calculateDays = (checkin?: string, checkout?: string) => {
    if (!checkin || !checkout) return 0;
    const d1 = new Date(checkin);
    const d2 = new Date(checkout);
    const diff = d2.getTime() - d1.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/tent-reservations`, { headers });
      const data = await res.json();
      if (data.success && data.reservations) {
        setBookings(data.reservations);
      }
    } catch (err) {
      console.error("Error fetching tent bookings:", err);
    }
  };

  useEffect(() => {
    fetchBookings();

    const handleClick = (e: Event) => {
      const t = e.target as HTMLElement;
      const btn = t.closest(".view-btn, .edit-btn") as HTMLElement | null;
      if (!btn) return;
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const booking = bookingsRef.current.find((b) => b._id === id);
      if (!booking) return;
      
      if (btn.classList.contains("view-btn")) {
        setSelected(booking);
        setSheetMode("view");
        setIsDetailOpen(true);
      } else if (btn.classList.contains("edit-btn")) {
        if (!permsRef.current.canEdit) return;
        setSelected(booking);
        setEditForm({ ...booking });
        setSheetMode("edit");
        setIsDetailOpen(true);
      }
    };

    const handleRowClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(".view-btn, .edit-btn")) return;
      const row = target.closest("tr");
      if (row && row.parentElement?.tagName === "TBODY") {
        const idx = Array.from(row.parentElement.children).indexOf(row);
        const booking = bookingsRef.current[idx];
        if (booking) {
          setSelected(booking);
          setSheetMode("view");
          setIsDetailOpen(true);
        }
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("click", handleRowClick);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleRowClick);
    };
  }, []);

  const columns = [
    {
      title: "<strong>S.No</strong>",
      data: null,
      render: (_d: any, _t: any, _r: any, meta: any) =>
        meta.row + 1 + meta.settings._iDisplayStart,
      orderable: false,
      searchable: false,
    },
    { data: "bookingId", title: "<strong>Booking ID</strong>" },
    { data: "fullName", title: "<strong>Full Name</strong>" },
    { data: "phone", title: "<strong>Phone</strong>" },
    { data: "email", title: "<strong>Email</strong>" },
    {
      data: null,
      title: "<strong>Address</strong>",
      render: (_d: any, _t: any, row: TentBooking) => formatAddress(row),
    },
    {
      data: null,
      title: "<strong>Tent Spot</strong>",
      render: (_d: any, _t: any, row: TentBooking) => getTentSpotName(row),
    },
    {
      data: null,
      title: "<strong>Tents</strong>",
      render: (_d: any, _t: any, row: TentBooking) => getTentIds(row),
    },
    {
      data: null,
      title: "<strong>No. of Tents</strong>",
      render: (_d: any, _t: any, row: TentBooking) =>
        row.numberOfTents || row.tents?.length || 0,
    },
    {
      data: "reservationDate",
      title: "<strong>Reservation Date</strong>",
      render: (d: string) => formatDateForDisplay(d),
    },
    {
      data: "checkinDate",
      title: "<strong>Check In</strong>",
      render: (d: string) => formatDateForDisplay(d),
    },
    {
      data: "checkoutDate",
      title: "<strong>Check Out</strong>",
      render: (d: string) => formatDateForDisplay(d),
    },
    {
      data: null,
      title: "<strong>No. of Days</strong>",
      render: (_d: any, _t: any, row: TentBooking) =>
        calculateDays(row.checkinDate, row.checkoutDate),
    },
    {
      data: "guests",
      title: "<strong>Guests</strong>",
      render: (d: any) => d ?? 0,
    },
    {
      data: "children",
      title: "<strong>Children</strong>",
      render: (d: any) => d ?? 0,
    },
    {
      data: "status",
      title: "<strong>Status</strong>",
      render: (d: any) => d || "N/A",
    },
    {
      data: "totalPayable",
      title: "<strong>Total Payable</strong>",
      render: (d: number) => (d != null ? `₹${d}` : "N/A"),
    },
    {
      data: "paymentStatus",
      title: "<strong>Payment Status</strong>",
      render: (d: any) => d || "N/A",
    },
    {
      data: "paymentTransactionId",
      title: "<strong>Transaction ID</strong>",
      render: (d: any) => d || "N/A",
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_d: any, _t: any, row: TentBooking) => `
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="view-btn" data-id="${row._id}" style="background:#10b981;color:#fff;border:none;padding:6px 10px;border-radius:6px;">View</button>
        ${perms.canEdit ? `<button class="edit-btn" data-id="${row._id}" style="background:#3b82f6;color:#fff;border:none;padding:6px 10px;border-radius:6px;">Edit</button>` : ""}
      </div>
    `,
    },
  ];

  const exportToExcel = () => {
    const formatDateForExcel = (value?: string) => {
      if (!value) return "";
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
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
      "S. No",
      "Booking ID",
      "Full Name",
      "Phone",
      "Email",
      "Address",
      "Tent Spot",
      "Tents",
      "No. of Tents",
      "Reservation Date",
      "Check In",
      "Check Out",
      "No. of Days",
      "Guests",
      "Children",
      "Status",
      "Total Payable",
      "Payment Status",
      "Transaction ID",
    ];

    const csv = [
      headers.join(","),
      ...bookingsRef.current.map((r, i) =>
        [
          i + 1,
          `"${r.bookingId}"`,
          `"${r.fullName}"`,
          `"${r.phone}"`,
          `"${r.email}"`,
          `"${formatAddress(r)}"`,
          `"${getTentSpotName(r)}"`,
          `"${getTentIds(r)}"`,
          r.numberOfTents || r.tents?.length || 0,
          `"'${formatDateForExcel(r.reservationDate)}"`,
          `"'${formatDateForExcel(r.checkinDate)}"`,
          `"'${formatDateForExcel(r.checkoutDate)}"`,
          calculateDays(r.checkinDate, r.checkoutDate),
          r.guests ?? 0,
          r.children ?? 0,
          `"${r.status || ""}"`,
          r.totalPayable ?? 0,
          `"${r.paymentStatus || ""}"`,
          `"${r.paymentTransactionId || ""}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Tent_Bookings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveChanges = async () => {
    if (!permsRef.current.canEdit) return;
    if (!editForm || !selected) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem("admin_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${apiUrl}/api/tent-reservations/${selected._id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(editForm),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      setBookings((prev) =>
        prev.map((b) =>
          b._id === selected._id ? ({ ...b, ...editForm } as TentBooking) : b,
        ),
      );
      setSelected({ ...selected, ...editForm } as TentBooking);
      setSheetMode("view");
      alert("Booking updated successfully");
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save changes: " + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBooking = async (b: TentBooking | null) => {
    if (!permsRef.current.canDisable) return;
    if (!b) return;

    try {
      const token = localStorage.getItem("admin_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/tent-reservations/${b._id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      setBookings((prev) => prev.filter((x) => x._id !== b._id));
      alert("Booking deleted successfully");
    } catch (err) {
      console.error("Delete error", err);
      alert("Failed to delete booking: " + String(err));
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Tent Bookings</h2>
        <button
          onClick={() => (perms.canViewDownload ? exportToExcel() : null)}
          className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${perms.canViewDownload ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : "bg-gray-300 cursor-not-allowed"}`}
          disabled={!perms.canViewDownload}
          title={
            perms.canViewDownload
              ? "Export to Excel"
              : "You do not have permission to download/export"
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
          data={bookings}
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
            scrollY: "520px",
            buttons: [{ extend: "colvis", text: "Column Visibility" }],
            columnControl: [
              "order",
              ["orderAsc", "orderDesc", "spacer", "search"],
            ],
          }}
        />
      </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-[400px] sm:w-[700px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Booking Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected tent booking
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {sheetMode === "view" ? (
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold">
                        Guest Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label>Full Name</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{selected.fullName}</span>
                          </div>
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{selected.phone}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Email</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{selected.email}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Address</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{formatAddress(selected)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold">
                        Booking Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label>Booking ID</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span className="font-mono">
                              {selected.bookingId}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Reservation Date</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>
                              {formatDateForDisplay(selected.reservationDate)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Tent Spot</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{getTentSpotName(selected)}</span>
                          </div>
                        </div>
                        <div>
                          <Label>Tents</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{getTentIds(selected)}</span>
                          </div>
                        </div>
                        <div>
                          <Label>No. of Tents</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border text-center">
                            <span>
                              {selected.numberOfTents ||
                                selected.tents?.length ||
                                0}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>No. of Days</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border text-center">
                            <span>
                              {calculateDays(
                                selected.checkinDate,
                                selected.checkoutDate,
                              )}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Check In</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>
                              {formatDateForDisplay(selected.checkinDate)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Check Out</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>
                              {formatDateForDisplay(selected.checkoutDate)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Guests</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border text-center">
                            <span>{selected.guests ?? 0}</span>
                          </div>
                        </div>
                        <div>
                          <Label>Children</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border text-center">
                            <span>{selected.children ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Status & Payment
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <Label>Status</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{selected.status}</span>
                          </div>
                        </div>
                        <div>
                          <Label>Payment Status</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{selected.paymentStatus}</span>
                          </div>
                        </div>
                        <div>
                          <Label>Total Payable</Label>
                          <div className="mt-1 p-3 bg-green-50 rounded border">
                            <span>
                              ₹{selected.totalPayable?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold">Edit Booking</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label>Full Name</Label>
                          <input
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.fullName || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                fullName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <input
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.phone || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                phone: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Email</Label>
                          <input
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.email || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Check In</Label>
                          <input
                            type="date"
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.checkinDate?.split("T")[0] || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                checkinDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Check Out</Label>
                          <input
                            type="date"
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.checkoutDate?.split("T")[0] || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                checkoutDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Guests</Label>
                          <input
                            type="number"
                            min={1}
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.guests ?? 0}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                guests: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Children</Label>
                          <input
                            type="number"
                            min={0}
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.children ?? 0}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                children: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <select
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.status || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                status: e.target.value,
                              }))
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div>
                          <Label>Payment Status</Label>
                          <select
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.paymentStatus || ""}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                paymentStatus: e.target.value,
                              }))
                            }
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                        <div>
                          <Label>Total Payable</Label>
                          <input
                            type="number"
                            className="mt-1 p-2 w-full border rounded"
                            value={editForm?.totalPayable ?? 0}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                totalPayable: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-white">
                {sheetMode === "view" ? (
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="flex-1">Close</Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSheetMode("view");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveChanges}
                      disabled={isSaving || !perms.canEdit}
                    >
                      {isSaving ? "Saving..." : "Update"}
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
