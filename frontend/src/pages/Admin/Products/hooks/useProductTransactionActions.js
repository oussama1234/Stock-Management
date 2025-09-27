import { useCallback, useMemo, useState } from 'react';
import { useToast } from '@/components/Toaster/ToastContext';
import { useConfirm } from '@/components/ConfirmContext/ConfirmContext';
import { createSale, updateSale, deleteSale } from '@/api/Sales';
import { createPurchase, updatePurchase, deletePurchase } from '@/api/Purchases';
import { useProductData } from '../context/ProductDataContext';

/**
 * Shared transaction actions for ProductDetailsRefactored
 * - Centralizes modal state and CRUD for sales and purchases
 * - Avoids code duplication across tabs and parent
 */
export default function useProductTransactionActions() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const { product, refreshData } = useProductData();

  // Modal state
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingSaleItem, setEditingSaleItem] = useState(null);
  const [editingPurchaseItem, setEditingPurchaseItem] = useState(null);

  // Sale initial data (memoized for stable reference while editing)
  const saleInitial = useMemo(() => {
    if (editingSaleItem) {
      const s = editingSaleItem;
      const base = s.sale || {};
      return {
        customer_name: base.customer_name || base.customer?.name || '',
        tax: base.tax ?? 0,
        discount: base.discount ?? 0,
        items: [
          {
            product_id: s.product_id || product?.id,
            quantity: s.quantity || 1,
            price: s.unit_price || s.price || product?.price || 0,
          },
        ],
      };
    }
    return {
      customer_name: '',
      tax: 0,
      discount: 0,
      items: [
        { product_id: product?.id, quantity: 1, price: product?.price || 0 },
      ],
    };
  }, [editingSaleItem, product]);

  // Purchase initial data (memoized for stable reference while editing)
  const purchaseInitial = useMemo(() => {
    if (editingPurchaseItem) {
      const p = editingPurchaseItem;
      const base = p.purchase || {};
      const supplierId = base.supplier_id || base.supplier?.id || '';
      const rawDate = base.purchase_date || base.created_at || p.created_at || '';
      const purchaseDate = rawDate ? String(rawDate).split('T')[0] : '';
      return {
        // Keep backwards compatibility with PurchaseModal which reads initial.supplier?.id
        supplier: {
          id: supplierId,
          name: base.supplier?.name || undefined,
        },
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        tax: base.tax ?? 0,
        discount: base.discount ?? 0,
        purchaseItems: [
          {
            product_id: p.product_id || product?.id,
            product: { name: p.product?.name || product?.name },
            quantity: p.quantity || 1,
            price: p.unit_price || p.price || product?.price || 0,
          },
        ],
      };
    }
    return {
      supplier_id: '',
      purchase_date: new Date().toISOString().split('T')[0],
      tax: 0,
      discount: 0,
      purchaseItems: [
        { product_id: product?.id, product: { name: product?.name }, quantity: 1, price: product?.price || 0 },
      ],
    };
  }, [editingPurchaseItem, product]);

  // Openers
  const openCreateSale = useCallback(() => {
    setEditingSaleItem(null);
    setSaleModalOpen(true);
  }, []);

  const openCreatePurchase = useCallback(() => {
    setEditingPurchaseItem(null);
    setPurchaseModalOpen(true);
  }, []);

  const openEditSale = useCallback((saleItem) => {
    setEditingSaleItem(saleItem || null);
    setSaleModalOpen(true);
  }, []);

  const openEditPurchase = useCallback((purchaseItem) => {
    setEditingPurchaseItem(purchaseItem || null);
    setPurchaseModalOpen(true);
  }, []);

  // Closers
  const closeSaleModal = useCallback(() => setSaleModalOpen(false), []);
  const closePurchaseModal = useCallback(() => setPurchaseModalOpen(false), []);

  // Submit handlers (create/update)
  const submitSale = useCallback(async (payload) => {
    try {
      if (editingSaleItem?.sale?.id) {
        await updateSale(editingSaleItem.sale.id, payload);
        toast.success('Sale updated successfully');
      } else {
        await createSale(payload);
        toast.success('Sale created successfully');
      }
      closeSaleModal();
      // Small delay to allow backend cache invalidation to propagate
      setTimeout(async () => {
        await refreshData();
      }, 100);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Sale operation failed');
      throw e;
    }
  }, [editingSaleItem, closeSaleModal, refreshData, toast]);

  const submitPurchase = useCallback(async (payload) => {
    try {
      // Normalize payload to ensure proper types/format
      const normalized = {
        supplier_id: Number(payload.supplier_id) || undefined,
        purchase_date: payload.purchase_date ? String(payload.purchase_date).split('T')[0] : undefined,
        tax: Number.isFinite(Number(payload.tax)) ? Number(payload.tax) : 0,
        discount: Number.isFinite(Number(payload.discount)) ? Number(payload.discount) : 0,
        items: (payload.items || payload.purchaseItems || []).map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity),
          price: Number(it.price),
        })),
      };

      if (editingPurchaseItem?.purchase?.id) {
        await updatePurchase(editingPurchaseItem.purchase.id, normalized);
        toast.success('Purchase updated successfully');
      } else {
        await createPurchase(normalized);
        toast.success('Purchase created successfully');
      }
      closePurchaseModal();
      // Small delay to allow backend cache invalidation to propagate
      setTimeout(async () => {
        await refreshData();
      }, 100);
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Purchase operation failed');
      throw e;
    }
  }, [editingPurchaseItem, closePurchaseModal, refreshData, toast]);

  // Deletes with confirmation
  const deleteSaleByItem = useCallback(async (saleItem) => {
    const saleId = saleItem?.sale?.id || saleItem?.id;
    if (!saleId) return;
    const ok = await confirm({
      type: 'warning',
      title: 'Delete sale?',
      description: 'This will delete the sale and restore stock for its items.'
    });
    if (!ok) return;
    try {
      await deleteSale(saleId);
      toast.success('Sale deleted successfully');
      await refreshData();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Delete failed');
      throw e;
    }
  }, [confirm, toast, refreshData]);

  const deletePurchaseByItem = useCallback(async (purchaseItem) => {
    const purchaseId = purchaseItem?.purchase?.id || purchaseItem?.id;
    if (!purchaseId) return;
    const ok = await confirm({
      type: 'warning',
      title: 'Delete purchase?',
      description: 'This will delete the purchase and reduce stock for its items.'
    });
    if (!ok) return;
    try {
      await deletePurchase(purchaseId);
      toast.success('Purchase deleted successfully');
      await refreshData();
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Delete failed');
      throw e;
    }
  }, [confirm, toast, refreshData]);

  return {
    // modal flags
    saleModalOpen,
    purchaseModalOpen,

    // editing targets
    editingSaleItem,
    editingPurchaseItem,

    // initial data
    saleInitial,
    purchaseInitial,


    // open/close
    openCreateSale,
    openCreatePurchase,
    openEditSale,
    openEditPurchase,
    closeSaleModal,
    closePurchaseModal,

    // submit
    submitSale,
    submitPurchase,

    // delete
    deleteSaleByItem,
    deletePurchaseByItem,
  };
}
