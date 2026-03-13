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
import { DatePickerField } from "@/components/ui/date-picker";
import PageLoader from "@/components/shared/PageLoader";

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
  const dtRef = useRef<any>(null);
  const perms = usePermissions();
  const permsRef = useRef(perms);
  const [bookings, setBookings] = useState<TentBooking[]>([]);
  const bookingsRef = useRef<TentBooking[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<TentBooking | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [editForm, setEditForm] = useState<Partial<TentBooking> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl =
    (import.meta.env && import.meta.env.VITE_API_URL) ||
    "http://localhost:5000";

  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);
  useEffect(() => {
    permsRef.current = perms;
  }, [perms]);

  // Sync editForm with selected booking
  useEffect(() => {
    if (selected) {
      setEditForm({ ...selected });
    } else {
      setEditForm(null);
    }
  }, [selected]);

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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

    const dtApi = (dtRef.current as any)?.dt?.();
    const dataToExport: TentBooking[] = dtApi
      ? dtApi.rows({ search: "applied" }).data().toArray()
      : bookingsRef.current;

    const csv = [
      headers.join(","),
      ...dataToExport.map((r, i) =>
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

  return (
    <div className="w-full max-w-full overflow-hidden">
      <style>{`
        @media (max-width: 768px) {
          .tent-bookings-table-container .dt-layout-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }

          .tent-bookings-table-container .dt-layout-cell {
            display: inline-flex !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
          }

          .tent-bookings-table-container .dt-layout-start {
            order: 1 !important;
          }

          .tent-bookings-table-container .dt-layout-end {
            order: 2 !important;
            margin-left: auto !important;
          }

          .tent-bookings-table-container .dt-buttons {
            display: inline-flex !important;
          }

          .tent-bookings-table-container .dt-buttons button {
            font-size: 11px !important;
            padding: 4px 8px !important;
            white-space: nowrap !important;
          }

          .tent-bookings-table-container .dt-search {
            display: inline-flex !important;
            align-items: center !important;
          }

          .tent-bookings-table-container .dt-search input {
            font-size: 10px !important;
            padding: 4px 6px !important;
            width: 140px !important;
          }

          .tent-bookings-table-container .dt-length {
            order: 3 !important;
            flex-basis: 100% !important;
            margin-top: 8px !important;
          }

          .tent-bookings-table-container .dt-length select {
            font-size: 11px !important;
            padding: 4px 6px !important;
          }

          .tent-bookings-table-container .dt-length label {
            font-size: 11px !important;
          }

          .tent-bookings-table-container .dt-paging {
            order: 4 !important;
            flex-basis: 100% !important;
            margin-top: 8px !important;
            display: flex !important;
            justify-content: flex-end !important;
          }

          .tent-bookings-table-container .dt-paging button {
            font-size: 10px !important;
            padding: 4px 8px !important;
          }

          .tent-bookings-table-container .dt-info {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Tent Bookings</h2>
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

      <div ref={tableRef} className="tent-bookings-table-container w-full">
        {isLoading && <PageLoader message="Loading tent bookings..." />}
        <DataTable
          ref={dtRef}
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
            layout: {
              topStart: "buttons",
              topEnd: "search",
              bottomStart: "pageLength",
              bottomEnd: "paging",
            },
            buttons: [
              {
                extend: "colvis",
                text: "Column Visibility",
                collectionLayout: "fixed two-column",
                collection: {
                  appendTo: "body",
                },
              },
            ],
            columnControl: [
              "order",
              ["orderAsc", "orderDesc", "spacer", "search"],
            ],
            initComplete: function () {
              const wrapper = (this as any).api().table().container();
              const topRow = wrapper.querySelector(
                ".dt-layout-row:first-child",
              );
              if (topRow && !topRow.querySelector(".reset-filters-btn")) {
                const btn = document.createElement("button");
                btn.className = "reset-filters-btn";
                btn.textContent = "Reset Filters";
                btn.style.cssText =
                  "padding:6px 16px;border-radius:6px;border:1px solid #cbd5e1;background:#f8fafc;color:#334155;font-size:13px;font-weight:500;cursor:pointer;margin-left:8px;transition:all .15s ease;";
                btn.onmouseenter = () => {
                  btn.style.background = "#e2e8f0";
                };
                btn.onmouseleave = () => {
                  btn.style.background = "#f8fafc";
                };
                btn.onclick = () => {
                  const api = (this as any).api();
                  const container = api.table().container();

                  // 1. Clear global search and column searches
                  api.search("").columns().search("");

                  // 2. Clear Column Control plugin filters (API method)
                  if (api.columns().ccSearchClear) {
                    (api.columns() as any).ccSearchClear();
                  }

                  // 3. Clear all inputs and trigger events to sync UI
                  container.querySelectorAll("input").forEach((input: any) => {
                    input.value = "";
                    input.dispatchEvent(new Event("input", { bubbles: true }));
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                  });

                  // 4. Clear all selects and trigger events
                  container
                    .querySelectorAll("select")
                    .forEach((select: any) => {
                      if (select.options.length > 0) {
                        select.selectedIndex = 0;
                        select.dispatchEvent(
                          new Event("change", { bubbles: true }),
                        );
                      }
                    });

                  // 5. Force remove active state from column header buttons
                  container
                    .querySelectorAll(".dtcc-button_active")
                    .forEach((btn: any) => {
                      btn.classList.remove("dtcc-button_active");
                    });

                  // 6. Draw once to sync everything
                  api.draw();
                };
                topRow.appendChild(btn);
              }
            },
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div>
                          <Label className="text-xs">Full Name</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            <span className="text-sm">{selected.fullName}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Phone</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            <span className="text-sm">{selected.phone}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs">Email</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            <span className="text-sm">{selected.email}</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs">Address</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border">
                            <span className="text-sm">
                              {formatAddress(selected)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold">
                        Booking Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div>
                          <Label className="text-xs">Booking ID</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm font-mono">
                              {selected.bookingId}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Reservation Date</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {formatDateForDisplay(selected.reservationDate)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Tent Spot</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {getTentSpotName(selected)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Tents</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {getTentIds(selected)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">No. of Tents</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {selected.numberOfTents ||
                                selected.tents?.length ||
                                0}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">No. of Days</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {calculateDays(
                                selected.checkinDate,
                                selected.checkoutDate,
                              )}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Check In</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {formatDateForDisplay(selected.checkinDate)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Check Out</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {formatDateForDisplay(selected.checkoutDate)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Guests</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {selected.guests ?? 0}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Children</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {selected.children ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Status & Payment
                      </h3>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        <div>
                          <Label className="text-xs">Status</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">{selected.status}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Payment Status</Label>
                          <div className="mt-1 p-2 bg-gray-50 rounded border text-center">
                            <span className="text-sm">
                              {selected.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Total Payable</Label>
                          <div className="mt-1 p-2 bg-green-50 rounded border text-center">
                            <span className="text-sm font-semibold">
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
                          <DatePickerField
                            value={editForm?.checkinDate?.split("T")[0] || ""}
                            onChange={(val) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                checkinDate: val,
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Check Out</Label>
                          <DatePickerField
                            value={editForm?.checkoutDate?.split("T")[0] || ""}
                            onChange={(val) =>
                              setEditForm((prev) => ({
                                ...(prev || {}),
                                checkoutDate: val,
                              }))
                            }
                            className="mt-1"
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
                            <option value="Pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
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
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Failed">Failed</option>
                            <option value="Refunded">Refunded</option>
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
                      onClick={() => setIsDetailOpen(false)}
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
                        if (selected) {
                          setEditForm({ ...selected });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveChanges}
                      disabled={isSaving || !perms.canEdit}
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
                      onClick={() => setIsDetailOpen(false)}
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
  );
}
