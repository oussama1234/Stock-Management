import React, { use, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Brain, BarChart3, Database, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/Spinners/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { DashboardRoute } from '../router/Index';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {loading, error, handleLogin} = useAuth(); // Using the custom hook to access auth context
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const response = handleLogin(formData.email, formData.password);
    // After login, you might want to navigate to a different page
    if (response.status === 200) {
      navigate(DashboardRoute);
    }
  };
  

  

  return (
    <>
      {loading && <LoadingSpinner message='Loading, Please Wait' />}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            initial={{
              scale: 0,
              opacity: 0,
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
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
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="px-8 py-12">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-md opacity-75"></div>
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                    <Brain className="h-10 w-10 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-2">Stock Manager</h1>
              <p className="text-blue-200">Intelligent inventory control system</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-white placeholder-blue-200 transition-all duration-300"
                  placeholder="Enter your email"
                  required
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-white placeholder-blue-200 transition-all duration-300"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-blue-400 hover:text-blue-300 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-blue-400 hover:text-blue-300 transition-colors" />
                  )}
                </button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white font-medium shadow-lg transition-all duration-300 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Login to Dashboard
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Features List */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-10 grid grid-cols-2 gap-4 text-center"
            >
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <BarChart3 className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-200">Real-time Analytics</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <Brain className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-blue-200">AI Predictions</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <p className="text-blue-200 text-sm">
            © {new Date().getFullYear()} Stock Manager. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
    </>
  );
};

export default Login;