// src/pages/Inventory/Adjustments/AdjustmentConfirmationModal.jsx
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, X } from 'lucide-react';

const ReasonBadge = ({ reason }) => {
  const map = {
    damage: 'bg-rose-50 text-rose-700 border-rose-200',
    lost: 'bg-amber-50 text-amber-700 border-amber-200',
    correction: 'bg-blue-50 text-blue-700 border-blue-200',
    other: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${map[reason] || map.other}`}>{reason}</span>;
};

export default function AdjustmentConfirmationModal({ open, onOpenChange, data, onConfirm, loading }) {
  const diff = Number(data?.difference || 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 p-0 focus:outline-none">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-5">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">Confirm Adjustment</Dialog.Title>
              <Dialog.Close className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Product</span>
                <span className="font-medium truncate max-w-[60%] text-right">{data?.product?.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Old Qty</span>
                <span className="font-medium">{data?.current_stock ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Qty</span>
                <span className="font-medium">{data?.new_quantity ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Difference</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-sm font-semibold ${diff >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {diff >= 0 ? '+ ' : '- '}{Math.abs(diff)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Reason</span>
                <ReasonBadge reason={data?.reason} />
              </div>
              {data?.notes && (
                <div>
                  <div className="text-gray-600 mb-1">Notes</div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700">{data.notes}</div>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">This action will update stock and create an audit record.</div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">Back</button>
              </Dialog.Close>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Confirm & Save
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
