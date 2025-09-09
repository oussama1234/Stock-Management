// MyProfile.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Shield,
  Bell,
  Settings,
  BarChart3
} from 'lucide-react';
import { useToast } from '../components/Toaster/ToastContext';
import { useAuth } from '../context/AuthContext';

const MyProfile = () => {
  const {user, updateProfile} = useAuth();
  const [userData, setUserData] = useState({
    name: user?.name,
    email: user?.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileImage: user?.profileImage,
    notifications: true,
    twoFactor: false
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : files ? files[0] : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Create image preview if image is selected
    if (name === 'profileImage' && files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(files[0]);
      setFile(files[0]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!userData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (userData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation (only if any password field is filled)
    if (userData.currentPassword || userData.newPassword || userData.confirmPassword) {
      if (!userData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }

      if (userData.newPassword && userData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }

      if (userData.newPassword !== userData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const response = await updateProfile(userData, file);
      setSuccess(true);
     
      setTimeout(() => setSuccess(false), 3000);
      
      // Here you would typically send the data to your backend
      console.log('Profile data:', userData);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4">
          <User className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </motion.div>

      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden"
      >
        <div className="p-6">
          {/* Profile Image Section */}
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {userData.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
              </div>
              
              <motion.label 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-full shadow-md cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white" />
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </motion.label>
            </div>
            <p className="text-sm text-gray-500">Click camera icon to change photo</p>
          </motion.div>

          {/* Personal Information Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-500" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    className={`pl-10 pr-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                      errors.name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter your name"
                  />
                </div>
                <AnimatePresence>
                  {errors.name && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    className={`pl-10 pr-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                      errors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Password Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-blue-500" />
              Change Password
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={userData.currentPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-12 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                      errors.currentPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.currentPassword && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> {errors.currentPassword}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={userData.newPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-12 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                      errors.newPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.newPassword && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> {errors.newPassword}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm Password */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={userData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-12 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.confirmPassword && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-500 text-sm mt-1 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-1" /> {errors.confirmPassword}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Preferences Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-500" />
              Preferences
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={userData.notifications}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`block w-14 h-8 rounded-full ${userData.notifications ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${userData.notifications ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 flex items-center">
                  <Bell className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-gray-700">Enable notifications</span>
                </div>
              </label>

              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="twoFactor"
                    checked={userData.twoFactor}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`block w-14 h-8 rounded-full ${userData.twoFactor ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${userData.twoFactor ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 flex items-center">
                  <Shield className="h-5 w-5 text-gray-600 mr-2" />
                  <span className="text-gray-700">Two-factor authentication</span>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </motion.button>
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-xl flex items-center"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Profile updated successfully!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.form>
    </div>
  );
};

export default MyProfile;