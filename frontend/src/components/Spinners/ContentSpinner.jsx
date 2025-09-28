// ContentSpinner.jsx - Ultra-modern, dynamic loading component
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Database, 
  Package, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Activity,
  Zap,
  Sparkles,
  ArrowRight,
  Loader,
  RefreshCw
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { usePreferences } from "@/context/PreferencesContext";

const ContentSpinner = ({
  size = "medium",
  message = "Loading data...",
  fullWidth = false,
  theme = "default", // default, sales, inventory, analytics, users
  showProgress = false,
  variant = "minimal", // minimal by default for performance; modern/orbital available explicitly
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Dynamic loading steps based on theme
  const loadingSteps = {
    default: ["Initializing...", "Loading data...", "Almost ready..."],
    sales: ["Loading sales data...", "Processing transactions...", "Finalizing reports..."],
    inventory: ["Scanning inventory...", "Checking stock levels...", "Updating records..."],
    analytics: ["Analyzing data...", "Computing metrics...", "Generating insights..."],
    users: ["Loading users...", "Checking permissions...", "Preparing dashboard..."]
  };

  const steps = loadingSteps[theme] || loadingSteps.default;

  // Auto-progress through steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(stepInterval);
  }, [steps.length]);

  // Simulate progress
  useEffect(() => {
    if (showProgress) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0;
          return prev + Math.random() * 15;
        });
      }, 300);

      return () => clearInterval(progressInterval);
    }
  }, [showProgress]);

  const sizeClasses = {
    small: {
      container: "h-20 w-20",
      orbit: "h-32 w-32",
      icon: "h-5 w-5",
      centerIcon: "h-6 w-6",
      text: "text-sm",
      padding: "p-6"
    },
    medium: {
      container: "h-28 w-28",
      orbit: "h-44 w-44",
      icon: "h-6 w-6",
      centerIcon: "h-8 w-8",
      text: "text-base",
      padding: "p-8"
    },
    large: {
      container: "h-40 w-40",
      orbit: "h-56 w-56",
      icon: "h-8 w-8",
      centerIcon: "h-12 w-12",
      text: "text-lg",
      padding: "p-10"
    },
  };

  // Theme-based icon sets
  const themeIcons = {
    default: [Package, Database, TrendingUp, BarChart3],
    sales: [ShoppingCart, DollarSign, TrendingUp, BarChart3],
    inventory: [Package, Database, Activity, Zap],
    analytics: [BarChart3, TrendingUp, Activity, Sparkles],
    users: [Users, Database, Activity, BarChart3]
  };

  const icons = themeIcons[theme] || themeIcons.default;

  const {
    container: containerSize,
    orbit: orbitSize,
    icon: iconSize,
    centerIcon: centerIconSize,
    text: textSize,
    padding
  } = sizeClasses[size];

  // Theme-aware colors from preferences
  const { currentTheme } = usePreferences();
  const spinnerBorderTop = useMemo(() => {
    const accent = currentTheme?.accent || 'bg-blue-500';
    return accent.replace(/^bg-/, 'border-t-');
  }, [currentTheme?.accent]);
  const spinnerBorderBase = useMemo(() => currentTheme?.border || 'border-blue-200', [currentTheme?.border]);

  // Render different variants
  const renderModernSpinner = () => (
    <div className="relative">
      {/* Gradient background glow */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute inset-0 ${orbitSize} bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-xl -z-10`}
      />

      {/* Outer orbital ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        className={`${orbitSize} rounded-full relative`}
      >
        <div className="absolute inset-0 rounded-full border-2 border-gradient-to-r from-blue-400/40 via-purple-400/40 to-pink-400/40" />
        
        {/* Orbital particles */}
        {[0, 1, 2].map((index) => {
          const angle = (index * 120);
          return (
            <motion.div
              key={index}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '0 0'
              }}
              animate={{
                rotate: 360 + angle,
                scale: [1, 1.5, 1]
              }}
              transition={{
                rotate: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear"
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3
                }
              }}
            />
          );
        })}
      </motion.div>

      {/* Middle rotating ring with icons */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear"
        }}
        className={`absolute inset-0 ${containerSize} m-auto`}
      >
        {icons.map((Icon, index) => {
          const angle = (index * 90);
          const radius = size === 'small' ? 40 : size === 'medium' ? 50 : 70;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          
          return (
            <motion.div
              key={index}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)'
              }}
              animate={{
                rotate: 360,
                scale: [1, 1.3, 1]
              }}
              transition={{
                rotate: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                },
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2
                }
              }}
            >
              <div className="p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg border border-white/50">
                <Icon className={`${iconSize} text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text`} style={{
                  color: `hsl(${200 + index * 40}, 70%, 55%)`
                }} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Central pulsing core */}
      <motion.div
        initial={{ scale: 0, rotate: 0 }}
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: 360
        }}
        transition={{
          scale: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          rotate: {
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }
        }}
        className={`absolute inset-0 m-auto w-16 h-16 ${size === 'large' ? 'w-20 h-20' : size === 'small' ? 'w-12 h-12' : ''} rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl`}
      >
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Sparkles className={`${centerIconSize} text-white drop-shadow-lg`} />
        </motion.div>
      </motion.div>
    </div>
  );

  const renderMinimalSpinner = () => (
    <div className="relative">
<div className={`${containerSize} rounded-full border-4 ${spinnerBorderBase} ${currentTheme?.text || ''} animate-spin`} style={{ animationDuration: '1s', borderTopColor: 'currentColor' }} />
    </div>
  );

  const renderOrbitalSpinner = () => (
    <div className="relative">
      {/* Multiple orbital rings */}
      {[0, 1, 2].map((ringIndex) => (
        <motion.div
          key={ringIndex}
          animate={{ rotate: ringIndex % 2 === 0 ? 360 : -360 }}
          transition={{
            duration: 3 + ringIndex,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute inset-0 rounded-full border-2 opacity-60`}
          style={{
            width: `${100 + ringIndex * 20}%`,
            height: `${100 + ringIndex * 20}%`,
            margin: 'auto',
            borderColor: `hsl(${220 + ringIndex * 30}, 70%, 60%)`
          }}
        >
          <motion.div
            className="absolute w-2 h-2 rounded-full shadow-lg"
            style={{
              top: -4,
              left: '50%',
              backgroundColor: `hsl(${220 + ringIndex * 30}, 70%, 60%)`
            }}
            animate={{
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: ringIndex * 0.2
            }}
          />
        </motion.div>
      ))}
      
      {/* Center icon */}
      <div className={`${containerSize} flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <RefreshCw className={`${centerIconSize} text-blue-500`} />
        </motion.div>
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullWidth ? "w-full py-16" : "py-8"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        {variant === "modern" && renderModernSpinner()}
        {variant === "minimal" && renderMinimalSpinner()}
        {variant === "orbital" && renderOrbitalSpinner()}
        {variant === "classic" && renderModernSpinner()} {/* fallback to modern */}
      </motion.div>

      {/* Dynamic loading text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center mt-8"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`text-gray-700 ${textSize} font-medium mb-2 flex items-center justify-center gap-2`}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <ArrowRight className="h-4 w-4 text-blue-500" />
            </motion.div>
            {steps[currentStep] || message}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        {showProgress && (
          <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* Animated dots */}
        <div className="flex justify-center space-x-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
              className="w-2 h-2 rounded-full"
              style={{
                background: `linear-gradient(45deg, hsl(${200 + i * 20}, 70%, 60%), hsl(${220 + i * 20}, 70%, 50%))`
              }}
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
    large: "h-8 w-8",
  };
  const { currentTheme } = usePreferences();
  const spinnerBorderTop = useMemo(() => {
    const accent = currentTheme?.accent || 'bg-blue-500';
    return accent.replace(/^bg-/, 'border-t-');
  }, [currentTheme?.accent]);
  const spinnerBorderBase = useMemo(() => currentTheme?.border || 'border-blue-200', [currentTheme?.border]);
  return (
<div className={`${sizeClasses[size]} ${className} rounded-full border-2 ${spinnerBorderBase} ${currentTheme?.text || ''} animate-spin`} style={{ animationDuration: '1s', borderTopColor: 'currentColor' }} />
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
              repeatType: "reverse",
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
              delay: i * 0.1,
            }}
            className="bg-gray-200 rounded-lg h-4"
            style={{ width: `${100 - i * 10}%` }}
          />
        ))}
      </div>
    );
  }

  return null;
};

export default ContentSpinner;
