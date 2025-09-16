// ConfirmContext.jsx
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle, HelpCircle, Info, X } from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// Create the context
const ConfirmContext = createContext(undefined);

// Custom hook to use the confirm dialog
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

// Provider component
export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(); // Use ref to store the resolve function

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve; // Store resolve function in ref
      setDialog({
        ...options,
        isOpen: true,
      });
    });
  }, []);

  const closeDialog = useCallback((result) => {
    if (resolveRef.current) {
      resolveRef.current(result); // Use the stored resolve function
      resolveRef.current = null; // Clear the ref
    }
    setDialog(null);
  }, []);

  const value = {
    confirm,
    closeDialog,
  };

  const getDialogConfig = (type = "confirm") => {
    const configs = {
      confirm: {
        icon: HelpCircle,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmButton: "bg-blue-500 hover:bg-blue-600",
      },
      warning: {
        icon: AlertTriangle,
        iconColor: "text-yellow-500",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        confirmText: "Proceed",
        cancelText: "Cancel",
        confirmButton: "bg-yellow-500 hover:bg-yellow-600",
      },
      danger: {
        icon: AlertTriangle,
        iconColor: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        confirmText: "Delete",
        cancelText: "Cancel",
        confirmButton: "bg-red-500 hover:bg-red-600",
      },
      info: {
        icon: Info,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        confirmText: "Okay",
        cancelText: "Cancel",
        confirmButton: "bg-blue-500 hover:bg-blue-600",
      },
      success: {
        icon: CheckCircle,
        iconColor: "text-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        confirmText: "Continue",
        cancelText: "Cancel",
        confirmButton: "bg-green-500 hover:bg-green-600",
      },
    };

    return configs[type] || configs.confirm;
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {dialog?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() =>
              dialog.cancelOnOverlayClick !== false && closeDialog(false)
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`rounded-2xl border shadow-xl max-w-md w-full overflow-hidden ${
                getDialogConfig(dialog.type).bgColor
              } ${getDialogConfig(dialog.type).borderColor}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.1,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      {React.createElement(getDialogConfig(dialog.type).icon, {
                        className: `h-6 w-6 ${
                          getDialogConfig(dialog.type).iconColor
                        }`,
                      })}
                    </motion.div>
                  </div>

                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {dialog.title || "Confirmation"}
                    </h3>

                    {dialog.description && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-2 text-gray-600"
                      >
                        {dialog.description}
                      </motion.p>
                    )}
                  </div>

                  {dialog.showClose !== false && (
                    <button
                      onClick={() => closeDialog(false)}
                      className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row-reverse gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => closeDialog(true)}
                  className={`px-4 py-2 text-white rounded-xl font-medium transition-colors duration-300 ${
                    getDialogConfig(dialog.type).confirmButton
                  } flex items-center justify-center`}
                >
                  {dialog.confirmText ||
                    getDialogConfig(dialog.type).confirmText}
                </motion.button>

                {dialog.cancelText !== null && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => closeDialog(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-300"
                  >
                    {dialog.cancelText ||
                      getDialogConfig(dialog.type).cancelText}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider;
