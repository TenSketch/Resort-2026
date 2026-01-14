import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Interface for form data
interface LogFormData {
  bookingId: string;
  username: string;
  logType: string;
  logMessage: string;
  logEntryDate: string;
}

const AddLogForm = () => {
  const [formData, setFormData] = useState<LogFormData>({
    bookingId: "",
    username: "",
    logType: "",
    logMessage: "",
    logEntryDate: "",
  });

  // handle text, select, date change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    // prepare payload
    const payload = { ...formData }

    fetch(`${apiBase}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
          const errMsg = (parsed && parsed.error) || res.statusText || 'Failed to save log'
          throw new Error(errMsg)
        }

        return parsed
      })
      .then(() => {
        alert('Log saved')
        handleReset()
      })
      .catch((err) => {
        console.error('Save log error', err)
        alert('Error: ' + err.message)
      })
  };

  // reset handler
  const handleReset = () => {
    setFormData({
      bookingId: "",
      username: "",
      logType: "",
      logMessage: "",
      logEntryDate: "",
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">Add Log Entry</h1>
          <p className="text-slate-600">Fill in the details to add a log record</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Log Information */}
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">
            Log Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bookingId">Booking ID *</Label>
              <Input
                id="bookingId"
                name="bookingId"
                value={formData.bookingId}
                onChange={handleChange}
                placeholder="Enter booking ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logType">Log Type *</Label>
            <select
              id="logType"
              name="logType"
              value={formData.logType}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-50"
            >
              <option value="">-- Select Log Type --</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logMessage">Log Message *</Label>
            <textarea
              id="logMessage"
              name="logMessage"
              value={formData.logMessage}
              onChange={handleChange}
              placeholder="Enter log message"
              required
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logEntryDate">Log Entry Date *</Label>
            <Input
              id="logEntryDate"
              name="logEntryDate"
              type="date"
              value={formData.logEntryDate}
              onChange={handleChange}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <Button
              type="submit"
              className="px-8 py-3 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium"
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="px-8 py-3 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium"
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLogForm;
