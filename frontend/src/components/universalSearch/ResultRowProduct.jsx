import React, { memo } from 'react'
import { Eye, Pencil, Download } from 'lucide-react'

const toneClasses = {
  red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  gray: 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300',
}
const Badge = ({ label, tone = 'gray' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${toneClasses[tone]} ${tone==='red'||tone==='amber' ? 'animate-pulse' : ''}`}>{label}</span>
)

const ActionIcon = ({ children, onClick }) => (
  <button onClick={onClick} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
    {children}
  </button>
)

const ResultRowProduct = memo(function ResultRowProduct({ p, selected = false, onView, onEdit, onExport }) {
  const reserved = typeof p.reserved === 'number' ? p.reserved : 0
  const available = typeof p.available === 'number' ? p.available : Math.max(0, (p.stock ?? 0) - reserved)
  let tone = 'gray'
  if (available <= 0) tone = 'red'
  else if (available <= (p.low_stock_threshold ?? 5)) tone = 'amber'
  else tone = 'green'

  return (
    <div className={`group flex items-center gap-3 px-2 py-2 rounded-xl ${selected ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'} transition-all`}>
      {p.image ? <img src={p.image} alt="" className="w-9 h-9 rounded object-cover" /> : <div className="w-9 h-9 rounded bg-gray-100 dark:bg-gray-700" />}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</div>
        <div className="text-xs text-gray-500 truncate">
          SKU {p.sku || '—'} • Stock {available}/{p.stock ?? '—'} • Reserved {reserved}
        </div>
      </div>
      <Badge label={available <= 0 ? 'Out' : available <= (p.low_stock_threshold ?? 5) ? 'Low' : 'In'} tone={tone} />
      <div className="flex items-center gap-1">
        <ActionIcon onClick={onView}><Eye className="h-4 w-4" /></ActionIcon>
        <ActionIcon onClick={onEdit}><Pencil className="h-4 w-4" /></ActionIcon>
        <ActionIcon onClick={onExport}><Download className="h-4 w-4" /></ActionIcon>
      </div>
    </div>
  )
})

export default ResultRowProduct
