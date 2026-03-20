import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.js";
import "datatables.net-columncontrol";
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
import PageLoader from "@/components/shared/PageLoader";

DataTable.use(DT);

interface TouristBooking {
  id: string;
  _id: string;
  bookingId: string;
  fullName: string;
  phone: string;
  email: string;
  touristSpots?: Array<{
    spotId: string;
    name: string;
    visitDate: string;
    counts: {
      guests: number;
      cameras: number;
    };
    amounts: {
      entry: number;
      camera: number;
      total: number;
    };
  }>;
  totalPayable?: number;
  status?: string;
  paymentStatus?: string;
  reservationDate?: string;
  reservedFrom?: string;
  user?: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export default function AllTouristBookings() {
  const tableRef = useRef(null);
  const dtRef = useRef<any>(null);
  const perms = usePermissions();
  const permsRef = useRef(perms);
  const [bookings, setBookings] = useState<TouristBooking[]>([]);
  const bookingsRef = useRef<TouristBooking[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<TouristBooking | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [editForm, setEditForm] = useState<Partial<TouristBooking> | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const formatVisitors = (b?: TouristBooking) => {
    if (!b || !b.touristSpots || b.touristSpots.length === 0) return "N/A";
    const totalGuests = b.touristSpots.reduce(
      (sum, spot) => sum + (spot.counts?.guests || 0),
      0,
    );
    const totalCameras = b.touristSpots.reduce(
      (sum, spot) => sum + (spot.counts?.cameras || 0),
      0,
    );
    return `${totalGuests}G / ${totalCameras}C`;
  };

  const getTouristSpotNames = (b?: TouristBooking) => {
    if (!b || !b.touristSpots || b.touristSpots.length === 0) return "N/A";
    return b.touristSpots.map((s) => s.name).join(", ");
  };

  const getVisitDate = (b?: TouristBooking) => {
    if (!b || !b.touristSpots || b.touristSpots.length === 0) return "";
    return b.touristSpots[0].visitDate;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const apiUrl =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("admin_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/trek-reservations/all-bookings`, {
        headers,
      });
      const data = await res.json();

      console.log("API Response:", data); // Debug log

      // Handle different response formats
      let reservations = [];
      if (data.success && Array.isArray(data.bookings)) {
        reservations = data.bookings;
      } else if (data.success && Array.isArray(data.reservations)) {
        reservations = data.reservations;
      } else if (Array.isArray(data.data)) {
        reservations = data.data;
      } else if (Array.isArray(data)) {
        reservations = data;
      } else {
        console.warn("Unexpected response format:", data);
        setBookings([]);
        return;
      }

      console.log("Found reservations:", reservations.length); // Debug log

      const mapped = reservations.map((r: any) => ({
        id: r._id,
        _id: r._id,
        bookingId: r.bookingId,
        fullName: r.user?.name || "N/A",
        phone: r.user?.phone || "N/A",
        email: r.user?.email || "N/A",
        touristSpots: r.touristSpots || [],
        totalPayable: r.totalPayable || 0,
        status: r.status || "pending",
        paymentStatus: r.paymentStatus || "unpaid",
        reservationDate: r.reservationDate || r.createdAt,
        reservedFrom: r.reservedFrom || "Online",
        user: r.user || {},
      }));

      console.log("Mapped bookings:", mapped); // Debug log
      setBookings(mapped);
    } catch (err) {
      console.error("Failed to fetch trek bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const handleButtonClick = (e: Event) => {
      const t = e.target as HTMLElement;
      const btn = t.closest(".view-btn, .edit-btn") as HTMLElement | null;
      if (!btn) return;
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const booking = bookingsRef.current.find((b) => b.id === id);
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

    document.addEventListener("click", handleButtonClick);
    document.addEventListener("click", handleRowClick);
    return () => {
      document.removeEventListener("click", handleButtonClick);
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
      title: "<strong>Trek Spots</strong>",
      render: (_d: any, _t: any, row: TouristBooking) =>
        getTouristSpotNames(row),
    },
    {
      data: null,
      title: "<strong>Visit Date</strong>",
      render: (_d: any, _t: any, row: TouristBooking) =>
        formatDateForDisplay(getVisitDate(row)),
    },
    {
      data: null,
      title: "<strong>Visitors (G/C)</strong>",
      render: (_d: any, _t: any, row: TouristBooking) => formatVisitors(row),
    },
    { data: "reservedFrom", title: "<strong>Reserved From</strong>" },
    {
      data: "reservationDate",
      title: "<strong>Reservation Date</strong>",
      render: (d: string) => formatDateForDisplay(d),
    },
    {
      data: "status",
      title: "<strong>Status</strong>",
      render: (d: string) => {
        const colors: Record<string, string> = {
          Reserved: "bg-green-100 text-green-800",
          Pending: "bg-yellow-100 text-yellow-800",
          Cancelled: "bg-red-100 text-red-800",
          "not-reserved": "bg-gray-100 text-gray-800",
        };
        const color = colors[d] || "bg-gray-100 text-gray-800";
        return `<span class="px-2 py-1 rounded text-xs font-medium ${color}">${d}</span>`;
      },
    },
    {
      data: "totalPayable",
      title: "<strong>Amount</strong>",
      render: (d: number) => (d != null ? `₹${d.toLocaleString()}` : "N/A"),
    },
    {
      data: "paymentStatus",
      title: "<strong>Payment</strong>",
      render: (d: string) => {
        const colors: Record<string, string> = {
          Paid: "bg-green-100 text-green-800",
          Unpaid: "bg-red-100 text-red-800",
          Pending: "bg-yellow-100 text-yellow-800",
          Cancelled: "bg-gray-100 text-gray-800",
        };
        const color = colors[d] || "bg-gray-100 text-gray-800";
        return `<span class="px-2 py-1 rounded text-xs font-medium ${color}">${d}</span>`;
      },
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_d: any, _t: any, row: TouristBooking) => `
      <div style="display:flex;gap:8px;align-items:center;justify-content:center;">
        <button 
          class="view-btn" 
          data-id="${row.id}" 
          title="View Booking"
          style="
            background:#10b981;
            color:white;
            border:none;
            padding:6px 12px;
            border-radius:6px;
            font-size:12px;
            font-weight:500;
            cursor:pointer;
            transition:all 0.2s ease;
            box-shadow:0 1px 3px rgba(0,0,0,0.1);
          "
          onmouseover="this.style.background='#059669';this.style.transform='translateY(-1px)';this.style.boxShadow='0 2px 6px rgba(0,0,0,0.15)'"
          onmouseout="this.style.background='#10b981';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'"
        >
          View
        </button>
        ${
          perms.canEdit
            ? `
        <button 
          class="edit-btn" 
          data-id="${row.id}" 
          title="Edit Booking"
          style="
            background:#3b82f6;
            color:white;
            border:none;
            padding:6px 12px;
            border-radius:6px;
            font-size:12px;
            font-weight:500;
            cursor:pointer;
            transition:all 0.2s ease;
            box-shadow:0 1px 3px rgba(0,0,0,0.1);
          "
          onmouseover="this.style.background='#2563eb';this.style.transform='translateY(-1px)';this.style.boxShadow='0 2px 6px rgba(0,0,0,0.15)'"
          onmouseout="this.style.background='#3b82f6';this.style.transform='translateY(0)';this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'"
        >
          Edit
        </button>
        `
            : ""
        }
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
      "Trek Spots",
      "Visit Date",
      "Guests",
      "Cameras",
      "Reserved From",
      "Reservation Date",
      "Status",
      "Amount",
      "Payment Status",
    ];

    const dtApi = (dtRef.current as any)?.dt?.();
    const dataToExport: TouristBooking[] = dtApi
      ? dtApi.rows({ search: "applied" }).data().toArray()
      : bookingsRef.current;

    const csv = [
      headers.join(","),
      ...dataToExport.map((r, i) => {
        const guests =
          r.touristSpots?.reduce(
            (sum, s) => sum + (s.counts?.guests || 0),
            0,
          ) || 0;
        const cameras =
          r.touristSpots?.reduce(
            (sum, s) => sum + (s.counts?.cameras || 0),
            0,
          ) || 0;
        const spotNames =
          r.touristSpots?.map((s) => s.name).join("; ") || "N/A";
        const visitDate = r.touristSpots?.[0]?.visitDate || "";

        return [
          i + 1,
          `"${r.bookingId}"`,
          `"${r.fullName}"`,
          `"${r.phone}"`,
          `"${r.email}"`,
          `"${spotNames}"`,
          `"${formatDateForExcel(visitDate)}"`,
          guests,
          cameras,
          `"${r.reservedFrom || ""}"`,
          `"${formatDateForExcel(r.reservationDate)}"`,
          `"${r.status || ""}"`,
          r.totalPayable || 0,
          `"${r.paymentStatus || ""}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Trek_Spot_Bookings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveChanges = async () => {
    if (!permsRef.current.canEdit) return;
    if (!editForm || !selected) return;
    setIsSaving(true);
    try {
      const apiUrl =
        (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("admin_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Update only the fields that can be edited
      const updateData = {
        status: editForm.status,
        paymentStatus: editForm.paymentStatus,
        totalPayable: editForm.totalPayable,
        user: {
          name: editForm.fullName,
          phone: editForm.phone,
          email: editForm.email,
        },
      };

      const res = await fetch(
        `${apiUrl}/api/trek-reservations/${selected._id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(updateData),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update booking");
      }

      await res.json();

      // Update local state
      const updated: TouristBooking = {
        ...selected,
        fullName: editForm.fullName || selected.fullName,
        phone: editForm.phone || selected.phone,
        email: editForm.email || selected.email,
        status: editForm.status || selected.status,
        paymentStatus: editForm.paymentStatus || selected.paymentStatus,
        totalPayable: editForm.totalPayable ?? selected.totalPayable,
      };

      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      );
      setSelected(updated);
      setSheetMode("view");
      setIsSaving(false);
      alert("Booking updated successfully!");
    } catch (err) {
      console.error("Save error", err);
      alert("Failed to save changes: " + String(err));
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <style>{`
        @media (max-width: 768px) {
          .tourist-bookings-table-container .dt-layout-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }

          .tourist-bookings-table-container .dt-layout-cell {
            display: inline-flex !important;
            align-items: center !important;
            flex-wrap: nowrap !important;
          }

          .tourist-bookings-table-container .dt-layout-start {
            order: 1 !important;
          }

          .tourist-bookings-table-container .dt-layout-end {
            order: 2 !important;
            margin-left: auto !important;
          }

          .tourist-bookings-table-container .dt-buttons {
            display: inline-flex !important;
          }

          .tourist-bookings-table-container .dt-buttons button {
            font-size: 11px !important;
            padding: 4px 8px !important;
            white-space: nowrap !important;
          }

          .tourist-bookings-table-container .dt-search {
            display: inline-flex !important;
            align-items: center !important;
          }

          .tourist-bookings-table-container .dt-search input {
            font-size: 10px !important;
            padding: 4px 6px !important;
            width: 140px !important;
          }

          .tourist-bookings-table-container .dt-length {
            order: 3 !important;
            flex-basis: 100% !important;
            margin-top: 8px !important;
          }

          .tourist-bookings-table-container .dt-length select {
            font-size: 11px !important;
            padding: 4px 6px !important;
          }

          .tourist-bookings-table-container .dt-length label {
            font-size: 11px !important;
          }

          .tourist-bookings-table-container .dt-paging {
            order: 4 !important;
            flex-basis: 100% !important;
            margin-top: 8px !important;
            display: flex !important;
            justify-content: flex-end !important;
          }

          .tourist-bookings-table-container .dt-paging button {
            font-size: 10px !important;
            padding: 4px 8px !important;
          }

          .tourist-bookings-table-container .dt-info {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Trek Spot Bookings
        </h2>
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

      <div ref={tableRef} className="tourist-bookings-table-container w-full">
        {loading && <PageLoader message="Loading Trek Bookings..." />}
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
              Complete information about the selected booking
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
                        {selected.user?.address && (
                          <div className="md:col-span-2">
                            <Label>Address</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded border">
                              <span>{selected.user.address}</span>
                              {selected.user.city && `, ${selected.user.city}`}
                              {selected.user.state &&
                                `, ${selected.user.state}`}
                              {selected.user.country &&
                                ` - ${selected.user.country}`}
                            </div>
                          </div>
                        )}
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
                          <Label>Reserved From</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span>{selected.reservedFrom}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trek Spots Details */}
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold mb-3">Trek Spots</h3>
                      {selected.touristSpots &&
                      selected.touristSpots.length > 0 ? (
                        selected.touristSpots.map((spot, idx) => (
                          <div
                            key={idx}
                            className="mb-4 p-4 bg-slate-50 rounded-lg border"
                          >
                            <h4 className="font-medium text-slate-800 mb-2">
                              {idx + 1}. {spot.name}
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <Label className="text-xs">Visit Date</Label>
                                <div className="mt-1">
                                  {formatDateForDisplay(spot.visitDate)}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Guests</Label>
                                <div className="mt-1">
                                  {spot.counts?.guests || 0}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Cameras</Label>
                                <div className="mt-1">
                                  {spot.counts?.cameras || 0}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Entry Fees</Label>
                                <div className="mt-1">
                                  ₹{spot.amounts?.entry || 0}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Camera Fees</Label>
                                <div className="mt-1">
                                  ₹{spot.amounts?.camera || 0}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Spot Total</Label>
                                <div className="mt-1 font-semibold">
                                  ₹{spot.amounts?.total || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500">
                          No trek spots information
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold">
                        Status & Payment
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <Label>Status</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span className="capitalize">
                              {selected.status}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Payment Status</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <span className="capitalize">
                              {selected.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label>Total Amount</Label>
                          <div className="mt-1 p-3 bg-green-50 rounded border">
                            <span className="font-semibold text-green-700">
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
                            <option value="reserved">Reserved</option>
                            <option value="pending">Pending</option>
                            <option value="not-reserved">Not Reserved</option>
                            <option value="cancelled">Cancelled</option>
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
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <Label>Total Amount</Label>
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
                      onClick={() => {
                        if (!perms.canEdit) return;
                        setSheetMode("edit");
                        setEditForm({ ...selected });
                      }}
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
