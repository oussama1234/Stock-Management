import React, { memo, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Package, ShoppingBag, ListChecks, Users as UsersIcon, Truck, Tag, User as UserIcon } from 'lucide-react'
import SectionHeader from './SectionHeader'
import ResultRowProduct from './ResultRowProduct'
import { ResultRowSale, ResultRowPurchase, ResultRowMovement, ResultRowSupplier, ResultRowCustomer, ResultRowReason } from './ResultRows'
import SkeletonLoader from './SkeletonLoader'
import VirtualList from './VirtualList'

// New universal search dropdown container
// Grouped sections with sticky headers, hover actions, and virtualization for long lists
function SearchDropdown({
  visible,
  term,
  loading,
  results,
  selectedKey,
  onHoverItem,
  onSelectItem,
  onViewAll,
}) {
  const groups = useMemo(() => {
    return {
      products: results?.products?.data || [],
      sales: results?.sales?.data || [],
      purchases: results?.purchases?.data || [],
      movements: results?.movements?.data || [],
      customers: (results?.customers?.data || []).map(c => ({ ...c, _display: c.customer_name || c.name })),
      suppliers: results?.suppliers?.data || [],
      reasons: results?.reasons?.data || [],
      users: results?.users?.data || [],
    }
  }, [results])

  const sectionDefs = [
    { key: 'products', label: 'Products', icon: Package },
    { key: 'sales', label: 'Sales', icon: UserIcon },
    { key: 'purchases', label: 'Purchases', icon: ShoppingBag },
    { key: 'movements', label: 'Movements', icon: ListChecks },
    { key: 'customers', label: 'Customers', icon: UsersIcon },
    { key: 'suppliers', label: 'Suppliers', icon: Truck },
    { key: 'reasons', label: 'Reasons', icon: Tag },
  ]

  const renderers = {
    products: (p) => (
      <ResultRowProduct
        p={p}
        selected={selectedKey === `products:${p.id}`}
        onView={() => onSelectItem?.({ entity: 'products', item: p, action: 'view' })}
        onEdit={() => onSelectItem?.({ entity: 'products', item: p, action: 'edit' })}
        onExport={() => onSelectItem?.({ entity: 'products', item: p, action: 'export' })}
      />
    ),
    sales: (s) => (
      <ResultRowSale
        s={s}
        selected={selectedKey === `sales:${s.id}`}
        onView={() => onSelectItem?.({ entity: 'sales', item: s, action: 'view' })}
      />
    ),
    purchases: (p) => (
      <ResultRowPurchase
        p={p}
        selected={selectedKey === `purchases:${p.id}`}
        onView={() => onSelectItem?.({ entity: 'purchases', item: p, action: 'view' })}
      />
    ),
    movements: (m) => (
      <ResultRowMovement
        m={m}
        selected={selectedKey === `movements:${m.id}`}
        onView={() => onSelectItem?.({ entity: 'movements', item: m, action: 'view' })}
      />
    ),
    customers: (c, idx) => (
      <ResultRowCustomer
        c={c}
        selected={selectedKey === `customers:${idx}`}
        onView={() => onSelectItem?.({ entity: 'customers', item: c, action: 'view' })}
      />
    ),
    suppliers: (s) => (
      <ResultRowSupplier
        s={s}
        selected={selectedKey === `suppliers:${s.id}`}
        onView={() => onSelectItem?.({ entity: 'suppliers', item: s, action: 'view' })}
      />
    ),
    reasons: (r, idx) => (
      <ResultRowReason
        r={r}
        selected={selectedKey === `reasons:${idx}`}
        onView={() => onSelectItem?.({ entity: 'reasons', item: r, action: 'view' })}
      />
    ),
  }

  const isEmpty = !loading && Object.values(groups).every(arr => (arr || []).length === 0)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="absolute left-0 right-0 mt-2 z-50"
        >
          <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Results for "{term}"</span>
              </div>
              {loading && (
                <div className="text-sm text-gray-500">Searching…</div>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <SkeletonLoader rows={6} />
            ) : isEmpty ? (
              <div className="text-center text-gray-500 text-sm py-6">No quick results. Press Enter to see full results.</div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto pr-1 -mx-2 px-2 space-y-4">
                {sectionDefs.map(sec => {
                  const list = groups[sec.key] || []
                  if (list.length === 0) return null
                  const useVirtual = list.length > 60
                  return (
                    <div key={sec.key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-2">
                      <SectionHeader icon={sec.icon} label={sec.label} count={list.length} />
                      <div className="mt-2">
                        {useVirtual ? (
                          <VirtualList
                            items={list.map((item, idx) => ({ item, idx, key: `${sec.key}:${item.id ?? idx}` }))}
                            itemHeight={44}
                            height={Math.min(320, Math.max(180, Math.ceil(Math.min(list.length, 8) * 44)))}
                            overscan={6}
                            renderRow={({ item: wrap }) => (
                              <div
                                onMouseEnter={() => onHoverItem?.(`${sec.key}:${wrap.item.id ?? wrap.idx}`)}
                                onClick={() => onSelectItem?.({ entity: sec.key, item: wrap.item, index: wrap.idx })}
                              >
                                {renderers[sec.key](wrap.item, wrap.idx)}
                              </div>
                            )}
                          />
                        ) : (
                          <div className="space-y-1">
                            {list.slice(0, 200).map((it, idx) => (
                              <div
                                key={`${sec.key}:${it.id ?? idx}`}
                                onMouseEnter={() => onHoverItem?.(`${sec.key}:${it.id ?? idx}`)}
                                onClick={() => onSelectItem?.({ entity: sec.key, item: it, index: idx })}
                              >
                                {renderers[sec.key](it, idx)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end mt-3">
              <button
                type="button"
                className="text-xs px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                onClick={() => onViewAll?.()}
              >
                View all results
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(SearchDropdown)
