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

import { useEffect, useRef, useState } from "react";
import { usePermissions } from '@/lib/AdminProvider'
import { Download } from "lucide-react";
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

interface TentType {
  id: string;
  sno: number;
  tentType: string;
  accommodationType: string;
  tentBase: string;
  dimensions: string;
  brand: string;
  features: string;
  price: number;
  amenities: string;
  isActive: boolean;
}

export default function AllTentTypesTable() {
  const tableRef = useRef(null);
  const perms = usePermissions()
  const permsRef = useRef(perms)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'view'|'edit'>('view')
  const [selectedTent, setSelectedTent] = useState<TentType | null>(null);
  const [tentTypes, setTentTypes] = useState<TentType[]>([]);
  const tentTypesRef = useRef<TentType[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editTentType, setEditTentType] = useState("");
  const [editAccommodationType, setEditAccommodationType] = useState("");
  const [editTentBase, setEditTentBase] = useState("");
  const [editDimensions, setEditDimensions] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editFeatures, setEditFeatures] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editAmenities, setEditAmenities] = useState("");



  // Fetch tent types from backend
  useEffect(() => {
    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    const fetchTentTypes = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${apiBase}/api/tent-types`);
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || `Failed to fetch tent types (status ${res.status})`);
        }
        const data = await res.json();
        // Expected shape: { tentTypes: [ ... ] }
        const list = Array.isArray(data.tentTypes) ? data.tentTypes : [];
        // Map server objects to UI TentType shape
        const mapped = list.map((t: any, idx: number) => ({
          id: t._id,
          sno: idx + 1,
          tentType: t.tentType || '',
          accommodationType: t.accommodationType || '',
          tentBase: t.tentBase || '',
          dimensions: t.dimensions || '',
          brand: t.brand || '',
          features: t.features || '',
          price: t.pricePerDay || t.price || 0,
          amenities: Array.isArray(t.amenities) ? t.amenities.join(', ') : (t.amenities || ''),
          isActive: !t.isDisabled,
        }));
        setTentTypes(mapped);
      } catch (err: any) {
        console.error('Failed to load tent types', err);
        setLoadError(err.message || 'Failed to load tent types');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTentTypes();
  }, []);

  // keep refs up to date for DOM handlers
  useEffect(()=>{ tentTypesRef.current = tentTypes }, [tentTypes])
  useEffect(()=>{ permsRef.current = perms }, [perms])

  const exportToExcel = () => {
    const headers = [
      "S.No",
      "Tent Type",
      "Accommodation Type",
      "Tent Base",
      "Dimensions",
      "Brand",
      "Features",
      "Price (₹)",
      "Amenities",
      "Status"
    ];

    const csvContent = [
      headers.join(","),
      ...tentTypes.map((tent) => {
        return [
          tent.sno,
          `"${tent.tentType.replace(/"/g, '""')}"`,
          `"${tent.accommodationType.replace(/"/g, '""')}"`,
          `"${tent.tentBase.replace(/"/g, '""')}"`,
          `"${tent.dimensions.replace(/"/g, '""')}"`,
          `"${tent.brand.replace(/"/g, '""')}"`,
          `"${tent.features.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `₹${tent.price.toLocaleString()}`,
          `"${tent.amenities.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${tent.isActive ? 'Active' : 'Inactive'}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Tent_Types_Records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openForView = (tent: TentType) => {
    setSelectedTent(tent);
    setEditTentType(tent.tentType);
    setEditAccommodationType(tent.accommodationType);
    setEditTentBase(tent.tentBase);
    setEditDimensions(tent.dimensions);
    setEditBrand(tent.brand);
    setEditFeatures(tent.features);
    setEditPrice(String(tent.price));
    setEditAmenities(tent.amenities);
    setSheetMode('view')
    setIsDetailSheetOpen(true);
  }

  const handleEdit = (tent: TentType) => {
    if (!permsRef.current.canEdit) return
    openForView(tent)
    setSheetMode('edit')
  };

  const toggleActiveStatus = async (tent: TentType) => {
    if (!permsRef.current.canDisable) return
    
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('admin_token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiBase}/api/tent-types/${tent.id}/toggle-status`, {
        method: 'PATCH',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle status');
      }

      // Update local state
      setTentTypes((prev) =>
        prev.map((t) =>
          t.id === tent.id ? { ...t, isActive: !t.isActive } : t
        )
      );
      if (selectedTent && selectedTent.id === tent.id) {
        setSelectedTent({ ...tent, isActive: !tent.isActive });
      }
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      alert('Failed to toggle status: ' + (err.message || String(err)));
    }
  };

  const columns = [
    { data: "sno", title: "S.No" },
    { data: "tentType", title: "Tent Type" },
    { data: "accommodationType", title: "Accommodation Type" },
    { data: "tentBase", title: "Tent Base" },
    { data: "dimensions", title: "Dimensions" },
    { data: "brand", title: "Brand" },
    {
      data: "features",
      title: "Features",
      render: (data: string) => `<div style="white-space:pre-wrap; max-width:300px">${data}</div>`,
    },
    {
      data: "price",
      title: "Price (₹)",
      render: (data: number) => `₹${data.toLocaleString()}`,
    },
    {
      data: "amenities",
      title: "Amenities",
      render: (data: string) => `<div style="white-space:pre-wrap; max-width:300px">${data}</div>`,
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
      render: (_data: any, _type: any, row: TentType) => {
        const isDisabled = !row.isActive;
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            ${perms.canEdit ? `
            <button 
              class="edit-btn" 
              data-id="${row.id}"
              style="background: #3b82f6; color: white; border: none; padding: 6px 12px;
                border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;"
              title="Edit Tent Type"
            >
              Edit
            </button>` : ''}
            ${perms.canDisable ? `
            <button 
              class="disable-btn" 
              data-id="${row.id}"
              style="background: ${isDisabled ? "#6b7280" : "#dc2626"}; color: white;
                border: none; padding: 6px 12px; border-radius: 6px;
                font-size: 12px; font-weight: 500; cursor: ${isDisabled ? 'not-allowed' : 'pointer'};"
              ${isDisabled ? 'disabled' : ''}
              title="${isDisabled ? 'Already inactive' : 'Deactivate'}"
            >
              ${isDisabled ? "Inactive" : "Deactivate"}
            </button>` : ''}
          </div>
        `;
      },
    },
  ];

  // Handle button clicks in table
  useEffect(() => {
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button') as HTMLElement | null
      if (button?.classList.contains('edit-btn') || button?.classList.contains('disable-btn')) {
        event.stopPropagation()
        const tentId = button.getAttribute('data-id') || ''
        const tent = tentTypesRef.current.find(t => t.id === tentId)
        if (!tent) return
        if (button.classList.contains('edit-btn')) {
          if (!permsRef.current.canEdit) return
          handleEdit(tent)
        } else if (button.classList.contains('disable-btn')) {
          if (!permsRef.current.canDisable) return
          toggleActiveStatus(tent)
        }
        return
      }

      // Row click opens view-only sheet
      const row = target.closest('tr')
      if (row && row.parentElement?.tagName === 'TBODY') {
        const rowIndex = Array.from(row.parentElement.children).indexOf(row as any)
        const tent = tentTypesRef.current[rowIndex]
        if (tent) openForView(tent)
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden py-6">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-slate-800">
          Tent Types
        </h2>
        <Button
          onClick={() => perms.canViewDownload ? exportToExcel() : null}
          className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg ${
            perms.canViewDownload 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          disabled={!perms.canViewDownload}
          title={perms.canViewDownload ? 'Export to Excel' : 'You do not have permission to download/export'}
        >
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      <div ref={tableRef} className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 mb-3">Loading tent types...</div>
        )}
        {loadError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-800 mb-3">{loadError}</div>
        )}
          <DataTable
          data={tentTypes}
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
                collection: {
                    // 👇 this is the fix
                    appendTo: "body",
                },
                },
            ],
            columnControl: [
                "order",
            ],
            columnDefs: [
                { targets: "_all", visible: true },
            ],
            }}

        />
      </div>

      {/* Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[600px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Tent Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected tent type
            </SheetDescription>
          </SheetHeader>

          {selectedTent && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <Label>S.No</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">{selectedTent.sno}</div>
                </div>

                <div>
                  <Label>Tent Type</Label>
                  {sheetMode === 'edit' ? (
                    <Input value={editTentType} onChange={(e) => setEditTentType(e.target.value)} />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.tentType}</div>
                  )}
                </div>

                <div>
                  <Label>Accommodation Type</Label>
                  {sheetMode === 'edit' ? (
                    <Input value={editAccommodationType} onChange={(e) => setEditAccommodationType(e.target.value)} />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.accommodationType}</div>
                  )}
                </div>

                <div>
                  <Label>Tent Base</Label>
                  {sheetMode === 'edit' ? (
                    <Input value={editTentBase} onChange={(e) => setEditTentBase(e.target.value)} />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.tentBase}</div>
                  )}
                </div>

                <div>
                  <Label>Dimensions</Label>
                  {sheetMode === 'edit' ? (
                    <Input value={editDimensions} onChange={(e) => setEditDimensions(e.target.value)} />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.dimensions}</div>
                  )}
                </div>

                <div>
                  <Label>Brand name</Label>
                  {sheetMode === 'edit' ? (
                    <Input value={editBrand} onChange={(e) => setEditBrand(e.target.value)} />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.brand}</div>
                  )}
                </div>

                <div>
                  <Label>Features</Label>
                  {sheetMode === 'edit' ? (
                    <textarea rows={4} value={editFeatures} onChange={(e) => setEditFeatures(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-slate-50" />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border whitespace-pre-wrap">{selectedTent.features}</div>
                  )}
                </div>

                <div>
                  <Label>Price</Label>
                  {sheetMode === 'edit' ? (
                    <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">₹{selectedTent.price.toLocaleString()}</div>
                  )}
                </div>

                <div>
                  <Label>Amenities</Label>
                  {sheetMode === 'edit' ? (
                    <textarea rows={3} value={editAmenities} onChange={(e) => setEditAmenities(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-slate-50" />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border whitespace-pre-wrap">{selectedTent.amenities}</div>
                  )}
                </div>

                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedTent.isActive ? "default" : "destructive"}>{selectedTent.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </div>

              <div className="flex-shrink-0 flex gap-2 p-6 border-t bg-white">
                {sheetMode === 'view' ? (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => { if (!perms.canEdit) return; setSheetMode('edit') }}
                      disabled={!perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to edit' : undefined}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={selectedTent.isActive ? "destructive" : "default"}
                      onClick={() => { if (!perms.canDisable) return; toggleActiveStatus(selectedTent) }}
                      disabled={!perms.canDisable}
                      title={!perms.canDisable ? 'You do not have permission to change status' : undefined}
                    >
                      {selectedTent.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="outline" onClick={() => setIsDetailSheetOpen(false)}>
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setSheetMode('view')}>Cancel</Button>
                    <Button
                      onClick={async () => {
                        if (!perms.canEdit) return
                        
                        try {
                          const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
                          const token = localStorage.getItem('admin_token');
                          
                          const updateData = {
                            tentType: editTentType,
                            accommodationType: editAccommodationType,
                            tentBase: editTentBase,
                            dimensions: editDimensions,
                            brand: editBrand,
                            features: editFeatures,
                            pricePerDay: Number(editPrice),
                            amenities: editAmenities.split(',').map(a => a.trim()).filter(Boolean),
                          };

                          const headers: Record<string, string> = {
                            'Content-Type': 'application/json',
                          };
                          if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                          }

                          const response = await fetch(`${apiBase}/api/tent-types/${selectedTent.id}`, {
                            method: 'PUT',
                            headers,
                            body: JSON.stringify(updateData),
                          });

                          const data = await response.json();

                          if (!response.ok) {
                            throw new Error(data.error || 'Failed to update tent type');
                          }

                          // Update local state
                          setTentTypes((prev) =>
                            prev.map((t) =>
                              t.id === selectedTent.id
                                ? {
                                    ...t,
                                    tentType: editTentType,
                                    accommodationType: editAccommodationType,
                                    tentBase: editTentBase,
                                    dimensions: editDimensions,
                                    brand: editBrand,
                                    features: editFeatures,
                                    price: Number(editPrice),
                                    amenities: editAmenities,
                                  }
                                : t
                            )
                          );
                          setSheetMode('view')
                          setIsDetailSheetOpen(false);
                          alert('Tent type updated successfully!');
                        } catch (err: any) {
                          console.error('Failed to update tent type:', err);
                          alert('Failed to update tent type: ' + (err.message || String(err)));
                        }
                      }}
                      disabled={!perms.canEdit}
                      title={!perms.canEdit ? 'You do not have permission to save' : undefined}
                    >
                      Save
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
