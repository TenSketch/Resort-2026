import { X, MoreVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

// Match backend data (flattened for existing component usage)
interface ResortDetailData {
  _id: string;
  resortName?: string;
  slug?: string;
  contactPersonName?: string;
  contactNumber?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    cityDistrict?: string;
    stateProvince?: string;
    postalCode?: string;
    country?: string;
  };
  website?: string;
  foodProviding?: string;
  foodDetails?: string;
  roomIdPrefix?: string;
  extraGuestCharges?: number;
  supportNumber?: string;
  logo?: { url?: string } | string | null;
}

interface ResortDetailPanelProps {
  resort: ResortDetailData;
  isOpen: boolean;
  onClose: () => void;
  onResortUpdated?: (resort: ResortDetailData) => void;
}
const ResortDetailPanel = ({ resort, isOpen, onClose, onResortUpdated }: ResortDetailPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => flatten(resort));
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

  // flatten nested address for form editing
  function flatten(r: ResortDetailData) {
    return {
      _id: r._id,
      resortName: r.resortName || '',
      slug: r.slug || '',
      contactPersonName: r.contactPersonName || '',
      contactNumber: r.contactNumber || '',
      email: r.email || '',
      addressLine1: r.address?.line1 || '',
      addressLine2: r.address?.line2 || '',
      cityDistrict: r.address?.cityDistrict || '',
      stateProvince: r.address?.stateProvince || '',
      postalCode: r.address?.postalCode || '',
      country: r.address?.country || '',
      website: r.website || '',
      foodProviding: r.foodProviding || '',
      foodDetails: r.foodDetails || '',
      roomIdPrefix: r.roomIdPrefix || '',
      extraGuestCharges: r.extraGuestCharges !== undefined && r.extraGuestCharges !== null ? String(r.extraGuestCharges) : '',
      supportNumber: r.supportNumber || '',
      logo: typeof r.logo === 'string' ? r.logo : r.logo?.url || '',
    }
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      
      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === '_id' || key === 'logo') return;
        if (value !== null && value !== undefined && value !== '') {
          form.append(key, String(value));
        }
      });
      
      // Add logo file if selected
      if (logoFile) {
        form.append('logo', logoFile);
      }
      
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${apiBase}/api/resorts/${formData._id}`, {
        method: 'PUT',
        headers,
        body: form,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed: ${res.status}`);
      }
      
      const data = await res.json();
      if (onResortUpdated) onResortUpdated(data.resort);
      setIsEditing(false);
      setLogoFile(null);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const basicInfoData = [
    { field: "Resort Name", value: resort.resortName || '' },
    { field: "Slug", value: resort.slug || '' },
    { field: "Contact Person Name", value: resort.contactPersonName || '' },
    { field: "Contact Number", value: resort.contactNumber || '' },
    { field: "Email", value: resort.email || '' },
    { field: "Website", value: resort.website || '' },
    { field: "Support Number", value: resort.supportNumber || '' },
    { field: "Room ID Prefix", value: resort.roomIdPrefix || '' },
  ];

  const addressData = [
    { field: "Address Line 1", value: resort.address?.line1 || '' },
    { field: "Address Line 2", value: resort.address?.line2 || '' },
    { field: "City / District", value: resort.address?.cityDistrict || '' },
    { field: "State / Province", value: resort.address?.stateProvince || '' },
    { field: "Postal Code", value: resort.address?.postalCode || '' },
    { field: "Country", value: resort.address?.country || '' },
  ];

  const foodData = [
    { field: "Food Providing", value: resort.foodProviding || '' },
    { field: "Extra Guest Charges", value: resort.extraGuestCharges != null ? String(resort.extraGuestCharges) : '' },
  ];

  const foodDetailsData = [
    { field: "Food Details", value: resort.foodDetails || '' },
  ];

  const infoColumns: ColumnDef<{ field: string; value: string }>[] = [
    {
      accessorKey: "field",
      header: "Field",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700 min-w-[120px]">
          {row.getValue("field")}
        </div>
      ),
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => {
        const value = row.getValue("value") as string;
        const field = row.getValue("field") as string;

        if (field === "Email") {
          return (
            <a
              href={`mailto:${value}`}
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {value}
            </a>
          );
        }

        if (field === "Website") {
          return (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {value}
            </a>
          );
        }

        return <div className="text-slate-600 break-words">{value}</div>;
      },
    },
  ];

  const textAreaColumns: ColumnDef<{ field: string; value: string }>[] = [
    {
      accessorKey: "field",
      header: "Field",
      cell: ({ row }) => (
        <div className="font-medium text-slate-700 min-w-[120px]">
          {row.getValue("field")}
        </div>
      ),
    },
    {
      accessorKey: "value",
      header: "Content",
      cell: ({ row }) => {
        const value = row.getValue("value") as string;
        return (
          <div className="text-slate-600 whitespace-pre-wrap break-words max-w-full">
            {value}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* Main View Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-3/4 lg:w-1/2 bg-white shadow-xl overflow-y-auto border-l border-slate-200">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Resort Details</h2>
              <p className="text-sm text-slate-600">View resort information</p>
            </div>
            <Button variant="outline" size="icon" onClick={onClose} className="p-2">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {/* Basic Info with Action Menu */}
            <SectionHeader
              title="Basic Information"
              action={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
            <DataTable columns={infoColumns} data={basicInfoData} />

            {/* Resort Logo Display - Always show section */}
            <div className="flex flex-col space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Resort Logo</h4>
              {((typeof resort.logo === 'string' && resort.logo) || (typeof resort.logo === 'object' && resort.logo?.url)) ? (
                <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 w-fit">
                  <img
                    src={typeof resort.logo === 'string' ? resort.logo : resort.logo?.url}
                    alt="Resort Logo"
                    className="max-w-32 max-h-32 object-contain"
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">Stored on Cloudinary</p>
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 w-fit">
                  <div className="w-32 h-32 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl text-slate-300">📷</span>
                      <p className="text-xs text-slate-500 mt-2">No logo uploaded</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <SectionHeader title="Address Information" />
            <DataTable columns={infoColumns} data={addressData} />

            <SectionHeader title="Food Information" />
            <DataTable columns={infoColumns} data={foodData} />
            <DataTable columns={textAreaColumns} data={foodDetailsData} />
          </div>
        </div>
      </div>

      {/* Edit Overlay Panel */}
      {isEditing && (
        <div className="fixed inset-y-0 right-0 z-[60] w-full sm:w-3/4 lg:w-1/2 bg-white shadow-xl overflow-y-auto border-l border-slate-200">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-800">Edit Resort Information</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => {
                  setIsEditing(false);
                  setLogoFile(null);
                  setFormData(flatten(resort));
                }}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={saving} onClick={handleSave}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
              </div>
            </div>

            {error && <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded">{error}</div>}
            {saving && <div className="text-sm text-slate-500 mb-2">Saving...</div>}

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800 border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resortName" className="text-sm font-medium text-slate-700">Resort Name *</Label>
                    <Input
                      id="resortName"
                      value={formData.resortName}
                      onChange={(e) => setFormData({ ...formData, resortName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug" className="text-sm font-medium text-slate-700">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPersonName" className="text-sm font-medium text-slate-700">Contact Person Name</Label>
                    <Input
                      id="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactNumber" className="text-sm font-medium text-slate-700">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website" className="text-sm font-medium text-slate-700">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supportNumber" className="text-sm font-medium text-slate-700">Support Number</Label>
                    <Input
                      id="supportNumber"
                      type="tel"
                      value={formData.supportNumber}
                      onChange={(e) => setFormData({ ...formData, supportNumber: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="roomIdPrefix" className="text-sm font-medium text-slate-700">Room ID Prefix</Label>
                    <Input
                      id="roomIdPrefix"
                      value={formData.roomIdPrefix}
                      onChange={(e) => setFormData({ ...formData, roomIdPrefix: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="logo" className="text-sm font-medium text-slate-700">
                      Resort Logo
                      <span className="text-xs text-slate-500 font-normal ml-2">(Uploads to Cloudinary)</span>
                    </Label>
                    {logoFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogoFile(null)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-4 flex-wrap">
                    {/* Current Logo */}
                    {formData.logo && !logoFile && (
                      <div className="flex flex-col items-center">
                        <div className="border-2 border-slate-300 rounded-lg p-3 bg-white">
                          <img 
                            src={formData.logo} 
                            alt="Current logo" 
                            className="w-24 h-24 object-contain" 
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-2 font-medium">Current Logo</p>
                        <p className="text-xs text-slate-500">Upload new to replace</p>
                      </div>
                    )}

                    {/* No Current Logo */}
                    {!formData.logo && !logoFile && (
                      <div className="flex flex-col items-center">
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 bg-white w-24 h-24 flex items-center justify-center">
                          <span className="text-3xl text-slate-400">📷</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 font-medium">No Logo Yet</p>
                        <p className="text-xs text-slate-500">Upload below</p>
                      </div>
                    )}

                    {/* New Logo Preview */}
                    {logoFile && (
                      <div className="flex flex-col items-center">
                        <div className="border-2 border-green-400 rounded-lg p-3 bg-white">
                          <img 
                            src={URL.createObjectURL(logoFile)} 
                            alt="New logo preview" 
                            className="w-24 h-24 object-contain" 
                          />
                        </div>
                        <p className="text-xs text-green-600 mt-2 font-medium">✓ New Logo</p>
                        <p className="text-xs text-slate-500">{logoFile.name}</p>
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <div>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Accepted formats: JPG, PNG, GIF, SVG • Max size: 5MB • Uploads to Cloudinary automatically
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800 border-b pb-2">Address Information</h3>
                
                <div>
                  <Label htmlFor="addressLine1" className="text-sm font-medium text-slate-700">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2" className="text-sm font-medium text-slate-700">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cityDistrict" className="text-sm font-medium text-slate-700">City/District</Label>
                    <Input
                      id="cityDistrict"
                      value={formData.cityDistrict}
                      onChange={(e) => setFormData({ ...formData, cityDistrict: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stateProvince" className="text-sm font-medium text-slate-700">State/Province</Label>
                    <Input
                      id="stateProvince"
                      value={formData.stateProvince}
                      onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium text-slate-700">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium text-slate-700">Country</Label>
                    <select
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Food Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800 border-b pb-2">Food Information</h3>
                
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Food Providing</Label>
                  <RadioGroup 
                    value={formData.foodProviding} 
                    onValueChange={(value) => setFormData({ ...formData, foodProviding: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="food-yes" />
                      <Label htmlFor="food-yes" className="text-sm cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="food-no" />
                      <Label htmlFor="food-no" className="text-sm cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.foodProviding === 'yes' && (
                  <div>
                    <Label htmlFor="foodDetails" className="text-sm font-medium text-slate-700">Food Details</Label>
                    <Textarea
                      id="foodDetails"
                      value={formData.foodDetails}
                      onChange={(e) => setFormData({ ...formData, foodDetails: e.target.value })}
                      className="mt-1 min-h-20"
                      placeholder="Describe food services, menu options, etc."
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="extraGuestCharges" className="text-sm font-medium text-slate-700">Extra Guest Charges</Label>
                  <Input
                    id="extraGuestCharges"
                    type="number"
                    value={formData.extraGuestCharges}
                    onChange={(e) => setFormData({ ...formData, extraGuestCharges: e.target.value })}
                    className="mt-1"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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

export default ResortDetailPanel;

/* Section Header with optional action button */
const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
    <h3 className="text-lg sm:text-xl font-semibold text-slate-800">{title}</h3>
    {action}
  </div>
);

/* Generic Data Table */
const DataTable = ({
  columns,
  data,
}: {
  columns: ColumnDef<any>[];
  data: any[];
}) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3 py-3 text-left font-medium text-slate-700">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={`hover:bg-slate-50 transition-colors ${
                index % 2 === 0 ? "bg-white" : "bg-slate-25"
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
