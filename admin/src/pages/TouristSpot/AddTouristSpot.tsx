import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AddTouristSpot = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const [form, setForm] = useState({
            name: '',
            category: 'TREK', // Default to TREK for trek spots
            entryFees: '',
            parking2W: '',
            parking4W: '',
            cameraFees: '',
            maxSlotsPerDay: '',
            maxMembersPerSlot: '30',
            description: '',
            address: '',
            mapEmbed: '',
        });

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
        const [added, setAdded] = useState<any[]>([]);
        const [newImages, setNewImages] = useState<File[]>([]);
        // const [existingImages, setExistingImages] = useState<any[]>([])
        const [isEditMode, setIsEditMode] = useState(false)
        const [editingId, setEditingId] = useState<string | null>(null)
        const navigate = useNavigate()

        useEffect(() => {
            // check for ?id= param
            try {
                const params = new URLSearchParams(window.location.search)
                const id = params.get('id')
                if (id) {
                    ;(async () => {
                        try {
                            const res = await fetch(`${apiBase}/api/touristspots/${encodeURIComponent(id)}`)
                            if (!res.ok) return
                            const data = await res.json()
                            const s = data?.touristSpot
                            if (!s) return
                            setIsEditMode(true)
                            setEditingId(id)
                            setForm({
                                name: s.name || '',
                                category: s.category || 'TREK',
                                entryFees: s.entryFees ? String(s.entryFees) : '',
                                parking2W: s.parking2W ? String(s.parking2W) : '',
                                parking4W: s.parking4W ? String(s.parking4W) : '',
                                cameraFees: s.cameraFees ? String(s.cameraFees) : '',
                                maxSlotsPerDay: '',
                                maxMembersPerSlot: s.maxMembersPerSlot ? String(s.maxMembersPerSlot) : '',
                                description: s.description || '',
                                address: s.address || '',
                                mapEmbed: s.mapEmbed || '',
                            })
                            // normalize images (array of {url, public_id} or strings)
                            // if (Array.isArray(s.images)) {
                            //     setExistingImages(s.images.map((i:any) => (typeof i === 'string' ? { url: i } : i)))
                            // }
                        } catch (e) {
                            console.warn('Failed to load tourist spot for edit', e)
                        }
                    })()
                }
            } catch (e) {
                // ignore
            }
        }, [])

    const handleAdd = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(null);

                try {
                    // Simple required field validation
                    if (!form.name || form.entryFees === '') {
                        throw new Error('Spot Name and Entry Fee are required');
                    }
                // If in edit mode, call PUT to update
                if (isEditMode && editingId) {
                    const token = localStorage.getItem('admin_token')
                    // If there are images (new uploads), use FormData, otherwise send JSON
                    if (newImages.length > 0) {
                        const formData = new FormData();
                        newImages.forEach((f) => formData.append('images', f));
                        formData.append('name', form.name.trim());
                        formData.append('category', form.category.trim());
                        if (form.entryFees !== '') formData.append('entryFees', String(Number(form.entryFees)));
                        if (form.parking2W !== '') formData.append('parking2W', String(Number(form.parking2W)));
                        if (form.parking4W !== '') formData.append('parking4W', String(Number(form.parking4W)));
                        if (form.cameraFees !== '') formData.append('cameraFees', String(Number(form.cameraFees)));
                        if (form.description) formData.append('description', form.description);
                        if (form.address) formData.append('address', form.address);
                        if (form.maxSlotsPerDay !== '') formData.append('maxSlotsPerDay', String(Number(form.maxSlotsPerDay)));
                        if (form.maxMembersPerSlot !== '') formData.append('maxMembersPerSlot', String(Number(form.maxMembersPerSlot)));
                        if (form.mapEmbed) formData.append('mapEmbed', form.mapEmbed);

                        const res = await fetch(`${apiBase}/api/touristspots/${encodeURIComponent(editingId)}`, {
                            method: 'PUT',
                            headers: token ? { 'Authorization': `Bearer ${token}` } : undefined as any,
                            body: formData,
                        });
                        if (!res.ok) {
                            const errData = await res.json().catch(() => null);
                            throw new Error((errData && errData.error) || res.statusText || 'Failed to update');
                        }
                        await res.json().catch(() => null);
                        setSuccess('Tourist spot updated successfully');
                        // navigate back to list
                        navigate('/touristspots/all')
                        return
                    } else {
                        const payload: any = {
                            name: form.name.trim(),
                            category: form.category.trim(),
                        };
                        if (form.entryFees !== '') payload.entryFees = Number(form.entryFees);
                        if (form.parking2W !== '') payload.parking2W = Number(form.parking2W);
                        if (form.parking4W !== '') payload.parking4W = Number(form.parking4W);
                        if (form.cameraFees !== '') payload.cameraFees = Number(form.cameraFees);
                        if (form.description) payload.description = form.description;
                        if (form.address) payload.address = form.address;
                        if (form.maxSlotsPerDay !== '') payload.maxSlotsPerDay = Number(form.maxSlotsPerDay);
                        if (form.maxMembersPerSlot !== '') payload.maxMembersPerSlot = Number(form.maxMembersPerSlot);
                        if (form.mapEmbed) payload.mapEmbed = form.mapEmbed;

                        const token = localStorage.getItem('admin_token')
                        const res = await fetch(`${apiBase}/api/touristspots/${encodeURIComponent(editingId)}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                            },
                            body: JSON.stringify(payload),
                        });
                        if (!res.ok) {
                            const errData = await res.json().catch(() => null);
                            throw new Error((errData && errData.error) || res.statusText || 'Failed to update');
                        }
                        await res.json().catch(() => null);
                        setSuccess('Tourist spot updated successfully');
                        navigate('/touristspots/all')
                        return
                    }
                }
                // If there are images, send multipart/form-data for create
                if (newImages.length > 0) {
                    const token = localStorage.getItem('admin_token')
                    const formData = new FormData();
                    newImages.forEach((f) => formData.append('images', f));
                    formData.append('name', form.name.trim());
                    formData.append('category', form.category.trim());
                    if (form.entryFees !== '') formData.append('entryFees', String(Number(form.entryFees)));
                    if (form.parking2W !== '') formData.append('parking2W', String(Number(form.parking2W)));
                    if (form.parking4W !== '') formData.append('parking4W', String(Number(form.parking4W)));
                    if (form.cameraFees !== '') formData.append('cameraFees', String(Number(form.cameraFees)));
                    if (form.description) formData.append('description', form.description);
                    if (form.address) formData.append('address', form.address);
                    if (form.maxSlotsPerDay !== '') formData.append('maxSlotsPerDay', String(Number(form.maxSlotsPerDay)));
                    if (form.maxMembersPerSlot !== '') formData.append('maxMembersPerSlot', String(Number(form.maxMembersPerSlot)));
                    if (form.mapEmbed) formData.append('mapEmbed', form.mapEmbed);

                    const res = await fetch(`${apiBase}/api/touristspots/add`, {
                        method: 'POST',
                        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
                        body: formData,
                    });
                    if (!res.ok) {
                        const errData = await res.json().catch(() => null);
                        throw new Error((errData && errData.error) || res.statusText || 'Failed to add');
                    }
                    const data = await res.json().catch(() => null);
                    const saved = data?.touristSpot || data?.spot || data || {};
                    // Map images from response if present, otherwise show uploaded file names
                    if (!saved.images) saved.images = newImages.map((f) => f.name);
                    setAdded(prev => [saved, ...prev]);
                } else {
                    const payload: any = {
                        name: form.name.trim(),
                        category: form.category.trim(),
                    };
                    if (form.entryFees !== '') payload.entryFees = Number(form.entryFees);
                    if (form.parking2W !== '') payload.parking2W = Number(form.parking2W);
                    if (form.parking4W !== '') payload.parking4W = Number(form.parking4W);
                    if (form.cameraFees !== '') payload.cameraFees = Number(form.cameraFees);
                    if (form.description) payload.description = form.description;
                    if (form.address) payload.address = form.address;
                    if (form.maxSlotsPerDay !== '') payload.maxSlotsPerDay = Number(form.maxSlotsPerDay);
                    if (form.maxMembersPerSlot !== '') payload.maxMembersPerSlot = Number(form.maxMembersPerSlot);
                    if (form.mapEmbed) payload.mapEmbed = form.mapEmbed;

                    const token = localStorage.getItem('admin_token')
                    const res = await fetch(`${apiBase}/api/touristspots/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify(payload),
                    });
                    if (!res.ok) {
                        const errData = await res.json().catch(() => null);
                        throw new Error((errData && errData.error) || res.statusText || 'Failed to add');
                    }
                    const data = await res.json().catch(() => null);
                    const saved = data?.touristSpot || data?.spot || data || payload;
                    setAdded(prev => [saved, ...prev]);
                }

                setSuccess('Tourist spot added successfully');
                setForm({ name: '', category: 'TREK', entryFees: '', parking2W: '', parking4W: '', cameraFees: '', maxSlotsPerDay: '', maxMembersPerSlot: '', description: '', address: '', mapEmbed: '' });
                setNewImages([]);
            } catch (err: any) {
                console.error('Add tourist spot error', err);
                setError(err.message || 'Failed to add tourist spot');
            } finally {
                setIsSaving(false);
            }
    };

    const handleReset = () => {
        setForm({ name: '', category: 'TREK', entryFees: '', parking2W: '', parking4W: '', cameraFees: '', maxSlotsPerDay: '', maxMembersPerSlot: '', description: '', address: '', mapEmbed: '' });
        setNewImages([]);
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="min-h-screen p-8">
            <div className="w-full max-w-3xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-slate-800 mb-2">Add Tourist Spot</h1>
                    <p className="text-slate-600">Create a new tourist spot with fees and parking details.</p>

                    {success && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">{success}</div>
                    )}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>
                    )}
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <div className="p-4 bg-transparent">
                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Spot Name</Label>
                                                <Input placeholder="e.g. Jalatarangini" value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} className="w-full" />
                                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-700">Category</Label>
                                <Input value={form.category} onChange={(e) => setForm(s => ({ ...s, category: e.target.value }))} className="w-full" disabled />
                                <p className="text-xs text-gray-500 mt-1">Defaulted to 'TREK' for trek spots</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Entry Fee (₹) <span className="text-red-600">*</span></Label>
                                    <Input required type="number" min={0} placeholder="e.g. 800" value={form.entryFees} onChange={(e) => setForm(s => ({ ...s, entryFees: e.target.value }))} className="w-full" />
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">2W Parking Fee (Optional)</Label>
                                    <Input type="number" min={0} value={form.parking2W} onChange={(e) => setForm(s => ({ ...s, parking2W: e.target.value }))} className="w-full" />
                                </div>

                                <div>
                                    <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">4W Parking Fee (Optional)</Label>
                                    <Input type="number" min={0} value={form.parking4W} onChange={(e) => setForm(s => ({ ...s, parking4W: e.target.value }))} className="w-full" />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium text-gray-700">Camera Fee (Optional)</Label>
                                <Input type="number" min={0} value={form.cameraFees} onChange={(e) => setForm(s => ({ ...s, cameraFees: e.target.value }))} className="w-full" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Max Treks/Slots per Day</Label>
                                    <Input type="number" min={1} placeholder="e.g. 2" value={form.maxSlotsPerDay} onChange={(e) => setForm(s => ({ ...s, maxSlotsPerDay: e.target.value }))} className="w-full" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-700">Max Members per Trek/Slot</Label>
                                    <Input type="number" min={1} placeholder="e.g. 30" value={form.maxMembersPerSlot} onChange={(e) => setForm(s => ({ ...s, maxMembersPerSlot: e.target.value }))} className="w-full" />
                                </div>
                            </div>
              
                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Description</Label>
                                                <textarea value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} rows={4} className="w-full px-3 py-2 border rounded-md bg-slate-50" />
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Address</Label>
                                                <Input value={form.address} onChange={(e) => setForm(s => ({ ...s, address: e.target.value }))} className="w-full" />
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Map Embed URL</Label>
                                                <Input placeholder="https://www.google.com/maps/embed?..." value={form.mapEmbed} onChange={(e) => setForm(s => ({ ...s, mapEmbed: e.target.value }))} className="w-full" />
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-700">Photos (multiple)</Label>
                                                <p className="text-xs text-gray-500">For frontend scroll view</p>
                                                <input type="file" accept="image/*" multiple onChange={(e) => {
                                                    const files = e.target.files;
                                                    if (files) setNewImages(Array.from(files));
                                                }} className="w-full mt-1" />
                                                {newImages.length > 0 && (
                                                    <p className="text-xs text-gray-600 mt-1">{newImages.length} file(s) selected: {newImages.map(f => f.name).join(', ')}</p>
                                                )}
                                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <Button type="button" onClick={handleAdd} disabled={isSaving} className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg">
                            {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Tourist Spot' : 'Add Tourist Spot')}
                        </Button>
                        <Button type="button" onClick={handleReset} variant="ghost" disabled={isSaving} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 px-6 rounded-lg">
                            Reset
                        </Button>
                    </div>

                    {added.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-3">Recently Added</h2>
                            <div className="space-y-3">
                                {added.map((a, i) => (
                                    <div key={i} className="p-3 border rounded bg-white">
                                        <div className="font-medium">{a.name || a.title || '—'}</div>
                                        <div className="text-sm text-slate-600">Category: {a.category || '—'}</div>
                                            <div className="text-sm">Entry: ₹{(a.entryFees ?? 0).toLocaleString()}</div>
                                            <div className="text-sm">Address: {a.address || '—'}</div>
                                            <div className="text-sm">2W Park: {a.parking2W ? `₹${a.parking2W}` : '—'} • 4W Park: {a.parking4W ? `₹${a.parking4W}` : '—'}</div>
                                            <div className="text-sm">Camera: {a.cameraFees ? `₹${a.cameraFees}` : '—'}</div>
                                            <div className="text-sm">Max Slots/Day: {a.maxSlotsPerDay ?? '—'} • Max Members/Slot: {a.maxMembersPerSlot ?? '—'}</div>
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

export default AddTouristSpot;