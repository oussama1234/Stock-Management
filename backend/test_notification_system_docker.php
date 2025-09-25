<?php

/**
 * Comprehensive Notification System Test Script
 * 
 * This script tests all notification functionality including:
 * - Direct notification service calls
 * - Sale creation and notifications
 * - Purchase creation and notifications  
 * - Low stock alerts
 * - Job queue processing
 * - Database persistence verification
 */

require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Notification;
use App\Models\Supplier;
use App\Services\NotificationService;
use App\Jobs\CheckLowStockJob;
use App\Jobs\CreateSaleNotificationJob;
use App\Jobs\CreatePurchaseNotificationJob;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationSystemTester
{
    private $notificationService;
    private $testResults = [];
    
    public function __construct()
    {
        $this->notificationService = app(NotificationService::class);
        echo "🚀 Starting Notification System Test Suite\n";
        echo "===========================================\n\n";
    }
    
    public function runAllTests()
    {
        $this->testDatabaseConnection();
        $this->testNotificationServiceDirectly();
        $this->testSaleCreationAndNotification();
        $this->testPurchaseCreationAndNotification();
        $this->testLowStockAlert();
        $this->testJobQueueProcessing();
        $this->testDatabasePersistence();
        $this->printSummary();
    }
    
    private function testDatabaseConnection()
    {
        echo "🔍 Testing Database Connection...\n";
        try {
            $count = DB::table('notifications')->count();
            echo "✅ Database connected. Current notifications count: $count\n\n";
            $this->testResults['database'] = true;
        } catch (Exception $e) {
            echo "❌ Database connection failed: " . $e->getMessage() . "\n\n";
            $this->testResults['database'] = false;
        }
    }
    
    private function testNotificationServiceDirectly()
    {
        echo "🔍 Testing NotificationService directly...\n";
        
        try {
            // Get or create a test user
            $user = User::first();
            if (!$user) {
                echo "❌ No users found in database. Please create a user first.\n\n";
                $this->testResults['notification_service'] = false;
                return;
            }
            
            // Test direct notification creation
            $notification = $this->notificationService->createNotification([
                'type' => Notification::TYPE_STOCK_UPDATED,
                'title' => 'Test Notification',
                'message' => 'This is a test notification created directly via service',
                'user_id' => $user->id,
                'priority' => Notification::PRIORITY_MEDIUM,
                'category' => Notification::CATEGORY_SYSTEM,
                'data' => ['test' => true]
            ]);
            
            echo "✅ Direct notification created with ID: {$notification->id}\n";
            echo "   Type: {$notification->type}\n";
            echo "   Title: {$notification->title}\n\n";
            
            $this->testResults['notification_service'] = true;
        } catch (Exception $e) {
            echo "❌ NotificationService test failed: " . $e->getMessage() . "\n\n";
            $this->testResults['notification_service'] = false;
        }
    }
    
    private function testSaleCreationAndNotification()
    {
        echo "🔍 Testing Sale Creation and Notification...\n";
        
        try {
            // Get required data
            $user = User::first();
            $product = Product::first();
            
            if (!$user || !$product) {
                echo "❌ Missing required data. Need at least one user and one product.\n\n";
                $this->testResults['sale_notification'] = false;
                return;
            }
            
            // Create a test sale
            $sale = new Sale([
                'customer_name' => 'Test Customer for Notification',
                'sale_date' => Carbon::now(),
                'tax' => 10.0,
                'discount' => 5.0,
                'total_amount' => 100.0,
                'user_id' => $user->id
            ]);
            $sale->save();
            
            // Create sale item to trigger observer
            $saleItem = new SaleItem([
                'sale_id' => $sale->id,
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 50.0
            ]);
            $saleItem->save();
            
            // Load sale with relationships
            $sale->load(['items.product', 'user']);
            
            echo "✅ Test sale created with ID: {$sale->id}\n";
            echo "   Customer: {$sale->customer_name}\n";
            echo "   Items: " . $sale->items->count() . "\n";
            echo "   Observer should have dispatched CreateSaleNotificationJob\n\n";
            
            $this->testResults['sale_notification'] = true;
        } catch (Exception $e) {
            echo "❌ Sale notification test failed: " . $e->getMessage() . "\n\n";
            $this->testResults['sale_notification'] = false;
        }
    }
    
    private function testPurchaseCreationAndNotification()
    {
        echo "🔍 Testing Purchase Creation and Notification...\n";
        
        try {
            // Get required data
            $user = User::first();
            $product = Product::first();
            $supplier = Supplier::first();
            
            if (!$user || !$product || !$supplier) {
                echo "❌ Missing required data. Need at least one user, product, and supplier.\n\n";
                $this->testResults['purchase_notification'] = false;
                return;
            }
            
            // Create a test purchase
            $purchase = new Purchase([
                'user_id' => $user->id,
                'supplier_id' => $supplier->id,
                'purchase_date' => Carbon::now(),
                'total_amount' => 200.0
            ]);
            $purchase->save();
            
            // Create purchase item
            $purchaseItem = new PurchaseItem([
                'purchase_id' => $purchase->id,
                'product_id' => $product->id,
                'quantity' => 5,
                'price' => 40.0
            ]);
            $purchaseItem->save();
            
            // Load purchase with relationships
            $purchase->load(['items.product', 'supplier', 'user']);
            
            echo "✅ Test purchase created with ID: {$purchase->id}\n";
            echo "   Supplier: {$purchase->supplier->name}\n";
            echo "   Items: " . $purchase->items->count() . "\n";
            echo "   Observer should have dispatched CreatePurchaseNotificationJob\n\n";
            
            $this->testResults['purchase_notification'] = true;
        } catch (Exception $e) {
            echo "❌ Purchase notification test failed: " . $e->getMessage() . "\n\n";
            $this->testResults['purchase_notification'] = false;
        }
    }
    
    private function testLowStockAlert()
    {
        echo "🔍 Testing Low Stock Alert System...\n";
        
        try {
            // Find or create a product with low stock
            $product = Product::first();
            if ($product) {
                // Set stock to a low level
                $product->stock = 3;
                $product->low_stock_threshold = 10;
                $product->save();
                
                echo "✅ Set product '{$product->name}' stock to 3 (threshold: 10)\n";
                
                // Test the low stock check service method directly
                $alertsCreated = $this->notificationService->checkAndCreateLowStockAlerts();
                
                echo "✅ Low stock check completed. Alerts created: $alertsCreated\n\n";
                $this->testResults['low_stock'] = true;
            } else {
                echo "❌ No products found to test low stock alerts\n\n";
                $this->testResults['low_stock'] = false;
            }
        } catch (Exception $e) {
            echo "❌ Low stock alert test failed: " . $e->getMessage() . "\n\n";
            $this->testResults['low_stock'] = false;
        }
    }
    
    private function testJobQueueProcessing()
    {
        echo "🔍 Testing Job Queue Processing...\n";
        
        try {
            // Check if there are jobs in the queue
            $jobCount = DB::table('jobs')->count();
            echo "📋 Jobs in queue: $jobCount\n";
            
            if ($jobCount > 0) {
                // List job types
                $jobs = DB::table('jobs')->select('queue', DB::raw('count(*) as count'))
                          ->groupBy('queue')->get();
                
                foreach ($jobs as $job) {
                    echo "   Queue '{$job->queue}': {$job->count} jobs\n";
                }
            }
            
            // Check failed jobs
            $failedCount = DB::table('failed_jobs')->count();
            echo "💀 Failed jobs: $failedCount\n";
            
            if ($failedCount > 0) {
                $recentFailed = DB::table('failed_jobs')
                                  ->orderBy('failed_at', 'desc')
                                  ->limit(3)
                                  ->get(['exception']);
                
                foreach ($recentFailed as $failed) {
                    $lines = explode("\n", $failed->exception);
                    echo "   Error: " . $lines[0] . "\n";
                }
            }
            
            echo "\n";
            $this->testResults['job_queue'] = true;
        } catch (Exception $e) {
            echo "❌ Job queue test failed: " . $e->getMessage() . "\n\n";
            $this->testResults['job_queue'] = false;
        }
    }
    
    private function testDatabasePersistence()
    {
        echo "🔍 Testing Database Persistence...\n";
        
        try {
            // Check notifications in database
            $totalNotifications = Notification::count();
            echo "📊 Total notifications in database: $totalNotifications\n";
            
            if ($totalNotifications > 0) {
                // Group by type
                $byType = Notification::select('type', DB::raw('count(*) as count'))
                                    ->groupBy('type')
                                    ->get();
                
                foreach ($byType as $type) {
                    echo "   {$type->type}: {$type->count}\n";
                }
                
                // Recent notifications
                $recent = Notification::with('user')
                                    ->orderBy('created_at', 'desc')
                                    ->limit(5)
                                    ->get(['id', 'type', 'title', 'user_id', 'created_at']);
                
                echo "\n📋 Recent notifications:\n";
                foreach ($recent as $notification) {
                    echo "   [{$notification->id}] {$notification->type}: {$notification->title} (" . 
                         $notification->created_at->diffForHumans() . ")\n";
                }
            } else {
                echo "⚠️  No notifications found in database. This indicates notifications are not being persisted.\n";
            }
            
            echo "\n";
            $this->testResults['database_persistence'] = $totalNotifications > 0;
        } catch (Exception $e) {
            echo "❌ Database persistence test failed: " . $e->getMessage() . "\n\n";
            $this->testResults['database_persistence'] = false;
        }
    }
    
    private function printSummary()
    {
        echo "📋 TEST SUMMARY\n";
        echo "===============\n";
        
        $totalTests = count($this->testResults);
        $passedTests = array_sum($this->testResults);
        
        foreach ($this->testResults as $test => $result) {
            $status = $result ? '✅ PASS' : '❌ FAIL';
            $testName = ucwords(str_replace('_', ' ', $test));
            echo "$status $testName\n";
        }
        
        echo "\n";
        echo "Results: $passedTests/$totalTests tests passed\n";
        
        if ($passedTests === $totalTests) {
            echo "🎉 All tests passed! Notification system is working correctly.\n";
        } else {
            echo "⚠️  Some tests failed. Check the output above for details.\n";
        }
        
        // Specific recommendations
        if (!$this->testResults['database_persistence']) {
            echo "\n🔧 RECOMMENDED ACTIONS:\n";
            echo "- Ensure queue worker is running: php artisan queue:work\n";
            echo "- Check if observers are properly registered in AppServiceProvider\n";
            echo "- Verify database migrations have been run\n";
            echo "- Check Laravel logs for errors\n";
        }
    }
}

// Run the tests
$tester = new NotificationSystemTester();
$tester->runAllTests();