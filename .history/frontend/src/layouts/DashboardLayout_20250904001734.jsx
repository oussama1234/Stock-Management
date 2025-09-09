// Layout.jsx (Updated with improved colors)
// DashboardLayout.jsx with improved colors and children prop
import React, { useState } from 'react';
import Sidebar from '@/components/SideBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 via-blue-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-6 min-h-full">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default Layout;