// ToastContext.jsx
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import React, { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children, position = "top-right" }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type: "info",
      duration: 5000,
      ...toast,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    addToast,
    removeToast,
    success: (message, options = {}) =>
      addToast({ type: "success", message, ...options }),
    error: (message, options = {}) =>
      addToast({ type: "error", message, ...options }),
    info: (message, options = {}) =>
      addToast({ type: "info", message, ...options }),
    warning: (message, options = {}) =>
      addToast({ type: "warning", message, ...options }),
  };

  const positionClasses = {
    "top-right": "top-25 right-10",
    "top-left": "top-25 left-10",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className={`fixed z-50 ${positionClasses[position]} space-y-3 max-w-md w-full`}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ id, type, message, duration, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const toastIcons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const toastStyles = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  const progressStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  React.useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 100 / (duration / 50);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration, isPaused, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: type.includes("top") ? -50 : 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`relative p-4 rounded-xl border shadow-lg ${toastStyles[type]} backdrop-blur-sm bg-opacity-95`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-xl">
        <motion.div
          className={`h-full ${progressStyles[type]} rounded-t-xl`}
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>

      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">{toastIcons[type]}</div>

        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ToastContext;
