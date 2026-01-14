import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.js";
import "datatables.net-columncontrol-dt";
import "datatables.net-columncontrol-dt/css/columnControl.dataTables.css";

import { useEffect, useMemo, useRef, useState } from "react";

DataTable.use(DT);

interface Reservation {
  roomName: string;
  status?: string;
  bookingId?: string;
  guestName?: string;
  paidAmount?: number;
  guests?: number;
  extraGuests?: number;
  children?: number;
  totalGuests?: number;
  totalFoods?: number;
  noOfDays?: number;
  remainingDays?: number;
}

export default function DailyOccupancyReport() {
  const tableRef = useRef(null);
  const apiUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';
  const [reservationData, setReservationData] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${apiUrl}/api/reports/daily-occupancy/slug/jungle-star`);
        const result = await response.json();
        
        if (result.success) {
          setReservationData(result.data || []);
        } else {
          console.error('Failed to fetch report data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  // ✅ Export to Excel function
  const exportToExcel = () => {
    const headers = [
      "Room Name",
      "Booking ID",
      "Guest Name",
      "Paid Amount",
      "Guest(s)",
      "Extra Guest(s)",
      "Children",
      "Total Guests",
      "Foods Billed",
      "No. of Days",
      "Remaining Days",
    ];

    const csvRows = [
      headers.join(","),
      ...reservationData
        .filter((row) => !row.status)
        .map((row) =>
          [
            `"${row.roomName}"`,
            `"${row.bookingId || ""}"`,
            `"${row.guestName || ""}"`,
            row.paidAmount ?? "",
            row.guests ?? "",
            row.extraGuests ?? "",
            row.children ?? "",
            row.totalGuests ?? "",
            row.totalFoods ?? "",
            row.noOfDays ?? "",
            row.remainingDays ?? "",
          ].join(",")
        ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Daily_Occupancy_Report_JungleStar.csv");
    link.click();
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .dt-button-collection {
        position: absolute !important;
        z-index: 9999 !important;
        background: white !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
      }
      .dataTables_wrapper .dt-buttons {
        position: relative;
      }
      .dataTables_wrapper {
        position: relative;
      }
      .dt-button-collection.dropdown-menu {
        transform: none !important;
      }
      .dataTables_wrapper tfoot th {
        background-color: #f8f9fa;
        font-weight: bold;
        border-top: 2px solid #dee2e6;
        padding: 8px;
      }
      .dataTables_wrapper tfoot {
        background-color: #f8f9fa;
      }
    `;
    document.head.appendChild(style);

    const handleScroll = () => {
      const collection = document.querySelector(".dt-button-collection");
      if (collection && (collection as HTMLElement).style.display !== "none") {
        (collection as HTMLElement).style.display = "none";
      }
    };

    const scrollContainer = document.querySelector(".overflow-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      document.head.removeChild(style);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const totals = useMemo(() => {
    const sum = (field: keyof Reservation) =>
      reservationData.reduce((acc, row) => {
        if (row.status) return acc;
        const value = row[field];
        return acc + (typeof value === "number" ? value : 0);
      }, 0);

    return {
      paidAmount: sum("paidAmount"),
      guests: sum("guests"),
      extraGuests: sum("extraGuests"),
      children: sum("children"),
      totalGuests: sum("totalGuests"),
      totalFoods: sum("totalFoods"),
      noOfDays: sum("noOfDays"),
      remainingDays: sum("remainingDays"),
    };
  }, [reservationData]);

  const columns: any[] = [
    { title: "Room Name", data: "roomName" },
    {
      title: "Booking ID",
      data: "bookingId",
      defaultContent: "—",
      render: (_data: any, _type: string, row: Reservation) =>
        row.status ? "—" : row.bookingId || "—",
    },
    {
      title: "Guest Name",
      data: "guestName",
      defaultContent: "—",
      render: (_data: any, _type: string, row: Reservation) =>
        row.status ? "—" : row.guestName || "—",
    },
    {
      title: "Paid Amount",
      data: "paidAmount",
      defaultContent: "—",
      render: (data: any, _type: string, row: Reservation) =>
        row.status ? "—" : data ? `₹${data.toLocaleString()}` : "—",
    },
    {
      title: "Guest(s)",
      data: "guests",
      defaultContent: "—",
      render: (data: any, _type: string, row: Reservation) =>
        row.status ? "—" : data || "—",
    },
    {
      title: "Extra Guest(s)",
      data: "extraGuests",
      defaultContent: "—",
      render: (data: any, _type: string, row: Reservation) =>
        row.status ? "—" : data || "—",
    },
    {
      title: "Children",
      data: "children",
      defaultContent: "—",
      render: (data: any, _type: string, row: Reservation) =>
        row.status ? "—" : data || "—",
    },
    {
      title: "Total Guests",
      data: "totalGuests",
      defaultContent: "—",
      render: (data: any, _type: string, row: Reservation) =>
        row.status ? "—" : data || "—",
    },
    {
      title: "Foods Billed",
      data: "totalFoods",
      defaultContent: "—",
      render: (data: any, _type: string, row: Reservation) =>
        row.status ? "—" : data || "—",
    },
    {
      title: "No. of Days",
      data: "noOfDays",
      defaultContent: "—",
      render: (data: any, _type: string, row: Reservation) =>
        row.status ? "—" : data || "—",
    },
    {
      title: "Remaining Days",
      data: "remainingDays",
      defaultContent: "—",
      render: (data: any, _type: string, row: Reservation) =>
        row.status ? "—" : data || "—",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-1">
            Today's Occupancy Report – JungleStar
          </h2>
          <p className="text-sm text-gray-500">Today: {today}</p>
        </div>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to Excel
        </button>
      </div>

      <div className="overflow-auto" style={{ position: "relative" }}>
        <div ref={tableRef} style={{ position: "relative", minWidth: "max-content" }}>
          <DataTable
            data={reservationData}
            columns={columns}
            className="display nowrap"
            options={{
              destroy: true,
              pageLength: 10,
              lengthMenu: [5, 10, 25, 50, 100],
              order: [[0, "asc"]],
              searching: false,
              paging: false,
              info: false,
              dom: "Bfrtip",
              columnControl: [["orderAsc", "orderDesc", "spacer", "search"]],
            }}
          >
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Booking ID</th>
                <th>Guest Name</th>
                <th>Paid Amount</th>
                <th>Guest(s)</th>
                <th>Extra Guest(s)</th>
                <th>Children</th>
                <th>Total Guests</th>
                <th>Foods Billed</th>
                <th>No. of Days</th>
                <th>Remaining Days</th>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <th>Total</th>
                <th>—</th>
                <th>—</th>
                <th>{totals.paidAmount.toLocaleString()}</th>
                <th>{totals.guests}</th>
                <th>{totals.extraGuests}</th>
                <th>{totals.children}</th>
                <th>{totals.totalGuests}</th>
                <th>{totals.totalFoods}</th>
                <th>{totals.noOfDays}</th>
                <th>{totals.remainingDays}</th>
              </tr>
            </tfoot>
          </DataTable>
        </div>
      </div>
    </div>
  );
}
