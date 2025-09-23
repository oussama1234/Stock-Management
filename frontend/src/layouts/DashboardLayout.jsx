// Layout.jsx (Updated with improved colors)
// DashboardLayout.jsx with improved colors and children prop
// it contains navbar, sidebar, footer and main content area
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/SideBar";
import { useState } from "react";

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /*************  ✨ Windsurf Command ⭐  *************/
  /**
   * Toggle the sidebar open or closed state
   * @function
   */
  /*******  b2e37f94-c895-43da-9e2b-d571b19c3422  *******/ const toggleSidebar =
    () => {
      setSidebarOpen(!sidebarOpen);
    };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 via-blue-50 dark:from-gray-900 dark:to-gray-800 dark:via-gray-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-y-auto p-2 md:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 p-4 min-h-full">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
