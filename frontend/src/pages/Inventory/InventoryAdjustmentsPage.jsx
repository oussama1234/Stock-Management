// src/pages/Inventory/InventoryAdjustmentsPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { postInventoryAdjustment } from '@/api/Inventory';
import { Plus } from 'lucide-react';
import AdjustmentKPIs from '@/pages/Inventory/Adjustments/AdjustmentKPIs';
import InventoryTabs from '@/pages/Inventory/components/InventoryTabs';
import AdjustmentFormModal from '@/pages/Inventory/Adjustments/AdjustmentFormModal';
import AdjustmentConfirmationModal from '@/pages/Inventory/Adjustments/AdjustmentConfirmationModal';
import AdjustmentTable from '@/pages/Inventory/Adjustments/AdjustmentTable';

// Lightweight Toast component (no external deps)
function Toast({ open, type = 'success', message, onClose }) {
  if (!open) return null;
  const styles = type === 'success'
    ? 'bg-emerald-600 text-white'
    : type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-gray-800 text-white';
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-2 rounded-xl shadow-lg ${styles}`}>{message}</div>
    </div>
  );
}

export default function InventoryAdjustmentsPage() {

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null); // data from form
  const [submitting, setSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const showToast = useCallback((type, message) => {
    setToast({ open: true, type, message });
    setTimeout(() => setToast(t => ({ ...t, open: false })), 2400);
  }, []);

  // Trigger history refresh via key bump
  const [tableVersion, setTableVersion] = useState(0);
  const refreshTable = () => setTableVersion(v => v + 1);

  const onProceed = (data) => {
    setPending(data);
    setFormOpen(false);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    try {
      setSubmitting(true);
      await postInventoryAdjustment({
        product_id: Number(pending.product_id),
        new_quantity: Number(pending.new_quantity),
        reason: pending.reason,
        notes: pending.notes || undefined,
      });
      setConfirmOpen(false);
      setPending(null);
      refreshTable();
      showToast('success', 'Inventory adjusted successfully');
    } catch (e) {
      showToast('error', e?.response?.data?.message || e.message || 'Failed to save adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Toast open={toast.open} type={toast.type} message={toast.message} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="inline-flex items-center gap-1">
              <li>Inventory</li>
              <li className="opacity-60">›</li>
              <li className="font-medium text-gray-700">Adjustments</li>
            </ol>
          </nav>
          <h1 className="text-2xl lg:text-3xl font-bold mt-1">Inventory Adjustments</h1>
          {/* Sub-navigation within Inventory */}
          <InventoryTabs />
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          New Adjustment
        </button>
      </div>

      {/* KPIs */}
      <AdjustmentKPIs />

      {/* History Table */}
      <div key={tableVersion}>
        <AdjustmentTable />
      </div>

      {/* Modals */}
      <AdjustmentFormModal open={formOpen} onOpenChange={setFormOpen} onProceed={onProceed} />
      <AdjustmentConfirmationModal open={confirmOpen} onOpenChange={setConfirmOpen} data={pending} onConfirm={onConfirm} loading={submitting} />
    </div>
  );
}
