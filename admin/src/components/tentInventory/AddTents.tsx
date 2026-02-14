import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

type FormState = {
    tentSpot: string;
    tentType: string;
    noOfGuests: number | "";
    noOfChildren: number | "";
    tentId: string;
    rate: number | "";
    tentCount: number | "";
    images: File[];
};

interface TentSpot {
  _id: string;
  spotName: string;
  location: string;
}

interface TentType {
  _id: string;
  tentType: string;
  accommodationType: string;
  pricePerDay: number;
}

const AddTents: React.FC = () => {
    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    
    const [form, setForm] = useState<FormState>({
        tentSpot: "",
        tentType: "",
        noOfGuests: "",
        noOfChildren: "",
        tentId: "",
        rate: "",
        tentCount: 1,
        images: [],
    });

    const [tentSpots, setTentSpots] = useState<TentSpot[]>([]);
    const [tentTypes, setTentTypes] = useState<TentType[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Fetch tent spots
    useEffect(() => {
        const fetchTentSpots = async () => {
            try {
                const res = await fetch(`${apiBase}/api/tent-spots`);
                const data = await res.json();
                if (data.success) {
                    setTentSpots(data.tentSpots);
                }
            } catch (err) {
                console.error('Failed to fetch tent spots:', err);
            }
        };
        fetchTentSpots();
    }, []);

    // Fetch tent types
    useEffect(() => {
        const fetchTentTypes = async () => {
            try {
                const res = await fetch(`${apiBase}/api/tent-types`);
                const data = await res.json();
                if (data.success) {
                    setTentTypes(data.tentTypes);
                }
            } catch (err) {
                console.error('Failed to fetch tent types:', err);
            }
        };
        fetchTentTypes();
    }, []);

    // Update rate when tent type changes
    useEffect(() => {
        if (form.tentType) {
            const selectedType = tentTypes.find(t => t._id === form.tentType);
            if (selectedType) {
                setForm((s) => ({ ...s, rate: selectedType.pricePerDay }));
            }
        }
    }, [form.tentType, tentTypes]);

    // Fetch next tent ID when tent spot changes
    useEffect(() => {
        const fetchNextTentId = async () => {
            if (form.tentSpot) {
                try {
                    const res = await fetch(`${apiBase}/api/tents/next-tent-id/${form.tentSpot}`);
                    const data = await res.json();
                    if (data.success && data.nextTentId) {
                        setForm((s) => ({ ...s, tentId: data.nextTentId }));
                    }
                } catch (err) {
                    console.error('Failed to fetch next tent ID:', err);
                }
            }
        };
        fetchNextTentId();
    }, [form.tentSpot]);

    const handleChange = (key: keyof FormState, value: any) => {
        setForm((s) => ({ ...s, [key]: value }));
    };

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            setForm((s) => ({ ...s, images: [...s.images, ...fileArray] }));
            
            // Create previews
            fileArray.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setForm((s) => ({
            ...s,
            images: s.images.filter((_, i) => i !== index)
        }));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting) return;

        // Validation
        if (!form.tentSpot || !form.tentType || !form.noOfGuests || !form.rate || !form.tentCount) {
            setError("Please fill in all required fields");
            return;
        }

        if (!form.tentId) {
            setError("Tent ID could not be generated. Please select a tent spot.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('admin_token');
            const formData = new FormData();
            
            formData.append('tentSpot', form.tentSpot);
            formData.append('tentType', form.tentType);
            formData.append('noOfGuests', String(form.noOfGuests));
            formData.append('noOfChildren', String(form.noOfChildren || 0));
            formData.append('rate', String(form.rate));
            formData.append('tentCount', String(form.tentCount));
            
            // Append all images
            form.images.forEach((image) => {
                formData.append('images', image);
            });

            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${apiBase}/api/tents`, {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create tent');
            }

            setSuccess('Tent created successfully!');
            handleReset();
        } catch (err: any) {
            setError(err.message || 'Failed to create tent');
            console.error('Error creating tent:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setForm({
            tentSpot: "",
            tentType: "",
            noOfGuests: "",
            noOfChildren: "",
            tentId: "",
            rate: "",
            tentCount: 1,
            images: [],
        });
        setImagePreviews([]);
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="w-full max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-800 mb-2">Add New Tent</h1>
                    <p className="text-slate-600">Fill in the details to add a tent to your inventory</p>
                    
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="tentSpot" className="text-sm font-medium text-slate-700">Tent Spot <span className="text-red-500">*</span></Label>
                            <select
                                id="tentSpot"
                                value={form.tentSpot}
                                onChange={(e) => handleChange("tentSpot", e.target.value)}
                                required
                                className="w-full h-[36px] px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm"
                            >
                                <option value="">-- Select Tent Spot --</option>
                                {tentSpots.map((spot) => (
                                    <option key={spot._id} value={spot._id}>
                                        {spot.spotName} - {spot.location}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tentType" className="text-sm font-medium text-slate-700">Tent Type <span className="text-red-500">*</span></Label>
                            <select
                                id="tentType"
                                value={form.tentType}
                                onChange={(e) => handleChange("tentType", e.target.value)}
                                required
                                className="w-full h-[36px] px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm"
                            >
                                <option value="">-- Select Tent Type --</option>
                                {tentTypes.map((type) => (
                                    <option key={type._id} value={type._id}>
                                        {type.tentType} - {type.accommodationType}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="noOfGuests" className="text-sm font-medium text-slate-700">No. of Guests <span className="text-red-500">*</span></Label>
                            <Input
                                id="noOfGuests"
                                type="number"
                                value={form.noOfGuests}
                                onChange={(e) => handleChange("noOfGuests", Number(e.target.value))}
                                required
                                placeholder="e.g., 2, 4"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="noOfChildren" className="text-sm font-medium text-slate-700">No. of Children</Label>
                            <Input
                                id="noOfChildren"
                                type="number"
                                min={0}
                                value={form.noOfChildren}
                                onChange={(e) => handleChange("noOfChildren", Number(e.target.value))}
                                placeholder="e.g., 2"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                            />
                            <p className="text-xs text-slate-500">Maximum children allowed in this tent</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tentCount" className="text-sm font-medium text-slate-700">Tent Count <span className="text-red-500">*</span></Label>
                            <Input
                                id="tentCount"
                                type="number"
                                min={1}
                                value={form.tentCount}
                                onChange={(e) => handleChange("tentCount", Number(e.target.value))}
                                required
                                placeholder="e.g., 6"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                            />
                            <p className="text-xs text-slate-500">Number of times this tent can be booked for the same dates</p>
                        </div>
                    </div>

                    {/* Tent Details */}
                    <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Tent Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="tentId" className="text-sm font-medium text-slate-700">Tent ID</Label>
                            <Input
                                id="tentId"
                                value={form.tentId}
                                readOnly
                                placeholder="Auto-generated based on tent spot"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-gray-100 text-slate-600"
                            />
                            <p className="text-xs text-slate-500">Auto-generated when you select a tent spot</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rate" className="text-sm font-medium text-slate-700">Rate (₹) <span className="text-red-500">*</span></Label>
                            <Input
                                id="rate"
                                type="number"
                                value={form.rate ?? ""}
                                onChange={(e) => handleChange("rate", Number(e.target.value))}
                                required
                                placeholder="Auto-filled from tent type"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Tent Images</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="images" className="text-sm font-medium text-slate-700">Tent Images</Label>
                            <input
                                id="images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFiles}
                                className="w-full h-[36px] px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 text-sm"
                            />
                            <p className="text-xs text-slate-500">Upload multiple images of the tent (JPG, PNG, etc.)</p>
                        </div>

                        {/* Image Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-slate-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t border-slate-200">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : 'Add Tent'}
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

export default AddTents;