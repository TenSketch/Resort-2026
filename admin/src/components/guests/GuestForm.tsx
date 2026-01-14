import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface GuestFormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  dob: string;
  nationality: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  registrationDate: string;
  registerThrough: string;
}

const countries = ["India", "United States", "United Kingdom", "Australia", "Canada"];

const AddGuestForm = () => {
  const [formData, setFormData] = useState<GuestFormData>({
    name: "",
    phone: "",
    email: "",
    password: "",
    dob: "",
    nationality: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    registrationDate: new Date().toISOString().split('T')[0],
    registerThrough: "admin",
  });
  const [isLoading, setIsLoading] = useState(false);

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    // Ensure at least one of each required character type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly (total 12 characters)
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setFormData((prev) => ({ ...prev, password }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required profile fields for complete profile
    const requiredProfileFields = ['dob', 'nationality', 'address1', 'city', 'state', 'pincode', 'country'];
    const missingFields = requiredProfileFields.filter(field => !formData[field as keyof GuestFormData]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required profile fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_ADMIN_API || '';
      const url = apiUrl ? `${apiUrl}/api/user/register` : '/api/user/register';

      // Prepare payload with all user data including profile fields
      const payload = {
        full_name: formData.name,
        email_id: formData.email,
        mobile_number: formData.phone,
        password: formData.password,
        registerThrough: formData.registerThrough,
        // Include profile data in registration
        dob: formData.dob,
        nationality: formData.nationality,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: formData.country,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.code === 3000 && data.result.status === 'success') {
        alert('User added successfully with complete profile!');
        handleReset();
      } else {
        throw new Error(data.result?.msg || 'Failed to add user');
      }
    } catch (err: any) {
      console.error('Error adding user:', err);
      alert('Error adding user: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      dob: "",
      nationality: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      registrationDate: new Date().toISOString().split('T')[0],
      registerThrough: "admin",
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Add New User
          </h1>
          <p className="text-slate-600">Create a new user account with complete profile. All fields marked with * are required.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                maxLength={10}
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                placeholder="10-digit mobile number"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  name="password"
                  type="text"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                  placeholder="Min 8 chars, 1 uppercase, number, special char"
                  required
                />
                <Button
                  type="button"
                  onClick={generatePassword}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Generate Password
                </Button>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6 mt-6">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-sm font-medium text-slate-700">Date of Birth *</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality" className="text-sm font-medium text-slate-700">Nationality *</Label>
              <Input
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                placeholder="e.g., India"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationDate" className="text-sm font-medium text-slate-700">Registration Date</Label>
              <Input
                id="registrationDate"
                name="registrationDate"
                type="date"
                value={formData.registrationDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registerThrough" className="text-sm font-medium text-slate-700">Register Through</Label>
              <select
                id="registerThrough"
                name="registerThrough"
                value={formData.registerThrough}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              >
                <option value="admin">Admin</option>
                <option value="frontend">Frontend</option>
              </select>
            </div>
          </div>

          {/* Address Information */}
          <h3 className="text-xl font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6 mt-6">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="address1" className="text-sm font-medium text-slate-700">Address Line 1 *</Label>
              <Input
                id="address1"
                name="address1"
                placeholder="Street address"
                value={formData.address1}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address2" className="text-sm font-medium text-slate-700">Address Line 2</Label>
              <Input
                id="address2"
                name="address2"
                placeholder="Apartment, suite, etc. (optional)"
                value={formData.address2}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-slate-700">City / District *</Label>
              <Input
                id="city"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-slate-700">State / Province *</Label>
              <Input
                id="state"
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pincode" className="text-sm font-medium text-slate-700">Postal Code *</Label>
              <Input
                id="pincode"
                name="pincode"
                placeholder="Postal/ZIP code"
                value={formData.pincode}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-slate-700">Country *</Label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <Button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding User...' : 'Add User'}
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              variant="outline"
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

export default AddGuestForm;
