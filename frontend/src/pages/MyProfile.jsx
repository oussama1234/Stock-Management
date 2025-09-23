// MyProfile.jsx - Redesigned with Modern Glassmorphism
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  Camera,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Save,
  Settings,
  Shield,
  User,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Globe,
  Award
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { getUserPreferences, updateUserPreferences } from "../api/Preferences";
import { useSearchParams } from "react-router-dom";

const MyProfile = () => {
  const { user, updateProfile, error } = useAuth();
  const { preferences, savePreferences: saveUserPreferences, currentTheme, loading: prefsLoading } = usePreferences();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [userData, setUserData] = useState({
    // Basic profile fields
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    website: user?.website || '',
    job_title: user?.job_title || '',
    
    // Password fields
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    
    // Images
    profileImage: user?.profileImage,
    avatar: user?.avatar,
    
    // Security
    two_factor_enabled: user?.two_factor_enabled ?? false,
  });
  
  // Local preferences state for form handling
  const [localPreferences, setLocalPreferences] = useState(preferences);
  
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sync context preferences with local state
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'preferences', name: 'Preferences', icon: Settings },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Create image preview if image is selected
    if (name === "profileImage" && files && files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(files[0]);
      setFile(files[0]);
    }
  };

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalPreferences((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const savePreferences = async () => {
    try {
      setSavingPreferences(true);
      console.log('Saving preferences:', localPreferences);
      
      const result = await saveUserPreferences(localPreferences);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        // Clear any existing errors
        if (errors.preferences) {
          setErrors(prev => ({ ...prev, preferences: '' }));
        }
      } else {
        throw new Error(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setErrors({ preferences: error.message || 'Failed to save preferences' });
    } finally {
      setSavingPreferences(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!userData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (userData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!userData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation (only if any password field is filled)
    if (
      userData.currentPassword ||
      userData.newPassword ||
      userData.confirmPassword
    ) {
      if (!userData.currentPassword) {
        newErrors.currentPassword =
          "Current password is required to change password";
      }

      if (userData.newPassword && userData.newPassword.length < 6) {
        newErrors.newPassword = "New password must be at least 6 characters";
      }

      if (userData.newPassword !== userData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("Submitting profile data:", userData);
      const result = await updateProfile(userData, file);
      
      if (result.success) {
        setSuccess(true);
        setIsEditing(false); // Close editing mode on success
        // Update local state with the new user data
        if (result.data?.user) {
          setUserData({
            ...userData,
            ...result.data.user,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
        }
        // Clear file and image preview after successful save
        setFile(null);
        setImagePreview(null);
      }

      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setUpdatingSecurity(true);
        console.log("Updating security settings:", userData);
        const result = await updateProfile(userData, null);
        
        if (result.success) {
          setSuccess(true);
          // Clear password fields after successful update
          setUserData(prev => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          }));
          // Update user data if returned
          if (result.data?.user) {
            setUserData(prev => ({
              ...prev,
              ...result.data.user,
              currentPassword: "",
              newPassword: "",
              confirmPassword: ""
            }));
          }
        }

        setTimeout(() => setSuccess(false), 3000);
      } finally {
        setUpdatingSecurity(false);
      }
    }
  };

  const ToggleSwitch = ({ checked, onChange, name }) => (
    <button
      type="button"
      onClick={() => onChange({ target: { name, checked: !checked, type: 'checkbox' }})}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
        checked ? 'bg-blue-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-blue-50/40 to-indigo-50/60 dark:from-gray-900/80 dark:via-gray-800/40 dark:to-gray-900/60 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {/* Profile Header */}
              <div className="relative p-6 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5" />
                
                <div className="relative flex flex-col items-center">
                  {/* Profile Image */}
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center overflow-hidden shadow-xl border-4 border-white/50">
                      {imagePreview || userData.profileImage ? (
                        <img
                          src={imagePreview || userData.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-white">
                          {userData.name?.split(' ').map(n => n[0]).join('') || 'OM'}
                        </span>
                      )}
                    </div>
                    
                    <motion.label
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg cursor-pointer border border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <Camera className="h-4 w-4 text-blue-600" />
                      <input
                        type="file"
                        name="profileImage"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                      />
                    </motion.label>
                  </div>
                  
                  {/* Profile Info */}
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{userData.name}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{userData.bio}</p>
                    <div className="flex items-center justify-center space-x-1 text-xs text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50/80 rounded-2xl">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">24/7</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Active</p>
                  </div>
                  <div className="text-center p-3 bg-green-50/80 rounded-2xl">
                    <div className="flex items-center justify-center mb-2">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">Pro</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Member</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {/* Tab Navigation */}
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex space-x-1 bg-gray-100/80 dark:bg-gray-700/80 rounded-2xl p-1">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                          activeTab === tab.id
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Profile Information</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">Update your personal details and contact information</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsEditing(!isEditing)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                        </motion.button>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Name Field */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Full Name</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="text"
                                name="name"
                                value={userData.name}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                  !isEditing 
                                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300' 
                                    : errors.name
                                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                } focus:outline-none`}
                                placeholder="Enter your full name"
                              />
                            </div>
                            {errors.name && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-red-500 text-sm flex items-center"
                              >
                                <XCircle className="h-4 w-4 mr-1" /> {errors.name}
                              </motion.p>
                            )}
                          </div>

                          {/* Email Field */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="email"
                                name="email"
                                value={userData.email}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                  !isEditing 
                                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300' 
                                    : errors.email
                                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                } focus:outline-none`}
                                placeholder="Enter your email address"
                              />
                            </div>
                            {errors.email && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="text-red-500 text-sm flex items-center"
                              >
                                <XCircle className="h-4 w-4 mr-1" /> {errors.email}
                              </motion.p>
                            )}
                          </div>

                          {/* Phone Field */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Phone Number</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="tel"
                                name="phone"
                                value={userData.phone}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                  !isEditing 
                                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300' 
                                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                } focus:outline-none`}
                                placeholder="Enter your phone number"
                              />
                            </div>
                          </div>

                          {/* Location Field */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Location</label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="text"
                                name="location"
                                value={userData.location}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                  !isEditing 
                                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300' 
                                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                } focus:outline-none`}
                                placeholder="Enter your location"
                              />
                            </div>
                          </div>
                          
                          {/* Job Title Field */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Job Title</label>
                            <div className="relative">
                              <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="text"
                                name="job_title"
                                value={userData.job_title}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                  !isEditing 
                                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300' 
                                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                } focus:outline-none`}
                                placeholder="e.g., Stock Manager, Inventory Specialist"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Bio Field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Bio</label>
                          <textarea
                            name="bio"
                            value={userData.bio}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                              !isEditing 
                                ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300' 
                                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                            } focus:outline-none resize-none`}
                            placeholder="Tell us about yourself"
                          />
                        </div>
                        

                        {/* Website Field */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Website</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="url"
                              name="website"
                              value={userData.website}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                                !isEditing 
                                  ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300' 
                                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                              } focus:outline-none`}
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                        </div>

                        {/* Save Button */}
                        {isEditing && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-end"
                          >
                            <motion.button
                              type="submit"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                            >
                              <Save className="h-4 w-4" />
                              <span>Save Changes</span>
                            </motion.button>
                          </motion.div>
                        )}
                      </form>
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Security Settings</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Manage your password and security preferences</p>
                      </div>

                      <form onSubmit={handleSecuritySubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Current Password */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Current Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                name="currentPassword"
                                value={userData.currentPassword}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-300 ${
                                  errors.currentPassword
                                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                } focus:outline-none`}
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? (
                                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                )}
                              </button>
                            </div>
                            {errors.currentPassword && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-500 text-sm flex items-center"
                              >
                                <XCircle className="h-4 w-4 mr-1" /> {errors.currentPassword}
                              </motion.p>
                            )}
                          </div>

                          {/* New Password */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">New Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type={showNewPassword ? "text" : "password"}
                                name="newPassword"
                                value={userData.newPassword}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-300 ${
                                  errors.newPassword
                                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                } focus:outline-none`}
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                ) : (
                                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                                )}
                              </button>
                            </div>
                            {errors.newPassword && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-500 text-sm flex items-center"
                              >
                                <XCircle className="h-4 w-4 mr-1" /> {errors.newPassword}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Confirm New Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={userData.confirmPassword}
                              onChange={handleInputChange}
                              className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-300 ${
                                errors.confirmPassword
                                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-800 text-gray-800 dark:text-white'
                              } focus:outline-none`}
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-red-500 text-sm flex items-center"
                            >
                              <XCircle className="h-4 w-4 mr-1" /> {errors.confirmPassword}
                            </motion.p>
                          )}
                        </div>

                        {/* Two Factor Authentication */}
                        <div className="p-4 bg-gray-50/80 dark:bg-gray-700/80 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <div>
                                <h4 className="font-medium text-gray-800 dark:text-white">Two-Factor Authentication</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Add an extra layer of security to your account</p>
                              </div>
                            </div>
                            <ToggleSwitch 
                              checked={userData.two_factor_enabled} 
                              onChange={handleInputChange}
                              name="two_factor_enabled"
                            />
                          </div>
                        </div>

                        {/* Update Password Button */}
                        <motion.div className="flex justify-end">
                          <motion.button
                            type="submit"
                            disabled={updatingSecurity}
                            whileHover={{ scale: updatingSecurity ? 1 : 1.02 }}
                            whileTap={{ scale: updatingSecurity ? 1 : 0.98 }}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingSecurity ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                            <span>{updatingSecurity ? 'Updating...' : 'Update Security'}</span>
                          </motion.button>
                        </motion.div>
                      </form>
                    </motion.div>
                  )}

                  {activeTab === 'preferences' && (
                    <motion.div
                      key="preferences"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Preferences</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Customize your experience and notification settings</p>
                      </div>

                      <div className="space-y-8">
                        {/* Notification Settings */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                            <Bell className="h-5 w-5 mr-2 text-blue-600" />
                            Notifications
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
                              <div>
                                <h5 className="font-medium text-gray-800 dark:text-white">Push Notifications</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Receive notifications in your browser</p>
                              </div>
                              <ToggleSwitch 
                                checked={localPreferences.push_notifications} 
                                onChange={handlePreferenceChange}
                                name="push_notifications"
                              />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-green-50/80 rounded-2xl border border-green-100">
                              <div>
                                <h5 className="font-medium text-gray-800 dark:text-white">Email Notifications</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Receive important updates via email</p>
                              </div>
                              <ToggleSwitch 
                                checked={localPreferences.email_notifications} 
                                onChange={handlePreferenceChange}
                                name="email_notifications"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-orange-50/80 rounded-2xl border border-orange-100">
                              <div>
                                <h5 className="font-medium text-gray-800 dark:text-white">Low Stock Alerts</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Get notified when items are running low</p>
                              </div>
                              <ToggleSwitch 
                                checked={localPreferences.low_stock_alerts} 
                                onChange={handlePreferenceChange}
                                name="low_stock_alerts"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-purple-50/80 rounded-2xl border border-purple-100">
                              <div>
                                <h5 className="font-medium text-gray-800 dark:text-white">Sales Notifications</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Get notified about new sales</p>
                              </div>
                              <ToggleSwitch 
                                checked={localPreferences.sales_notifications} 
                                onChange={handlePreferenceChange}
                                name="sales_notifications"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Appearance Settings */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                            <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                            Appearance
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-gray-900/5 rounded-2xl border border-gray-200">
                              <div>
                                <h5 className="font-medium text-gray-800 dark:text-white">Dark Mode</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Switch to dark theme</p>
                              </div>
                              <ToggleSwitch 
                                checked={localPreferences.dark_mode} 
                                onChange={handlePreferenceChange}
                                name="dark_mode"
                              />
                            </div>
                            
                            <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Theme Color</label>
                              <select
                                name="theme_color"
                                value={localPreferences.theme_color}
                                onChange={handlePreferenceChange}
                                className={`w-full px-3 py-2 rounded-lg border border-gray-300 ${currentTheme.focus} focus:ring-2 ${currentTheme.ring}/20 focus:outline-none bg-white/90 text-gray-800`}
                              >
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="purple">Purple</option>
                                <option value="red">Red</option>
                                <option value="orange">Orange</option>
                                <option value="pink">Pink</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        {/* Dashboard Settings */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                            <Settings className="h-5 w-5 mr-2 text-green-600" />
                            Dashboard
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50/80 rounded-2xl border border-green-100">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Default Date Range</label>
                              <select
                                name="default_date_range"
                                value={localPreferences.default_date_range}
                                onChange={handlePreferenceChange}
                                className={`w-full px-3 py-2 rounded-lg border border-gray-300 ${currentTheme.focus} focus:ring-2 ${currentTheme.ring}/20 focus:outline-none bg-white/90 text-gray-800`}
                              >
                                <option value="7">Last 7 days</option>
                                <option value="14">Last 14 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="60">Last 60 days</option>
                                <option value="90">Last 90 days</option>
                              </select>
                            </div>
                            
                            <div className="p-4 bg-cyan-50/80 rounded-2xl border border-cyan-100">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Items Per Page</label>
                              <select
                                name="items_per_page"
                                value={localPreferences.items_per_page}
                                onChange={handlePreferenceChange}
                                className={`w-full px-3 py-2 rounded-lg border border-gray-300 ${currentTheme.focus} focus:ring-2 ${currentTheme.ring}/20 focus:outline-none bg-white/90 text-gray-800`}
                              >
                                <option value="10">10 items</option>
                                <option value="20">20 items</option>
                                <option value="50">50 items</option>
                                <option value="100">100 items</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Privacy Settings */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-red-600" />
                            Privacy
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-red-50/80 rounded-2xl border border-red-100">
                              <div>
                                <h5 className="font-medium text-gray-800 dark:text-white">Public Profile</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Make your profile visible to others</p>
                              </div>
                              <ToggleSwitch 
                                checked={localPreferences.profile_public} 
                                onChange={handlePreferenceChange}
                                name="profile_public"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-yellow-50/80 rounded-2xl border border-yellow-100">
                              <div>
                                <h5 className="font-medium text-gray-800 dark:text-white">Show Online Status</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Let others see when you're online</p>
                              </div>
                              <ToggleSwitch 
                                checked={localPreferences.show_online_status} 
                                onChange={handlePreferenceChange}
                                name="show_online_status"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Save Preferences */}
                        <motion.div className="flex flex-col items-end pt-4 border-t border-gray-200 dark:border-gray-700">
                          {errors.preferences && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-red-500 text-sm flex items-center mb-4"
                            >
                              <XCircle className="h-4 w-4 mr-1" /> {errors.preferences}
                            </motion.p>
                          )}
                          <motion.button
                            type="button"
                            onClick={savePreferences}
                            disabled={savingPreferences}
                            whileHover={{ scale: savingPreferences ? 1 : 1.02 }}
                            whileTap={{ scale: savingPreferences ? 1 : 0.98 }}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingPreferences ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Settings className="h-4 w-4" />
                            )}
                            <span>{savingPreferences ? 'Saving...' : 'Save Preferences'}</span>
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-6 right-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-green-200 dark:border-green-700 z-50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">Success!</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Profile updated successfully</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyProfile;