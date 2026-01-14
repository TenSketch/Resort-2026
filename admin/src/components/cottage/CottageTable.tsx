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

// Removed static JSON import; now fetching from API
import { useEffect, useRef, useState } from "react";
import { usePermissions } from '@/lib/AdminProvider'
// Removed Dialog imports (edit & confirmation modals) per requirement to keep only side details sheet
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

DataTable.use(DT);

interface CottageType {
  _id: string;
  name: string;
  description?: string;
  maxGuests?: number;
  bedrooms?: number;
  bathrooms?: number;
  basePrice?: number;
  amenities: string[];
  resort?: { _id: string; name: string; resortName?: string } | string | null;
  isDisabled?: boolean;
  images?: { url: string; public_id: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export default function CottageDataTable() {
  const tableRef = useRef(null);
  // Removed modal state (edit & confirm) – only side sheet remains
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  // Track selected cottage only (editing handled inside sheet or via direct disable)
  const [cottageTypes, setCottageTypes] = useState<CottageType[]>([]);
  const cottageRef = useRef<CottageType[]>([])
  const [selectedCottage, setSelectedCottage] = useState<CottageType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<CottageType>>({});
  const [version, setVersion] = useState(0); // force table re-render when data changes
  const [amenityDraft, setAmenityDraft] = useState('');
  const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false);
  const perms = usePermissions()
  const permsRef = useRef(perms)
  useEffect(()=>{ cottageRef.current = cottageTypes }, [cottageTypes])
  useEffect(()=>{ permsRef.current = perms }, [perms])

  const addAmenity = () => {
    const val = amenityDraft.trim();
    if (!val) return;
    setFormData(f => ({ ...f, amenities: [ ...(f.amenities || []), val ] }));
    setAmenityDraft('');
  };
  const removeAmenity = (amenity: string) => {
    setFormData(f => ({ ...f, amenities: (f.amenities || []).filter(a => a !== amenity) }));
  };
  // Form data not needed since edit modal removed – we show read-only info in sheet

  const openForView = (cottage: CottageType) => {
    setSelectedCottage(cottage);
    setFormData(cottage);
    setEditMode(false);
    setIsAmenitiesOpen(false);
    setIsDetailSheetOpen(true);
  }

  const handleEdit = (cottage: CottageType) => {
    if (!permsRef.current.canEdit) return
    setSelectedCottage(cottage);
    setFormData(cottage);
    setEditMode(true);
    setIsAmenitiesOpen(true);
    setIsDetailSheetOpen(true);
  };

  const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

  const handleDisable = async (cottage: CottageType) => {
    if (!permsRef.current.canDisable) return
    try {
      const target = !cottage.isDisabled;
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API_BASE}/api/cottage-types/${cottage._id}/disable`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ isDisabled: target })
      });
      if (!res.ok) throw new Error('Failed to update disable state');
      const data = await res.json();
      setCottageTypes(prev => prev.map(c => c._id === data.cottageType._id ? data.cottageType : c));
      if (selectedCottage && selectedCottage._id === cottage._id) {
        setSelectedCottage(data.cottageType);
        setFormData(data.cottageType);
      }
      setVersion(v => v + 1);
    } catch (e:any) {
      console.error(e);
      alert(e.message || 'Disable failed');
    }
  };

  const handleRowClick = (cottage: CottageType) => {
    openForView(cottage)
  };

  // Removed confirm/cancel/update/input change logic (modals removed)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/cottage-types`);
        if (!res.ok) throw new Error('Failed to load cottage types');
        const json = await res.json();
        const list: CottageType[] = json.cottageTypes?.map((ct: any) => ({
          ...ct,
          resort: ct.resort || null,
          amenities: ct.amenities || [],
        })) || [];
        setCottageTypes(list);
        setVersion(v=>v+1);
      } catch (e:any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Styles & delegated event handlers
  useEffect(() => {
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
      const cottageId = target.getAttribute('data-id') || target.closest('button')?.getAttribute('data-id');
      const cottage = cottageRef.current.find(c => c._id === cottageId);
      
      if (cottage) {
        // Stop propagation to prevent row click when button is clicked
        event.stopPropagation();
        
        if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
          if (!permsRef.current.canEdit) return
          handleEdit(cottage);
        } else if (target.classList.contains('disable-btn') || target.closest('.disable-btn')) {
          if (!permsRef.current.canDisable) return
          handleDisable(cottage);
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
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        const cottage = cottageRef.current[rowIndex];
        if (cottage) {
          handleRowClick(cottage);
        }
      }
    };

    document.addEventListener('click', handleButtonClick);
    document.addEventListener('click', handleTableRowClick);

    return () => {
      document.removeEventListener('click', handleButtonClick);
      document.removeEventListener('click', handleTableRowClick);
    };

  }, [cottageTypes]);

