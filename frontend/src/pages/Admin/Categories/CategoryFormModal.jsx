// src/pages/Admin/Categories/CategoryFormModal.jsx
// Beautiful modern animated modal with lazy loading and stunning design
// - Gradient backgrounds and glassmorphism effects
// - Smooth animations and micro-interactions
// - Form validation with beautiful error states
// - Loading states with animated spinners

import React, { memo, useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Layers, 
  Type, 
  FileText, 
  Sparkles, 
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

const CategoryFormModal = memo(function CategoryFormModal({ 
  open, 
  onOpenChange, 
  initial = null, 
  onSubmit, 
  loading = false 
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setName(initial?.name || '');
      setDescription(initial?.description || '');
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setSubmitSuccess(false);
    }
  }, [open, initial]);

  // Real-time validation
  const validateField = useCallback((field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Category name is required';
        } else if (value.trim().length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          newErrors.name = 'Name must be less than 50 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'description':
        if (value.trim().length > 500) {
          newErrors.description = 'Description must be less than 500 characters';
        } else {
          delete newErrors.description;
        }
        break;
    }
    
    setErrors(newErrors);
  }, [errors]);

  // Handle field changes with validation
  const handleNameChange = useCallback((e) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      validateField('name', value);
    }
  }, [touched.name, validateField]);

  const handleDescriptionChange = useCallback((e) => {
    const value = e.target.value;
    setDescription(value);
    if (touched.description) {
      validateField('description', value);
    }
  }, [touched.description, validateField]);

  // Handle field blur for validation
  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'name') validateField('name', name);
    if (field === 'description') validateField('description', description);
  }, [name, description, validateField]);

  // Submit form with animation
  const submit = useCallback(async () => {
    // Validate all fields
    validateField('name', name);
    validateField('description', description);
    
    setTouched({ name: true, description: true });
    
    // Check for errors
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Category name is required' }));
      return;
    }
    
    if (Object.keys(errors).length > 0) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = { 
        name: name.trim(), 
        description: description?.trim() || null 
      };
      
      await onSubmit?.(payload);
      
      // Success animation
      setSubmitSuccess(true);
      
      // Auto-close after success animation
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      setErrors({ general: error.message || 'Something went wrong' });
    } finally {
      setIsSubmitting(false);
    }
  }, [name, description, errors, onSubmit, onOpenChange, validateField]);

  // Handle Enter key submission
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      submit();
    }
  }, [submit]);

  const isFormValid = name.trim() && Object.keys(errors).length === 0;

  return (
    <AnimatePresence>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          {/* Enhanced Overlay */}
          <Dialog.Overlay asChild>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-black/40 via-gray-900/50 to-black/60 backdrop-blur-md z-50"
            />
          </Dialog.Overlay>
          
          {/* Beautiful Modal Content */}
          <Dialog.Content asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                opacity: { duration: 0.2 }
              }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-lg z-50 focus:outline-none"
              onKeyDown={handleKeyDown}
            >
              {/* Modal Card */}
              <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                      scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                  <motion.div
                    animate={{
                      rotate: -360,
                      y: [-5, 5, -5]
                    }}
                    transition={{
                      rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  />
                </div>

                {/* Header */}
                <div className="relative z-10 p-6 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg"
                      >
                        <Layers className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <Dialog.Title className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                          {initial ? 'Edit Category' : 'New Category'}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Sparkles className="h-4 w-4 mr-1 text-purple-500" />
                          {initial ? 'Update category details' : 'Create a new product category'}
                        </p>
                      </div>
                    </div>
                    
                    <Dialog.Close asChild>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                      </motion.button>
                    </Dialog.Close>
                  </div>
                </div>

                {/* Form Content */}
                <div className="relative z-10 p-6">
                  <AnimatePresence mode="wait">
                    {submitSuccess ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center py-8"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                          transition={{ duration: 0.8 }}
                          className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                        >
                          <Check className="h-8 w-8 text-white" />
                        </motion.div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {initial ? 'Category Updated!' : 'Category Created!'}
                        </h3>
                        <p className="text-gray-600">
                          {initial ? 'Changes have been saved successfully.' : 'New category has been created successfully.'}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        {/* General Error */}
                        {errors.general && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3"
                          >
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <p className="text-red-700 text-sm">{errors.general}</p>
                          </motion.div>
                        )}

                        {/* Name Field */}
                        <div>
                          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                            <Type className="h-4 w-4 text-purple-500" />
                            <span>Category Name</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <motion.div
                            whileFocus={{ scale: 1.02 }}
                            className="relative"
                          >
                            <input 
                              type="text"
                              value={name}
                              onChange={handleNameChange}
                              onBlur={() => handleBlur('name')}
                              placeholder="Enter category name..."
                              className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-300 bg-white/80 backdrop-blur-sm ${
                                errors.name 
                                  ? 'border-red-300 focus:border-red-400 bg-red-50/50' 
                                  : name.trim() && !errors.name
                                  ? 'border-green-300 focus:border-green-400 bg-green-50/50'
                                  : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                              } focus:outline-none focus:ring-4 focus:ring-purple-100`}
                            />
                            {name.trim() && !errors.name && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                              >
                                <Check className="h-5 w-5 text-green-500" />
                              </motion.div>
                            )}
                          </motion.div>
                          {errors.name && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-2 mt-2 text-red-600"
                            >
                              <AlertCircle className="h-4 w-4" />
                              <p className="text-xs">{errors.name}</p>
                            </motion.div>
                          )}
                        </div>

                        {/* Description Field */}
                        <div>
                          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                            <FileText className="h-4 w-4 text-purple-500" />
                            <span>Description</span>
                            <span className="text-gray-400 font-normal">(optional)</span>
                          </label>
                          <motion.div
                            whileFocus={{ scale: 1.02 }}
                            className="relative"
                          >
                            <textarea 
                              value={description}
                              onChange={handleDescriptionChange}
                              onBlur={() => handleBlur('description')}
                              placeholder="Enter category description..."
                              rows={4}
                              className={`w-full px-4 py-4 rounded-2xl border-2 transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none ${
                                errors.description 
                                  ? 'border-red-300 focus:border-red-400 bg-red-50/50' 
                                  : 'border-gray-200 focus:border-purple-400 hover:border-gray-300'
                              } focus:outline-none focus:ring-4 focus:ring-purple-100`}
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                              {description.length}/500
                            </div>
                          </motion.div>
                          {errors.description && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center space-x-2 mt-2 text-red-600"
                            >
                              <AlertCircle className="h-4 w-4" />
                              <p className="text-xs">{errors.description}</p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Actions */}
                {!submitSuccess && (
                  <div className="relative z-10 p-6 pt-0">
                    <div className="flex items-center justify-end space-x-3">
                      <Dialog.Close asChild>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold transition-all duration-200 hover:bg-gray-50"
                        >
                          Cancel
                        </motion.button>
                      </Dialog.Close>
                      
                      <motion.button 
                        onClick={submit}
                        disabled={!isFormValid || isSubmitting || loading}
                        whileHover={isFormValid ? { scale: 1.02 } : {}}
                        whileTap={isFormValid ? { scale: 0.98 } : {}}
                        className={`inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                          isFormValid && !isSubmitting && !loading
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {(isSubmitting || loading) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>{initial ? 'Save Changes' : 'Create Category'}</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                    
                    {/* Keyboard Shortcut Hint */}
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-400">
                        Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd> to save
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AnimatePresence>
  );
});

export default CategoryFormModal;
