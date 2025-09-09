// Users.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  User,
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  UserPlus,
  Shield,
  Mail,
  Lock,
  Camera,
  X,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

import { useToast } from '@/components/Toaster/ToastContext';
import { selectLoading, selectUsers } from '../../Redux/UsersSelectors';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../../Redux/UsersThunks';
import LoadingSpinner from '@/components/Spinners/LoadingSpinner';

const UsersPage = () => {
  const dispatch = useDispatch();
  const selectedUsers = useSelector(selectUsers);
  const selectedLoading = useSelector(selectLoading);


  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  
  
  // Sample initial data
  useEffect(() => {
   
    
      if(selectedUsers.length > 0)
      {
    setUsers(selectUsers);
    setFilteredUsers(selectUsers);
      }
    
  }, [fetchUsers, selectedUsers]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profileImage: null,
    role: 'user',
    password: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!editingUser && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (editingUser) {
        // Update existing user
        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...formData, password: formData.password || user.password }
            : user
        ));
        toast.success('User updated successfully!');
      } else {
        // Add new user
        const newUser = {
          id: Date.now(),
          ...formData
        };
        setUsers([...users, newUser]);
        toast.success('User added successfully!');
      }
      
      closeModal();
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        password: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        profileImage: null,
        role: 'user',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      profileImage: null,
      role: 'user',
      password: ''
    });
    setErrors({});
  };

  const deleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
      toast.success('User deleted successfully!');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <Users className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
        <p className="text-gray-600">Manage your team members and their permissions</p>
      </motion.div>

      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
          />
        </div>

        <div className="flex gap-3">
        

          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </motion.button>
        </div>
      </motion.div>

      {/* Users Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                {/* User Avatar */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center border-4 border-white shadow-lg">
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={user.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{user.name}</h3>
                  <p className="text-gray-600 flex items-center justify-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {user.email}
                  </p>
                </div>

                {/* Role Badge */}
                <div className="flex justify-center mb-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1 capitalize">{user.role}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex justify-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openModal(user)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-300"
                  >
                    <Edit className="h-4 w-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteUser(user.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new user</p>
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
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Profile Image */}
                  <div className="flex justify-center">
                    <label className="relative cursor-pointer">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center border-4 border-white shadow-lg">
                        {formData.profileImage ? (
                          <img 
                            src={URL.createObjectURL(formData.profileImage)} 
                            alt="Preview"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">
                              {formData.name ? formData.name.split(' ').map(n => n[0]).join('') : 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                      <input
                        type="file"
                        name="profileImage"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`pl-10 pr-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                          errors.name 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                        placeholder="Enter full name"
                      />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-10 pr-4 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                          errors.email 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                        placeholder="Enter email address"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  {(!editingUser || formData.password) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {editingUser ? 'New Password' : 'Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`pl-10 pr-12 py-3 w-full rounded-xl border focus:ring-2 focus:outline-none transition-all duration-300 ${
                            errors.password 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                          }`}
                          placeholder="Enter password"
                        />
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                      )}
                    </div>
                  )}

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="relative">
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300 appearance-none"
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Administrator</option>
                      </select>
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-300"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      {editingUser ? 'Update' : 'Create'} User
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

export default UsersPage;