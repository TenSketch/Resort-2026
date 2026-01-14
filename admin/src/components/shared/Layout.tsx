import { useState } from "react";
import { Outlet } from "react-router";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { ViewTypeProvider } from "@/lib/ViewTypeContext";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <ViewTypeProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar onMenuClick={toggleSidebar} />
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        {/* Main content with proper spacing */}
        <main className="pt-16 lg:pl-64 pb-16 min-h-screen">
          <div className="h-full p-4 overflow-y-auto">
            <Outlet />
          </div>
        </main>
        
        <Footer />
      </div>
    </ViewTypeProvider>
  );
};

export default Layout;