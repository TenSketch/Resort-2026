

import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router";
import {
  ChevronRight,
  ChevronDown,
  Building2,
  Bed,
  Calendar,
  FileText,
  Home,
  Plus,
  Globe,
  BookOpen,
  BedDouble,
  ClipboardMinus,
  Tent,
  Binoculars,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useViewType } from "@/lib/ViewTypeContext";
import type { ViewType } from "@/lib/ViewTypeContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { viewType } = useViewType();
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? [] // Close the current section
        : [section] // Open only the clicked section, close others
    );
  };

  const allMenuItems = [
    // Resort Management
    {
      id: "resort-dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/dashboard/report",
      viewTypes: ["resort"] as ViewType[],
    },
    {
      id: "resorts",
      label: "Resorts",
      icon: Building2,
      viewTypes: ["resort"] as ViewType[],
      children: [
        { label: "All Resorts", path: "/resorts/all", icon: Globe },
        { label: "Add Resort", path: "/resorts/add", icon: Plus },
      ],
    },
    {
      id: "cottage-types",
      label: "Cottage Types",
      icon: BookOpen,
      viewTypes: ["resort"] as ViewType[],
      children: [
        { label: "All Types", path: "/cottage-types/all", icon: BookOpen },
        { label: "Add Type", path: "/cottage-types/add", icon: Plus },
      ],
    },
    {
      id: "rooms",
      label: "Rooms",
      icon: Bed,
      viewTypes: ["resort"] as ViewType[],
      children: [
        { label: "All Rooms", path: "/rooms/all", icon: BedDouble },
        { label: "Add Room", path: "/rooms/add", icon: Plus },
      ],
    },
    // Room Amenities removed from Resort Management per request
    {
      id: "res-reservations",
      label: "Reservations",
      icon: Calendar,
      viewTypes: ["resort"] as ViewType[],
      children: [
        { label: "All Reservations", path: "/reservation/all", icon: Calendar },
        { label: "Add Reservation", path: "/reservation/add", icon: Plus },
      ],
    },
    {
      id: "res-reports",
      label: "Reports",
      icon: FileText,
      viewTypes: ["resort"] as ViewType[],
      children: [
        { label: "Daily Occupancy Jungle Star", path: "/reports/daily-occupancy-junglestar", icon: ClipboardMinus },
        { label: "Daily Occupancy Vanavihari", path: "/reports/daily-occupancy-vanavihari", icon: ClipboardMinus },
        // { label: "Payments", path: "/reports/payments", icon: FileText },
        // { label: "Logs", path: "/log-reports/all", icon: FileText },
      ],
    },

    // Tent Management
    {
      id: "tent-dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/tent/dashboard",
      viewTypes: ["tent"] as ViewType[],
    },
    {
      id: "tentspots",
      label: "Tent Spots",
      icon: Tent,
      viewTypes: ["tent"] as ViewType[],
      children: [
        { label: "Add Spots", path: "/tentspots/details", icon: Plus },
        { label: "All Spots", path: "/tentspots/all", icon: Globe },
      ],
    },
    {
      id: "tenttypes",
      label: "Tent Types",
      icon: Tent,
      viewTypes: ["tent"] as ViewType[],
      children: [
        { label: "Add Tent Type", path: "/tenttypes/add", icon: Plus },
        { label: "All Tent Types", path: "/tenttypes/all", icon: BookOpen },
      ],
    },
    // Tent Inventory removed from Tent Management per request
        {
      id: "tentinventory",
      label: "Tent Inventory",
      icon: Tent,
      viewTypes: ["tent"] as ViewType[],
      children: [
        { label: "Add Tents", path: "/tentinventory/addtents", icon: Plus },
        { label: "All Tents", path: "/tentinventory/alltents", icon: BookOpen },
      ],
    },
    {
      id: "tent-bookings",
      label: "Tent Bookings",
      icon: Calendar,
      viewTypes: ["tent"] as ViewType[],
      children: [
        { label: "Add Bookings", path: "/tentbookings/addbookings", icon: Plus },
        { label: "All Bookings", path: "/tentbookings/allbookings", icon: Calendar }
      ],
    },
    // {
    //   id: "tent-reports",
    //   label: "Reports",
    //   icon: FileText,
    //   viewTypes: ["tent"] as ViewType[],
    //   children: [
    //     { label: "Utilisation", path: "/reports/utilisation", icon: FileText },
    //   ],
    // },

    // Tourist Spot Management
    {
      id: "tourist-dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/tourist/dashboard",
      viewTypes: ["tourist-spot"] as ViewType[],
    },
    {
      id: "spots",
      label: "Spots",
      icon: Binoculars,
      viewTypes: ["tourist-spot"] as ViewType[],
      children: [
        { label: "Add Spot", path: "/touristspots/add", icon: Plus },
        { label: "All Spots", path: "/touristspots/all", icon: Binoculars },
      ],
    },
    {
      id: "packages",
      label: "Packages",
      icon: Globe,
      viewTypes: ["tourist-spot"] as ViewType[],
      children: [
        { label: "All Packages", path: "/tourist/packages", icon: Globe },
      ],
    },
    {
      id: "tourist-bookings",
      label: "Bookings",
      icon: Calendar,
      viewTypes: ["tourist-spot"] as ViewType[],
      children: [
        { label: "Add Booking", path: "/tourist/bookings/add", icon: Plus },
        { label: "All Bookings", path: "/tourist/bookings", icon: Calendar },
      ],
    },
    // {
    //   id: "tourist-reports",
    //   label: "Reports",
    //   icon: FileText,
    //   viewTypes: ["tourist-spot"] as ViewType[],
    //   children: [
    //     { label: "Visits", path: "/reports/visits", icon: FileText },
    //     { label: "Revenue", path: "/reports/revenue", icon: FileText },
    //   ],
    // },
  ];

  // Filter menu items based on current view type
  const menuItems = useMemo(() => {
    return allMenuItems.filter(item => item.viewTypes.includes(viewType));
  }, [viewType]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-white/10 backdrop-blur-md z-40 lg:hidden"
          onClick={onClose}
        />
      )}


      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out z-50",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="min-h-full flex flex-col">
          <div className="p-4">
            {/* Brand */}
            <div className="flex items-center space-x-2">
          <img 
            src="https://res.cloudinary.com/dia8x6y6u/image/upload/v1752997496/logo_kszbod.png"
            alt="Vanavihari Logo"
            className="w-full h-8 object-contain"
          />
        </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              if (!item.children) {
                return (
                  <Link
                    key={item.id}
                    to={item.path || "#"}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      isActive(item.path || "")
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-slate-700 hover:text-white"
                    )}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              }

              const isOpen = openSections.includes(item.id);
              const hasActiveChild = item.children.some(child => isActive(child.path));

              return (
                <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleSection(item.id)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between px-3 py-2 h-auto text-left font-normal",
                        hasActiveChild
                          ? "bg-slate-700 text-white"
                          : "text-gray-300 hover:bg-slate-700 hover:text-white"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "flex items-center space-x-3 px-6 py-2 rounded-lg transition-colors ml-4",
                          isActive(child.path)
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:bg-slate-700 hover:text-white"
                        )}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                      >
                        <child.icon className="h-4 w-4" />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;