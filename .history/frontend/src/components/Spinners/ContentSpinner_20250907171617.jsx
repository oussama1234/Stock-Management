// ContentSpinner.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Package, Database, TrendingUp } from 'lucide-react';

const ContentSpinner = ({ 
  size = "medium", 
  message = "Loading data...",
  fullWidth = false 
}) => {
  const sizeClasses = {
    small: {
      container: "h-16 w-16",
      icon: "h-6 w-6",
      text: "text-sm"
    },
    medium: {
      container: "h-24 w-24",
      icon: "h-8 w-8",
      text: "text-base"
    },
    large: {
      container: "h-32 w-32",
      icon: "h-10 w-10",
      text: "text-lg"
    }
  };

  const { container: containerSize, icon: iconSize, text: textSize } = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center ${fullWidth ? 'w-full py-16' : 'py-8'}`}>
      <div className="relative">
        {/* Outer rotating circle */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`${containerSize} rounded-full border-4 border-blue-100`}
        />
        
        {/* Inner pulsing circle */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute inset-0 m-auto ${size === 'small' ? 'h-12 w-12' : size === 'medium' ? 'h-16 w-16' : 'h-24 w-24'} rounded-full border-4 border-indigo-200`}
        />
        
        {/* Rotating icons */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Package className={`${iconSize} text-blue-500`} />
            </motion.div>
          </div>
          
          <div className="absolute top-1/2 -right-1 transform -translate-y-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Database className={`${iconSize} text-indigo-500`} />
            </motion.div>
          </div>
          
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <TrendingUp className={`${iconSize} text-purple-500`} />
            </motion.div>
          </div>
          
          <div className="absolute top-1/2 -left-1 transform -translate-y-1/2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <BarChart3 className={`${iconSize} text-blue-600`} />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Central icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
          className={`absolute inset-0 m-auto ${
            size === 'small' ? 'h-8 w-8' : size === 'medium' ? 'h-10 w-10' : 'h-14 w-14'
          } rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg`}
        >
          <BarChart3 className={`${
            size === 'small' ? 'h-4 w-4' : size === 'medium' ? 'h-5 w-5' : 'h-6 w-6'
          } text-white`} />
        </motion.div>
      </div>
      
      {/* Loading text with animation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-6"
      >
        <p className={`text-gray-600 ${textSize} font-medium`}>{message}</p>
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-1 mt-2">
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
    </div>
  );
};

// Simple inline spinner for buttons or small spaces
export const InlineSpinner = ({ size = "small", className = "" }) => {
  const sizeClasses = {
    tiny: "h-4 w-4",
    small: "h-5 w-5",
    medium: "h-6 w-6",
    large: "h-8 w-8"
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
      className={`${sizeClasses[size]} ${className} rounded-full border-2 border-blue-200 border-t-blue-500`}
    />
  );
};

// Skeleton loader for content placeholders
export const SkeletonLoader = ({ type = "card", count = 1 }) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);
  
  if (type === "card") {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0.8 }}
            transition={{ 
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="bg-gray-200 rounded-2xl p-6 h-32"
          />
        ))}
      </div>
    );
  }
  
  if (type === "text") {
    return (
      <div className="space-y-3">
        {skeletons.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0.8 }}
            transition={{ 
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.1
            }}
            className="bg-gray-200 rounded-lg h-4"
            style={{ width: `${100 - (i * 10)}%` }}
          />
        ))}
      </div>
    );
  }
  
  return null;
};

export default ContentSpinner;