// this is the dashboard layout file
// it contains navbar, sidebar and main content area
// the navbar is fixed at the top
// the sidebar is collapsible and can be toggled
// the main content area is where the pages will be rendered

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import SideBar from '@/components/SideBar';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    return (
        <div className="flex h-screen">
            <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div className="flex-1 p-4">
                <Button onClick={toggleSidebar} className="lg:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
                {children}
            </div>
        </div>
    );
}
