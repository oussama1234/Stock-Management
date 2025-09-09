// Layout.jsx (Updated to fix sidebar toggle)
import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 min-h-full">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;