  const columns = [
    {
      title: "S.No",
      data: null,
      render: (_data: any, _type: any, _row: any, meta: any) =>
        meta.row + 1 + meta.settings._iDisplayStart,
      orderable: false,
      searchable: false,
    },
    { data: "name", title: "Cottage Name" },
    {
      data: "resort",
      title: "Resort",
      render: (data: any) => typeof data === 'string' ? data : (data?.resortName || data?.name || ''),
    },
    {
      data: "description",
      title: "Description",
      render: (data: string) =>
        `<div style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${data}">${data}</div>`,
    },
    {
  data: "amenities",
      title: "Amenities",
      render: (data: string[]) =>
        `<div style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${data
            .map(
              (item) => `
                <span style="
                  background: #dbeafe;
                  color: #1e3a8a;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  white-space: nowrap;
                  max-width: 100px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">${item}</span>`
            )
            .join("")}
        </div>`,
    },
    {
      data: null,
      title: "Actions",
      orderable: false,
      searchable: false,
      render: (_data: any, _type: any, row: CottageType) => {
    const isDisabled = !!row.isDisabled;
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            ${perms.canEdit ? `
            <button 
              class="edit-btn" 
              data-id="${row._id}" 
              title="Edit Cottage"
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
              title="${isDisabled ? 'Already Disabled' : 'Disable Record'}"
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
              ${isDisabled ? 'Disabled' : 'Disable'}
            </button>` : ''}
          </div>
        `;
      },
    },
  ];


  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden py-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Cottage Types</h2>
      <div ref={tableRef} className="flex-1 overflow-hidden">
        {error && <div className="text-red-600 p-2">{error}</div>}
        {loading && <div className="p-2">Loading...</div>}
        <DataTable
          key={version}
          data={cottageTypes}
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
              },
            ],
            columnControl: ["order", ["orderAsc", "orderDesc", "spacer", "search"]],
            rowCallback: (row: any, data: any) => {
              if (data.isDisabled) row.classList.add('disabled-row'); else row.classList.remove('disabled-row');
              return row;
            },
          }}
        />
      </div>

  {/* Removed Edit & Confirmation dialogs */}

      {/* Cottage Details Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:max-w-[600px] sm:w-[700px] lg:w-[800px]">
          <SheetHeader>
            <SheetTitle>Cottage Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected cottage type
            </SheetDescription>
          </SheetHeader>
          
          {selectedCottage && (
            <div className="flex flex-col gap-6 py-4 p-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Cottage ID</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                    <span className="text-sm text-gray-900">{selectedCottage._id}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Cottage Name</Label>
                  {editMode ? (
                    <Input value={formData.name || ''} onChange={e=> setFormData(f=>({...f, name: e.target.value}))} />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border"><span className="text-sm text-gray-900">{selectedCottage.name}</span></div>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Resort</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border min-h-[48px]">
                    <span className="text-sm text-gray-900">
                      {typeof selectedCottage.resort === 'string' 
                        ? selectedCottage.resort 
                        : (selectedCottage.resort?.resortName || selectedCottage.resort?.name || '')}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Description</Label>
                  {editMode ? (
                    <Input value={formData.description || ''} onChange={e=> setFormData(f=>({...f, description: e.target.value}))} />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border min-h-[80px]"><span className="text-sm text-gray-900">{selectedCottage.description}</span></div>
                  )}
                </div>
                
                <div>
                  <Collapsible open={isAmenitiesOpen} onOpenChange={setIsAmenitiesOpen}>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Room Amenities</Label>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                          {isAmenitiesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <span className="sr-only">Toggle amenities</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-2">
                      {editMode ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            {(formData.amenities || []).map((amenity, idx) => (
                              <Badge key={amenity+idx} variant="secondary" className="px-2 py-1 text-xs flex items-center gap-1">
                                <span>{amenity}</span>
                                <button
                                  type="button"
                                  className="text-red-500 hover:text-red-700 leading-none"
                                  onClick={() => removeAmenity(amenity)}
                                  aria-label={`Remove ${amenity}`}
                                >×</button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={amenityDraft}
                              onChange={e => setAmenityDraft(e.target.value)}
                              onKeyDown={e => {
                                if ((e.key === 'Enter' || e.key === ',') && amenityDraft.trim()) {
                                  e.preventDefault();
                                  addAmenity();
                                }
                              }}
                              placeholder="Type amenity & press Enter"
                            />
                            <Button type="button" onClick={addAmenity} disabled={!amenityDraft.trim()}>Add</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedCottage.amenities.map((amenity, index) => (
                            <Badge key={index} variant="secondary" className="px-2 py-1 text-xs">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedCottage.isDisabled ? "destructive" : "default"} className="px-2 py-1">
                      {selectedCottage.isDisabled ? 'Disabled' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {!editMode ? (
                  <>
                    <Button onClick={()=> { if (!perms.canEdit) return; setEditMode(true); setFormData(selectedCottage); }} className="flex-1" disabled={selectedCottage.isDisabled || !perms.canEdit} title={!perms.canEdit ? 'You do not have permission to edit' : undefined}>Edit</Button>
                    <Button variant={selectedCottage.isDisabled? 'default':'destructive'} onClick={()=> { if (!perms.canDisable) return; handleDisable(selectedCottage) }} disabled={!perms.canDisable} title={!perms.canDisable ? 'You do not have permission to change status' : undefined}>
                      {selectedCottage.isDisabled? 'Enable':'Disable'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={()=> { setEditMode(false); setFormData(selectedCottage); }}>Cancel</Button>
                    <Button onClick={async ()=> {
                      if (!perms.canEdit) return
                      try {
                        const token = localStorage.getItem('admin_token')
                        const res = await fetch(`${API_BASE}/api/cottage-types/${selectedCottage._id}`, { method:'PUT', headers:{'Content-Type':'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {})}, body: JSON.stringify({ name: formData.name, description: formData.description, amenities: formData.amenities }) });
                        if(!res.ok) throw new Error('Update failed');
                        const data = await res.json();
                        setCottageTypes(prev => prev.map(c => c._id === data.cottageType._id ? data.cottageType : c));
                        setSelectedCottage(data.cottageType);
                        setFormData(data.cottageType);
                        setEditMode(false);
                        setVersion(v=>v+1);
                      } catch(e:any){
                        alert(e.message || 'Update failed');
                      }
                    }} disabled={!perms.canEdit} title={!perms.canEdit ? 'You do not have permission to save' : undefined}>Save</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
