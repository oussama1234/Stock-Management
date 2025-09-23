// src/pages/Admin/Sales/components/SalesLoadingButton.jsx
// Ultra-modern loading button with advanced animations for sales operations

import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Check, 
  X, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  Zap,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SalesLoadingButton({ 
  children, 
  loading = false,
  success = false,
  error = false, 
  disabled = false, 
  onClick, 
  className = "",
  variant = "primary", // primary, secondary, danger, success, gradient
  size = "md", // xs, sm, md, lg, xl
  icon: Icon = null,
  loadingText = "Processing...",
  successText = "Success!",
  errorText = "Error!",
  glowEffect = true,
  rippleEffect = true,
  pulseOnHover = true,
  ...props 
}) {
  const [ripples, setRipples] = useState([]);
  const [buttonState, setButtonState] = useState('idle');

  // State management
  useEffect(() => {
    if (loading) setButtonState('loading');
    else if (success) {
      setButtonState('success');
      const timer = setTimeout(() => setButtonState('idle'), 2000);
      return () => clearTimeout(timer);
    } else if (error) {
      setButtonState('error');
      const timer = setTimeout(() => setButtonState('idle'), 2000);
      return () => clearTimeout(timer);
    } else {
      setButtonState('idle');
    }
  }, [loading, success, error]);

  const variants = {
    primary: {
      idle: "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl",
      loading: "bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 text-white",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg",
      error: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg"
    },
    secondary: {
      idle: "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow-md",
      loading: "bg-gray-50 text-gray-600 border-2 border-gray-200",
      success: "bg-green-50 text-green-700 border-2 border-green-200",
      error: "bg-red-50 text-red-700 border-2 border-red-200"
    },
    danger: {
      idle: "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl",
      loading: "bg-gradient-to-r from-red-400 to-rose-500 text-white",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg",
      error: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg"
    },
    success: {
      idle: "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl",
      loading: "bg-gradient-to-r from-green-400 to-emerald-500 text-white",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg",
      error: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg"
    },
    gradient: {
      idle: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 shadow-lg hover:shadow-xl",
      loading: "bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 text-white",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg",
      error: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg"
    }
  };

  const sizes = {
    xs: { padding: "px-2 py-1", text: "text-xs", icon: "h-3 w-3" },
    sm: { padding: "px-3 py-2", text: "text-sm", icon: "h-4 w-4" },
    md: { padding: "px-6 py-3", text: "text-base", icon: "h-5 w-5" },
    lg: { padding: "px-8 py-4", text: "text-lg", icon: "h-6 w-6" },
    xl: { padding: "px-10 py-5", text: "text-xl", icon: "h-7 w-7" }
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;
  const isDisabled = disabled || buttonState === 'loading';

  const handleClick = (e) => {
    if (rippleEffect && !isDisabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = {
        id: Date.now(),
        x,
        y
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }
    
    if (onClick && !isDisabled) {
      onClick(e);
    }
  };

  const renderContent = () => {
    switch (buttonState) {
      case 'loading':
        return (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className={currentSize.icon} />
            </motion.div>
            <span>{loadingText}</span>
          </motion.div>
        );
      case 'success':
        return (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            className="flex items-center space-x-2"
          >
            <Check className={currentSize.icon} />
            <span>{successText}</span>
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.5, x: -20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: 0,
              rotate: [0, -5, 5, 0]
            }}
            className="flex items-center space-x-2"
            transition={{ rotate: { duration: 0.5 } }}
          >
            <X className={currentSize.icon} />
            <span>{errorText}</span>
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 relative"
          >
            {Icon && (
              <motion.div
                whileHover={pulseOnHover ? { scale: 1.1, rotate: 10 } : {}}
                transition={{ duration: 0.2 }}
              >
                <Icon className={currentSize.icon} />
              </motion.div>
            )}
            <span>{children}</span>
            <motion.div
              className="opacity-0 group-hover:opacity-100"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className={`${currentSize.icon} transition-opacity`} />
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <motion.button
      whileHover={!isDisabled ? { 
        scale: 1.02, 
        y: -2,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
      } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        group relative overflow-hidden rounded-xl font-medium transition-all duration-300
        ${currentSize.padding} ${currentSize.text} ${currentVariant[buttonState]} ${className}
        ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
      `}
      {...props}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}
      </AnimatePresence>

      {/* Glow effect */}
      {glowEffect && !isDisabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
          animate={{
            x: ['-200%', '200%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
      )}

      {/* Button content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      {/* Sales-specific sparkle effect */}
      {buttonState === 'success' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
                y: [0, -20, 0]
              }}
              transition={{ 
                duration: 1,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            >
              <Sparkles className="h-3 w-3 text-yellow-300" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.button>
  );
}
