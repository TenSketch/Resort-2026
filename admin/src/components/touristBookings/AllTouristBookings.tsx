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
import { usePermissions } from '@/lib/AdminProvider'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

DataTable.use(DT);

interface TouristBooking {
  id: string;
  bookingId: string;
  fullName: string;
  phone: string;
  email: string;
  touristSpotName?: string;
  packageType?: string;
  visitDate?: string;
  visitTime?: string;
  adults?: number;
  children?: number;
  totalVisitors?: number;
  guideRequired?: string;
  transportRequired?: string;
  pickupLocation?: string;
  reservedFrom?: string;
  reservationDate?: string;
  status?: string;
  amountPayable?: number;
  paymentStatus?: string;
  amountPaid?: number;
  paymentTransactionId?: string;
  cancelBookingReason?: string;
  cancellationMessage?: string;
  refundableAmount?: number;
  amountRefunded?: number;
  dateOfRefund?: string;
  internalNotes?: string;
}

export default function AllTouristBookings() {
  const tableRef = useRef(null);
  const perms = usePermissions()
  const permsRef = useRef(perms)
  const [bookings, setBookings] = useState<TouristBooking[]>([])
  const bookingsRef = useRef<TouristBooking[]>([])
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selected, setSelected] = useState<TouristBooking | null>(null)
  const [sheetMode, setSheetMode] = useState<'view' | 'edit'>('view')
  const [editForm, setEditForm] = useState<Partial<TouristBooking> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [disabling, setDisabling] = useState<TouristBooking | null>(null)

  useEffect(() => { bookingsRef.current = bookings }, [bookings])
  useEffect(() => { permsRef.current = perms }, [perms])

  const formatDateForDisplay = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${month}/${day}/${year}`;
  }

  const formatVisitors = (b?: TouristBooking) => {
    if (!b) return 'N/A'
    return `${b.adults || 0} / ${b.children || 0}`
  }

  const fetchBookings = async () => {
    const demo: TouristBooking[] = [
      {
        id: 'demo-1',
        bookingId: 'TS-0001',
        fullName: 'Asha Kumar',
        phone: '+91-9876543210',
        email: 'asha.kumar@example.com',
        touristSpotName: 'Jungle Star',
        packageType: 'Adult',
        visitDate: new Date().toISOString().slice(0,10),
        visitTime: '09:00 - 11:00',
        adults: 2,
        children: 1,
        totalVisitors: 3,
        guideRequired: 'Yes',
        transportRequired: 'No',
        pickupLocation: '',
        reservedFrom: 'Website',
        reservationDate: new Date().toISOString().slice(0,10),
        status: 'Confirmed',
        amountPayable: 1500,
        paymentStatus: 'Paid',
        amountPaid: 1500,
        paymentTransactionId: 'TXN-DEMO-TS-001',
        cancelBookingReason: '',
        cancellationMessage: '',
        refundableAmount: 0,
        amountRefunded: 0,
        dateOfRefund: '',
        internalNotes: '',
      }
    ]

    setBookings(demo)
  }

  useEffect(() => {
    fetchBookings()

    const handleClick = (e: Event) => {
      const t = e.target as HTMLElement
      const btn = t.closest('.edit-btn, .delete-btn') as HTMLElement | null
      if (!btn) return
      e.stopPropagation()
      const id = btn.getAttribute('data-id')
      const booking = bookingsRef.current.find(b => b.id === id)
      if (!booking) return
      if (btn.classList.contains('edit-btn')) {
        if (!permsRef.current.canEdit) return
        setSelected(booking)
        setEditForm({ ...booking })
        setSheetMode('edit')
        setIsDetailOpen(true)
      } else if (btn.classList.contains('delete-btn')) {
        if (!permsRef.current.canDisable) return
        setDisabling(booking)
        setIsConfirmOpen(true)
      }
    }

    const handleRowClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.closest('.edit-btn, .delete-btn')) return
      const row = target.closest('tr')
      if (row && row.parentElement?.tagName === 'TBODY') {
        const idx = Array.from(row.parentElement.children).indexOf(row)
        const booking = bookingsRef.current[idx]
        if (booking) {
          setSelected(booking)
          setSheetMode('view')
          setIsDetailOpen(true)
        }
      }
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('click', handleRowClick)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('click', handleRowClick)
    }
  }, [])

  const columns = [
    { title: '<strong>S.No</strong>', data: null, render: (_d:any,_t:any,_r:any,meta:any) => meta.row + 1 + meta.settings._iDisplayStart, orderable: false, searchable: false },
    { data: 'bookingId', title: '<strong>Booking ID</strong>' },
    { data: 'fullName', title: '<strong>Full Name</strong>' },
    { data: 'phone', title: '<strong>Phone</strong>' },
    { data: 'email', title: '<strong>Email</strong>' },
    { data: 'touristSpotName', title: '<strong>Spot</strong>' },
    { data: 'packageType', title: '<strong>Package</strong>' },
    { data: 'visitDate', title: '<strong>Visit Date</strong>', render: (d:string) => formatDateForDisplay(d) },
    { data: 'visitTime', title: '<strong>Visit Time</strong>' },
    { data: null, title: '<strong>Visitors (A/C)</strong>', render: (_d:any,_t:any,row:TouristBooking) => formatVisitors(row) },
    { data: 'guideRequired', title: '<strong>Guide</strong>' },
    { data: 'transportRequired', title: '<strong>Transport</strong>' },
    { data: 'reservedFrom', title: '<strong>Reserved From</strong>' },
    { data: 'reservationDate', title: '<strong>Reservation Date</strong>', render: (d:string) => formatDateForDisplay(d) },
    { data: 'status', title: '<strong>Status</strong>' },
    { data: 'amountPayable', title: '<strong>Amount Payable</strong>', render: (d:number) => d != null ? `₹${d}` : 'N/A' },
    { data: 'paymentStatus', title: '<strong>Payment Status</strong>' },
    { data: 'amountPaid', title: '<strong>Amount Paid</strong>', render: (d:number) => d != null ? `₹${d}` : 'N/A' },
    { data: 'paymentTransactionId', title: '<strong>Payment Transaction ID</strong>' },
    { data: 'cancelBookingReason', title: '<strong>Cancel Booking Reason</strong>' },
    { data: 'cancellationMessage', title: '<strong>Cancellation Message</strong>' },
    { data: 'refundableAmount', title: '<strong>Refundable Amount</strong>', render: (d:number) => d != null ? `₹${d}` : 'N/A' },
    { data: 'amountRefunded', title: '<strong>Amount Refunded</strong>', render: (d:number) => d != null ? `₹${d}` : 'N/A' },
    { data: 'dateOfRefund', title: '<strong>Date of Refund</strong>' },
    { data: 'internalNotes', title: '<strong>Notes</strong>', render: (d:any) => d ? String(d).slice(0,50) : 'N/A' },
    { data: null, title: 'Actions', visible: false, orderable: false, searchable: false, render: (_d:any,_t:any,row:TouristBooking) => `
      <div style="display:flex;gap:8px;align-items:center;">
        ${perms.canEdit ? `<button class="edit-btn" data-id="${row.id}" style="background:#3b82f6;color:#fff;border:none;padding:6px 10px;border-radius:6px;">Edit</button>` : ''}
        ${perms.canDisable ? `<button class="delete-btn" data-id="${row.id}" style="background:#dc2626;color:#fff;border:none;padding:6px 10px;border-radius:6px;">Delete</button>` : ''}
      </div>
    `}
  ]

  const exportToExcel = () => {
    const formatDateForExcel = (value?: string) => {
      if (!value) return ''
      const d = new Date(value); if (isNaN(d.getTime())) return value
      const day = String(d.getUTCDate()).padStart(2,'0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const mon = months[d.getUTCMonth()] || ''
      const yy = String(d.getUTCFullYear()).slice(-2)
      return `${day}-${mon}-${yy}`
    }

    const headers = [
      'S. No','Booking ID','Full Name','Phone','Email','Spot','Package','Visit Date','Visit Time','Visitors (A/C)','Guide','Transport','Pickup Location','Reserved From','Reservation Date','Status','Amount Payable','Payment Status','Amount Paid','Payment Transaction ID','Cancel Booking Reason','Cancellation Message','Refundable Amount','Amount Refunded','Date of Refund','Notes'
    ]

    const csv = [
      headers.join(','),
      ...bookingsRef.current.map((r, i) => [
        i+1,
        `"${r.bookingId}"`,
        `"${r.fullName}"`,
        `"${r.phone}"`,
        `"${r.email}"`,
        `"${r.touristSpotName || 'N/A'}"`,
        `"${r.packageType || ''}"`,
        `"${formatDateForExcel(r.visitDate)}"`,
        `"${r.visitTime || ''}"`,
        `"${r.adults || 0}/${r.children || 0}"`,
        `"${r.guideRequired || ''}"`,
        `"${r.transportRequired || ''}"`,
        `"${r.pickupLocation || ''}"`,
        `"${r.reservedFrom || ''}"`,
        `"${r.reservationDate || ''}"`,
        `"${r.status || ''}"`,
        r.amountPayable,
        `"${r.paymentStatus || ''}"`,
        r.amountPaid,
        `"${r.paymentTransactionId || ''}"`,
        `"${r.cancelBookingReason || ''}"`,
        `"${r.cancellationMessage || ''}"`,
        r.refundableAmount,
        r.amountRefunded,
        `"${r.dateOfRefund || ''}"`,
        `"${r.internalNotes || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'Tourist_Spot_Bookings.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const saveChanges = async () => {
    if (!permsRef.current.canEdit) return
    if (!editForm || !selected) return
    setIsSaving(true)
    try {
      const updated: TouristBooking = { ...selected, ...(editForm as TouristBooking) }
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
      setSelected(updated)
      setSheetMode('view')
      setIsSaving(false)
      alert('Changes saved locally (demo data).')
    } catch (err) {
      console.error('Save error', err)
      alert('Failed to save changes: ' + String(err))
      setIsSaving(false)
    }
  }

  const disableBooking = async (b: TouristBooking | null) => {
    if (!permsRef.current.canDisable) return
    if (!b) return
    setBookings(prev => prev.filter(x => x.id !== b.id))
    alert('This is frontend-only demo data: booking removed locally.')
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Tourist Spot Bookings</h2>
        <button onClick={() => perms.canViewDownload ? exportToExcel() : null} className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg ${perms.canViewDownload ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`} disabled={!perms.canViewDownload}>⬇ Export to Excel</button>
      </div>

      <div ref={tableRef} className="w-full">
        <DataTable data={bookings} columns={columns} className="display nowrap w-full border border-gray-400" options={{ pageLength: 10, lengthMenu: [5,10,25,50,100], order: [[0,'asc']], searching: true, paging: true, info: true, scrollX: true, scrollCollapse: true, scrollY: '520px', buttons: [{ extend: 'colvis', text: 'Column Visibility' }], columnControl: ['order', ['orderAsc','orderDesc','spacer','search']] }} />
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Disable</DialogTitle>
            <DialogDescription>Are you sure you want to disable this booking?</DialogDescription>
          </DialogHeader>
          {disabling && (<div className="py-4"><p><strong>Booking ID:</strong> {disabling.bookingId}</p><p><strong>Name:</strong> {disabling.fullName}</p></div>)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => { await disableBooking(disabling); setIsConfirmOpen(false); setDisabling(null); }}>Yes, Disable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-[400px] sm:w-[700px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Booking Details</SheetTitle>
            <SheetDescription>Complete information about the selected booking</SheetDescription>
          </SheetHeader>
          {selected && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {sheetMode === 'view' ? (
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold">Guest Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div><Label>Full Name</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{selected.fullName}</span></div></div>
                        <div><Label>Phone</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{selected.phone}</span></div></div>
                        <div className="md:col-span-2"><Label>Email</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{selected.email}</span></div></div>
                      </div>
                    </div>
                    <div className="border-b pb-4">
                      <h3 className="text-lg font-semibold">Booking Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div><Label>Booking ID</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span className="font-mono">{selected.bookingId}</span></div></div>
                        <div><Label>Reservation Date</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{formatDateForDisplay(selected.reservationDate)}</span></div></div>
                        <div><Label>Visit Date</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{formatDateForDisplay(selected.visitDate)}</span></div></div>
                        <div><Label>Visit Time</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{selected.visitTime}</span></div></div>
                        <div><Label>Spot</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{selected.touristSpotName}</span></div></div>
                        <div><Label>Visitors (A/C)</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{formatVisitors(selected)}</span></div></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Status & Payment</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div><Label>Status</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{selected.status}</span></div></div>
                        <div><Label>Payment Status</Label><div className="mt-1 p-3 bg-gray-50 rounded border"><span>{selected.paymentStatus}</span></div></div>
                        <div><Label>Amount Payable</Label><div className="mt-1 p-3 bg-green-50 rounded border"><span>₹{selected.amountPayable?.toLocaleString()}</span></div></div>
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
                          <input className="mt-1 p-2 w-full border rounded" value={editForm?.fullName || ''} onChange={e => setEditForm(prev => ({ ...(prev || {}), fullName: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <input className="mt-1 p-2 w-full border rounded" value={editForm?.phone || ''} onChange={e => setEditForm(prev => ({ ...(prev || {}), phone: e.target.value }))} />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Email</Label>
                          <input className="mt-1 p-2 w-full border rounded" value={editForm?.email || ''} onChange={e => setEditForm(prev => ({ ...(prev || {}), email: e.target.value }))} />
                        </div>

                        <div>
                          <Label>Visit Date</Label>
                          <input type="date" className="mt-1 p-2 w-full border rounded" value={editForm?.visitDate || ''} onChange={e => setEditForm(prev => ({ ...(prev || {}), visitDate: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Visit Time</Label>
                          <input className="mt-1 p-2 w-full border rounded" value={editForm?.visitTime || ''} onChange={e => setEditForm(prev => ({ ...(prev || {}), visitTime: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Spot</Label>
                          <input className="mt-1 p-2 w-full border rounded" value={editForm?.touristSpotName || ''} onChange={e => setEditForm(prev => ({ ...(prev || {}), touristSpotName: e.target.value }))} />
                        </div>

                        <div>
                          <Label>Status</Label>
                          <input className="mt-1 p-2 w-full border rounded" value={editForm?.status || ''} onChange={e => setEditForm(prev => ({ ...(prev || {}), status: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Amount Payable</Label>
                          <input type="number" className="mt-1 p-2 w-full border rounded" value={editForm?.amountPayable ?? 0} onChange={e => setEditForm(prev => ({ ...(prev || {}), amountPayable: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <Label>Amount Paid</Label>
                          <input type="number" className="mt-1 p-2 w-full border rounded" value={editForm?.amountPaid ?? 0} onChange={e => setEditForm(prev => ({ ...(prev || {}), amountPaid: Number(e.target.value) }))} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-white">
                {sheetMode === 'view' ? (
                  <>
                    <Button
                      onClick={() => {
                        if (!perms.canEdit) return
                        setSheetMode('edit')
                        setEditForm({ ...selected })
                      }}
                      className="flex-1"
                      disabled={!perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to edit' : undefined}
                    >
                      Edit Booking
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!perms.canDisable) return
                        setIsDetailOpen(false)
                        setDisabling(selected)
                        setIsConfirmOpen(true)
                      }}
                      disabled={!perms.canDisable}
                      title={!perms.canDisable ? 'You do not have permission to delete' : undefined}
                    >
                      Delete
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
  )
}
