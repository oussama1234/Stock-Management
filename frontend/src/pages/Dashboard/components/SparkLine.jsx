// src/pages/Dashboard/components/SparkLine.jsx
// Stateless sparkline SVG component. Accepts precomputed numeric values.
// Uses memo to avoid recalculating on identical data.

import React, { useMemo } from "react";
import { sparkPoints } from "../utils";

const SparkLine = React.memo(function SparkLine({ values = [], width = 240, height = 70, color = "#4f46e5" }) {
  const points = useMemo(() => sparkPoints(values, width, height), [values, width, height]);
  if (!points) return <div style={{ height }} />;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
});

export default SparkLine;
