
import React, { useEffect, useRef, useState } from "react";
import { Menu, User, LogOut, Building2, Tent, MapPin, Check, ChevronDown, Users, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router";
import Breadcrumb from "./Breadcrumb";
// import NotificationDropdown from "./NotificationDropDown";
import { useAdmin } from "@/lib/AdminProvider";
import { useViewType } from "@/lib/ViewTypeContext";
import type { ViewType } from "@/lib/ViewTypeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onMenuClick: () => void;
}

// Breadcrumb mapping for different routes
const breadcrumbMap: Record<string, string[]> = {
  "/": ["Dashboard"],
  "/dashboard/report": ["Dashboard"],
  "/dailyoccupanyreport/vanavihari": ["Daily Occupancy", "Vanavihari Report"],
  "/dailyoccupanyreport/junglestar": ["Daily Occupancy", "Jungle Star Report"],
  "/frontdesk/checkin": ["Front Desk", "Check In"],
  "/frontdesk/checkout": ["Front Desk", "Check Out"],
  "/rooms/add": ["Rooms", "Add Room"],
  "/rooms/all": ["Rooms", "All Rooms"],
  "/reports/consolidation-report-vanavihari" : ["Consolidation Report"],
  "/users/manage" : ["User Management"],

  "/reports/daily-occupancy-junglestar": ["Report", "JungleStar"],
  "/reports/daily-occupancy-vanavihari": ["Report", "Vanavihari"],


  "/guests/add": ["Guests", "Add Guest"],
  "/guests/all": ["Guests", "All Guests"],
  "/resorts/add": ["Resorts", "Add Resort"],
  "/resorts/all": ["Resorts", "All Resorts"],
  "/log-reports/all": ["Log Reports", "All Reports"],
  "/log-reports/table": ["Log Reports", "Report Table"],
  "/reservation/add": ["Reservations", "Add Reservation"],
  "/reservation/all": ["Reservations", "All Reservations"],
  "/cottage-types/all": ["Cottage Types", "All Types"],
  "/cottage-types/add": ["Cottage Types", "Add Type"],
  "/room-amenities/all": ["Room Amenities", "All Amenities"],
  "/room-amenities/add": ["Room Amenities", "Add Amenity"],
  "/touristspots/add": ["Trek Spots", "Add Trek Spots"],
  "/touristspots/all": ["Trek Spots", "All Trek Spots"],
  "/tenttypes/add": ["Tent Types", "Add Tent Types"],
  "/tenttypes/all": ["Tent Types", "All Tent Types"],
  "/tentbookings/addbookings": ["Tent Bookings", "Add Tent Bookings"],
  "/tentbookings/allbookings": ["Tent Bookings", "All Tent Bookings"],
  "/tent/dashboard": ["Tent", "Dashboard"],
  "/tent/bookings": ["Tent", "Bookings"],

  "/tentinventory/alltents" : ["Tent Inventory","All Tents"],
  "/tentinventory/addtents" : ["Tent Inventory","Add Tents"],

  "/tentspots/all" : ["Tent Spots","All Tent Spots"],
  "/tent/inventory": ["Tent", "Inventory"],
  "/tentspots/details": ["Tent Spots", "Details"],
  "/tourist/dashboard": ["Trek Spots", "Dashboard"],
  "/tourist/bookings": ["Tourist", "All Bookings"],
  "/tourist/bookings/add": ["Tourist", "Add Bookings"],
  "/reports/daily-occupancy": ["Reports", "Daily Occupancy"],
  "/reports/payments": ["Reports", "Payments"],
  "/reports/utilisation": ["Reports", "Utilisation"],
  "/reports/cancellations": ["Reports", "Cancellations"],
  "/reports/visits": ["Reports", "Visits"],
  "/reports/revenue": ["Reports", "Revenue"],
  "/tourist/packages": ["Packages", "All Packages"],
  "/settings": ["Settings"],
};

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, admin } = useAdmin();
  const { viewType, setViewType } = useViewType();
  const currentPath = location.pathname;

  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem('admin_avatar'));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const breadcrumbs = breadcrumbMap[currentPath] || ["Dashboard", "Unknown Page"];

  const handleSignOut = () => {
    logout();
    navigate('/auth/login');
  };

  const handleViewTypeChange = (newViewType: ViewType) => {
    // setViewType will now navigate to the module-specific booking/reservation
    setViewType(newViewType);
  };

  useEffect(() => {
    const onUpdated = () => setAvatar(localStorage.getItem('admin_avatar'));
    window.addEventListener('admin-avatar-updated', onUpdated);
    return () => window.removeEventListener('admin-avatar-updated', onUpdated);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        localStorage.setItem('admin_avatar', dataUrl);
        setAvatar(dataUrl);
        window.dispatchEvent(new Event('admin-avatar-updated'));
      } catch (err) {
        // ignore
      }
    };
    reader.readAsDataURL(file);
  };

  const viewTypeOptions: { value: ViewType; label: string; icon: typeof Building2 }[] = [
    { value: "resort", label: "Resort", icon: Building2 },
    { value: "tent", label: "Tent", icon: Tent },
    { value: "tourist-spot", label: "Trek Spot", icon: MapPin },
  ];

  const currentViewOption = viewTypeOptions.find(option => option.value === viewType);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
      <div className="flex items-center justify-between flex-nowrap gap-1 sm:gap-2">
        {/* Left side */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-nowrap overflow-hidden min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden p-1 sm:p-2 flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center flex-shrink-0">
            <span className="text-base sm:text-xl font-semibold text-gray-800 hidden md:block whitespace-nowrap">
              Vanavihari Admin
            </span>
            <span className="text-sm font-semibold text-gray-800 md:hidden whitespace-nowrap">
              Vana Admin
            </span>
          </div>

          {/* Breadcrumb - hidden on mobile */}
          <div className="hidden sm:block truncate whitespace-nowrap overflow-hidden min-w-0 flex-1">
            <Breadcrumb
              items={breadcrumbs}
              className="text-gray-600 truncate text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Right side - reduced spacing for mobile */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-2 flex-shrink-0">

          {/* Guests Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center min-h-[44px] h-11 sm:h-9 px-2"
              >
                <span className="text-[13px] font-medium text-gray-500 mr-1 hidden sm:inline">Guests</span>
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/guests/all')} className="cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                All Guests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/guests/add')} className="cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Guest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Type Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center justify-between min-h-[44px] h-11 sm:h-9 px-2 md:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[13px] font-medium text-gray-500 mr-1 whitespace-nowrap hidden sm:inline">{currentViewOption?.label}</span>
                  {currentViewOption && <currentViewOption.icon className="h-4 w-4 sm:h-4 sm:w-4" />}
                </div>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {viewTypeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleViewTypeChange(option.value)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                  {viewType === option.value && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* <NotificationDropdown/> */}


          {/* Global top-bar menu */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center h-8 sm:h-9 px-1.5 sm:px-2">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden md:inline text-sm ml-1">Global</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/log-reports/all')}>
                <FileText className="mr-2 h-4 w-4" />
                Logs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Home className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* Account dropdown */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center min-h-[44px] h-11 sm:h-9 px-1.5 sm:px-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                  {avatar ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 sm:h-4 sm:w-4 text-white" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                    {avatar ? (
                      // eslint-disable-next-line jsx-a11y/img-redundant-alt
                      <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{admin?.name || 'Account'}</div>
                    <div className="text-xs text-slate-500 capitalize">{(
                      admin?.role === 'superadmin' ? 'Super Admin' :
                      admin?.role || ''
                    )}</div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/my-account')} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUploadClick} className="cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                Upload Photo
              </DropdownMenuItem>
              {avatar && (
                <DropdownMenuItem
                  onClick={() => {
                    try {
                      localStorage.removeItem('admin_avatar');
                    } catch (e) {
                      // ignore
                    }
                    setAvatar(null);
                    window.dispatchEvent(new Event('admin-avatar-updated'));
                  }}
                  className="cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Photo
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;