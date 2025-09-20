// src/pages/Admin/Sales/components/SalesLoadingButton.jsx
// Enhanced loading button with better UX for sales operations

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function SalesLoadingButton({ 
  children, 
  loading = false, 
  disabled = false, 
  onClick, 
  className = "",
  variant = "primary", // primary, secondary, danger
  size = "md", // sm, md, lg
  icon: Icon = null,
  ...props 
}) {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 shadow-lg",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-lg"
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const baseClasses = "rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";

  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} animate-spin`} />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={`${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`} />}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
}