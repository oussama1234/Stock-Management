// src/pages/Search/UniversalSearchPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { searchAll } from '@/api/Search';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, ShoppingBag, Users, TrendingUp, Truck, 
  Search as SearchIcon, ListChecks, User as UserIcon, Tag, Boxes
} from 'lucide-react';
import ContentSpinner from '@/components/Spinners/ContentSpinner';
import SectionHeader from '@/components/universalSearch/SectionHeader';
import ResultRowProduct from '@/components/universalSearch/ResultRowProduct';
import { ResultRowSale, ResultRowPurchase, ResultRowMovement, ResultRowSupplier, ResultRowCustomer, ResultRowReason } from '@/components/universalSearch/ResultRows';
import SkeletonLoader from '@/components/universalSearch/SkeletonLoader';
import VirtualList from '@/components/universalSearch/VirtualList';
import { useCategoriesQuery } from '@/GraphQL/Categories/Queries/Categories';

// --- UI helpers (badges, avatar, progress, formatters) ---
const money = (n) => (typeof n === 'number' ? n.toLocaleString() : '—')
const dateFmt = (d) => (d ? new Date(d).toLocaleString() : '—')

const Pill = ({ children, color = 'gray' }) => {
  const map = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${map[color] || map.gray}`}>{children}</span>
}

const Avatar = ({ name = 'U', src, color = 'indigo' }) => {
  const bgMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30',
    blue: 'bg-blue-50 dark:bg-blue-900/30',
    violet: 'bg-violet-50 dark:bg-violet-900/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/30',
    gray: 'bg-gray-100 dark:bg-gray-800',
  };
  const textMap = {
    indigo: 'text-indigo-700 dark:text-indigo-300',
    blue: 'text-blue-700 dark:text-blue-300',
    violet: 'text-violet-700 dark:text-violet-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
    amber: 'text-amber-700 dark:text-amber-300',
    gray: 'text-gray-700 dark:text-gray-300',
  };
  const bgCls = bgMap[color] || bgMap.indigo;
  const textCls = textMap[color] || textMap.indigo;
  return (
    <div className={`relative h-10 w-10 rounded-xl overflow-hidden ${bgCls} flex items-center justify-center`}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className={`${textCls} text-sm font-bold`}>{(name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</span>
      )}
    </div>
  );
}

const StockProgress = ({ available = 0, stock = 0 }) => {
  const pct = stock > 0 ? Math.min(100, Math.round((available / stock) * 100)) : 0
  const tone = available <= 0 ? 'bg-rose-500' : available <= Math.max(5, Math.round(stock*0.15)) ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="w-full">
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-1.5 ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-gray-500">{available}/{stock} available</div>
    </div>
  )
}

// Richer, animated rows for each entity
const ProductRow = ({ p }) => (
  <motion.div whileHover={{ y: -2, scale: 1.01 }} className="group p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3 shadow-sm">
    {p.image ? (<img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />) : (<div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800" />)}
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <div className="font-semibold truncate text-gray-900 dark:text-gray-100">{p.name}</div>
        <Pill color="indigo">{p.category || '—'}</Pill>
        {typeof p.price === 'number' && <Pill color="emerald">{money(p.price)}</Pill>}
      </div>
      <div className="mt-1 flex items-center gap-2 text-[12px] text-gray-500">
        <span>Reserved {p.reserved ?? 0}</span>
        <span>•</span>
        <span>Stock {p.stock ?? 0}</span>
      </div>
      <div className="mt-2"><StockProgress available={p.available ?? 0} stock={p.stock ?? 0} /></div>
    </div>
    <Link to={`/dashboard/products/${p.id}`} className="text-xs px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Open</Link>
  </motion.div>
)

const SaleRow = ({ s }) => (
  <motion.div whileHover={{ y: -2, scale: 1.01 }} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <div className="flex items-center justify-between">
      <div className="font-semibold">Order #{s.id} • {s.customer_name || '—'}</div>
      <Pill color="rose">{money(s.total_amount)}</Pill>
    </div>
    <div className="text-xs text-gray-500 mt-1">{dateFmt(s.sale_date)}</div>
  </motion.div>
)

const PurchaseRow = ({ p }) => (
  <motion.div whileHover={{ y: -2, scale: 1.01 }} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <div className="flex items-center justify-between">
      <div className="font-semibold">PO #{p.id} • Supplier #{p.supplier_id}</div>
      <Pill color="amber">{money(p.total_amount)}</Pill>
    </div>
    <div className="text-xs text-gray-500 mt-1">{dateFmt(p.purchase_date)}</div>
  </motion.div>
)

const MovementRow = ({ m }) => {
  const typeTone = (m.type || '').toLowerCase() === 'in' ? 'emerald' : 'rose'
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Pill color={typeTone}>{(m.type || '').toUpperCase() || '—'}</Pill>
        <div className="font-medium truncate">{m.product?.name || '—'}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">Qty {m.quantity} • {m.reason || '—'} • {dateFmt(m.movement_date)}</div>
    </motion.div>
  )
}

const SupplierRow = ({ s }) => (
  <motion.div whileHover={{ y: -2, scale: 1.01 }} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3">
    <Avatar name={s.name} color="violet" />
    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium truncate">{s.name}</div>
      <div className="text-xs text-gray-500 truncate">{s.email || '—'} • {s.phone || ''}</div>
    </div>
  </motion.div>
)

const UserRow = ({ u }) => (
  <motion.div whileHover={{ y: -2, scale: 1.01 }} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3">
    <Avatar name={u.name} src={u.profileImage} color="blue" />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium truncate">{u.name}</div>
        <Pill color="indigo">{u.role || 'Member'}</Pill>
      </div>
      <div className="text-xs text-gray-500 truncate">{u.email}</div>
    </div>
  </motion.div>
)

const CustomerRow = ({ c }) => (
  <motion.div whileHover={{ y: -2, scale: 1.01 }} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <div className="text-sm font-medium">{c.customer_name}</div>
    <div className="text-xs text-gray-500">Last {dateFmt(c.last_sale_date)}</div>
  </motion.div>
)

const ReasonRow = ({ r }) => (
  <motion.div whileHover={{ y: -2, scale: 1.01 }} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
    <div className="text-sm font-medium">{r.reason}</div>
    <Pill>{r.cnt}</Pill>
  </motion.div>
)

const CategoryRow = ({ cat }) => (
  <motion.div whileHover={{ y: -2, scale: 1.01 }} className="p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-3">
    <Avatar name={cat.name} color="indigo" />
    <div className="min-w-0 flex-1">
      <div className="text-sm font-medium truncate">{cat.name}</div>
      {cat.description && <div className="text-xs text-gray-500 truncate">{cat.description}</div>}
    </div>
  </motion.div>
)

// (Removed custom section skeletons to use existing ContentSpinner)

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const Card = React.memo(function Card({ children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
    >
      {children}
    </motion.section>
  );
});

function PreviewModal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[9998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
            className="absolute left-1/2 top-24 -translate-x-1/2 w-[92vw] max-w-2xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
              <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800">Close</button>
            </div>
            <div>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function UniversalSearchPage() {
  const qs = useQuery();
  const initial = qs.get('q') || '';
  const [q, setQ] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [preview, setPreview] = useState(null); // {type, data}

  const [loadCategories, categoriesState] = useCategoriesQuery();

  const fetchResults = useCallback(async (term) => {
    if (!term || term.trim().length === 0) { setResults(null); return; }
    try {
      setLoading(true); setError(null);
      const data = await searchAll({ q: term, per_page: 12 });
      setResults(data?.results || null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQ(initial);
    fetchResults(initial);
    // load categories once; filter client-side on q
    loadCategories();
  }, [initial, fetchResults, loadCategories]);

  const categoriesFiltered = useMemo(() => {
    const cats = categoriesState?.data?.categories || [];
    const term = (q || '').toLowerCase();
    if (!term) return cats.slice(0, 8);
    return cats.filter(c => (c?.name || '').toLowerCase().includes(term)).slice(0, 8);
  }, [categoriesState?.data, q]);

  const isAllEmpty = useMemo(() => {
    const g = results || {};
    const keys = Object.keys(g);
    if (keys.length === 0) return true;
    const allEmpty = [
      'products','suppliers','sales','purchases','movements','customers','reasons','users'
    ].every(k => (g[k]?.data || []).length === 0);
    const catsEmpty = (categoriesFiltered || []).length === 0;
    return allEmpty && catsEmpty;
  }, [results, categoriesFiltered]);

  const totals = useMemo(() => {
    const sum = (arr, key) => (arr || []).reduce((a, x) => a + (Number(x?.[key]) || 0), 0);
    const sales = results?.sales?.data || [];
    const purchases = results?.purchases?.data || [];
    return {
      salesAmount: sum(sales, 'total_amount'),
      purchasesAmount: sum(purchases, 'total_amount'),
      productsCount: (results?.products?.data || []).length,
      movementsCount: (results?.movements?.data || []).length,
    };
  }, [results]);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl text-white">
            <SearchIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Universal Search</h1>
            <div className="text-xs text-gray-500">Results for “{q}”</div>
          </div>
        </div>
        {/* KPIs */}
        <div className="hidden md:flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs">Products: {totals.productsCount}</div>
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs">Sales: {totals.salesAmount}</div>
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs">Purchases: {totals.purchasesAmount}</div>
          <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs">Movements: {totals.movementsCount}</div>
        </div>
      </div>

      {/* Body */}
      {loading && !results ? (
        <div className="flex items-center justify-center py-16">
          <ContentSpinner size="medium" theme="analytics" variant="minimal" message={`Searching for "${q}"...`} />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4">{error}</div>
      ) : !results ? (
        <div className="text-gray-500">Type in the navbar search to get started.</div>
      ) : isAllEmpty ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-lg font-semibold mb-2">No results found</div>
          <div className="text-gray-500">We couldn’t find any matches for “{q}”. Try a different search term.</div>
        </div>
      ) : (
        <>
          {loading && results && (
            <div className="mb-2 flex items-center justify-center">
              <ContentSpinner size="small" theme="analytics" variant="minimal" message="Refreshing results..." />
            </div>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Products */}
          <Card>
            <SectionHeader icon={Package} label="Products" count={(results.products?.data || []).length} />
            <div className="mt-2">
              {(results.products?.data?.length || 0) > 60 ? (
                <VirtualList
                  items={(results.products?.data || []).map((p) => ({ key: `p:${p.id}`, p }))}
                  itemHeight={74}
                  height={Math.min(460, Math.max(260, Math.ceil(Math.min((results.products?.data || []).length, 8) * 74)))}
                  renderRow={({ item }) => (
                    <div className="py-0.5">
                      <ProductRow p={item.p} />
                    </div>
                  )}
                />
              ) : (
                <div className="space-y-1">
                  {(results.products?.data || []).map((p) => (
                    <ProductRow key={`p-${p.id}`} p={p} />
                  ))}
                </div>
              )}
              {(results.products?.data || []).length === 0 && <div className="text-gray-500 text-sm">No products</div>}
            </div>
          </Card>

          {/* Sales */}
          <Card>
            <SectionHeader icon={TrendingUp} label="Sales" count={(results.sales?.data || []).length} />
            <div className="mt-2 space-y-1">
              {(results.sales?.data || []).map((s) => (
                <SaleRow key={`s-${s.id}`} s={s} />
              ))}
              {(results.sales?.data || []).length === 0 && <div className="text-gray-500 text-sm">No sales</div>}
            </div>
          </Card>

          {/* Purchases */}
          <Card>
            <SectionHeader icon={ShoppingBag} label="Purchases" count={(results.purchases?.data || []).length} />
            <div className="mt-2 space-y-1">
              {(results.purchases?.data || []).map((p) => (
                <PurchaseRow key={`pu-${p.id}`} p={p} />
              ))}
              {(results.purchases?.data || []).length === 0 && <div className="text-gray-500 text-sm">No purchases</div>}
            </div>
          </Card>

          {/* Movements */}
          <Card>
            <SectionHeader icon={ListChecks} label="Stock Movements" count={(results.movements?.data || []).length} />
            <div className="mt-2 space-y-1">
              {(results.movements?.data || []).map((m) => (
                <MovementRow key={`m-${m.id}`} m={m} />
              ))}
              {(results.movements?.data || []).length === 0 && <div className="text-gray-500 text-sm">No movements</div>}
            </div>
          </Card>

          {/* Suppliers */}
          <Card>
            <SectionHeader icon={Truck} label="Suppliers" count={(results.suppliers?.data || []).length} />
            <div className="mt-2 space-y-1">
              {(results.suppliers?.data || []).map((s) => (
                <SupplierRow key={`sup-${s.id}`} s={s} />
              ))}
              {(results.suppliers?.data || []).length === 0 && <div className="text-gray-500 text-sm">No suppliers</div>}
            </div>
          </Card>

          {/* Users */}
          <Card>
            <SectionHeader icon={UserIcon} label="Users" count={(results.users?.data || []).length} />
            <div className="mt-2 space-y-1">
              {(results.users?.data || []).map((u) => (
                <UserRow key={`u-${u.id}`} u={u} />
              ))}
              {(results.users?.data || []).length === 0 && <div className="text-gray-500 text-sm">No users</div>}
            </div>
          </Card>

          {/* Customers & Reasons */}
          <Card>
            <SectionHeader icon={Users} label="Customers & Reasons" count={(results.customers?.data || []).length + (results.reasons?.data || []).length} />
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2">Customers</div>
                <div className="space-y-1">
                  {(results.customers?.data || []).map((c, idx) => (
                    <CustomerRow key={`c-${idx}`} c={c} />
                  ))}
                  {(results.customers?.data || []).length === 0 && <div className="text-gray-500 text-sm">No customers</div>}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2">Reasons</div>
                <div className="space-y-1">
                  {(results.reasons?.data || []).map((r, idx) => (
                    <ReasonRow key={`r-${idx}`} r={r} />
                  ))}
                  {(results.reasons?.data || []).length === 0 && <div className="text-gray-500 text-sm">No reasons</div>}
                </div>
              </div>
            </div>
          </Card>

          {/* Categories (GraphQL) */}
          <Card>
            <SectionHeader icon={Boxes} label="Categories" count={(categoriesFiltered || []).length} />
            <div className="mt-2 space-y-1">
              {categoriesState.loading ? (
                <SkeletonLoader rows={4} />
              ) : (
                (categoriesFiltered || []).map((cat) => (
                  <CategoryRow key={`cat-${cat.id}`} cat={cat} />
                ))
              )}
              {(categoriesFiltered || []).length === 0 && !categoriesState.loading && <div className="text-gray-500 text-sm">No categories</div>}
            </div>
          </Card>
        </div>
        </>
      )}

      {/* Quick Preview Modal */}
      <PreviewModal open={!!preview} onClose={() => setPreview(null)} title={preview?.type === 'product' ? 'Product Preview' : preview?.type === 'user' ? 'User Preview' : 'Preview'}>
        {preview?.type === 'product' && preview?.data && (
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{preview.data.name}</div>
            <div className="text-gray-500">Category: {preview.data.category || '—'}</div>
            <div className="text-gray-500">Stock: {preview.data.available}/{preview.data.stock}</div>
            <div className="pt-2">
              <Link to={`/dashboard/products/${preview.data.id}`} className="text-xs px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Open product</Link>
            </div>
          </div>
        )}
        {preview?.type === 'user' && preview?.data && (
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{preview.data.name}</div>
            <div className="text-gray-500">{preview.data.email}</div>
            <div className="text-gray-500">Role: {preview.data.role || 'Member'}</div>
            <div className="pt-2">
              <Link to="/dashboard/users" className="text-xs px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Manage user</Link>
            </div>
          </div>
        )}
      </PreviewModal>
    </div>
  );
}
