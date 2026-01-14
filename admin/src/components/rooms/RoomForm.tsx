import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

// Interfaces
interface RoomFormData {
  resortId: string;
  cottageTypeId: string;
  roomId: string;
  roomName: string;
  status: string;
  roomImages: File[];
  orderNumber: string;
  weekDaysRate: string;
  weekEndRate: string;
  noOfGuests: string;
  extraGuests: string;
  noOfChildren: string;
  chargesPerBedWeekDays: string;
  chargesPerBedWeekEnd: string;
}

const AddRoomForm = () => {
  const [formData, setFormData] = useState<RoomFormData>({
    resortId: "",
    cottageTypeId: "",
    roomId: "",
    roomName: "",
    status: "available",
    roomImages: [],
    orderNumber: "",
    weekDaysRate: "",
    weekEndRate: "",
    noOfGuests: "",
    extraGuests: "",
    noOfChildren: "",
    chargesPerBedWeekDays: "",
    chargesPerBedWeekEnd: "",
  });

  // State for dynamic data
  const [resorts, setResorts] = useState<Array<{ _id: string; resortName: string }>>([]);
  const [cottageTypes, setCottageTypes] = useState<Array<{ _id: string; name: string }>>([]);
  const [resortsLoading, setResortsLoading] = useState(false);
  const [cottageTypesLoading, setCottageTypesLoading] = useState(false);
  const [isLoadingRoomId, setIsLoadingRoomId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch resorts and cottage types on mount
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Fetch resorts
    const loadResorts = async () => {
      setResortsLoading(true);
      try {
        const token = localStorage.getItem('admin_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${apiBase}/api/resorts`, { headers });
        if (!res.ok) throw new Error('Failed to fetch resorts');
        const data = await res.json();
        const list = (data && data.resorts) || [];
        setResorts(list.map((r: any) => ({ _id: r._id || r.id, resortName: r.resortName || r.name })));
      } catch (e) {
        console.warn('Could not load resorts', e);
      } finally {
        setResortsLoading(false);
      }
    };

    // Fetch cottage types
    const loadCottageTypes = async () => {
      setCottageTypesLoading(true);
      try {
        const token = localStorage.getItem('admin_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${apiBase}/api/cottage-types`, { headers });
        if (!res.ok) throw new Error('Failed to fetch cottage types');
        const data = await res.json();
        const list = (data && data.cottageTypes) || [];
        setCottageTypes(list.map((ct: any) => ({ _id: ct._id, name: ct.name })));
      } catch (e) {
        console.warn('Could not load cottage types', e);
      } finally {
        setCottageTypesLoading(false);
      }
    };

    loadResorts();
    loadCottageTypes();
  }, []);

  // Fetch next room ID when resort is selected
  useEffect(() => {
    const fetchNextRoomId = async () => {
      if (!formData.resortId) {
        setFormData(prev => ({ ...prev, roomId: '' }));
        return;
      }

      setIsLoadingRoomId(true);
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('admin_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${apiBase}/api/rooms/next-room-id/${formData.resortId}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch next room ID');
        const data = await res.json();
        
        if (data.nextRoomId) {
          setFormData(prev => ({ ...prev, roomId: data.nextRoomId }));
        }
      } catch (e) {
        console.warn('Could not fetch next room ID', e);
      } finally {
        setIsLoadingRoomId(false);
      }
    };

    fetchNextRoomId();
  }, [formData.resortId]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      formData.roomImages.forEach(file => {
        const url = URL.createObjectURL(file);
        URL.revokeObjectURL(url);
      });
    };
  }, [formData.roomImages]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setFormData((prev) => ({ ...prev, roomImages: [...prev.roomImages, ...fileArray] }));
      // Clear the input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      roomImages: prev.roomImages.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // build multipart/form-data and submit to backend
    const form = new FormData()

    // images field (backend expects 'images' array)
    if (formData.roomImages && formData.roomImages.length > 0) {
      formData.roomImages.forEach((file) => {
        form.append('images', file)
      })
    }

    // map frontend names to backend expected names
    if (formData.resortId) form.append('resort', formData.resortId)
    if (formData.cottageTypeId) form.append('cottageType', formData.cottageTypeId)
    if (formData.roomId) form.append('roomId', formData.roomId)
    if (formData.roomName) form.append('roomName', formData.roomName)
    if (formData.status) form.append('status', formData.status)
    if (formData.orderNumber) form.append('orderNumber', formData.orderNumber)

    // backend uses 'price' field; use weekdays rate as primary price
    if (formData.weekDaysRate) form.append('price', String(formData.weekDaysRate))

    if (formData.weekEndRate) form.append('weekEndRate', String(formData.weekEndRate))
    if (formData.noOfGuests) form.append('noOfGuests', String(formData.noOfGuests))
    if (formData.extraGuests) form.append('extraGuests', String(formData.extraGuests))
    if (formData.noOfChildren) form.append('noOfChildren', String(formData.noOfChildren))
    if (formData.chargesPerBedWeekDays) form.append('chargesPerBedWeekDays', String(formData.chargesPerBedWeekDays))
    if (formData.chargesPerBedWeekEnd) form.append('chargesPerBedWeekEnd', String(formData.chargesPerBedWeekEnd))

    // ensure backend-required field name 'roomNumber' is present (fallback to roomId)
    if (!form.has('roomNumber') && form.get('roomId')) {
      form.append('roomNumber', String(formData.roomId))
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    
    // Get token for authentication
    const token = localStorage.getItem('admin_token')
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    fetch(apiBase + '/api/rooms/add', {
      method: 'POST',
      headers: headers,
      body: form,
    })
      .then(async (res) => {
        let parsed = null
        try {
          const text = await res.text()
          parsed = text ? JSON.parse(text) : null
        } catch (e) {
          parsed = null
        }

        if (!res.ok) {
          const errMsg = (parsed && parsed.error) || res.statusText || 'Failed'
          throw new Error(errMsg)
        }

        return parsed
      })
      .then(() => {
        alert('Room created successfully!')
        handleReset()
      })
      .catch((err) => {
        console.error(err)
        alert('Error: ' + err.message)
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  };

  const handleReset = () => {
    setFormData({
      resortId: "",
      cottageTypeId: "",
      roomId: "",
      roomName: "",
      status: "available",
      roomImages: [],
      orderNumber: "",
      weekDaysRate: "",
      weekEndRate: "",
      noOfGuests: "",
      extraGuests: "",
      noOfChildren: "",
      chargesPerBedWeekDays: "",
      chargesPerBedWeekEnd: "",
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Add New Room</h1>
          <p className="text-slate-600">Fill in the details to add a room</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="resortId" className="text-sm font-medium text-slate-700">Select Resort *</Label>
              <select
                id="resortId"
                name="resortId"
                value={formData.resortId}
                onChange={handleChange}
                required
                disabled={resortsLoading}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              >
                <option value="">{resortsLoading ? 'Loading...' : '-- Select Resort --'}</option>
                {resorts.map((resort) => (
                  <option key={resort._id} value={resort._id}>
                    {resort.resortName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cottageTypeId" className="text-sm font-medium text-slate-700">Select Cottage Type *</Label>
              <select
                id="cottageTypeId"
                name="cottageTypeId"
                value={formData.cottageTypeId}
                onChange={handleChange}
                required
                disabled={cottageTypesLoading}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              >
                <option value="">{cottageTypesLoading ? 'Loading...' : '-- Select Cottage Type --'}</option>
                {cottageTypes.map((cottage) => (
                  <option key={cottage._id} value={cottage._id}>
                    {cottage.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomId" className="text-sm font-medium text-slate-700">
                Room ID * 
                {isLoadingRoomId && <span className="text-xs text-slate-500 ml-2">(Generating...)</span>}
              </Label>
              <Input
                id="roomId"
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                required
                placeholder="e.g., VM1"
                disabled={isLoadingRoomId}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
              <p className="text-xs text-slate-500">Auto-generated based on resort. You can edit if needed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomName" className="text-sm font-medium text-slate-700">Room Name *</Label>
              <Input
                id="roomName"
                name="roomName"
                value={formData.roomName}
                onChange={handleChange}
                required
                placeholder="e.g., Sea View Room"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-slate-700">Status *</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              >
                <option value="available">Available</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2 lg:col-span-3 xl:col-span-4">
              <Label htmlFor="roomImages" className="text-sm font-medium text-slate-700">
                Room Images {formData.roomImages.length > 0 && `(${formData.roomImages.length} selected)`}
              </Label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="roomImages"
                  name="roomImages"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                  placeholder="Upload multiple room images"
                />
              </div>
              <p className="text-xs text-slate-500">You can select multiple images</p>
              
              {/* Image Preview List */}
              {formData.roomImages.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-slate-700">Selected Images:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {formData.roomImages.map((file, index) => (
                      <div
                        key={index}
                        className="group relative bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-400 transition-colors"
                      >
                        {/* Image Preview */}
                        <div className="relative aspect-video bg-slate-100 rounded-md overflow-hidden mb-2">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* File Name */}
                        <p className="text-xs text-slate-600 truncate" title={file.name}>
                          {file.name}
                        </p>
                        
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNumber" className="text-sm font-medium text-slate-700">Order Number *</Label>
              <Input
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
          </div>

          {/* Pricing Information */}
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Pricing Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="weekDaysRate" className="text-sm font-medium text-slate-700">Weekdays Rate *</Label>
              <Input
                id="weekDaysRate"
                name="weekDaysRate"
                type="number"
                value={formData.weekDaysRate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekEndRate" className="text-sm font-medium text-slate-700">Weekend Rate *</Label>
              <Input
                id="weekEndRate"
                name="weekEndRate"
                type="number"
                value={formData.weekEndRate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chargesPerBedWeekDays" className="text-sm font-medium text-slate-700">Charges per Bed (Weekdays) *</Label>
              <Input
                id="chargesPerBedWeekDays"
                name="chargesPerBedWeekDays"
                type="number"
                value={formData.chargesPerBedWeekDays}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chargesPerBedWeekEnd" className="text-sm font-medium text-slate-700">Charges per Bed (Weekend) *</Label>
              <Input
                id="chargesPerBedWeekEnd"
                name="chargesPerBedWeekEnd"
                type="number"
                value={formData.chargesPerBedWeekEnd}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
          </div>

          {/* Guest Information */}
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Guest Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="noOfGuests" className="text-sm font-medium text-slate-700">No. of Guests *</Label>
              <Input
                id="noOfGuests"
                name="noOfGuests"
                type="number"
                value={formData.noOfGuests}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extraGuests" className="text-sm font-medium text-slate-700">Extra Guests *</Label>
              <Input
                id="extraGuests"
                name="extraGuests"
                type="number"
                value={formData.extraGuests}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noOfChildren" className="text-sm font-medium text-slate-700">No. of Children</Label>
              <Input
                id="noOfChildren"
                name="noOfChildren"
                type="number"
                value={formData.noOfChildren}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-3 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-8 py-3 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomForm;
