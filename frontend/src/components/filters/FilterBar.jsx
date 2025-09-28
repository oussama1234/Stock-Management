import React, { memo } from "react";

/**
 * FilterBar
 * Generic container for tab filters. Children render individual controls.
 * Uses React.memo to prevent unnecessary re-renders.
 */
const FilterBar = memo(function FilterBar({ children }) {
  return (
    <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200 flex flex-wrap gap-2 items-center">
      {children}
    </div>
  );
});

export default FilterBar;
