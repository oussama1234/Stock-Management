// LoadingComponentsDemo.jsx - Comprehensive demo of all redesigned loading components
// This file demonstrates all the new ultra-modern loading components with different configurations

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  Download, 
  Send, 
  Trash2, 
  ShoppingCart, 
  Package, 
  BarChart3,
  Users,
  Settings
} from 'lucide-react';

import ContentSpinner from './ContentSpinner';
import LoadingButton from './LoadingButton';
import LoadingSpinner from './LoadingSpinner';
import SalesLoadingButton from '../../pages/Admin/Sales/components/SalesLoadingButton';

export default function LoadingComponentsDemo() {
  const [buttonStates, setButtonStates] = useState({
    primary: false,
    success: false,
    error: false,
    sales: false,
  });

  const handleButtonClick = (type) => {
    setButtonStates(prev => ({ ...prev, [type]: true }));
    
    // Simulate async operation
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Ultra-Modern Loading Components
          </h1>
          <p className="text-gray-600 text-lg">
            Redesigned with beautiful animations, dynamic themes, and enhanced UX
          </p>
        </motion.div>

        {/* ContentSpinner Variants */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">ContentSpinner Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Modern Variant */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                Modern Orbital
              </h3>
              <ContentSpinner
                variant="modern"
                theme="default"
                size="medium"
                message="Loading dashboard data..."
                showProgress={true}
              />
            </motion.div>

            {/* Sales Theme */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                Sales Theme
              </h3>
              <ContentSpinner
                variant="modern"
                theme="sales"
                size="medium"
                message="Processing sales data..."
                showProgress={true}
              />
            </motion.div>

            {/* Analytics Theme */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                Analytics Theme
              </h3>
              <ContentSpinner
                variant="modern"
                theme="analytics"
                size="medium"
                message="Computing insights..."
                showProgress={true}
              />
            </motion.div>

            {/* Minimal Variant */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                Minimal Style
              </h3>
              <ContentSpinner
                variant="minimal"
                size="medium"
                message="Loading..."
              />
            </motion.div>

            {/* Orbital Variant */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                Orbital Style
              </h3>
              <ContentSpinner
                variant="orbital"
                theme="inventory"
                size="medium"
                message="Scanning inventory..."
              />
            </motion.div>

            {/* Large Size */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                Large Size
              </h3>
              <ContentSpinner
                variant="modern"
                theme="users"
                size="large"
                message="Loading users..."
                showProgress={true}
              />
            </motion.div>

          </div>
        </section>

        {/* LoadingButton Variants */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Enhanced LoadingButton</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-700">Primary Variants</h3>
              <LoadingButton
                loading={buttonStates.primary}
                onClick={() => handleButtonClick('primary')}
                variant="primary"
                icon={Save}
                ripple={true}
                glow={true}
              >
                Save Changes
              </LoadingButton>
              
              <LoadingButton
                variant="gradient"
                icon={Download}
                size="lg"
                ripple={true}
                glow={true}
              >
                Download Report
              </LoadingButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-700">Success & Error States</h3>
              <LoadingButton
                success={buttonStates.success}
                onClick={() => handleButtonClick('success')}
                variant="success"
                icon={Send}
                successMessage="Sent!"
              >
                Send Email
              </LoadingButton>
              
              <LoadingButton
                error={buttonStates.error}
                onClick={() => handleButtonClick('error')}
                variant="danger"
                icon={Trash2}
                errorMessage="Failed!"
              >
                Delete Item
              </LoadingButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-700">Different Sizes</h3>
              <LoadingButton variant="secondary" size="xs">
                Extra Small
              </LoadingButton>
              <LoadingButton variant="primary" size="sm" icon={Settings}>
                Small
              </LoadingButton>
              <LoadingButton variant="gradient" size="xl" icon={BarChart3}>
                Extra Large
              </LoadingButton>
            </motion.div>

          </div>
        </section>

        {/* SalesLoadingButton */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Sales-Specific LoadingButton</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-700">Sales Actions</h3>
              <SalesLoadingButton
                loading={buttonStates.sales}
                onClick={() => handleButtonClick('sales')}
                variant="primary"
                icon={ShoppingCart}
                glowEffect={true}
                rippleEffect={true}
                loadingText="Processing Sale..."
              >
                Complete Sale
              </SalesLoadingButton>
              
              <SalesLoadingButton
                variant="gradient"
                icon={Package}
                size="lg"
                glowEffect={true}
                pulseOnHover={true}
              >
                Add to Inventory
              </SalesLoadingButton>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-gray-700">Different States</h3>
              <SalesLoadingButton
                success={true}
                variant="success"
                icon={BarChart3}
                successText="Sale Completed!"
                glowEffect={true}
              >
                Generate Report
              </SalesLoadingButton>
              
              <SalesLoadingButton
                variant="secondary"
                icon={Users}
                size="sm"
                rippleEffect={true}
              >
                View Customers
              </SalesLoadingButton>
            </motion.div>

          </div>
        </section>

        {/* LoadingSpinner Preview */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Full-Screen LoadingSpinner</h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <p className="text-gray-600 mb-4">
              Full-screen loading spinner with orbital animation, progress bars, and dynamic steps
            </p>
            <p className="text-sm text-gray-500 italic">
              Note: This would appear as a full-screen overlay in the actual application
            </p>
            <div className="mt-6 p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-xl">
              <div className="scale-50 transform-origin-center">
                <LoadingSpinner
                  theme="analytics"
                  variant="orbital"
                  showProgress={true}
                  showSteps={true}
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Summary */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-6">New Features Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div>
                <h3 className="font-semibold text-lg mb-2">🎨 Dynamic Theming</h3>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Context-aware icons</li>
                  <li>• Theme-specific messages</li>
                  <li>• Adaptive color schemes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">✨ Advanced Animations</h3>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Orbital particle systems</li>
                  <li>• Smooth state transitions</li>
                  <li>• Ripple & glow effects</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">🚀 Enhanced UX</h3>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Progress indicators</li>
                  <li>• Success/error states</li>
                  <li>• Dynamic step messaging</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">⚡ Multiple Variants</h3>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Modern, minimal, orbital</li>
                  <li>• Multiple size options</li>
                  <li>• Customizable behaviors</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">🎯 Smart States</h3>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Auto-reset timers</li>
                  <li>• Loading state management</li>
                  <li>• Contextual feedback</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">📱 Responsive Design</h3>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>• Mobile-optimized</li>
                  <li>• Consistent scaling</li>
                  <li>• Touch-friendly</li>
                </ul>
              </div>

            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}