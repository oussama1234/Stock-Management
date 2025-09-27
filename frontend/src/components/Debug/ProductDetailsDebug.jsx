// ProductDetailsDebug.jsx - Debug component to monitor all ProductDetails updates
import { useEffect, useState } from 'react';

const ProductDetailsDebug = ({ product, totalSaleValue, totalPurchaseValue, profitValue }) => {
  const [updateHistory, setUpdateHistory] = useState([]);
  const [lastSaleEvent, setLastSaleEvent] = useState(null);

  useEffect(() => {
    // Monitor product changes
    if (product) {
      setUpdateHistory(prev => [...prev.slice(-4), {
        timestamp: new Date().toLocaleTimeString(),
        type: 'PRODUCT_UPDATE',
        data: {
          stock: product.stock,
          totalSalesValue: product.totalSalesValue || totalSaleValue,
          profitValue: product.profitValue || profitValue,
          backendAnalytics: product.totalSalesValue !== undefined
        }
      }]);
    }
  }, [product, totalSaleValue, profitValue]);

  useEffect(() => {
    // Listen for sale events
    const handleSalesUpdate = (event) => {
      setLastSaleEvent({
        timestamp: new Date().toLocaleTimeString(),
        detail: event.detail
      });
      setUpdateHistory(prev => [...prev.slice(-4), {
        timestamp: new Date().toLocaleTimeString(),
        type: 'SALE_EVENT',
        data: event.detail
      }]);
    };

    const handleStockUpdate = (event) => {
      setUpdateHistory(prev => [...prev.slice(-4), {
        timestamp: new Date().toLocaleTimeString(),
        type: 'STOCK_EVENT',
        data: event.detail
      }]);
    };

    window.addEventListener('salesDataUpdated', handleSalesUpdate);
    window.addEventListener('stockHistoryUpdated', handleStockUpdate);

    return () => {
      window.removeEventListener('salesDataUpdated', handleSalesUpdate);
      window.removeEventListener('stockHistoryUpdated', handleStockUpdate);
    };
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 text-sm shadow-lg z-50 max-w-md">
      <div className="font-semibold text-blue-800 mb-3">🔍 ProductDetails Debug</div>
      
      <div className="space-y-2 text-blue-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Stock: {product?.stock}</div>
          <div>Analytics: {product?.totalSalesValue !== undefined ? '✅ Backend' : '⚠️ Frontend'}</div>
          <div>Sales: ${(product?.totalSalesValue || totalSaleValue)?.toFixed(2)}</div>
          <div>Profit: ${(product?.profitValue || profitValue)?.toFixed(2)}</div>
        </div>
        
        {lastSaleEvent && (
          <div className="border-t pt-2">
            <div className="text-xs font-medium">Last Sale Event:</div>
            <div className="text-xs">{lastSaleEvent.timestamp}</div>
            <div className="text-xs">Product: {lastSaleEvent.detail?.productId}</div>
          </div>
        )}
        
        <div className="border-t pt-2">
          <div className="text-xs font-medium mb-1">Update History:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {updateHistory.map((update, index) => (
              <div key={index} className="text-xs bg-white rounded px-2 py-1">
                <div className="flex justify-between">
                  <span className={`font-medium ${
                    update.type === 'SALE_EVENT' ? 'text-green-600' :
                    update.type === 'STOCK_EVENT' ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {update.type}
                  </span>
                  <span className="text-gray-500">{update.timestamp}</span>
                </div>
                {update.type === 'PRODUCT_UPDATE' && (
                  <div className="text-gray-600">
                    Stock: {update.data.stock} | 
                    Sales: ${update.data.totalSalesValue?.toFixed(2)} |
                    {update.data.backendAnalytics ? ' 🎯' : ' 📱'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => setUpdateHistory([])}
          className="mt-2 px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded text-xs w-full"
        >
          Clear History
        </button>
      </div>
    </div>
  );
};

export default ProductDetailsDebug;
