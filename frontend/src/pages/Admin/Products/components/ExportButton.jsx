import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

const ExportButton = memo(({ onClick, disabled = false, tooltip = 'Export product details with all sales, purchases, and stock movement data.' }) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onClick?.(); }}
      disabled={disabled}
      className={`flex items-center space-x-2 px-3 py-2 rounded-xl shadow-lg transition-all duration-300 text-sm ${
        disabled
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white'
      }`}
      title={tooltip}
      aria-label="Export"
    >
      {disabled ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-5 w-5" />
      )}
      <span>Export</span>
    </motion.button>
  );
});

ExportButton.displayName = 'ExportButton';

export default ExportButton;