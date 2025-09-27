// src/pages/Admin/Purchases/PurchasesSimple.jsx
// Minimal Purchases component for debugging

import { useState, useEffect } from "react";
import usePurchasesData from "./usePurchasesData";

export default function PurchasesSimple() {
  
  const { data: purchases, loading, error } = usePurchasesData({
    page: 1,
    per_page: 20,
    search: ""
  });

  if (loading) {
    return (
      <div className="p-6">
        <h1>Loading purchases...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1>Error: {error}</h1>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Purchases (Simple)</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <p>Total purchases: {purchases?.length || 0}</p>
        {purchases && purchases.length > 0 && (
          <div className="mt-4">
            <h2 className="font-semibold mb-2">First purchase:</h2>
            <pre className="text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(purchases[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
