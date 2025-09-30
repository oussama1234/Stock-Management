// UsersPageNew.jsx - Complete Redesign with Server-Side Pagination
// Beautiful modern design with animations, icons, hover effects matching app style
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Award,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/Toaster/ToastContext";
import { useConfirm } from "../../components/ConfirmContext/ConfirmContext";
import ContentSpinner from "../../components/Spinners/ContentSpinner";
import { useAuth } from "../../context/AuthContext";
import { AxiosClient } from "@/api/AxiosClient";
import { getUsers, createUser, updateUser, deleteUser } from "../../api/AuthFunctions";

const UsersPageNew = () => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const { user: currentUser } = useAuth();

  // Server-side pagination state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    job_title: "",
    bio: "",
    profileImage: null,
    role: "user",
    password: "",
    two_factor_enabled: false,
  });

  const [errors, setErrors] = useState({});

  // Fetch users with server-side pagination
  const fetchUsers = useCallback(async (isPagination = false) => {
    try {
      // Set appropriate loading state
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }

      const response = await getUsers({
        page: currentPage,
        per_page: perPage,
        search: searchTerm,
        role: roleFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (response.success) {
        setUsers(response.data.data || []);
        setTotalUsers(response.data.total || 0);
        setTotalPages(response.data.last_page || 1);
      } else {
        toast.error(response.message || "Failed to load users");
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  }, [currentPage, perPage, searchTerm, roleFilter, sortBy, sortOrder, toast]);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, roleFilter]);

  // Pagination navigation functions
  const handlePageChange = async (newPage) => {
    if (newPage === currentPage || paginationLoading) return;
    setCurrentPage(newPage);
    // The fetchUsers will be called with isPagination=true via useEffect
  };

  // Handle all data fetching
  useEffect(() => {
    // Determine if this is a pagination change (currentPage changed but not from reset)
    const isPaginationChange = currentPage > 1;
    fetchUsers(isPaginationChange);
  }, [fetchUsers]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "profileImage" || name === "avatar") {
      if (files && files[0]) {
        const selectedFile = files[0];
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
          setFormData((prev) => ({
            ...prev,
            profileImage: e.target.result,
          }));
        };
        reader.readAsDataURL(selectedFile);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!editingUser && !formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      
      // Append all form fields with proper handling for different data types
      Object.keys(formData).forEach(key => {
        if (key !== 'description' && key !== 'profileImage') {
          const value = formData[key];
          // Handle different data types properly
          if (value !== null && value !== undefined) {
            if (typeof value === 'boolean') {
              formDataToSend.append(key, value ? '1' : '0');
            } else if (value !== '') {
              formDataToSend.append(key, value);
            }
          }
        }
      });

      // Append file if exists
      if (file) {
        formDataToSend.append('profileImage', file);
      }
      
      // Debug log the form data
      for (let [key, value] of formDataToSend.entries()) {
      }

      let response;
      if (editingUser) {
        // Update existing user
        response = await updateUser(editingUser.id, formDataToSend);
      } else {
        // Add new user
        response = await createUser(formDataToSend);
      }

      if (response.success) {
        closeModal();
        await fetchUsers(); // Refresh the list
        toast.success(response.message || `User ${editingUser ? 'updated' : 'created'} successfully!`);
      } else {
        toast.error(response.message || "Error saving user");
        if (response.errors) {
          setErrors(response.errors);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open modal for add/edit
  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        website: user.website || "",
        job_title: user.job_title || "",
        bio: user.bio || "",
        profileImage: user.profileImage,
        role: user.role || "user",
        password: "",
        two_factor_enabled: user.two_factor_enabled || false,
      });
      setImagePreview(user.avatar || user.profileImage);
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        job_title: "",
        bio: "",
        profileImage: null,
        role: "user",
        password: "",
        two_factor_enabled: false,
      });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      job_title: "",
      bio: "",
      profileImage: null,
      role: "user",
      password: "",
      two_factor_enabled: false,
    });
    setErrors({});
    setImagePreview(null);
    setFile(null);
  };

  // Delete user
  const deleteUserFunction = async (userObj) => {
    try {
      const confirmResult = await confirm({
        type: "warning",
        title: "Delete User",
        description: `Are you sure you want to delete ${userObj.name}? This action cannot be undone.`,
        confirmText: "Yes, Delete",
        cancelText: "Cancel",
      });

      if (confirmResult) {
        const response = await deleteUser(userObj.id);
        if (response.success) {
          toast.success(response.message || "User deleted successfully!");
          fetchUsers(); // Refresh the list
        } else {
          toast.error(response.message || "Failed to delete user");
        }
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  // Get role styling
  const getRoleConfig = (role) => {
    const configs = {
      admin: {
        color: "from-red-500 to-rose-600",
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: Shield,
      },
      manager: {
        color: "from-blue-500 to-indigo-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: Users,
      },
      user: {
        color: "from-green-500 to-emerald-600",
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        icon: User,
      },
    };
    return configs[role] || configs.user;
  };

  // Toggle switch component
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

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 p-6">
        <ContentSpinner size="large" message="Loading users..." fullWidth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/80 via-blue-50/40 to-indigo-50/60 p-6">
        {/* Beautiful Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-6"
        >
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl mr-4 shadow-xl">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center text-lg">
                <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                Manage your team with <span className="font-semibold text-purple-600 mx-1">{totalUsers}</span> users
              </p>
            </div>
          </div>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-medium shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            <span>Add New User</span>
          </motion.button>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none bg-white transition-all duration-300"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="user">User</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort By */}
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-10 pr-8 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none bg-white transition-all duration-300"
              >
                <option value="created_at">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="role">Sort by Role</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* Per Page */}
            <div className="relative">
              <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="pl-10 pr-8 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none bg-white transition-all duration-300"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {users.length === 0 ? 0 : ((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalUsers)} of {totalUsers} users
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchUsers(false)}
              disabled={loading || paginationLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading || paginationLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Users Grid */}
        {users.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-12 text-center"
          >
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or add a new user</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
            >
              <UserPlus className="h-5 w-5 inline mr-2" />
              Add First User
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {/* Pagination Loading Overlay */}
            <AnimatePresence>
              {paginationLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-center z-10"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                      <div className="absolute inset-0 rounded-full border-2 border-blue-200/30 animate-pulse"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading users...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="popLayout">
              {users.map((user, index) => {
                const roleConfig = getRoleConfig(user.role);
                const RoleIcon = roleConfig.icon;

                return (
                  <motion.div
                    key={user.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                    className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden hover:border-indigo-200 transition-all duration-500"
                  >
                    {/* User Header */}
                    <div className={`relative p-6 bg-gradient-to-br ${roleConfig.color}/10`}>
                      <div className="absolute top-4 right-4">
                        <div className={`px-2 py-1 ${roleConfig.bg} ${roleConfig.border} border rounded-full flex items-center space-x-1`}>
                          <RoleIcon className={`h-3 w-3 ${roleConfig.text}`} />
                          <span className={`text-xs font-medium ${roleConfig.text} capitalize`}>
                            {user.role}
                          </span>
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-100 p-1 shadow-lg">
                            {user.avatar || user.profileImage ? (
                              <img
                                src={user.avatar || user.profileImage}
                                alt={user.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <div className={`w-full h-full rounded-xl bg-gradient-to-br ${roleConfig.color} flex items-center justify-center`}>
                                <span className="text-xl font-bold text-white">
                                  {user.name?.split(" ").map(n => n[0]).join("") || "U"}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Online Status */}
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-md flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{user.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{user.job_title || 'Team Member'}</p>
                        
                        {/* Contact Info */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-center text-xs text-gray-500">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[150px]">{user.email}</span>
                          </div>
                          
                          {user.phone && (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          
                          {user.location && (
                            <div className="flex items-center justify-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{user.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="p-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-2 bg-blue-50 rounded-xl">
                          <div className="text-lg font-bold text-blue-700">{user.sales_count || 0}</div>
                          <div className="text-xs text-blue-600">Sales</div>
                        </div>
                        <div className="p-2 bg-green-50 rounded-xl">
                          <div className="text-lg font-bold text-green-700">{user.purchases_count || 0}</div>
                          <div className="text-xs text-green-600">Purchases</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-gray-100">
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openModal(user)}
                          className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-300 flex items-center justify-center space-x-1"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span className="text-sm font-medium">Edit</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => deleteUserFunction(user)}
                          className="py-2 px-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Two Factor Badge */}
                    {user.two_factor_enabled && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-green-100 text-green-700 p-1 rounded-full">
                          <Shield className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-200/50 p-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || paginationLoading}
                  className="px-3 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-1"
                >
                  {paginationLoading && currentPage !== 1 ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : null}
                  <span>First</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || paginationLoading}
                  className="px-3 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-1"
                >
                  {paginationLoading && currentPage > 1 ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : null}
                  <span>Previous</span>
                </motion.button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    const isCurrentPage = pageNum === currentPage;
                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={paginationLoading}
                        className={`px-3 py-2 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[40px] ${
                          isCurrentPage
                            ? 'bg-blue-500 text-white'
                            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                        } ${paginationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {paginationLoading && !isCurrentPage ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          pageNum
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || paginationLoading}
                  className="px-3 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-1"
                >
                  {paginationLoading && currentPage < totalPages ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : null}
                  <span>Next</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || paginationLoading}
                  className="px-3 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-1"
                >
                  {paginationLoading && currentPage !== totalPages ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : null}
                  <span>Last</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Add/Edit User Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={closeModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {editingUser ? "Edit User" : "Add New User"}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        {editingUser ? "Update user information and preferences" : "Create a new user account"}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={closeModal}
                      className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-300"
                    >
                      <X className="h-6 w-6" />
                    </motion.button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Image Section */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <label className="cursor-pointer block">
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                <span className="text-xl font-bold text-white">
                                  {formData.name ? formData.name.split(" ").map(n => n[0]).join("") : "U"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-full shadow-lg">
                            <Camera className="h-4 w-4 text-white" />
                          </div>
                          <input
                            type="file"
                            name="avatar"
                            accept="image/*"
                            onChange={handleInputChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`pl-10 pr-4 py-3 w-full rounded-xl border transition-all duration-300 ${
                              errors.name
                                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            } focus:outline-none`}
                            placeholder="Enter full name"
                          />
                        </div>
                        {errors.name && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <X className="h-4 w-4 mr-1" /> {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`pl-10 pr-4 py-3 w-full rounded-xl border transition-all duration-300 ${
                              errors.email
                                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            } focus:outline-none`}
                            placeholder="Enter email address"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <X className="h-4 w-4 mr-1" /> {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
                            placeholder="Enter location"
                          />
                        </div>
                      </div>

                      {/* Job Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <div className="relative">
                          <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="job_title"
                            value={formData.job_title}
                            onChange={handleInputChange}
                            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
                            placeholder="e.g., Stock Manager, Inventory Specialist"
                          />
                        </div>
                      </div>

                      {/* Website */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role *
                        </label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="pl-10 pr-8 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none appearance-none bg-white transition-all duration-300"
                          >
                            <option value="user">User</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {editingUser ? "New Password (leave blank to keep current)" : "Password *"}
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={`pl-10 pr-12 py-3 w-full rounded-xl border transition-all duration-300 ${
                              errors.password
                                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            } focus:outline-none`}
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <X className="h-4 w-4 mr-1" /> {errors.password}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition-all duration-300"
                        placeholder="Tell us about yourself"
                      />
                    </div>


                    {/* Two Factor Authentication */}
                    <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-medium text-gray-800">Two-Factor Authentication</h4>
                            <p className="text-sm text-gray-600">Add an extra layer of security to this account</p>
                          </div>
                        </div>
                        <ToggleSwitch 
                          checked={formData.two_factor_enabled} 
                          onChange={handleInputChange}
                          name="two_factor_enabled"
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={closeModal}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={submitting}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
                      >
                        {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        <span>{submitting ? "Saving..." : (editingUser ? "Update User" : "Create User")}</span>
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default UsersPageNew;
