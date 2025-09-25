import React, { useState, useEffect } from 'react';
import { getNotifications } from '../../api/Notifications';
import { useCreateSaleItemMutation } from '../../GraphQL/SaleItem/Mutations/CreateSaleItem';

const NotificationDebugTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const { createSaleItem, loading: saleLoading } = useCreateSaleItemMutation();
  
  const fetchNotificationCount = async () => {
    const response = await getNotifications({ page: 1, per_page: 100 });
    if (response.success) {
      return response.data?.length || 0;
    }
    return 0;
  };

  // Load initial notification count on component mount
  useEffect(() => {
    fetchNotificationCount().then(setNotificationCount);
  }, []);

  const runNotificationTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Step 1: Get current notification count
      const initialCount = await fetchNotificationCount();
      
      setTestResults(prev => [...prev, {
        step: 1,
        message: `Initial notification count: ${initialCount}`,
        status: 'info'
      }]);

      // Step 2: Create a test sale
      const testSaleData = {
        product_id: 1, // Assuming product ID 1 exists
        quantity: 1,
        price: 10.99,
        customer_name: 'Test Customer - Notification Debug',
        tax: 0,
        discount: 0
      };

      setTestResults(prev => [...prev, {
        step: 2,
        message: 'Creating test sale...',
        status: 'info'
      }]);

      const saleResult = await createSaleItem({
        variables: { saleItem: testSaleData }
      });

      if (saleResult.data) {
        setTestResults(prev => [...prev, {
          step: 3,
          message: `Sale created successfully! Sale ID: ${saleResult.data.createSaleByProduct.id}`,
          status: 'success'
        }]);

        // Step 3: Wait for background job processing
        setTestResults(prev => [...prev, {
          step: 4,
          message: 'Waiting 3 seconds for background notification job...',
          status: 'info'
        }]);

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 4: Check if notification was created
        const finalCount = await fetchNotificationCount();
        const newNotifications = finalCount - initialCount;

        if (newNotifications > 0) {
          setTestResults(prev => [...prev, {
            step: 5,
            message: `✅ SUCCESS: ${newNotifications} new notification(s) created!`,
            status: 'success'
          }]);
        } else {
          setTestResults(prev => [...prev, {
            step: 5,
            message: `❌ ISSUE: No new notifications created. This indicates the notification job may not be running.`,
            status: 'error'
          }]);
        }

      } else {
        setTestResults(prev => [...prev, {
          step: 3,
          message: '❌ Failed to create sale',
          status: 'error'
        }]);
      }

    } catch (error) {
      setTestResults(prev => [...prev, {
        step: 'error',
        message: `❌ Test failed: ${error.message}`,
        status: 'error'
      }]);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 shadow-lg rounded-lg p-4 w-96 z-50">
      <h3 className="text-lg font-semibold mb-3">🧪 Notification Debug Test</h3>
      
      <button
        onClick={runNotificationTest}
        disabled={isRunning || saleLoading}
        className={`w-full p-2 rounded text-white font-medium ${
          isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isRunning ? 'Running Test...' : 'Test Notification Creation'}
      </button>

      {testResults.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto">
          <h4 className="font-medium mb-2">Test Results:</h4>
          {testResults.map((result, index) => (
            <div key={index} className={`text-sm p-2 mb-1 rounded ${
              result.status === 'success' ? 'bg-green-100 text-green-800' :
              result.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <strong>Step {result.step}:</strong> {result.message}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        Current notifications: {notificationCount}
      </div>
    </div>
  );
};

export default NotificationDebugTest;