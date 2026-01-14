import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// select components removed because this form no longer uses location dropdown

const AddTentTypes = () => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Available amenities options
  const availableAmenities = [
    "Beds",
    "Pillows",
    "Bed sheets",
    "Comforters",
    "Towels",
    "Chairs"
  ];

  // Single-item add form (admin can add multiple tent types one by one)
  const [form, setForm] = useState({
    tentType: "",
    accommodationType: "",
    tentBase: "",
    dimensions: "",
    brand: "",
    features: "",
    price: "",
    amenities: [] as string[],
  });

  const [added, setAdded] = useState<Array<any>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add current form to the database and local list
  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!form.tentType || !form.accommodationType || !form.tentBase || !form.price) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare the data for submission
      const tentData = {
        tentType: form.tentType,
        accommodationType: form.accommodationType,
        tentBase: form.tentBase,
        dimensions: form.dimensions,
        brand: form.brand,
        features: form.features,
        pricePerDay: Number(form.price),
        amenities: form.amenities,
      };

      const token = localStorage.getItem('admin_token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBase}/api/tent-types/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify(tentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save tent type');
      }

      const result = await response.json();
      const savedTent = result.tentType;

      // Add to local preview list
      setAdded((s) => [
        ...s,
        {
          _id: savedTent._id,
          tentType: savedTent.tentType,
          accommodationType: savedTent.accommodationType,
          tentBase: savedTent.tentBase,
          dimensions: savedTent.dimensions,
          brand: savedTent.brand,
          features: savedTent.features,
          pricePerDay: `${savedTent.pricePerDay}/day`,
          amenities: Array.isArray(savedTent.amenities) 
            ? savedTent.amenities.join(', ') 
            : savedTent.amenities,
        },
      ]);

      setSuccess('Tent type added successfully!');

      // Reset form to defaults after add
      setForm({
        tentType: "",
        accommodationType: "",
        tentBase: "",
        dimensions: "",
        brand: "",
        features: "",
        price: "",
        amenities: [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add tent type');
      console.error('Error adding tent type:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      tentType: "",
      accommodationType: "",
      tentBase: "",
      dimensions: "",
      brand: "",
      features: "",
      price: "",
      amenities: [],
    });
    setAdded([]);
    setError(null);
    setSuccess(null);
  };

  const toggleAmenity = (amenity: string) => {
    setForm((s) => ({
      ...s,
      amenities: s.amenities.includes(amenity)
        ? s.amenities.filter((a) => a !== amenity)
        : [...s.amenities, amenity],
    }));
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Add Tent Type
          </h1>
          <p className="text-slate-600">
            Select location, tent type, and set price
          </p>

          {/* Success/Error Messages */}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Form */}
  <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Single tent-type add form */}
            <div className="w-full max-w-3xl">
            <div className="p-4 bg-transparent">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Tent type <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.tentType}
                    onChange={(e) => setForm((s) => ({ ...s, tentType: e.target.value }))}
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Accommodation Type <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.accommodationType}
                    onChange={(e) => setForm((s) => ({ ...s, accommodationType: e.target.value }))}
                    placeholder="e.g., Camping, Glamping, Family"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Tent Base <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.tentBase}
                    onChange={(e) => setForm((s) => ({ ...s, tentBase: e.target.value }))}
                    placeholder="e.g., Concrete, Wooden, Ground"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Dimensions</Label>
                  <Input
                    value={form.dimensions}
                    onChange={(e) => setForm((s) => ({ ...s, dimensions: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Brand name</Label>
                  <Input
                    value={form.brand}
                    onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Features</Label>
                  <textarea
                    value={form.features}
                    onChange={(e) => setForm((s) => ({ ...s, features: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md bg-slate-50"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Price (per day) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Amenities</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {availableAmenities.map((amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center space-x-2 cursor-pointer p-2 border rounded-md hover:bg-slate-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={form.amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="w-4 h-4 text-slate-800 border-gray-300 rounded focus:ring-slate-500"
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                  {form.amenities.length > 0 && (
                    <div className="mt-2 text-sm text-slate-600">
                      Selected: {form.amenities.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 max-w-md">
            <Button
              type="button"
              onClick={handleAdd}
              disabled={isSaving}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Add Tent Type'}
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </Button>
          </div>

          {/* Preview of added tent types */}
          {added.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Added Tent Types</h2>
              <div className="space-y-3">
                {added.map((t, i) => (
                  <div key={i} className="p-3 border rounded bg-white">
                    <div className="font-medium">{t.tentType} — ₹{t.pricePerDay}</div>
                    <div className="text-sm text-slate-600">{t.dimensions}</div>
                    <div className="text-sm">Accommodation Type: {t.accommodationType}</div>
                    <div className="text-sm">Tent Base: {t.tentBase}</div>
                    <div className="text-sm">Brand: {t.brand}</div>
                    <div className="whitespace-pre-wrap text-sm">Features: {t.features}</div>
                    <div className="text-sm">Amenities: {t.amenities}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddTentTypes;
