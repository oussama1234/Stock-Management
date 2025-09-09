// NotFound.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, AlertCircle, Search, BarChart3 } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 via-blue-50 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-200/20"
            initial={{
              scale: 0,
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative w-full max-w-md"
      >
        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
          <div className="px-8 py-12">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-md opacity-50"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-6 rounded-2xl shadow-lg">
                  <AlertCircle className="h-16 w-16 text-white" />
                </div>
              </div>
            </motion.div>
            
            {/* Text Content */}
            <div className="text-center mb-10">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4"
              >
                404
              </motion.h1>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-800 mb-4"
              >
                Page Not Found
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-8"
              >
                Sorry, we couldn't find the page you're looking for. Perhaps you've mistyped the URL or the page has been moved.
              </motion.p>
            </div>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-md hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Go Home
                </motion.button>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium shadow-sm hover:bg-gray-200 transition-all duration-300"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Go Back
              </button>
            </motion.div>

            {/* Search Suggestion */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10"
            >
              <p className="text-center text-gray-500 text-sm mb-3">Or try searching</p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search our inventory..."
                  className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-gray-700 placeholder-gray-400 transition-all duration-300"
                />
              </div>
            </motion.div>
          </div>
          
          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="px-8 py-4 bg-gray-50 border-t border-gray-200/80 flex items-center justify-center"
          >
            <BarChart3 className="h-5 w-5 text-indigo-500 mr-2" />
            <span className="text-sm text-gray-600">StockAI Manager • Intelligent Inventory System</span>
          </motion.div>
        </div>

        {/* Home Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <Link to="/" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors duration-300">
            ← Return to StockAI Manager
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;