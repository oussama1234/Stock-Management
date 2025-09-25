// LoadingSpinner.jsx - Ultra-modern full-screen loading experience
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Database, 
  Package, 
  TrendingUp, 
  Sparkles, 
  Zap,
  Activity,
  Loader,
  RefreshCw,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";

const LoadingSpinner = ({ 
  message = "Loading your stock data...",
  theme = "default", // default, sales, inventory, analytics, users  
  variant = "orbital", // orbital, modern, minimal, particles
  showProgress = true,
  showSteps = true,
  appName = "Stock Manager",
  version = "2.0"
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(message);

  // Theme-based loading steps
  const loadingSteps = {
    default: [
      "Initializing system...",
      "Loading components...", 
      "Preparing workspace...",
      "Almost ready..."
    ],
    sales: [
      "Loading sales data...",
      "Processing transactions...", 
      "Calculating metrics...",
      "Finalizing dashboard..."
    ],
    inventory: [
      "Scanning inventory...",
      "Checking stock levels...", 
      "Updating records...",
      "Preparing reports..."
    ],
    analytics: [
      "Analyzing data...",
      "Computing insights...", 
      "Generating charts...",
      "Loading dashboard..."
    ],
    users: [
      "Loading user profiles...",
      "Checking permissions...", 
      "Setting up workspace...",
      "Ready to go..."
    ]
  };

  const steps = loadingSteps[theme] || loadingSteps.default;
  const icons = {
    default: [Package, Database, TrendingUp, BarChart3],
    sales: [ShoppingCart, DollarSign, TrendingUp, BarChart3],
    inventory: [Package, Database, Activity, Zap],
    analytics: [BarChart3, TrendingUp, Activity, Sparkles],
    users: [Users, Database, Activity, BarChart3]
  };
  const themeIcons = icons[theme] || icons.default;

  // Auto-progress through steps
  useEffect(() => {
    if (!showSteps) return;
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = (prev + 1) % steps.length;
        setLoadingText(steps[next]);
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [steps, showSteps]);

  // Simulate progress
  useEffect(() => {
    if (!showProgress) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 8 + 2;
        const newProgress = Math.min(prev + increment, 95); // Stop at 95%
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [showProgress]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              background: `radial-gradient(circle, hsl(${200 + Math.random() * 60}, 70%, 60%) 0%, transparent 70%)`,
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0,
              opacity: 0
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: [0, 0.5, 0],
              opacity: [0, 0.1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 8,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${i % 2 === 0 ? 'bg-blue-400/10' : 'bg-purple-400/10'} backdrop-blur-sm`}
            style={{
              width: Math.random() * 60 + 20,
              height: Math.random() * 60 + 20,
              borderRadius: i % 3 === 0 ? '50%' : '20%',
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 90}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative flex flex-col items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-12 flex flex-col items-center shadow-2xl"
        >
          {/* App branding */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
              className="w-16 h-16 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg"
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">{appName}</h1>
            <p className="text-blue-200 text-sm">Version {version}</p>
          </motion.div>

          {/* Dynamic spinner based on variant */}
          <div className="relative mb-8">
            {variant === 'orbital' && (
              <div className="relative">
                {/* Orbital rings */}
                {[0, 1, 2].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute inset-0 rounded-full border-2 border-blue-300/30"
                    style={{
                      width: 120 + ring * 40,
                      height: 120 + ring * 40,
                      margin: 'auto'
                    }}
                    animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
                    transition={{
                      duration: 8 + ring * 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    {/* Orbital particles */}
                    {[0, 1, 2, 3].map((particle) => {
                      const Icon = themeIcons[particle] || Package;
                      return (
                        <motion.div
                          key={particle}
                          className="absolute w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg"
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: `rotate(${particle * 90}deg) translateX(${30 + ring * 20}px) rotate(-${particle * 90}deg)`
                          }}
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 360]
                          }}
                          transition={{
                            scale: { duration: 2, repeat: Infinity, delay: particle * 0.2 },
                            rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                          }}
                        >
                          <Icon 
                            className="h-4 w-4" 
                            style={{ color: `hsl(${200 + ring * 40 + particle * 20}, 70%, 55%)` }}
                          />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ))}

                {/* Central core */}
                <motion.div
                  className="w-32 h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl"
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: 360
                  }}
                  transition={{
                    scale: { duration: 2, repeat: Infinity },
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" }
                  }}
                >
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <BarChart3 className="h-12 w-12 text-white" />
                  </motion.div>
                </motion.div>
              </div>
            )}

            {variant === 'modern' && (
              <div className="relative">
                <motion.div
                  className="w-32 h-32 rounded-full border-4 border-blue-300/40"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <motion.div
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.7)', '0 0 0 20px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
              </div>
            )}

            {variant === 'minimal' && (
              <motion.div
                className="w-24 h-24 rounded-full border-4 border-blue-300/40 border-t-blue-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>

          {/* Dynamic loading text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6"
            >
              <motion.div 
                className="text-xl font-semibold text-white mb-2 flex items-center justify-center gap-2"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <ArrowRight className="h-5 w-5 text-blue-300" />
                </motion.div>
                {showSteps ? loadingText : message}
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          {showProgress && (
            <div className="w-80 mb-6">
              <div className="flex justify-between text-sm text-blue-200 mb-2">
                <span>Loading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full relative overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </div>
          )}

          {/* Animated status dots */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                style={{
                  background: `linear-gradient(45deg, hsl(${200 + i * 15}, 70%, 60%), hsl(${220 + i * 15}, 70%, 50%))`
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-blue-200/60 text-sm">Powered by {appName} • Built with React</p>
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
    large: "w-12 h-12",
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
      className={`${sizeClasses[size]} rounded-full border-2 border-blue-200 border-t-blue-500`}
    />
  );
};

export default LoadingSpinner;
