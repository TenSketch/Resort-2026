import { createContext, useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import type { ReactNode } from "react";

export type ViewType = "resort" | "tent" | "tourist-spot";

interface ViewTypeContextType {
  viewType: ViewType;
  setViewType: (type: ViewType) => void;
}

const ViewTypeContext = createContext<ViewTypeContextType | undefined>(undefined);

// Function to determine view type based on URL path
const getViewTypeFromPath = (pathname: string): ViewType => {
  if (pathname.includes("/tent") || 
      pathname.includes("/tentbookings") || 
      pathname.includes("/tenttypes") || 
      pathname.includes("/tentspots")) {
    return "tent";
  }
  
  if (pathname.includes("/tourist") || 
      pathname.includes("/touristspots") || 
      pathname.includes("/packages")) {
    return "tourist-spot";
  }
  
  // Default to resort for all other paths including dashboard, resorts, rooms, etc.
  return "resort";
};

export const ViewTypeProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize state from localStorage or default to "resort"
  const [viewType, setViewTypeState] = useState<ViewType>(() => {
    const stored = localStorage.getItem("admin-view-type") as ViewType;
    const fromPath = getViewTypeFromPath(location.pathname);
    return stored || fromPath;
  });

  // Update view type when location changes
  useEffect(() => {
    const newViewType = getViewTypeFromPath(location.pathname);
    if (newViewType !== viewType) {
      setViewTypeState(newViewType);
      localStorage.setItem("admin-view-type", newViewType);
    }
  }, [location.pathname, viewType]);

  // Custom setter that also updates localStorage
  const setViewType = (type: ViewType) => {
    setViewTypeState(type);
    localStorage.setItem("admin-view-type", type);

    // Navigate to the module-specific booking/reservation page
    switch (type) {
      case "resort":
        navigate('/reservation/all');
        break;
      case "tent":
        navigate('/tentbookings/allbookings');
        break;
      case "tourist-spot":
        navigate('/tourist/bookings');
        break;
    }
  };

  return (
    <ViewTypeContext.Provider value={{ viewType, setViewType }}>
      {children}
    </ViewTypeContext.Provider>
  );
};

export const useViewType = () => {
  const context = useContext(ViewTypeContext);
  if (!context) {
    throw new Error("useViewType must be used within ViewTypeProvider");
  }
  return context;
};
