import { useEffect, useState } from "react"
import ResortCard from "@/components/resorts/ResortCard"
import ResortDetailPanel from "@/components/resorts/ResortDetailPanel"

// Shape aligned strictly with backend MongoDB schema (resortModel.js)
interface ResortData {
  _id: string
  resortName: string
  slug: string
  contactPersonName?: string
  contactNumber?: string
  email?: string
  address?: {
    line1?: string
    line2?: string
    cityDistrict?: string
    stateProvince?: string
    postalCode?: string
    country?: string
  }
  website?: string
  foodProviding?: string
  foodDetails?: string
  roomIdPrefix?: string
  extraGuestCharges?: number
  supportNumber?: string
  logo?: { url?: string; public_id?: string }
  createdAt?: string
  updatedAt?: string
}

// Derived UI friendly card data
interface ResortCardView {
  id: string
  name: string
  imageUrl: string
  address: string
  phone: string
  email: string
  // keep a reference to full resort for detail panel
  full: ResortData
}

const AllResortsPage = () => {
  const [selectedResort, setSelectedResort] = useState<ResortData | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [resorts, setResorts] = useState<ResortCardView[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apiBase = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${apiBase}/api/resorts`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Failed to load resorts: ${res.status} ${res.statusText}`)
        const data = await res.json()
        const mapped: ResortCardView[] = (data.resorts || []).map((r: ResortData) => {
          const address = [
            r.address?.line1,
            r.address?.line2,
            r.address?.cityDistrict,
            r.address?.stateProvince,
            r.address?.postalCode,
            r.address?.country,
          ].filter(Boolean).join(', ')
          return {
            id: r._id,
            name: r.resortName,
            imageUrl: r.logo?.url || '', // Use Cloudinary URL, no hardcoded fallback
            address,
            phone: r.contactNumber || '',
            email: r.email || '',
            full: r,
          }
        })
        if (mounted) setResorts(mapped)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        console.error(err)
        if (mounted) setError(err.message || 'Unknown error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false; controller.abort() }
  }, [apiBase])

  const handleResortClick = (resort: ResortCardView) => {
    setSelectedResort(resort.full)
    setIsDetailPanelOpen(true)
  }

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false)
    setSelectedResort(null)
  }

  return (
    <div className="relative">
      <div className="p-4">
        {loading && <div className="text-sm text-slate-600">Loading resorts...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid gap-[1px] grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 mt-3">
          {(!loading && !error && resorts.length === 0) && (
            <div className="text-sm text-slate-500 col-span-full py-8 text-center">No resorts found. Add one to get started.</div>
          )}
          {resorts.map((resort) => (
            <ResortCard
              key={resort.id}
              name={resort.name}
              imageUrl={resort.imageUrl}
              address={resort.address}
              phone={resort.phone}
              email={resort.email}
              onClick={() => handleResortClick(resort)}
            />
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedResort && (
        <ResortDetailPanel
          resort={selectedResort as any}
          isOpen={isDetailPanelOpen}
          onClose={handleCloseDetailPanel}
      onResortUpdated={(updated) => {
            // update selected resort
            setSelectedResort(updated as any)
            // update card list
            setResorts(prev => prev.map(card => card.id === updated._id ? {
              ...card,
        name: updated.resortName || card.name,
        imageUrl: (updated as any).logo?.url || card.imageUrl,
              address: [
                updated.address?.line1,
                updated.address?.line2,
                updated.address?.cityDistrict,
                updated.address?.stateProvince,
                updated.address?.postalCode,
                updated.address?.country,
              ].filter(Boolean).join(', '),
              phone: updated.contactNumber || '',
              email: updated.email || '',
              full: updated as any,
            } : card))
          }}
        />
      )}
    </div>
  )
}

export default AllResortsPage