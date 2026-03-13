import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/date-picker";
import { useAdmin } from "@/lib/AdminProvider";
import PageLoader from "@/components/shared/PageLoader";

interface ApprovalReservation {
  id: string;
  bookingId: string;
  fullName: string;
  resortName: string;
  resort: string;
  checkIn: string;
  checkOut: string;
  totalPayable: number;
  createdBy: string;
  approval_status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PENDING_DFO_APPROVAL: {
    label: "Pending Approval",
    color: "bg-amber-100 text-amber-800 border border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const ApprovalsPage = () => {
  const navigate = useNavigate();
  const { isDFO, isSuperAdmin } = useAdmin();
  const [reservations, setReservations] = useState<ApprovalReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resorts, setResorts] = useState<{ _id: string; resortName: string }[]>(
    [],
  );

  // Filters
  const [filterResort, setFilterResort] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("all");
  const [adminUsers, setAdminUsers] = useState<
    { username: string; name: string }[]
  >([]);

  const apiUrl =
    (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

  const formatDate = (val: string) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
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
    return `${String(d.getUTCDate()).padStart(2, "0")} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("admin_token");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [resRes, resortsRes, adminsRes] = await Promise.all([
          fetch(`${apiUrl}/api/reservations`, { headers }),
          fetch(`${apiUrl}/api/resorts`, { headers }),
          fetch(`${apiUrl}/api/admin/users`, { headers }),
        ]);

        const resData = await resRes.json();
        const resortsData = await resortsRes.json();
        const adminsData = await adminsRes.json();

        const resortMap = new Map(
          ((resortsData.resorts || []) as any[]).map((r: any) => [
            r._id,
            r.resortName,
          ]),
        );
        setResorts(resortsData.resorts || []);
        if (adminsData.success) {
          setAdminUsers(adminsData.admins || []);
        }

        const raw: any[] = resData.reservations || resData || [];
        // Only show reservations that have an approval status (created by admin/superadmin)
        const filtered = raw.filter(
          (r) =>
            r.approval_status &&
            ["PENDING_DFO_APPROVAL", "APPROVED", "REJECTED"].includes(
              r.approval_status,
            ),
        );

        const mapped: ApprovalReservation[] = filtered.map((r) => ({
          id: String(r._id || r.id || ""),
          bookingId: r.bookingId || "—",
          fullName: r.fullName || "—",
          resortName: resortMap.get(r.resort) || r.resort || "—",
          resort: r.resort || "",
          checkIn: r.checkIn
            ? new Date(r.checkIn).toISOString().slice(0, 10)
            : "",
          checkOut: r.checkOut
            ? new Date(r.checkOut).toISOString().slice(0, 10)
            : "",
          totalPayable: Number(r.totalPayable) || 0,
          createdBy: r.createdBy || r.createdByName || "—",
          approval_status: r.approval_status || "PENDING_DFO_APPROVAL",
          createdAt: r.createdAt || "",
        }));

        setReservations(mapped);
      } catch (err) {
        console.error("Failed to load approvals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  const filteredReservations = useMemo(() => {
    let data = [...reservations];

    if (filterResort && filterResort !== "all") {
      data = data.filter((r) => r.resort === filterResort);
    }
    if (filterStatus && filterStatus !== "all") {
      data = data.filter((r) => r.approval_status === filterStatus);
    }
    if (filterDateFrom) {
      data = data.filter((r) => r.checkIn >= filterDateFrom);
    }
    if (filterDateTo) {
      data = data.filter((r) => r.checkOut <= filterDateTo);
    }
    if (filterCreatedBy && filterCreatedBy !== "all") {
      data = data.filter(
        (r) => r.createdBy.toLowerCase() === filterCreatedBy.toLowerCase(),
      );
    }

    // Sort: PENDING first, then by createdAt desc
    data.sort((a, b) => {
      if (
        a.approval_status === "PENDING_DFO_APPROVAL" &&
        b.approval_status !== "PENDING_DFO_APPROVAL"
      )
        return -1;
      if (
        a.approval_status !== "PENDING_DFO_APPROVAL" &&
        b.approval_status === "PENDING_DFO_APPROVAL"
      )
        return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return data;
  }, [
    reservations,
    filterResort,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    filterCreatedBy,
  ]);

  const pendingCount = reservations.filter(
    (r) => r.approval_status === "PENDING_DFO_APPROVAL",
  ).length;

  if (!isDFO && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-800">
            Access Denied
          </h2>
          <p className="text-slate-500 mt-1">
            Only DFO can access the approvals page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6 text-slate-700" />
            <h1 className="text-2xl font-semibold text-slate-800">
              Booking Approvals
            </h1>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="h-3 w-3" />
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Review and approve bookings created by admin staff
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Resort</Label>
            <Select value={filterResort} onValueChange={setFilterResort}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Resorts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resorts</SelectItem>
                {resorts.map((r) => (
                  <SelectItem key={r._id} value={r._id}>
                    {r.resortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING_DFO_APPROVAL">
                  Pending Approval
                </SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Check-in From</Label>
            <DatePickerField
              value={filterDateFrom}
              onChange={(val) => setFilterDateFrom(val)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Check-out To</Label>
            <DatePickerField
              value={filterDateTo}
              onChange={(val) => setFilterDateTo(val)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Created By</Label>
            <Select value={filterCreatedBy} onValueChange={setFilterCreatedBy}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All admin users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All admin users</SelectItem>
                {adminUsers.map((admin) => (
                  <SelectItem key={admin.username} value={admin.username}>
                    {admin.name || admin.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(filterResort !== "all" ||
          filterStatus !== "all" ||
          filterDateFrom ||
          filterDateTo ||
          filterCreatedBy) && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs text-slate-500"
            onClick={() => {
              setFilterResort("all");
              setFilterStatus("all");
              setFilterDateFrom("");
              setFilterDateTo("");
              setFilterCreatedBy("all");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <PageLoader message="Loading approvals..." />
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No approval requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Booking ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Guest
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Resort
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Check-in
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Check-out
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Created By
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((r) => {
                  const statusMeta =
                    STATUS_LABELS[r.approval_status] ||
                    STATUS_LABELS["PENDING_DFO_APPROVAL"];
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/approvals/${r.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {r.bookingId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {r.fullName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {r.resortName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDate(r.checkIn)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDate(r.checkOut)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        ₹{r.totalPayable.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {r.createdBy}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusMeta.color}`}
                        >
                          {statusMeta.icon}
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/approvals/${r.id}`);
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalsPage;
