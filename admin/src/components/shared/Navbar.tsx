
import { Menu, User, LogOut, Building2, Tent, MapPin, Check, ChevronDown, Globe, Users, FileText, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router";
import Breadcrumb from "./Breadcrumb";
import NotificationDropdown from "./NotificationDropDown";
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
  "/dashboard/report": ["Dashboard", "Reports"],
  "/dailyoccupanyreport/vanavihari": ["Daily Occupancy", "Vanavihari Report"],
  "/dailyoccupanyreport/junglestar": ["Daily Occupancy", "Jungle Star Report"],
  "/frontdesk/checkin": ["Front Desk", "Check In"],
  "/frontdesk/checkout": ["Front Desk", "Check Out"],
  "/rooms/add": ["Rooms", "Add Room"],
  "/rooms/all": ["Rooms", "All Rooms"],

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
  "/touristspots/add": ["Tourist Spots", "Add Tourist Spots"],
  "/touristspots/all": ["Tourist Spots", "Add Tourist Spots"],
  "/tenttypes/add": ["Tent Types", "Add Tent Types"],
  "/tenttypes/all": ["Tent Types", "All Tent Types"],
  "/tentbookings/addbookings": ["Tent Bookings", "Add Tent Bookings"],
  "/tentbookings/allbookings": ["Tent Bookings", "All Tent Bookings"],
  "/tent/dashboard": ["Tent", "Dashboard"],
  "/tent/bookings": ["Tent", "Bookings"],
  "/tent/inventory": ["Tent", "Inventory"],
  "/tentspots/details": ["Tent Spots", "Details"],
  "/tourist/dashboard": ["Tourist Spots", "Dashboard"],
  "/tourist/bookings": ["Tourist", "Bookings"],
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
  const { logout } = useAdmin();
  const { viewType, setViewType } = useViewType();
  const currentPath = location.pathname;

  const breadcrumbs = breadcrumbMap[currentPath] || ["Dashboard", "Unknown Page"];

  const handleSignOut = () => {
    logout();
    navigate('/auth/login');
  };

  const handleViewTypeChange = (newViewType: ViewType) => {
    // setViewType will now navigate to the module-specific booking/reservation
    setViewType(newViewType);
  };

  const viewTypeOptions: { value: ViewType; label: string; icon: typeof Building2 }[] = [
    { value: "resort", label: "Resort", icon: Building2 },
    { value: "tent", label: "Tent", icon: Tent },
    { value: "tourist-spot", label: "Tourist Spot", icon: MapPin },
  ];

  const currentViewOption = viewTypeOptions.find(option => option.value === viewType);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
      <div className="flex items-center justify-between flex-nowrap gap-1 sm:gap-2">
        {/* Left side */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-nowrap overflow-hidden min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden p-1 sm:p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center shrink-0">
            <span className="text-lg sm:text-xl font-semibold text-gray-800 hidden sm:block">
              Vanavihari Admin
            </span>
            <span className="text-sm font-semibold text-gray-800 sm:hidden">
              Vana
            </span>
          </div>

          {/* Breadcrumb - hidden on very small screens */}
          <div className="hidden xs:block truncate whitespace-nowrap overflow-hidden min-w-0">
            <Breadcrumb
              items={breadcrumbs}
              className="text-gray-600 truncate text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Right side - reduced spacing for mobile */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
          {/* View Type Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center justify-between h-8 sm:h-9 px-1.5 sm:px-2 md:px-3 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  {currentViewOption && <currentViewOption.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  <span className="hidden sm:inline text-xs sm:text-sm whitespace-nowrap">{currentViewOption?.label}</span>
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

          <NotificationDropdown/>

          {/* Global top-bar menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center h-8 sm:h-9 px-1.5 sm:px-2">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden md:inline text-sm ml-1">Global</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => navigate('/guests/all')}>
                <Users className="mr-2 h-4 w-4" />
                Guests
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/log-reports/all')}>
                <FileText className="mr-2 h-4 w-4" />
                Logs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Home className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Account dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center h-8 sm:h-9 px-1.5 sm:px-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <span className="hidden lg:block text-sm ml-1">Account</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                My Account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;