import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddAmenityForm = () => {
  const [amenityName, setAmenityName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    fetch(`${apiBase}/api/amenities/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: amenityName, description }),
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
          const errMsg = (parsed && parsed.error) || res.statusText || 'Failed to add amenity'
          throw new Error(errMsg)
        }

        return parsed
      })
      .then(() => {
        alert('Amenity added')
        handleReset()
      })
      .catch((err) => {
        console.error(err)
        alert('Error: ' + err.message)
      })
  };

  const handleReset = () => {
    setAmenityName("");
  setDescription("");
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Add New Amenity
          </h1>
          <p className="text-slate-600">Enter the amenity name you want to add</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amenity Name */}
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="amenityName" className="text-sm font-medium text-slate-700">
              Amenity Name *
            </Label>
            <Input
              id="amenityName"
              name="amenityName"
              type="text"
              placeholder="e.g., Swimming Pool"
              value={amenityName}
              onChange={(e) => setAmenityName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
            />
          </div>

          {/* Amenity Description */}
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="amenityDescription" className="text-sm font-medium text-slate-700">
              Description (optional)
            </Label>
            <textarea
              id="amenityDescription"
              name="amenityDescription"
              placeholder="Short description of the amenity"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 resize-vertical"
              rows={4}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 max-w-md">
            <Button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              Submit
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAmenityForm;
