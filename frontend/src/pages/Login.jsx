import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Briefcase,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Package,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toaster/ToastContext";
import { useAuth } from "../context/AuthContext";
import { DashboardRoute } from "../router/Index";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { handleLogin, error } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setisLoading] = useState(false);
  const Toast = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const features = [
    {
      icon: Package,
      title: "Smart Inventory",
      description: "Real-time stock tracking with automated alerts",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive reports and business insights",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Sales Optimization",
      description: "Boost revenue with intelligent recommendations",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your business",
      color: "from-orange-500 to-red-500"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setisLoading(true);

    try {
      const result = await handleLogin(formData.email, formData.password);

      if (result.success && result.data?.user) {
        // Keep loading state during navigation
        navigate(DashboardRoute);
        // Loading state will be reset when component unmounts
      } else {
        // Only stop loading if login was not successful
        setisLoading(false);
      }
    } catch (error) {
      console.log("Login failed:", error.message);
      // Stop loading on error
      setisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            initial={{
              scale: 0,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              scale: [0, 1, 0.8, 1, 0],
              x: [Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                  Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)],
              y: [Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800), 
                  Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            style={{
              width: 100 + Math.random() * 100,
              height: 100 + Math.random() * 100,
              background: `linear-gradient(45deg, 
                ${i % 4 === 0 ? '#3b82f6' : i % 4 === 1 ? '#8b5cf6' : i % 4 === 2 ? '#06b6d4' : '#10b981'}40, 
                ${i % 4 === 0 ? '#1d4ed8' : i % 4 === 1 ? '#7c3aed' : i % 4 === 2 ? '#0891b2' : '#059669'}60)`,
              filter: 'blur(40px)',
            }}
          />
        ))}
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Panel - Features Showcase */}
        <motion.div 
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center p-12"
        >
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
                  <div className="relative p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Stock Manager
                  </h1>
                  <p className="text-gray-400 text-lg">Intelligent Inventory System</p>
                </div>
              </div>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                Transform your business with our comprehensive inventory management solution. 
                Track, analyze, and optimize your stock with real-time insights.
              </p>
            </motion.div>

            {/* Features carousel */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 bg-gradient-to-r ${features[activeFeature].color} rounded-2xl shadow-lg`}>
                      {(() => {
                        const IconComponent = features[activeFeature].icon;
                        return <IconComponent className="h-6 w-6 text-white" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {features[activeFeature].title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {features[activeFeature].description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Feature indicators */}
              <div className="flex space-x-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      activeFeature === index 
                        ? 'bg-white shadow-lg scale-110' 
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-3 gap-6 mt-12"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">500+</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Login Form */}
        <motion.div 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8"
        >
          <div className="w-full max-w-md">
            {/* Login Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
            >
              {/* Header */}
              <div className="p-8 text-center border-b border-white/10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg mb-6"
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-300">
                  Sign in to access your dashboard
                </p>
              </div>

              {/* Form */}
              <div className="p-8">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                  {/* Email Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none text-white placeholder-gray-400 transition-all duration-300"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none text-white placeholder-gray-400 transition-all duration-300"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500/20 border border-red-500/30 rounded-xl p-4"
                      >
                        <div className="flex items-center space-x-2">
                          <CircleAlert className="h-5 w-5 text-red-400 flex-shrink-0" />
                          <p className="text-red-400 text-sm">{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Login Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <motion.button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      whileHover={!isLoading ? { scale: 1.02 } : {}}
                      whileTap={!isLoading ? { scale: 0.98 } : {}}
                      className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isLoading 
                          ? 'bg-gradient-to-r from-blue-400 to-purple-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 cursor-pointer'
                      } text-white`}
                    >
                      {isLoading ? (
                        <>
                          {/* Custom loading spinner */}
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          <span>Sign In to Dashboard</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </form>

                {/* Quick Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="grid grid-cols-2 gap-3 mt-8"
                >
                  <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                    <Users className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-300">Multi-user</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                    <Zap className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-300">Real-time</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center mt-8"
            >
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Stock Manager. Made with ❤️ by Oussama Meqqadmi
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
