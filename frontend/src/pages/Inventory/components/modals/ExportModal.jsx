// src/pages/Inventory/components/modals/ExportModal.jsx
// Simple export modal for inventory data
import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Grid } from 'lucide-react';

const ExportModal = memo(function ExportModal({ 
  open, 
  onClose, 
  data = [], 
  filename = 'inventory-export' 
}) {
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    
    try {
      if (format === 'csv') {
        exportCSV();
      } else {
        exportJSON();
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Product Name', 'Category', 'Stock', 'Reserved', 'Available', 'Status'];
    const rows = data.map(item => [
      item.name || '',
      item.category_name || '',
      item.stock || 0,
      item.reserved_stock || 0,
      item.available_stock || 0,
      (item.available_stock || 0) <= 0 ? 'Out of Stock' : 
      (item.available_stock || 0) <= 10 ? 'Low Stock' : 'In Stock'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
    ].join('\n');

    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  };

  const exportJSON = () => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
  };

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Export Data
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Export {data.length} items
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormat('csv')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    format === 'csv'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FileText className={`w-6 h-6 mx-auto mb-2 ${
                    format === 'csv' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div className={`text-sm font-medium ${
                    format === 'csv' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    CSV
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Spreadsheet format
                  </div>
                </button>

                <button
                  onClick={() => setFormat('json')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    format === 'json'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Grid className={`w-6 h-6 mx-auto mb-2 ${
                    format === 'json' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div className={`text-sm font-medium ${
                    format === 'json' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    JSON
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Data format
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={exporting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {exporting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default ExportModal;