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

// Remote data fetched from backend API
import { useEffect, useRef, useState } from "react";
import { usePermissions } from '@/lib/AdminProvider'
// Dialog imports removed (small modals no longer used)
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

DataTable.use(DT);

interface Amenity {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export default function AllRoomAmenitiesTable() {
  const tableRef = useRef(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'view'|'edit'>('view')
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const perms = usePermissions()
  const permsRef = useRef(perms)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  // keep a live ref to amenities to avoid stale closure in global event handlers
  const amenitiesRef = useRef<Amenity[]>([]);
  useEffect(() => { amenitiesRef.current = amenities; }, [amenities]);
  useEffect(() => { permsRef.current = perms }, [perms])

  const handleEdit = (amenity: Amenity) => {
    if (!permsRef.current.canEdit) return
    // Open details sheet instead of a modal
    setSelectedAmenity(amenity);
    setEditName(amenity.name || "");
    setEditDescription(amenity.description || "");
    setSheetMode('edit')
    setIsDetailSheetOpen(true);
  };

  const toggleActiveStatus = async (amenity: Amenity) => {
    if (!permsRef.current.canDisable) return
    try {
      setUpdatingId(amenity._id);
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/amenities/${amenity._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ isActive: !amenity.isActive })
      });
      if (!res.ok) throw new Error('Failed to update amenity status');
      const data = await res.json();
      setAmenities(prev => prev.map(a => a._id === data.amenity._id ? data.amenity : a));
      if (selectedAmenity && selectedAmenity._id === amenity._id) setSelectedAmenity(data.amenity);
    } catch (e:any) {
      console.error(e);
      setError(e.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRowClick = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setEditName(amenity.name || "");
    setEditDescription(amenity.description || "");
    setSheetMode('view')
    setIsDetailSheetOpen(true);
  };

  // Removed modal-specific handlers (confirm/cancel/update/input changes)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/amenities`);
        if (!res.ok) throw new Error('Failed to fetch amenities');
        const data = await res.json();
        setAmenities(data.amenities || []);
      } catch (e:any) {
        setError(e.message || 'Error fetching amenities');
      } finally {
        setLoading(false);
      }
    };
    load();
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
      table.dataTable tbody tr.disabled-row {
        background-color: #f5f5f5 !important;
        opacity: 0.6 !important;
        text-decoration: line-through !important;
      }
      table.dataTable tbody tr.disabled-row:hover {
        background-color: #eeeeee !important;
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
      const amenityId = target.getAttribute('data-id') || target.closest('button')?.getAttribute('data-id');
      const amenity = amenitiesRef.current.find(a => a._id === amenityId);
      
      if (amenity) {
        // Stop propagation to prevent row click when button is clicked
        event.stopPropagation();
        
        if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
          if (!permsRef.current.canEdit) return
          handleEdit(amenity);
        } else if (target.classList.contains('disable-btn') || target.closest('.disable-btn')) {
          if (!permsRef.current.canDisable) return
          toggleActiveStatus(amenity);
        }
      }
    };

  const handleTableRowClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Don't trigger row click if a button was clicked
      if (target.closest('.edit-btn, .disable-btn')) {
        return;
      }
      
      const row = target.closest('tr');
      if (row && row.parentElement?.tagName === 'TBODY') {
        const rowId = row.getAttribute('data-id');
        if (rowId) {
          const amenity = amenitiesRef.current.find(a => a._id === rowId);
          if (amenity) handleRowClick(amenity);
        }
      }
    };

    // Add event listener for edit and disable buttons
    document.addEventListener('click', handleButtonClick);
    document.addEventListener('click', handleTableRowClick);

    return () => {
      document.removeEventListener('click', handleButtonClick);
      document.removeEventListener('click', handleTableRowClick);
    };
  }, []);

  const columns = [
    { data: "name", title: "Amenity Name" },
    {
      data: "description",
      title: "Description",
      render: (data: string) =>
        `<div style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${data || ""}">
          ${data || ""}
        </div>`,
    },
    {
      data: "isActive",
      title: "Status",
      render: (data: boolean) => `
        <span style="padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500; 
        color: ${data ? "#15803d" : "#b91c1c"};
        background-color: ${data ? "#dcfce7" : "#fee2e2"};">
          ${data ? "Active" : "Inactive"}
        </span>`,
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: Amenity) => {
    const isDisabled = !row.isActive;
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            ${perms.canEdit ? `
            <button 
              class="edit-btn" 
              data-id="${row._id}" 
              title="Edit Amenity"
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
                ${isDisabled ? 'opacity: 0.5;' : ''}
              "
              onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'"
              onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.1)'"
            >
              Edit
            </button>` : ''}
            ${perms.canDisable ? `
            <button 
              class="disable-btn" 
              data-id="${row._id}" 
              title="Toggle Active Status"
              style="
                background: ${isDisabled ? '#6b7280' : '#dc2626'};
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              "
              ${isDisabled ? 'disabled' : ''}
              onmouseover="${!isDisabled ? `this.style.background='#b91c1c'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.15)'` : ''}"
              onmouseout="${!isDisabled ? `this.style.background='#dc2626'; this.style.transform='translateY(0)'; this.style.boxShadow='0 1px 3px rgba(0, 0, 0, 0.1)'` : ''}"
            >
              ${isDisabled ? 'Inactive' : 'Deactivate'}
            </button>` : ''}
          </div>
        `;
      },
    },
  ];

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden py-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 flex-shrink-0">Room Amenities</h2>
  {loading && <div className="text-sm text-slate-500 mb-2">Loading amenities...</div>}
  {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <div ref={tableRef} className="flex-1 overflow-hidden">
        <DataTable
          data={amenities}
          columns={columns}
          className="display nowrap w-full border border-gray-400"
          options={{
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50],
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
              },
            ],
            columnControl: ["order", ["orderAsc", "orderDesc", "spacer", "search"]],
            rowCallback: (row: any, data: any) => {
              // attach id for reliable lookup regardless of sorting/filtering
              if (data && data._id) {
                row.setAttribute('data-id', data._id);
              }
              if (!data.isActive) {
                row.classList.add('disabled-row');
              } else {
                row.classList.remove('disabled-row');
              }
              return row;
            },
          }}
        />
      </div>

  {/* Small modals removed; actions now handled directly and via detail sheet */}

      {/* Amenity Details Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[600px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Amenity Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected room amenity
            </SheetDescription>
          </SheetHeader>
          
          {selectedAmenity && (
            <>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Amenity ID</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      <span className="text-sm text-gray-900">{selectedAmenity._id}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Amenity Name</Label>
                    <Input
                      className="mt-1"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Enter name"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <textarea
                      className="mt-1 w-full min-h-[90px] rounded-md border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Enter description"
                    />
                    {!editDescription && <p className="mt-1 text-xs text-slate-400">Optional</p>}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedAmenity.isActive ? "default" : "destructive"}
                        className="px-2 py-1"
                      >
                        {selectedAmenity.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Record Status</Label>
                    <div className="mt-1">
                      <Badge 
                        variant={selectedAmenity.isActive ? "default" : "destructive"}
                        className="px-2 py-1"
                      >
                        {selectedAmenity.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Fixed Action Buttons */}
              <div className="flex-shrink-0 flex flex-wrap gap-2 p-6 pt-4 border-t bg-white">
                {sheetMode === 'view' ? (
                  <>
                    <Button
                      onClick={() => { if (!perms.canEdit) return; setSheetMode('edit') }}
                      disabled={!perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to edit' : undefined}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => { if (!perms.canDisable) return; toggleActiveStatus(selectedAmenity) }}
                      variant={selectedAmenity.isActive ? 'destructive' : 'default'}
                      disabled={updatingId === selectedAmenity._id || !perms.canDisable}
                      title={!perms.canDisable ? 'You do not have permission to change status' : undefined}
                    >
                      {updatingId === selectedAmenity._id ? 'Updating...' : (selectedAmenity.isActive ? 'Deactivate' : 'Activate')}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDetailSheetOpen(false)}>Close</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setSheetMode('view')}>Cancel</Button>
                    <Button
                      onClick={async () => {
                        if (!perms.canEdit) return
                        if (!editName.trim()) { setError('Name is required'); return; }
                        try {
                          setSaving(true);
                          const token = localStorage.getItem('admin_token')
                          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/amenities/${selectedAmenity._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                            body: JSON.stringify({ name: editName, description: editDescription })
                          });
                          if (!res.ok) throw new Error('Save failed');
                          const data = await res.json();
                          setAmenities(prev => prev.map(a => a._id === data.amenity._id ? data.amenity : a));
                          setSelectedAmenity(data.amenity);
                          setEditName(data.amenity.name || '');
                          setEditDescription(data.amenity.description || '');
                          setError(null);
                          setSheetMode('view')
                        } catch (e:any) {
                          setError(e.message || 'Save error');
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving || !perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to save' : undefined}
                    >
                      {saving ? 'Saving...' : 'Save'}
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
