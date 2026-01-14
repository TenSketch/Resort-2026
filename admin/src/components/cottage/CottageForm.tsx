import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CottageTypeFormData {
  resort: string;
  name: string;
  amenities: string[]; 
  description: string;
}



const AddCottageTypeForm = () => {
  const [formData, setFormData] = useState<CottageTypeFormData>({
    resort: "",
    name: "",
    amenities: [],
    description: "",
  });
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [resorts, setResorts] = useState<Array<{ id: string; resortName: string }>>([])
  const [resortsLoading, setResortsLoading] = useState(false)
  const [amenitiesList, setAmenitiesList] = useState<Array<{ _id: string; name: string }>>([])
  const [amenitiesLoading, setAmenitiesLoading] = useState(false)

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    
    // Load resorts
    const loadResorts = async () => {
      setResortsLoading(true)
      try {
        const token = localStorage.getItem('admin_token')
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const res = await fetch(apiBase + '/api/resorts', { headers })
        if (!res.ok) throw new Error('Failed to fetch resorts')
        const data = await res.json()
        const list = (data && data.resorts) || []
        setResorts(list.map((r: any) => ({ id: r._id || r.id, resortName: r.resortName || r.name })))
      } catch (e) {
        console.warn('Could not load resorts', e)
      } finally {
        setResortsLoading(false)
      }
    }

    // Load amenities
    const loadAmenities = async () => {
      setAmenitiesLoading(true)
      try {
        const token = localStorage.getItem('admin_token')
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const res = await fetch(apiBase + '/api/amenities', { headers })
        if (!res.ok) throw new Error('Failed to fetch amenities')
        const data = await res.json()
        const list = (data && data.amenities) || []
        setAmenitiesList(list.map((a: any) => ({ _id: a._id, name: a.name })))
      } catch (e) {
        console.warn('Could not load amenities', e)
      } finally {
        setAmenitiesLoading(false)
      }
    }

    loadResorts()
    loadAmenities()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenitiesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setFormData((prev) => ({ ...prev, amenities: selected }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true)
    setMessage(null)

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const token = localStorage.getItem('admin_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(apiBase + '/api/cottage-types/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resort: formData.resort,
          name: formData.name,
          description: formData.description,
          amenities: formData.amenities
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add cottage type')

      setMessage('Cottage type added successfully')
      // reset form
      setFormData({ resort: '', name: '', amenities: [], description: '' })
    } catch (err: any) {
      setMessage(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  };

  const handleReset = () => {
    setFormData({ resort: '', name: '', amenities: [], description: '' })
    setMessage(null)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Add New Cottage Type
          </h1>
          <p className="text-slate-600">
            Select the resort and provide cottage details below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Resort */}
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="resortId" className="text-sm font-medium text-slate-700">
              Select Resort <span className="text-red-500">*</span>
            </Label>
            <select
              id="resort"
              name="resort"
              value={formData.resort}
              onChange={handleChange}
              required
              disabled={resortsLoading}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-50"
            >
              <option value="">-- Select Resort --</option>
              {resorts.map((resort) => (
                <option key={resort.id} value={resort.id}>
                  {resort.resortName}
                </option>
              ))}
            </select>
          </div>

          {/* Cottage Name */}
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-slate-700">
              Cottage Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Deluxe Cottage"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
            />
          </div>

          {/* Amenities (multi-select) */}
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="amenities" className="text-sm font-medium text-slate-700">
              Amenities
            </Label>
            <select
              id="amenities"
              name="amenities"
              multiple
              value={formData.amenities}
              onChange={handleAmenitiesChange}
              disabled={amenitiesLoading}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-50 min-h-[120px]"
            >
              {amenitiesList.map((amenity) => (
                <option key={amenity._id} value={amenity.name}>
                  {amenity.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">Hold Ctrl (Cmd on Mac) to select multiple amenities</p>
          </div>

          {/* Description */}
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description</Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe the cottage type" className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50" />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 max-w-md">
            <Button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg shadow-md" disabled={loading}>
              {loading ? 'Saving…' : 'Submit'}
            </Button>
            <Button type="button" onClick={handleReset} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 px-6 rounded-lg">
              Reset
            </Button>
          </div>

          {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AddCottageTypeForm;
