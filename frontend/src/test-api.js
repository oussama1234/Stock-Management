// Test script to manually call the notifications API

const BASE_URL = 'http://localhost:8000';

// You'll need to replace this with a valid token from your browser's local storage
const TOKEN = 'your-token-here'; // Get this from browser localStorage

async function testNotificationsAPI() {
  try {
    console.log('Testing notifications API...');
    
    const response = await fetch(`${BASE_URL}/api/notifications?page=1&per_page=10`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.success && data.meta) {
      console.log('Pagination Meta:', {
        currentPage: data.meta.current_page,
        lastPage: data.meta.last_page,
        total: data.meta.total,
        perPage: data.meta.per_page,
        hasMore: data.meta.current_page < data.meta.last_page
      });
    }
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

// Run the test if running directly
if (typeof window !== 'undefined') {
  // Running in browser
  testNotificationsAPI();
} else {
  // Export for use in other files
  module.exports = { testNotificationsAPI };
}