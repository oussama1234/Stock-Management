// LoadingButton.jsx - Ultra-modern loading button with enhanced animations
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Check, 
  X, 
  Zap, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  Download,
  Upload,
  Save,
  Send
} from "lucide-react";
import { useState, useEffect } from "react";

export default function LoadingButton({ 
  loading = false, 
  success = false,
  error = false,
  onClick, 
  disabled = false,
  className = "", 
  children, 
  loadingMessage = "Processing...",
  successMessage = "Success!",
  errorMessage = "Error!",
  variant = "primary", // primary, secondary, success, danger, info, gradient
  size = "md", // xs, sm, md, lg, xl
  icon: IconComponent = null,
  loadingIcon = "spinner", // spinner, pulse, dots, refresh, zap
  ripple = true,
  glow = false,
  ...props 
}) {
  const [ripples, setRipples] = useState([]);
  const [buttonState, setButtonState] = useState('idle'); // idle, loading, success, error

  // Auto-reset success/error states
  useEffect(() => {
    if (success) {
      setButtonState('success');
      const timer = setTimeout(() => setButtonState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      setButtonState('error');
      const timer = setTimeout(() => setButtonState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (loading) {
      setButtonState('loading');
    } else if (!success && !error) {
      setButtonState('idle');
    }
  }, [loading, success, error]);

  // Variant styles
  const variants = {
    primary: {
      idle: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent hover:from-blue-600 hover:to-indigo-700 focus:ring-blue-500",
      loading: "bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-transparent",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent",
      error: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent"
    },
    secondary: {
      idle: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 focus:ring-gray-500",
      loading: "bg-gray-200 text-gray-600 border-gray-300",
      success: "bg-green-100 text-green-700 border-green-300",
      error: "bg-red-100 text-red-700 border-red-300"
    },
    gradient: {
      idle: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white border-transparent hover:from-purple-600 hover:via-pink-600 hover:to-red-600 focus:ring-purple-500",
      loading: "bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-white border-transparent",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent",
      error: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent"
    },
    success: {
      idle: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent hover:from-green-600 hover:to-emerald-700 focus:ring-green-500",
      loading: "bg-gradient-to-r from-green-400 to-emerald-500 text-white border-transparent",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent",
      error: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent"
    },
    danger: {
      idle: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent hover:from-red-600 hover:to-rose-700 focus:ring-red-500",
      loading: "bg-gradient-to-r from-red-400 to-rose-500 text-white border-transparent",
      success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-transparent",
      error: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-transparent"
    }
  };

  // Size styles
  const sizes = {
    xs: "px-2 py-1 text-xs font-medium",
    sm: "px-3 py-1.5 text-sm font-medium",
    md: "px-4 py-2 text-sm font-medium",
    lg: "px-6 py-3 text-base font-medium",
    xl: "px-8 py-4 text-lg font-semibold"
  };

  // Loading icons
  const loadingIcons = {
    spinner: <Loader2 className="animate-spin" />,
    pulse: (
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <RefreshCw />
      </motion.div>
    ),
    refresh: <RefreshCw className="animate-spin" />,
    zap: (
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        <Zap />
      </motion.div>
    ),
    dots: (
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 bg-current rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    )
  };

  // Icon size based on button size
  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6"
  };

  const handleClick = (e) => {
    if (ripple && !disabled && buttonState === 'idle') {
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
    
    if (onClick && !disabled && buttonState === 'idle') {
      onClick(e);
    }
  };

  const isDisabled = disabled || buttonState === 'loading';
  const currentVariant = variants[variant] || variants.primary;
  const currentStyle = currentVariant[buttonState] || currentVariant.idle;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300 ease-out
        ${sizes[size]} ${currentStyle} ${className}
        ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${glow ? 'shadow-lg hover:shadow-xl' : ''}
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-60 disabled:transform-none
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
      {glow && !isDisabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}

      {/* Button content */}
      <div className="relative flex items-center justify-center space-x-2">
        <AnimatePresence mode="wait">
          {buttonState === 'loading' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`flex items-center space-x-2 ${iconSizes[size]}`}
            >
              {loadingIcons[loadingIcon]}
              <span>{loadingMessage}</span>
            </motion.div>
          ) : buttonState === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              <Check className={iconSizes[size]} />
              <span>{successMessage}</span>
            </motion.div>
          ) : buttonState === 'error' ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                x: 0,
                rotate: [0, -5, 5, 0]
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
              transition={{
                rotate: { duration: 0.5, times: [0, 0.2, 0.8, 1] }
              }}
            >
              <X className={iconSizes[size]} />
              <span>{errorMessage}</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center space-x-2"
            >
              {IconComponent && (
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.3 }}
                >
                  <IconComponent className={iconSizes[size]} />
                </motion.div>
              )}
              <span>{children}</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className={`${iconSizes[size]} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
