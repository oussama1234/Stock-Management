// THIS IS THE dashboard layout, needs to contain navbar and sidebar and footer at once 
// and the main content in the middle
// the main content will be passed as children props
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import SideBar from '@/components/SideBar';
import Footer from '@/components/Footer';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="flex flex-col h-screen">
            <Navbar />
            <div className="flex flex-1">
                <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <main className="flex-1 p-4">{children}</main>
            </div>
            <Footer />
        </div>
    );


}
