import React, { memo } from 'react'
import { Eye, Pencil, Download } from 'lucide-react'

const Row = ({ children, selected }) => (
  <div className={`group flex items-center gap-3 px-2 py-2 rounded-xl ${selected ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'} transition-all`}>{children}</div>
)

const Actions = ({ onView, onEdit, onExport }) => (
  <div className="flex items-center gap-1">
    {onView && <button onClick={onView} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Eye className="h-4 w-4" /></button>}
    {onEdit && <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Pencil className="h-4 w-4" /></button>}
    {onExport && <button onClick={onExport} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Download className="h-4 w-4" /></button>}
  </div>
)

export const ResultRowSale = memo(function ResultRowSale({ s, selected = false, onView, onEdit, onExport }) {
  return (
    <Row selected={selected}>
      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">S</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Order #{s.id} • {s.customer_name || '—'}</div>
        <div className="text-xs text-gray-500 truncate">{new Date(s.sale_date).toLocaleString()} • Total {s.total_amount ?? '—'} • Profit {s.profit ?? '—'}</div>
      </div>
      <Actions onView={onView} onEdit={onEdit} onExport={onExport} />
    </Row>
  )
})

export const ResultRowPurchase = memo(function ResultRowPurchase({ p, selected = false, onView, onEdit, onExport }) {
  return (
    <Row selected={selected}>
      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-bold">P</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">PO #{p.id} • Supplier #{p.supplier_id}</div>
        <div className="text-xs text-gray-500 truncate">{new Date(p.purchase_date).toLocaleString()} • Items {p.items_count ?? '—'} • Total {p.total_amount ?? '—'}</div>
      </div>
      <Actions onView={onView} onEdit={onEdit} onExport={onExport} />
    </Row>
  )
})

export const ResultRowMovement = memo(function ResultRowMovement({ m, selected = false, onView }) {
  return (
    <Row selected={selected}>
      <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-xs font-bold">M</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{(m.type || '').toUpperCase()} • {m.product?.name || '—'}</div>
        <div className="text-xs text-gray-500 truncate">Qty {m.quantity} • {m.reason || '—'} • {new Date(m.movement_date).toLocaleString()}</div>
      </div>
      <Actions onView={onView} />
    </Row>
  )
})

export const ResultRowSupplier = memo(function ResultRowSupplier({ s, selected = false, onView }) {
  return (
    <Row selected={selected}>
      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">SU</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{s.name}</div>
        <div className="text-xs text-gray-500 truncate">{s.email || '—'} • {s.phone || ''}</div>
      </div>
      <Actions onView={onView} />
    </Row>
  )
})

export const ResultRowCustomer = memo(function ResultRowCustomer({ c, selected = false, onView }) {
  const last = c.last_sale_date || c.last
  return (
    <Row selected={selected}>
      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center text-xs font-bold">C</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.customer_name || c.name}</div>
        <div className="text-xs text-gray-500 truncate">Last {last ? new Date(last).toLocaleDateString() : '—'}</div>
      </div>
      <Actions onView={onView} />
    </Row>
  )
})

export const ResultRowReason = memo(function ResultRowReason({ r, selected = false, onView }) {
  return (
    <Row selected={selected}>
      <div className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-700 flex items-center justify-center text-xs font-bold">R</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.reason}</div>
        <div className="text-xs text-gray-500 truncate">Occurrences {r.cnt ?? '—'}</div>
      </div>
      <Actions onView={onView} />
    </Row>
  )
})
