import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.js";
import "datatables.net-columncontrol-dt";
import "datatables.net-columncontrol-dt/css/columnControl.dataTables.css";

import { useEffect, useRef, useState } from "react";
import { usePermissions } from "@/lib/AdminProvider";
import PageLoader from "@/components/shared/PageLoader";
import ExportButton from "@/components/shared/ExportButton";
import DataTable from "../dataTable/DataTable";

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
  const perms = usePermissions();
  const tableRef = useRef(null);
  const dtRef = useRef<any>(null);
  const apiUrl =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";
  const [reservationData, setReservationData] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${apiUrl}/api/reports/daily-occupancy/slug/jungle-star`,
        );
        const result = await response.json();

        if (result.success) {
          setReservationData(result.data || []);
        } else {
          console.error("Failed to fetch report data:", result.error);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);



  const d = new Date();
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
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  const today = `${day}/${month}/${year}`;

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

  // const totals = useMemo(() => {
  //   const sum = (field: keyof Reservation) =>
  //     reservationData.reduce((acc, row) => {
  //       if (row.status) return acc;
  //       const value = row[field];
  //       return acc + (typeof value === "number" ? value : 0);
  //     }, 0);

  //   return {
  //     paidAmount: sum("paidAmount"),
  //     guests: sum("guests"),
  //     extraGuests: sum("extraGuests"),
  //     children: sum("children"),
  //     totalGuests: sum("totalGuests"),
  //     totalFoods: sum("totalFoods"),
  //     noOfDays: sum("noOfDays"),
  //     remainingDays: sum("remainingDays"),
  //   };
  // }, [reservationData]);

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
    return <PageLoader message="Loading report data..." />;
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
        <ExportButton
          data={reservationData.filter(row => !row.status)}
          dtRef={dtRef}
          headers={["Room Name", "Booking ID", "Guest Name", "Paid Amount", "Guest(s)", "Extra Guest(s)", "Children", "Total Guests", "Foods Billed", "No. of Days", "Remaining Days"]}
          mapRow={(row: any) => [
            row.roomName,
            row.bookingId || "",
            row.guestName || "",
            row.paidAmount ?? "",
            row.guests ?? "",
            row.extraGuests ?? "",
            row.children ?? "",
            row.totalGuests ?? "",
            row.totalFoods ?? "",
            row.noOfDays ?? "",
            row.remainingDays ?? ""
          ]}
          filename="Daily_Occupancy_Report_JungleStar.csv"
          disabled={!perms.canExport}
        />
      </div>

      <div className="overflow-auto" style={{ position: "relative" }}>
        <div
          ref={tableRef}
          className="w-full"
        // style={{ position: "relative", minWidth: "max-content" }}
        >
          <DataTable
            data={reservationData}
            columns={columns}
            dtRef={dtRef}
          // className="display nowrap"
          // options={{
          //   destroy: true,
          //   pageLength: 25,
          //   lengthMenu: [5, 10, 25, 50, 100],
          //   order: [[0, "asc"]],
          //   searching: true,
          //   paging: true,
          //   info: true,
          //   dom: "Bfrtip",
          //   buttons: [
          //     {
          //       extend: "colvis",
          //       className:
          //         "px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm",
          //       text: "Column Visibility",
          //     },
          //   ],
          // }}
          >
            {/* <thead>
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
            </tfoot> */}
          </DataTable>
        </div>
      </div>
    </div>
  );
}
