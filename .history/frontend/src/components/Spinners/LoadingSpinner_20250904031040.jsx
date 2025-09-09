// LoadingSpinner.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Package, Database, TrendingUp } from 'lucide-react';

const LoadingSpinner = ({ message = "Loading your stock data..." }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 via-blue-50 flex items-center justify-center z-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-200/30"
            initial={{
              scale: 0,
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: Math.random() * 8 + 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
            style={{
              width: Math.random() * 80 + 40,
              height: Math.random() * 80 + 40,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center justify-center">
        {/* Main spinner container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200/80 p-8 flex flex-col items-center"
        >
          {/* Outer rotating circle */}
          <div className="relative mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-28 h-28 rounded-full border-4 border-blue-100"
            />
            
            {/* Inner pulsing circle */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 m-auto w-20 h-20 rounded-full border-4 border-indigo-300"
            />
            
            {/* Rotating icons */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Package className="h-5 w-5 text-blue-500" />
                </motion.div>
              </div>
              
              <div className="absolute top-1/2 -right-2 transform -translate-y-1/2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Database className="h-5 w-5 text-indigo-500" />
                </motion.div>
              </div>
              
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </motion.div>
              </div>
              
              <div className="absolute top-1/2 -left-2 transform -translate-y-1/2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Central icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg"
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </motion.div>
          </div>
          
          {/* Loading text with animation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-2">StockAI Manager</h3>
            <p className="text-gray-600 mb-4">{message}</p>
            
            {/* Animated dots */}
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-2 h-2 bg-blue-500 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
        
        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-sm text-gray-500"
        >
          <p>Powered By Stock Manager</p>
        </motion.div>
      </div>
    </div>
  );
};

// Alternative minimal spinner version
export const MiniSpinner = ({ size = "medium" }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };
  
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
      className={`${sizeClasses[size]} rounded-full border-2 border-blue-200 border-t-blue-500`}
    />
  );
};

export default LoadingSpinner;