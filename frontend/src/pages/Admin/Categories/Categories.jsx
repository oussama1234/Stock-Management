// src/pages/Admin/Categories/Categories.jsx
// Main Categories component with dashboard and table views
// - Beautiful analytics dashboard as default view
// - Traditional table view for detailed management
// - Smooth transitions between views

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, List, Eye, Settings } from 'lucide-react';

// Import our new components
import CategoriesDashboard from './CategoriesDashboard';
import CategoryList from './CategoryListEnhanced';

export default function Categories() {
  const [activeView, setActiveView] = useState('list'); // 'list' or 'dashboard' - list first

  const viewButtons = [
    {
      id: 'list',
      label: 'Categories List',
      icon: List,
      description: 'Manage all categories'
    },
    {
      id: 'dashboard',
      label: 'Analytics Dashboard',
      icon: BarChart3,
      description: 'Performance insights & KPIs'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
      {/* View Switcher */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="inline-flex bg-gray-100 rounded-2xl p-1 shadow-inner">
              {viewButtons.map((view) => (
                <motion.button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`relative flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeView === view.id
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <view.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-bold">{view.label}</div>
                    <div className="text-xs text-gray-500">{view.description}</div>
                  </div>
                  
                  {activeView === view.id && (
                    <motion.div
                      layoutId="activeViewIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-xl -z-10"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Content */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {activeView === 'dashboard' && <CategoriesDashboard />}
        {activeView === 'list' && <CategoryList />}
      </motion.div>
    </div>
  );
}