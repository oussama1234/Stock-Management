import React, { memo, useCallback } from "react";

/**
 * Pagination component
 * - Renders Prev/Next and page numbers
 * - Minimizes re-renders via React.memo and stable handlers
 */
const Pagination = memo(function Pagination({
  meta,
  onPageChange,
}) {
  const { current_page = 1, last_page = 1 } = meta || {};

  const goto = useCallback((p) => {
    if (p >= 1 && p <= last_page && p !== current_page) onPageChange?.(p);
  }, [current_page, last_page, onPageChange]);

  const pages = (() => {
    const cur = current_page;
    const last = last_page;
    const max = 7;
    const arr = [];
    const add = (x) => arr.push(x);
    if (last <= max) {
      for (let i = 1; i <= last; i++) add(i);
    } else {
      add(1);
      let start = Math.max(2, cur - 2);
      let end = Math.min(last - 1, cur + 2);
      while (end - start + 1 < 5) {
        if (start > 2) start--; else if (end < last - 1) end++; else break;
      }
      if (start > 2) add('…');
      for (let i = start; i <= end; i++) add(i);
      if (end < last - 1) add('…');
      add(last);
    }
    return arr;
  })();

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div>
        Page {current_page} of {last_page}
      </div>
      <div className="flex items-center gap-1">
        <button
          className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50"
          onClick={() => goto(current_page - 1)}
          disabled={current_page <= 1}
        >
          Prev
        </button>
        {pages.map((p, idx) => (
          typeof p === 'number' ? (
            <button
              key={`p-${p}`}
              className={`px-3 py-1.5 rounded-xl border text-sm ${p === current_page ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              onClick={() => goto(p)}
            >
              {p}
            </button>
          ) : (
            <span key={`e-${idx}`} className="px-2 text-gray-400 select-none">{p}</span>
          )
        ))}
        <button
          className="px-3 py-1.5 rounded-xl border bg-white hover:bg-gray-50"
          onClick={() => goto(current_page + 1)}
          disabled={current_page >= last_page}
        >
          Next
        </button>
      </div>
    </div>
  );
});

export default Pagination;
