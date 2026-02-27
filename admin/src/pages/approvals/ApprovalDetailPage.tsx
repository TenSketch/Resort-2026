import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  CalendarDays,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdmin } from "@/lib/AdminProvider";

interface FullReservation {
  id: string;
  bookingId: string;
  // Guest info
  fullName: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  // Booking info
  resortName: string;
  resort: string;
  roomNames: string[];
  checkIn: string;
  checkOut: string;
  guests: number;
  extraGuests: number;
  children: number;
  numberOfRooms: number;
  noOfDays: number;
  // Amount
  roomPrice: number;
  extraBedCharges: number;
  totalPayable: number;
  // Approval
  approval_status: string;
  approved_by?: string;
  approved_at?: string;
  final_amount?: number;
  discount?: number;
  approval_remarks?: string;
  createdBy?: string;
  createdAt?: string;
  status: string;
}

const ApprovalDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDFO, isSuperAdmin } = useAdmin();

  const [reservation, setReservation] = useState<FullReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // DFO editable fields
  const [finalAmount, setFinalAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [remarks, setRemarks] = useState("");

  // Action state
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

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
    if (!id) return;
    const fetchReservation = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("admin_token");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [resRes, resortsRes, roomsRes] = await Promise.all([
          fetch(`${apiUrl}/api/reservations/${id}`, { headers }),
          fetch(`${apiUrl}/api/resorts`, { headers }),
          fetch(`${apiUrl}/api/rooms`, { headers }),
        ]);

        if (resRes.status === 404) {
          setNotFound(true);
          return;
        }

        const resData = await resRes.json();
        const resortsData = await resortsRes.json();
        const roomsData = await roomsRes.json();

        const r = resData.reservation || resData;
        if (!r || !r._id) {
          setNotFound(true);
          return;
        }

        const resortMap = new Map(
          ((resortsData.resorts || []) as any[]).map((x: any) => [
            x._id,
            x.resortName,
          ]),
        );
        const roomMap = new Map(
          ((roomsData.rooms || []) as any[]).map((x: any) => [
            x._id,
            x.roomName || x.roomId || x.roomNumber,
          ]),
        );

        let noOfDays = 0;
        if (r.checkIn && r.checkOut) {
          const d1 = new Date(r.checkIn);
          const d2 = new Date(r.checkOut);
          d1.setUTCHours(0, 0, 0, 0);
          d2.setUTCHours(0, 0, 0, 0);
          noOfDays = Math.max(
            1,
            Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)),
          );
        }

        const mapped: FullReservation = {
          id: String(r._id || r.id),
          bookingId: r.bookingId || "—",
          fullName: r.fullName || "—",
          phone: r.phone || "—",
          email: r.email || "—",
          address1: r.address1 || "",
          address2: r.address2 || "",
          city: r.city || "",
          state: r.state || "",
          postalCode: r.postalCode || "",
          country: r.country || "",
          resortName: resortMap.get(r.resort) || r.resort || "—",
          resort: r.resort || "",
          roomNames: Array.isArray(r.rooms)
            ? r.rooms.map((rid: string) => roomMap.get(rid) || rid)
            : [],
          checkIn: r.checkIn
            ? new Date(r.checkIn).toISOString().slice(0, 10)
            : "",
          checkOut: r.checkOut
            ? new Date(r.checkOut).toISOString().slice(0, 10)
            : "",
          guests: Number(r.guests) || 0,
          extraGuests: Number(r.extraGuests) || 0,
          children: Number(r.children) || 0,
          numberOfRooms: Number(r.numberOfRooms) || 0,
          noOfDays,
          roomPrice: Number(r.roomPrice) || 0,
          extraBedCharges: Number(r.extraBedCharges) || 0,
          totalPayable: Number(r.totalPayable) || 0,
          approval_status: r.approval_status || "",
          approved_by: r.approved_by || "",
          approved_at: r.approved_at || "",
          final_amount: r.final_amount,
          discount: r.discount,
          approval_remarks: r.approval_remarks || "",
          createdBy: r.createdBy || r.createdByName || "",
          createdAt: r.createdAt || "",
          status: r.status || "",
        };

        setReservation(mapped);
        setFinalAmount(String(r.final_amount ?? r.totalPayable ?? ""));
        setDiscount(String(r.discount ?? ""));
        setRemarks(r.approval_remarks || "");
      } catch (err) {
        console.error("Failed to load reservation:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchReservation();
  }, [id, apiUrl]);

  const handleApprove = async () => {
    if (!reservation) return;
    setActionError("");
    setIsApproving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload: any = {};
      if (finalAmount) payload.final_amount = Number(finalAmount);
      if (discount) payload.discount = Number(discount);
      if (remarks) payload.approval_remarks = remarks;

      // Try dedicated approve endpoint first, fall back to PATCH
      let res = await fetch(
        `${apiUrl}/api/reservations/${reservation.id}/approve`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        },
      );

      if (res.status === 404) {
        // Fallback: use generic PATCH with approval fields
        res = await fetch(`${apiUrl}/api/reservations/${reservation.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            ...payload,
            approval_status: "APPROVED",
            status: "Reserved",
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error || errData?.message || "Failed to approve",
        );
      }

      setActionSuccess("✅ Booking approved successfully! Room is confirmed.");
      setReservation((prev) =>
        prev ? { ...prev, approval_status: "APPROVED" } : prev,
      );
    } catch (err: any) {
      setActionError(err?.message || String(err));
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!reservation) return;
    if (!remarks.trim()) {
      setActionError("Remarks are mandatory when rejecting a booking.");
      return;
    }
    setActionError("");
    setIsRejecting(true);
    try {
      const token = localStorage.getItem("admin_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = { approval_remarks: remarks };

      // Try dedicated reject endpoint first, fall back to PATCH
      let res = await fetch(
        `${apiUrl}/api/reservations/${reservation.id}/reject`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload),
        },
      );

      if (res.status === 404) {
        res = await fetch(`${apiUrl}/api/reservations/${reservation.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            ...payload,
            approval_status: "REJECTED",
            status: "Not-Reserved",
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.error || errData?.message || "Failed to reject",
        );
      }

      setActionSuccess("❌ Booking rejected. Room has been released.");
      setReservation((prev) =>
        prev ? { ...prev, approval_status: "REJECTED" } : prev,
      );
    } catch (err: any) {
      setActionError(err?.message || String(err));
    } finally {
      setIsRejecting(false);
    }
  };

  const isPending = reservation?.approval_status === "PENDING_DFO_APPROVAL";
  const canAct = (isDFO || isSuperAdmin) && isPending;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
      </div>
    );
  }

  if (notFound || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-slate-800">
            Booking Not Found
          </h2>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => navigate("/approvals")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Approvals
          </Button>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING_DFO_APPROVAL: "bg-amber-100 text-amber-800 border border-amber-200",
    APPROVED: "bg-green-100 text-green-800 border border-green-200",
    REJECTED: "bg-red-100 text-red-800 border border-red-200",
  };
  const statusIcons: Record<string, React.ReactNode> = {
    PENDING_DFO_APPROVAL: <Clock className="h-3.5 w-3.5" />,
    APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
    REJECTED: <XCircle className="h-3.5 w-3.5" />,
  };
  const statusLabels: Record<string, string> = {
    PENDING_DFO_APPROVAL: "Pending DFO Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/approvals")}
          className="mb-4 -ml-1 text-slate-600"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Approvals
        </Button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Booking Approval
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-mono">
              {reservation.bookingId}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[reservation.approval_status] || "bg-slate-100 text-slate-700"}`}
          >
            {statusIcons[reservation.approval_status]}
            {statusLabels[reservation.approval_status] ||
              reservation.approval_status}
          </span>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* 1. Guest Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Guest Details</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoField label="Full Name" value={reservation.fullName} />
            <InfoField label="Phone" value={reservation.phone} />
            <InfoField label="Email" value={reservation.email} />
            <InfoField label="City" value={reservation.city || "—"} />
            <InfoField label="State" value={reservation.state || "—"} />
            <InfoField label="Country" value={reservation.country || "—"} />
            {(reservation.address1 || reservation.address2) && (
              <div className="col-span-2 md:col-span-3">
                <InfoField
                  label="Address"
                  value={
                    [reservation.address1, reservation.address2]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. Booking Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">Booking Details</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoField label="Resort" value={reservation.resortName} />
            <InfoField
              label="Rooms"
              value={reservation.roomNames.join(", ") || "—"}
            />
            <InfoField
              label="No. of Rooms"
              value={String(reservation.numberOfRooms)}
            />
            <InfoField
              label="Check-in"
              value={formatDate(reservation.checkIn)}
            />
            <InfoField
              label="Check-out"
              value={formatDate(reservation.checkOut)}
            />
            <InfoField
              label="No. of Nights"
              value={String(reservation.noOfDays)}
            />
            <InfoField label="Guests" value={String(reservation.guests)} />
            <InfoField
              label="Extra Guests"
              value={String(reservation.extraGuests)}
            />
            <InfoField label="Children" value={String(reservation.children)} />
            {reservation.createdBy && (
              <InfoField label="Created By" value={reservation.createdBy} />
            )}
            {reservation.createdAt && (
              <InfoField
                label="Created At"
                value={formatDate(reservation.createdAt.slice(0, 10))}
              />
            )}
          </div>

          {/* Amount breakdown */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="h-4 w-4 text-slate-500" />
              <span className="font-medium text-slate-700 text-sm">
                Proposed Amount
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <InfoField
                label="Room Price"
                value={`₹${reservation.roomPrice.toLocaleString()}`}
              />
              <InfoField
                label="Extra Guest Charges"
                value={`₹${reservation.extraBedCharges.toLocaleString()}`}
              />
              <InfoField
                label="Total Payable"
                value={`₹${reservation.totalPayable.toLocaleString()}`}
                bold
              />
            </div>
          </div>
        </div>

        {/* 3. DFO Editable Section + Actions */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800">DFO Decision</h2>
          </div>

          {/* If already decided, show read-only */}
          {!isPending ? (
            <div className="space-y-3">
              {reservation.final_amount !== undefined && (
                <InfoField
                  label="Final Amount"
                  value={`₹${Number(reservation.final_amount).toLocaleString()}`}
                  bold
                />
              )}
              {reservation.discount !== undefined &&
                reservation.discount !== null && (
                  <InfoField
                    label="Discount Applied"
                    value={`₹${Number(reservation.discount).toLocaleString()}`}
                  />
                )}
              {reservation.approval_remarks && (
                <InfoField
                  label="Remarks"
                  value={reservation.approval_remarks}
                />
              )}
              {reservation.approved_by && (
                <InfoField
                  label="Actioned By"
                  value={reservation.approved_by}
                />
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    Final Amount (₹)
                    <span className="text-slate-400 font-normal ml-1 text-xs">
                      (editable before approval)
                    </span>
                  </Label>
                  <Input
                    type="number"
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(e.target.value)}
                    className="h-10"
                    disabled={!canAct}
                    min="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">
                    Discount (₹)
                    <span className="text-slate-400 font-normal ml-1 text-xs">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-10"
                    disabled={!canAct}
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5 mb-5">
                <Label className="text-sm font-medium text-slate-700">
                  Remarks
                  <span className="text-red-500 ml-1">*</span>
                  <span className="text-slate-400 font-normal ml-1 text-xs">
                    (mandatory if rejecting)
                  </span>
                </Label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={!canAct}
                  rows={3}
                  placeholder="Add remarks here…"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Alerts */}
              {actionError && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {actionError}
                </div>
              )}
              {actionSuccess && (
                <div className="flex items-start gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {actionSuccess}
                </div>
              )}

              {canAct && !actionSuccess && (
                <div className="flex items-center gap-3">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                  >
                    {isApproving ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />{" "}
                        Approving…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    className="px-6"
                    onClick={handleReject}
                    disabled={isApproving || isRejecting}
                  >
                    {isRejecting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />{" "}
                        Rejecting…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" /> Reject
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Small reusable read-only field component
const InfoField = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <div>
    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
    <p className={`text-sm text-slate-800 ${bold ? "font-semibold" : ""}`}>
      {value || "—"}
    </p>
  </div>
);

export default ApprovalDetailPage;
