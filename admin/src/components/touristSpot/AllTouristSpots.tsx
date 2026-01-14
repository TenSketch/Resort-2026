import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

// Required plugins (kept minimal to match other tables)
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.js";

// Styles
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net-buttons-dt/css/buttons.dataTables.css";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router';
import { usePermissions } from '@/lib/AdminProvider'
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import TouristSpotDetailPanel from "@/components/touristSpot/TouristSpotDetailPanel";

DataTable.use(DT);

interface TouristSpot {
  id: string;
  _id: string;
  name: string;
  category?: string;
  entryFees?: number;
  parking2W?: number;
  parking4W?: number;
  cameraFees?: number;
  description?: string;
  address?: string;
  mapEmbed?: string;
  images?: Array<string | { url?: string }>;
}

export default function AllTouristSpots() {
  const tableRef = useRef(null);
  const perms = usePermissions();
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const permsRef = useRef(perms)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true);
  const spotsRef = useRef(spots);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [startEditOnOpen, setStartEditOnOpen] = useState(false);
  useEffect(() => { spotsRef.current = spots }, [spots])
  useEffect(() => { permsRef.current = perms }, [perms])

  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

  const exportToExcel = () => {
    const headers = [
      "ID",
      "Tourist Spot Name",
      "Category", 
      "Entry Fees (₹)",
      "2 Wheeler Parking (₹)",
      "4 Wheelers Parking (₹)",
      "Camera Fees (₹)",
      "Description",
      "Address",
      "Map Link"
    ];

    const csvContent = [
      headers.join(","),
      ...spots.map((spot) => {
        return [
          `"${spot.id}"`,
          `"${spot.name.replace(/"/g, '""')}"`,
          `"${(spot.category || '—').replace(/"/g, '""')}"`,
          `₹${(spot.entryFees || 0).toLocaleString()}`,
          `₹${(spot.parking2W || 0).toLocaleString()}`,
          `₹${(spot.parking4W || 0).toLocaleString()}`,
          spot.cameraFees ? `₹${spot.cameraFees.toLocaleString()}` : '—',
          `"${(spot.description || '—').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${(spot.address || '—').replace(/"/g, '""')}"`,
          `"${spot.mapEmbed || '—'}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Tourist_Spots_Records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/api/touristspots`);
        const data = await res.json().catch(() => null);
        if (res.ok && data && Array.isArray(data.touristSpots)) {
          const mapped = data.touristSpots.map((s: any, idx: number) => ({
            id: s._id || String(idx + 1),
            _id: s._id,
            name: s.name || s.title || `Spot ${idx + 1}`,
            category: s.category || s.type || '—',
            entryFees: s.entryFees ?? s.fees ?? 0,
            parking2W: s.parking2W ?? s.parking?.twoWheeler ?? 0,
            parking4W: s.parking4W ?? s.parking?.fourWheeler ?? 0,
            cameraFees: s.cameraFees ?? s.cameraFee ?? 0,
            description: s.description || s.desc || '',
            address: s.address || s.location || '',
            mapEmbed: s.mapEmbed || s.map || '',
            images: Array.isArray(s.images) ? s.images.map((i: any) => (typeof i === 'string' ? i : i.url || i.path || '')) : [],
          }));
          setSpots(mapped);
        }
      } catch (e) {
        console.warn('Failed to load tourist spots; using static seed');
      } finally {
        setLoading(false);
      }
    })();

    const style = document.createElement('style');
    style.innerHTML = `
      .dataTables_wrapper .dataTables_filter { display: inline-flex; gap: 8px; margin-bottom: 1rem; }
      .dataTables_wrapper .dataTables_length { margin-bottom: 1rem; }
      .dataTables_wrapper .dataTables_scrollBody { overflow-y: auto !important; max-height: 420px !important; border: 1px solid #ddd; border-radius: 0.5rem; }
      table.dataTable thead tr th, table.dataTable thead tr td { font-weight: 700 !important; }
      table.dataTable tbody tr { cursor: pointer !important; transition: background-color 0.15s ease !important; }
      table.dataTable tbody tr:hover { background-color: #f8fafc !important; }
    `;
    document.head.appendChild(style);

    return () => { document.head.removeChild(style); };
  }, []);

  // Handle action buttons and row click
  useEffect(() => {
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement
      const button = target.closest('button') as HTMLElement | null
      if (button?.classList.contains('edit-btn') || button?.classList.contains('disable-btn')) {
        event.stopPropagation()
        const id = button.getAttribute('data-id') || ''
        const spot = spotsRef.current.find(s => s.id === id)
        if (!spot) return
        if (button.classList.contains('edit-btn')) {
          if (!permsRef.current.canEdit) return
          setSelectedSpot(spot)
          setStartEditOnOpen(true)
          setIsDetailPanelOpen(true)
        } else if (button.classList.contains('disable-btn')) {
          if (!permsRef.current.canDisable) return
          // delete
          (async () => {
            try {
              const token = localStorage.getItem('admin_token')
              const headers: Record<string,string> = {}
              if (token) headers['Authorization'] = `Bearer ${token}`
              const res = await fetch(`${apiBase}/api/touristspots/${id}`, { method: 'DELETE', headers })
              const data = await res.json().catch(() => null)
              if (!res.ok) throw new Error(data?.error || 'Failed to delete')
              // remove from list
              setSpots(prev => prev.filter(p => p.id !== id))
            } catch (err: any) {
              console.error('Failed to delete tourist spot', err)
              alert('Failed to delete tourist spot: ' + (err.message || String(err)))
            }
          })()
        }
        return
      }

      // Row click - open detail side panel
      const row = target.closest('tr')
      if (row && row.parentElement?.tagName === 'TBODY') {
        const idx = Array.from(row.parentElement.children).indexOf(row as any)
        const spot = spotsRef.current[idx]
        if (spot) {
          setSelectedSpot(spot)
          setStartEditOnOpen(permsRef.current.canEdit)
          setIsDetailPanelOpen(true)
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [apiBase, navigate])

  const columns = [
    { data: 'id', title: 'ID' },
    { data: 'name', title: 'Tourist Spot Name' },
    { data: 'category', title: 'Category' },
    {
      data: 'images',
      title: 'Thumbnail',
      orderable: false,
      render: (data: any, _type: any, row: TouristSpot) => {
        const img = Array.isArray(data) && data.length > 0 ? (typeof data[0] === 'string' ? data[0] : (data[0].url || '')) : '';
        const src = img || '/img/placeholder.jpg';
        return `<img src="${src}" alt="${row.name}" style="width:64px;height:48px;object-fit:cover;border-radius:4px;"/>`;
      }
    },
    {
      data: 'entryFees',
      title: 'Entry Fees',
      render: (d: number) => `₹${(d || 0).toLocaleString()}`,
    },
    {
      data: 'parking2W',
      title: '2 Wheeler Parking',
      render: (d: number) => `₹${(d || 0).toLocaleString()}`,
    },
    {
      data: 'parking4W',
      title: '4 Wheelers Parking',
      render: (d: number) => `₹${(d || 0).toLocaleString()}`,
    },
    {
      data: 'cameraFees',
      title: 'Camera Fees',
      render: (d: number) => d ? `₹${d.toLocaleString()}` : '—',
    },
    {
      data: 'description',
      title: 'Description',
      render: (d: string) => d ? (d.length > 120 ? d.slice(0, 117) + '…' : d) : '—'
    },
    { data: 'address', title: 'Address' },
    {
      data: 'mapEmbed',
      title: 'Map',
      orderable: false,
      render: (d: string) => d ? `<a href="${d}" target="_blank" rel="noreferrer">Open map</a>` : '—'
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      searchable: false,
      render: (_: any, _2: any, row: TouristSpot) => {
        return `
          <div style="display:flex;gap:8px;align-items:center;">
            ${perms.canEdit ? `<button class="edit-btn" data-id="${row.id}" style="background:#3b82f6;color:white;border:none;padding:6px 10px;border-radius:6px;font-size:12px;">Edit</button>` : ''}
            ${perms.canDisable ? `<button class="disable-btn" data-id="${row.id}" style="background:#dc2626;color:white;border:none;padding:6px 10px;border-radius:6px;font-size:12px;">Disable</button>` : ''}
          </div>
        `;
      }
    }
  ];

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Tourist Spots</h2>
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

      <div ref={tableRef} className="w-full">
        {loading && <div className="p-4 text-sm text-gray-500">Loading tourist spots...</div>}
        <DataTable
          data={spots}
          columns={columns}
          className="display nowrap w-full border border-gray-400"
          options={{
            pageLength: 10,
            lengthMenu: [5, 10, 25, 50, 100],
            order: [[0, 'asc']],
            searching: true,
            paging: true,
            info: true,
            scrollX: true,
            scrollCollapse: true,
            scrollY: '420px',
            layout: { topStart: 'buttons', bottom1Start: 'pageLength' },
            buttons: [ { extend: 'colvis', text: 'Column Visibility' } ],
          }}
        />
      </div>

      {selectedSpot && (
        <TouristSpotDetailPanel
          spot={selectedSpot}
          isOpen={isDetailPanelOpen}
          startEditing={startEditOnOpen}
          canEdit={perms.canEdit}
          onClose={() => { setIsDetailPanelOpen(false); setSelectedSpot(null); setStartEditOnOpen(false); }}
          onSpotUpdated={(updated) => {
            setSpots(prev => prev.map(s => s._id === updated._id ? { ...s, ...updated } : s))
            setSelectedSpot(prev => prev ? { ...prev, ...updated } : prev)
          }}
        />
      )}
    </div>
  );
}
