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

DataTable.use(DT);

interface Tent {
  id: string;
  sno: number;
  tentSpot: string;
  tentSpotName: string;
  tentType: string;
  tentTypeName: string;
  noOfGuests: number;
  noOfChildren: number;
  tentId: string;
  rate: number;
  tentCount: number;
  images: Array<{ url: string; public_id: string }>;
  isActive: boolean;
}

export default function AllTentsTable() {
  const tableRef = useRef(null);
  const perms = usePermissions()
  const permsRef = useRef(perms)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'view'|'edit'>('view')
  const [selectedTent, setSelectedTent] = useState<Tent | null>(null);
  const [tents, setTents] = useState<Tent[]>([]);
  const tentsRef = useRef<Tent[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Editable fields
  const [editNoOfGuests, setEditNoOfGuests] = useState<number>(0);
  const [editNoOfChildren, setEditNoOfChildren] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);
  const [editTentCount, setEditTentCount] = useState<number>(1);

  // Fetch tents from backend
  useEffect(() => {
    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    const fetchTents = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${apiBase}/api/tents`);
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || `Failed to fetch tents (status ${res.status})`);
        }
        const data = await res.json();
        const list = Array.isArray(data.tents) ? data.tents : [];
        
        const mapped = list.map((t: any, idx: number) => ({
          id: t._id,
          sno: idx + 1,
          tentSpot: t.tentSpot?._id || '',
          tentSpotName: t.tentSpot?.spotName || 'Unknown',
          tentType: t.tentType?._id || '',
          tentTypeName: t.tentType?.tentType || 'Unknown',
          noOfGuests: t.noOfGuests || 0,
          noOfChildren: t.noOfChildren || 0,
          tentId: t.tentId || '',
          rate: t.rate || 0,
          tentCount: t.tentCount || 1,
          images: t.images || [],
          isActive: !t.isDisabled,
        }));
        
        setTents(mapped);
      } catch (err: any) {
        console.error('Failed to load tents', err);
        setLoadError(err.message || 'Failed to load tents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTents();
  }, []);

  useEffect(()=>{ tentsRef.current = tents }, [tents])
  useEffect(()=>{ permsRef.current = perms }, [perms])

  const exportToExcel = () => {
    const headers = [
      "S.No",
      "Tent Spot",
      "Tent Type",
      "No. of Guests",
      "No. of Children",
      "Tent ID",
      "Rate (₹)",
      "Tent Count",
      "Images",
      "Status"
    ];

    const csvContent = [
      headers.join(","),
      ...tents.map((tent) => {
        return [
          tent.sno,
          `"${tent.tentSpotName}"`,
          `"${tent.tentTypeName}"`,
          tent.noOfGuests,
          tent.noOfChildren,
          `"${tent.tentId}"`,
          tent.rate,
          tent.tentCount,
          tent.images.length,
          `"${tent.isActive ? 'Active' : 'Inactive'}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Tents_Records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openForView = (tent: Tent) => {
    setSelectedTent(tent);
    setEditNoOfGuests(tent.noOfGuests);
    setEditNoOfChildren(tent.noOfChildren);
    setEditRate(tent.rate);
    setEditTentCount(tent.tentCount);
    setSheetMode('view')
    setIsDetailSheetOpen(true);
  };

  const toggleActiveStatus = async (tent: Tent) => {
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
      
      const response = await fetch(`${apiBase}/api/tents/${tent.id}/toggle-status`, {
        method: 'PATCH',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle status');
      }

      // Update local state
      setTents((prev) =>
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

  const handleEdit = (tent: Tent) => {
    if (!permsRef.current.canEdit) return
    openForView(tent)
    setSheetMode('edit')
  };

  const columns = [
    { data: "sno", title: "S.No" },
    { data: "tentSpotName", title: "Tent Spot" },
    { data: "tentTypeName", title: "Tent Type" },
    { data: "noOfGuests", title: "No. of Guests" },
    { data: "noOfChildren", title: "No. of Children" },
    { data: "tentId", title: "Tent ID" },
    { 
      data: "rate", 
      title: "Rate (₹)",
      render: (data: number) => `₹${data.toLocaleString()}`
    },
    { data: "tentCount", title: "Tent Count" },
    {
      data: "images",
      title: "Images",
      render: (data: any[]) => data && data.length > 0 ? `${data.length} image(s)` : "No images",
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
      render: (_data: any, _type: any, row: Tent) => {
        return `
          <div style="display: flex; gap: 8px; align-items: center;">
            ${perms.canEdit ? `
            <button 
              class="edit-btn" 
              data-id="${row.id}"
              style="background: #3b82f6; color: white; border: none; padding: 6px 12px;
                border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer;"
              title="Edit Tent"
            >
              Edit
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
      if (button?.classList.contains('edit-btn')) {
        event.stopPropagation()
        const tentId = button.getAttribute('data-id') || ''
        const tent = tentsRef.current.find(t => t.id === tentId)
        if (!tent) return
        if (!permsRef.current.canEdit) return
        handleEdit(tent)
        return
      }

      // Row click opens view-only detail
      const row = target.closest('tr')
      if (row && row.parentElement?.tagName === 'TBODY') {
        const rowIndex = Array.from(row.parentElement.children).indexOf(row as any)
        const tent = tentsRef.current[rowIndex]
        if (tent) openForView(tent)
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleSaveEdit = async () => {
    if (!perms.canEdit || !selectedTent) return;
    
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('admin_token');
      
      const updateData = {
        noOfGuests: editNoOfGuests,
        noOfChildren: editNoOfChildren,
        rate: editRate,
        tentCount: editTentCount,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBase}/api/tents/${selectedTent.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tent');
      }

      // Update local state
      setTents((prev) =>
        prev.map((t) =>
          t.id === selectedTent.id
            ? { ...t, noOfGuests: editNoOfGuests, noOfChildren: editNoOfChildren, rate: editRate, tentCount: editTentCount }
            : t
        )
      );
      
      setSheetMode('view');
      setIsDetailSheetOpen(false);
      alert('Tent updated successfully!');
    } catch (err: any) {
      console.error('Failed to update tent:', err);
      alert('Failed to update tent: ' + (err.message || String(err)));
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden py-6">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-slate-800">
          All Tents
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
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 mb-3">Loading tents...</div>
        )}
        {loadError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-800 mb-3">{loadError}</div>
        )}
        <DataTable
          data={tents}
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
                  appendTo: "body",
                },
              },
            ],
            columnControl: ["order"],
            columnDefs: [
              { targets: 0, width: '50px', className: 'dt-center' }, // S.No
              { targets: 1, width: '150px' }, // Tent Spot
              { targets: 2, width: '150px' }, // Tent Type
              { targets: 3, width: '80px' }, // No. of Guests
              { targets: 4, width: '80px' }, // No. of Children
              { targets: 5, width: '100px' }, // Tent ID
              { targets: 6, width: '100px' }, // Rate
              { targets: 7, width: '80px' }, // Tent Count
              { targets: 8, width: '100px' }, // Images
              { targets: 9, width: '80px' }, // Status
              { targets: 10, width: '160px', orderable: false, searchable: false }, // Actions
              { targets: '_all', visible: true },
            ],
          }}
        />
      </div>

      {/* small style for truncation/ellipsis */}
      <style>{`
        .dt-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
        .dt-center{text-align:center}
      `}</style>

      {/* Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[600px] lg:w-[800px] flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>Tent Details</SheetTitle>
            <SheetDescription>
              Complete information about the selected tent
            </SheetDescription>
          </SheetHeader>

          {selectedTent && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <Label>S.No</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {selectedTent.sno}
                  </div>
                </div>

                <div>
                  <Label>Tent Spot</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.tentSpotName}</div>
                </div>

                <div>
                  <Label>Tent Type</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.tentTypeName}</div>
                </div>

                <div>
                  <Label>No. of Guests</Label>
                  {sheetMode === 'edit' ? (
                    <Input
                      type="number"
                      value={editNoOfGuests}
                      onChange={(e) => setEditNoOfGuests(Number(e.target.value))}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.noOfGuests}</div>
                  )}
                </div>

                <div>
                  <Label>No. of Children</Label>
                  {sheetMode === 'edit' ? (
                    <Input
                      type="number"
                      min={0}
                      value={editNoOfChildren}
                      onChange={(e) => setEditNoOfChildren(Number(e.target.value))}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.noOfChildren}</div>
                  )}
                </div>

                <div>
                  <Label>Tent ID</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border font-mono text-blue-600">{selectedTent.tentId}</div>
                </div>

                <div>
                  <Label>Rate (₹)</Label>
                  {sheetMode === 'edit' ? (
                    <Input
                      type="number"
                      value={editRate}
                      onChange={(e) => setEditRate(Number(e.target.value))}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">₹{selectedTent.rate.toLocaleString()}</div>
                  )}
                </div>

                <div>
                  <Label>Tent Count</Label>
                  {sheetMode === 'edit' ? (
                    <Input
                      type="number"
                      min={1}
                      value={editTentCount}
                      onChange={(e) => setEditTentCount(Number(e.target.value))}
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">{selectedTent.tentCount}</div>
                  )}
                  <p className="text-xs text-slate-500 mt-1">Number of times this tent can be booked for the same dates</p>
                </div>

                <div>
                  <Label>Images</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                    {selectedTent.images && selectedTent.images.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-green-600">✓ {selectedTent.images.length} image(s) uploaded</span>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {selectedTent.images.map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img.url} 
                              alt={`Tent ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-red-600">✗ No images uploaded</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTent.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
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
                    <Button variant="outline" onClick={() => setIsDetailSheetOpen(false)}>Close</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setSheetMode('view')}>Cancel</Button>
                    <Button
                      onClick={handleSaveEdit}
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