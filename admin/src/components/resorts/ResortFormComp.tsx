
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload } from "lucide-react";
import { fetchWithAuth } from "@/lib/apiUtils";

interface ResortFormData {
  resortName: string;
  slug: string;
  contactPersonName: string;
  contactNumber: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  cityDistrict: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  logo: File | null;
  website: string;
  foodProviding: string;
  foodDetails: string;
  roomIdPrefix: string;
  extraGuestCharges: string;
  supportNumber: string;
}

const ResortFormComp = () => {
  const [formData, setFormData] = useState<ResortFormData>({
    resortName: "",
    slug: "",
    contactPersonName: "",
    contactNumber: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    cityDistrict: "",
    stateProvince: "",
    postalCode: "",
    country: "",
    logo: null,
    website: "",
    foodProviding: "",
    foodDetails: "",
    roomIdPrefix: "",
    extraGuestCharges: "",
    supportNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
    "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
    "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
    "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic",
    "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus",
    "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
    "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
    "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
    "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos",
    "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
    "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
    "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
    "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
    "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
    "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia",
    "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
    "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
    "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo",
    "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
    "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
    "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];

  // Helper function to generate slug from text
  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w-]+/g, '')        // Remove all non-word chars
      .replace(/--+/g, '-')           // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '')             // Trim - from end of text
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug when resort name changes
    if (name === 'resortName') {
      setFormData(prev => ({
        ...prev,
        resortName: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      foodProviding: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // submit multipart/form-data to backend
    const form = new FormData()
    Object.entries(formData).forEach(([key, val]) => {
      if (val === null || val === undefined) return
      // files handled separately
      if (key === 'logo' && val instanceof File) {
        form.append('logo', val)
      } else if (typeof val === 'object') {
        // skip nested address object; append flat fields
      } else {
        form.append(key, String(val))
      }
    })

    // append address fields
    form.append('addressLine1', formData.addressLine1)
    form.append('addressLine2', formData.addressLine2)
    form.append('cityDistrict', formData.cityDistrict)
    form.append('stateProvince', formData.stateProvince)
    form.append('postalCode', formData.postalCode)
    form.append('country', formData.country)

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  
  // Get token from localStorage
  fetchWithAuth(apiBase + '/api/resorts/add', {
      method: 'POST',
      body: form,
    })
      .then(async (res) => {
        // parse JSON if present, otherwise handle empty body
        let parsed = null
        try {
          const text = await res.text()
          parsed = text ? JSON.parse(text) : null
        } catch (_e) {
          parsed = null
        }

        if (!res.ok) {
          const errMsg = (parsed && parsed.error) || res.statusText || 'Failed'
          throw new Error(errMsg)
        }

        return parsed
      })
      .then(() => {
        alert('Resort created successfully!')
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
      resortName: "",
      slug: "",
      contactPersonName: "",
      contactNumber: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      cityDistrict: "",
      stateProvince: "",
      postalCode: "",
      country: "",
      logo: null,
      website: "",
      foodProviding: "",
      foodDetails: "",
      roomIdPrefix: "",
      extraGuestCharges: "",
      supportNumber: "",
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Resort Information Form
          </h1>
          <p className="text-slate-600">Please fill in all the required details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Resort Name */}
            <div className="space-y-2">
              <Label htmlFor="resortName" className="text-sm font-medium text-slate-700">
                Resort Name *
              </Label>
              <Input
                id="resortName"
                name="resortName"
                type="text"
                placeholder="Enter resort name"
                value={formData.resortName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                Slug *
              </Label>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="URL slug (auto-generated)"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>

            {/* Contact Person Name */}
            <div className="space-y-2">
              <Label htmlFor="contactPersonName" className="text-sm font-medium text-slate-700">
                Contact Person Name *
              </Label>
              <Input
                id="contactPersonName"
                name="contactPersonName"
                type="text"
                placeholder="Enter contact person name"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-2">
              <Label htmlFor="contactNumber" className="text-sm font-medium text-slate-700">
                Contact Number *
              </Label>
              <Input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                placeholder="Enter contact number"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Email */}
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                required
              />
            </div>

            {/* Website */}
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="website" className="text-sm font-medium text-slate-700">
                Website
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">Address Information</h3>
            
            {/* Address Lines */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="addressLine1" className="text-sm font-medium text-slate-700">
                  Address Line 1 *
                </Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  type="text"
                  placeholder="Enter address line 1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="addressLine2" className="text-sm font-medium text-slate-700">
                  Address Line 2
                </Label>
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  type="text"
                  placeholder="Enter address line 2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                />
              </div>
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cityDistrict" className="text-sm font-medium text-slate-700">
                  City/District *
                </Label>
                <Input
                  id="cityDistrict"
                  name="cityDistrict"
                  type="text"
                  placeholder="Enter city/district"
                  value={formData.cityDistrict}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stateProvince" className="text-sm font-medium text-slate-700">
                  State/Province *
                </Label>
                <Input
                  id="stateProvince"
                  name="stateProvince"
                  type="text"
                  placeholder="Enter state/province"
                  value={formData.stateProvince}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-sm font-medium text-slate-700">
                  Postal Code *
                </Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  placeholder="Enter postal code"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                  required
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                  Country *
                </Label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                  required
                >
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
          </div>

          {/* Files and Website */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Logo Upload */}
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="logo" className="text-sm font-medium text-slate-700">
                Logo
              </Label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
                  placeholder="Upload logo file"
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium text-slate-700">
                Website
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
          </div>

          {/* Food Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">Food Information</h3>
            
            {/* Food Providing Radio */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Food Providing *
              </Label>
              <RadioGroup value={formData.foodProviding} onValueChange={handleRadioChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="food-yes" />
                  <Label htmlFor="food-yes" className="text-sm text-slate-700 cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="food-no" />
                  <Label htmlFor="food-no" className="text-sm text-slate-700 cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Food Details */}
            {formData.foodProviding === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="foodDetails" className="text-sm font-medium text-slate-700">
                  Food Details
                </Label>
                <Textarea
                  id="foodDetails"
                  name="foodDetails"
                  placeholder="Describe food services, menu options, etc."
                  value={formData.foodDetails}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50 min-h-20"
                />
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Room ID Prefix */}
            <div className="space-y-2">
              <Label htmlFor="roomIdPrefix" className="text-sm font-medium text-slate-700">
                Room ID Prefix
              </Label>
              <Input
                id="roomIdPrefix"
                name="roomIdPrefix"
                type="text"
                placeholder="e.g., RM-"
                value={formData.roomIdPrefix}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>

            {/* Extra Guest Charges */}
            <div className="space-y-2">
              <Label htmlFor="extraGuestCharges" className="text-sm font-medium text-slate-700">
                Extra Guest Charges
              </Label>
              <Input
                id="extraGuestCharges"
                name="extraGuestCharges"
                type="number"
                placeholder="Enter amount"
                value={formData.extraGuestCharges}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>

            {/* Support Number */}
            <div className="space-y-2">
              <Label htmlFor="supportNumber" className="text-sm font-medium text-slate-700">
                Support Number
              </Label>
              <Input
                id="supportNumber"
                name="supportNumber"
                type="tel"
                placeholder="Enter support number"
                value={formData.supportNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors bg-slate-50"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit'
              )}
            </Button>
            <Button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResortFormComp;