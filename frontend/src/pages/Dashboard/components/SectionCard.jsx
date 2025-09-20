// src/pages/Dashboard/components/SectionCard.jsx
// Generic section container with title and optional icon
// Keeps styling consistent and reduces duplication.

import React from "react";

const SectionCard = React.memo(function SectionCard({ title, Icon, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-5 w-5 text-indigo-600" /> : null}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {subtitle ? <div className="text-sm text-gray-500">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
});

export default SectionCard;
