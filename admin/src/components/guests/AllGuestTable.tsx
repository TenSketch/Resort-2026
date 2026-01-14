import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.js";
import "datatables.net-columncontrol-dt";
import "datatables.net-columncontrol-dt/css/columnControl.dataTables.css";

import "datatables.net-fixedcolumns";
import "datatables.net-fixedcolumns-dt/css/fixedColumns.dataTables.css";

// Guests will be loaded from backend API (MongoDB)
import { useEffect, useRef, useState } from "react";
import { usePermissions } from '@/lib/AdminProvider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

DataTable.use(DT);

interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  nationality: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  registrationDate: string;
  registerThrough: string;
  profileCompleted: boolean;
}

// local guest list loaded from backend
const initialGuests: Guest[] = [];

const exportToExcel = (guestsParam: Guest[]) => {
  const headers = [
    "S.No",
    "User ID",
    "Name",
    "Phone",
    "Email",
    "DOB",
    "Nationality",
    "Address",
    "City",
    "State",
    "Pincode",
    "Country",
    "Reg. Date",
    "Register Through",
    "Profile Status",
  ];

  const csvContent = [
    headers.join(","),
  ...guestsParam.map((row, idx) => {
      const fullAddress = [row.address1, row.address2].filter(Boolean).join(", ");
      return [
        idx + 1,
        `"${row.id}"`,
        `"${row.name}"`,
        `"${row.phone}"`,
        `"${row.email}"`,
        `"${row.dob}"`,
        `"${row.nationality}"`,
        `"${fullAddress.replace(/"/g, '""')}"`,
        `"${row.city}"`,
        `"${row.state}"`,
        `"${row.pincode}"`,
        `"${row.country}"`,
        `"${row.registrationDate}"`,
        `"${row.registerThrough}"`,
        `"${row.profileCompleted ? 'Complete' : 'Incomplete'}"`
      ].join(",");
    })
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "User_Records.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function GuestTable() {
  const tableRef = useRef(null);
  const perms = usePermissions()
  const permsRef = useRef(perms)
  // sheetMode toggles between viewing details and editing inside the sheet
  const [sheetMode, setSheetMode] = useState<'view' | 'edit'>('view');
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState<Partial<Guest>>({});
  const [guestsState, setGuestsState] = useState<Guest[]>(initialGuests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guestsRef = useRef<Guest[]>(initialGuests);

  useEffect(() => {
    guestsRef.current = guestsState;
  }, [guestsState]);

  // keep perms ref up-to-date for event handlers attached to document
  useEffect(() => {
    permsRef.current = perms
  }, [perms])

  const handleEdit = (guest: Guest) => {
    // open the side sheet in edit mode
    setSelectedGuest(guest);
    setEditingGuest(guest);
    setFormData({ ...guest });
    setSheetMode('edit');
    setIsDetailSheetOpen(true);
  };

  const handleDelete = (guest: Guest) => {
    setDeletingGuest(guest);
    setIsConfirmDeleteOpen(true);
  };

  const handleRowClick = (guest: Guest) => {
    // Always open in view mode when a row is clicked
    setSelectedGuest(guest);
    setEditingGuest(null);
    setSheetMode('view');
    setIsDetailSheetOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingGuest) {
      try {
        const token = localStorage.getItem('admin_token')
        const headers: any = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const response = await fetch(`/api/user/${deletingGuest.id}`, {
          method: 'DELETE',
          headers
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success || result.code === 3000) {
            console.log('User deleted:', deletingGuest.id);
            // Remove user from local state
            setGuestsState(prev => prev.filter(g => g.id !== deletingGuest.id));
            setIsConfirmDeleteOpen(false);
            setDeletingGuest(null);
            setIsDetailSheetOpen(false);
            alert('User deleted successfully!');
          } else {
            console.error('Delete failed:', result);
            alert('Failed to delete user: ' + (result.result?.msg || result.error || 'Unknown error'));
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete request failed:', response.status, errorData);
          alert('Failed to delete user: ' + (errorData.result?.msg || errorData.error || 'Server error'));
        }
      } catch (err: any) {
        console.error('Delete error:', err);
        alert('Error deleting user: ' + (err.message || 'Network error'));
      }
    }
  };

  const cancelDelete = () => {
    setIsConfirmDeleteOpen(false);
    setDeletingGuest(null);
  };

  const handleUpdate = async () => {
    if (!permsRef.current.canEdit) {
      // extra guard: do nothing if user lacks edit permission
      return
    }
    if (editingGuest && formData) {
      try {
        const token = localStorage.getItem('admin_token')
        const headers: any = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        
        // Prepare update payload
        const updatePayload: any = {};
        if (formData.name) updatePayload.name = formData.name;
        if (formData.phone) updatePayload.phone = formData.phone;
        if (formData.email) updatePayload.email = formData.email;
        if (formData.dob) updatePayload.dob = formData.dob;
        if (formData.nationality) updatePayload.nationality = formData.nationality;
        if (formData.address1 !== undefined) updatePayload.address1 = formData.address1;
        if (formData.address2 !== undefined) updatePayload.address2 = formData.address2;
        if (formData.city) updatePayload.city = formData.city;
        if (formData.state) updatePayload.state = formData.state;
        if (formData.pincode) updatePayload.pincode = formData.pincode;
        if (formData.country) updatePayload.country = formData.country;
        
        const response = await fetch(`/api/user/${editingGuest.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updatePayload)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success || result.code === 3000) {
            // Update local state with the updated user
            const updatedGuest = { ...editingGuest, ...formData };
            setGuestsState(prev => prev.map(g => 
              g.id === editingGuest.id ? updatedGuest : g
            ));
            
            // Update selected guest to reflect changes in view mode
            setSelectedGuest(updatedGuest);
            
            // Close edit mode and reset
            setEditingGuest(null);
            setFormData({});
            setSheetMode('view');
            
            alert('User updated successfully!');
          } else {
            console.error('Update failed:', result);
            alert('Failed to update user: ' + (result.result?.msg || result.error || 'Unknown error'));
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Update request failed:', response.status, errorData);
          alert('Failed to update user: ' + (errorData.result?.msg || errorData.error || 'Server error'));
        }
      } catch (err: any) {
        console.error('Update error:', err);
        alert('Error updating user: ' + (err.message || 'Network error'));
      }
    }
  };

  const handleCancel = () => {
    // cancel editing in sheet — revert form and go back to view or close
    if (selectedGuest) {
      setFormData({ ...selectedGuest });
    } else {
      setFormData({});
    }
    setEditingGuest(null);
    setSheetMode('view');
  };

  const handleInputChange = (field: keyof Guest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    // fetch guest data from backend
    const fetchGuests = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('admin_token')
        const headers: any = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch('/api/user/all', { headers });
        const json = await res.json();
        if (json && json.success && Array.isArray(json.users)) {
          const mappedGuests = json.users.map((g: any) => ({
            id: g._id || g.id,
            name: g.name || '',
            phone: g.phone || '',
            email: g.email || '',
            dob: g.dob ? new Date(g.dob).toISOString().slice(0,10) : '',
            nationality: g.nationality || '',
            address1: g.address1 || '',
            address2: g.address2 || '',
            city: g.city || '',
            state: g.state || '',
            pincode: g.pincode || '',
            country: g.country || '',
            registrationDate: g.registrationDate ? new Date(g.registrationDate).toISOString().slice(0,10) : '',
            registerThrough: g.registerThrough || 'frontend',
            profileCompleted: g.profileCompleted || false,
          }));
          
          setGuestsState(mappedGuests);
        } else if (Array.isArray(json)) {
          const mappedGuests = json.map((g: any) => ({
            id: g._id || g.id,
            name: g.name || '',
            phone: g.phone || '',
            email: g.email || '',
            dob: g.dob ? new Date(g.dob).toISOString().slice(0,10) : '',
            nationality: g.nationality || '',
            address1: g.address1 || '',
            address2: g.address2 || '',
            city: g.city || '',
            state: g.state || '',
            pincode: g.pincode || '',
            country: g.country || '',
            registrationDate: g.registrationDate ? new Date(g.registrationDate).toISOString().slice(0,10) : '',
            registerThrough: g.registerThrough || 'frontend',
            profileCompleted: g.profileCompleted || false,
          }));
          
          setGuestsState(mappedGuests);
        } else {
          setError('Unexpected response from server')
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load guests')
      } finally {
        setLoading(false);
      }
    }
    fetchGuests();

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
      .dataTables_wrapper {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .dataTables_wrapper .dt-layout-row {
        flex-shrink: 0;
      }
      .dataTables_wrapper .dataTables_scroll {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      .dataTables_wrapper .dataTables_scrollHead {
        flex-shrink: 0;
        border-radius: 0.5rem 0.5rem 0 0;
        border: 1px solid #ddd;
        border-bottom: none;
        background: #f8f9fa;
      }
      .dataTables_wrapper .dataTables_scrollHeadInner {
        width: 100% !important;
      }
      .dataTables_wrapper .dataTables_scrollBody {
        flex: 1;
        overflow: auto !important;
        width: 100%;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 0.5rem 0.5rem;
        min-height: 300px;
        max-height: calc(100vh - 350px);
      }
      .dataTables_wrapper table {
        width: max-content !important;
        min-width: 100%;
        margin: 0 !important;
      }
      .dt-button-collection.dropdown-menu {
        transform: none !important;
      }
      .dataTables_wrapper .dt-buttons {
        margin-bottom: 1rem;
      }
      .dataTables_wrapper .dataTables_info,
      .dataTables_wrapper .dataTables_paginate {
        margin-top: 1rem;
      }
      table.dataTable thead tr th,
      table.dataTable thead tr td {
        font-weight: 700 !important;
      }
      /* Disabled row styling */

      /* Action button styling */
      .edit-btn:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      .delete-btn:active {
        transform: translateY(0) !important;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      /* Clickable row styling */
      table.dataTable tbody tr {
        cursor: pointer !important;
        transition: background-color 0.2s ease !important;
      }
      table.dataTable tbody tr:hover {
        background-color: #f8fafc !important;
      }
    `;
    document.head.appendChild(style);

    const handleButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const guestId = target.getAttribute('data-id') || target.closest('button')?.getAttribute('data-id');
      const guest = guestsRef.current.find(g => g.id === guestId);
      
      if (guest) {
        // Stop propagation to prevent row click when button is clicked
        event.stopPropagation();
        
        if ((target.classList.contains('edit-btn') || target.closest('.edit-btn')) && permsRef.current.canEdit) {
          // double-check permission before opening edit
          handleEdit(guest);
        } else if ((target.classList.contains('delete-btn') || target.closest('.delete-btn')) && permsRef.current.canDisable) {
          handleDelete(guest);
        } else {
          // user clicked a button they lack permission for - ignore
          return;
        }
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
        const guest = guestsRef.current[rowIndex];
        if (guest) {
          handleRowClick(guest);
        }
      }
    };

    document.addEventListener('click', handleButtonClick);
    document.addEventListener('click', handleTableRowClick);

    return () => {
      document.removeEventListener('click', handleButtonClick);
      document.removeEventListener('click', handleTableRowClick);
    };

  }, []);

  const columns = [
    {
      title: "S.No",
      data: null,
      render: (_data: any, _type: any, _row: any, meta: any) =>
        meta.row + 1 + meta.settings._iDisplayStart,
      orderable: false,
      searchable: false
    },
    { data: "name", title: "Name" },
    { data: "email", title: "Email" },
    { data: "phone", title: "Phone" },
    {
      data: null,
      title: "Address",
      render: (_data: any, _type: any, row: Guest) => {
        const fullAddress = [row.address1, row.address2, row.city, row.state, row.pincode, row.country]
          .filter(Boolean)
          .join(", ");
        return `<div style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${fullAddress}">${fullAddress || 'N/A'}</div>`;
      },
    },
    { 
      data: "registrationDate", 
      title: "Reg. Date",
      render: (data: string) => data || 'N/A'
    },
    { 
      data: "registerThrough", 
      title: "Source",
      render: (data: string) => `<span class="px-2 py-1 text-xs rounded-full ${data === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">${data || 'frontend'}</span>`
    },
    { 
      data: "profileCompleted", 
      title: "Profile",
      render: (data: boolean) => `<span class="px-2 py-1 text-xs rounded-full ${data ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${data ? 'Complete' : 'Incomplete'}</span>`
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: Guest) => {
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            ${perms.canEdit ? `
            <button 
              class="edit-btn" 
              data-id="${row.id}" 
              title="Edit User"
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
            ${perms.canDisable ? `
            <button 
              class="delete-btn" 
              data-id="${row.id}" 
              title="Delete User"
              style="
                background: #dc2626;
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
              onmouseover="this.style.background='#b91c1c'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'"
              onmouseout="this.style.background='#dc2626'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.1)'"
            >
              Delete
            </button>
            ` : ''}
          </div>
        `;
      },
    },
  ];

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden py-6">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-slate-800">User Records</h2>
        <button
          onClick={() => perms.canViewDownload ? exportToExcel(guestsState) : null}
          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${perms.canViewDownload ? 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`}
          disabled={loading || !perms.canViewDownload}
          title={perms.canViewDownload ? 'Export to Excel' : 'You do not have permission to download/export'}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to Excel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading guests</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={tableRef} className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading guests...</span>
            </div>
          </div>
        ) : (
        <DataTable
          data={guestsState}
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
            scrollY: "calc(100vh - 350px)",
            scrollCollapse: true,
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
              }
            ],
            columnControl: ["order", ["orderAsc", "orderDesc", "spacer", "search"]],
          }}
        />
        )}
      </div>

  {/* Confirmation Dialog for Delete Action */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user from the database.
            </DialogDescription>
          </DialogHeader>
          
          {deletingGuest && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>User ID:</strong> {deletingGuest.id}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {deletingGuest.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {deletingGuest.email}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guest Details Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:max-w-[600px] sm:w-[700px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected user
            </SheetDescription>
          </SheetHeader>
          
          {selectedGuest && (
            <>
              {/* Scrollable Content: either view or edit mode */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {sheetMode === 'view' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">User ID</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedGuest.id}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Name</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedGuest.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedGuest.phone}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedGuest.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedGuest.dob || 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Nationality</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedGuest.nationality || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Address</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border min-h-[80px]">
                        <div className="text-sm text-gray-900">
                          {selectedGuest.address1 && <div>{selectedGuest.address1}</div>}
                          {selectedGuest.address2 && <div>{selectedGuest.address2}</div>}
                          {(selectedGuest.city || selectedGuest.state || selectedGuest.pincode) && (
                            <div>{[selectedGuest.city, selectedGuest.state, selectedGuest.pincode].filter(Boolean).join(', ')}</div>
                          )}
                          {selectedGuest.country && <div>{selectedGuest.country}</div>}
                          {!selectedGuest.address1 && !selectedGuest.city && <span className="text-gray-500">N/A</span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Registration Date</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <span className="text-sm text-gray-900">{selectedGuest.registrationDate || 'N/A'}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Register Through</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                          <Badge variant={selectedGuest.registerThrough === 'admin' ? 'secondary' : 'default'}>
                            {selectedGuest.registerThrough || 'frontend'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Profile Status</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                        <Badge variant={selectedGuest.profileCompleted ? 'default' : 'outline'}>
                          {selectedGuest.profileCompleted ? 'Complete' : 'Incomplete'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit form inside sheet
                  formData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={formData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dob || ''}
                          onChange={(e) => handleInputChange('dob', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          value={formData.nationality || ''}
                          onChange={(e) => handleInputChange('nationality', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="address1">Address Line 1</Label>
                        <Input
                          id="address1"
                          value={formData.address1 || ''}
                          onChange={(e) => handleInputChange('address1', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="address2">Address Line 2</Label>
                        <Input
                          id="address2"
                          value={formData.address2 || ''}
                          onChange={(e) => handleInputChange('address2', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.state || ''}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={formData.pincode || ''}
                          onChange={(e) => handleInputChange('pincode', e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country || ''}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Fixed Action Buttons */}
              <div className="flex-shrink-0 flex gap-2 p-6 pt-4 border-t bg-white">
                {sheetMode === 'view' ? (
                  <>
                    <Button 
                      onClick={() => {
                        if (!perms.canEdit) return
                        // switch to edit mode inside the same sheet
                        setSheetMode('edit');
                        setEditingGuest(selectedGuest);
                        setFormData({ ...selectedGuest });
                      }}
                      className="flex-1"
                      disabled={!perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to edit' : undefined}
                    >
                      Edit User
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        if (!perms.canDisable) return
                        setIsDetailSheetOpen(false);
                        handleDelete(selectedGuest);
                      }}
                      disabled={!perms.canDisable}
                      title={!perms.canDisable ? 'You do not have permission to delete' : undefined}
                    >
                      Delete User
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => { if (!perms.canEdit) return; handleUpdate(); }}
                      disabled={!perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to update' : undefined}
                    >
                      Update
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
