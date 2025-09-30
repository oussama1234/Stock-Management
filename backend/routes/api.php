<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HealthController;

// Health check endpoint (public - no authentication required)
//:Route::get('/health', [HealthController::class, 'check']);
Route::get('/health', function() {
    return response()->json(['status' => 'OK']);
});

// list of all the protected routes for authenticating users api
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/profile/update', [UserController::class, 'updateProfile']);
    Route::apiResource('users', UserController::class)->only(['index','destroy','store']);
    Route::post(('/users/update/{id}'), [UserController::class, 'update']);
    
    // User Preferences
    Route::get('/preferences', [\App\Http\Controllers\PreferencesController::class, 'show']);
    Route::put('/preferences', [\App\Http\Controllers\PreferencesController::class, 'update']);
    Route::post('/preferences/reset', [\App\Http\Controllers\PreferencesController::class, 'reset']);
    Route::get('/preferences/all', [\App\Http\Controllers\PreferencesController::class, 'index']); // Admin only
    Route::get('/preferences/theme-stats', [\App\Http\Controllers\PreferencesController::class, 'themeStats']); // Admin only

    // Dashboard analytics
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);
    Route::get('/dashboard/sales/overview', [DashboardController::class, 'salesOverview']);
    Route::get('/dashboard/sales/trends', [DashboardController::class, 'salesTrends']);
    Route::get('/dashboard/low-stock-alerts', [DashboardController::class, 'lowStockAlerts']);

    // Sales endpoints (paginated, filtered) with caching - kept for analytics only
    Route::get('/sales', [\App\Http\Controllers\SaleController::class, 'index']);
    Route::get('/sales/export', [\App\Http\Controllers\SaleController::class, 'export']);
    Route::get('/sales/{id}', [\App\Http\Controllers\SaleController::class, 'show']);
    Route::delete('/sales/{id}', [\App\Http\Controllers\SaleController::class, 'destroy']);
    Route::post('/sales', [\App\Http\Controllers\SaleController::class, 'store']);
    Route::put('/sales/{id}', [\App\Http\Controllers\SaleController::class, 'update']);  

    // Products endpoints for sales dropdown
    Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
    Route::get('/products/{id}', [\App\Http\Controllers\ProductController::class, 'show']);
    Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store']);
    Route::put('/products/{id}', [\App\Http\Controllers\ProductController::class, 'update']);
    Route::delete('/products/{id}', [\App\Http\Controllers\ProductController::class, 'destroy']);

    // Sales analytics endpoints
    Route::get('/sales/analytics/overview', [\App\Http\Controllers\SalesAnalyticsController::class, 'overview']);
    Route::get('/sales/analytics/trends', [\App\Http\Controllers\SalesAnalyticsController::class, 'trends']);
    Route::get('/sales/analytics/top-products', [\App\Http\Controllers\SalesAnalyticsController::class, 'topProducts']);
    Route::get('/sales/analytics/customers', [\App\Http\Controllers\SalesAnalyticsController::class, 'customers']);
    Route::get('/sales/analytics/categories', [\App\Http\Controllers\SalesAnalyticsController::class, 'categories']);
    Route::get('/sales/analytics/sales-people', [\App\Http\Controllers\SalesAnalyticsController::class, 'salesPeople']);
    Route::get('/sales/analytics/low-stock-alerts', [\App\Http\Controllers\SalesAnalyticsController::class, 'lowStockAlerts']);

    // Purchases endpoints (paginated, filtered) with caching
    Route::get('/purchases', [\App\Http\Controllers\PurchaseController::class, 'index']);
    Route::get('/purchases/export', [\App\Http\Controllers\PurchaseController::class, 'export']);
    Route::get('/purchases/{id}', [\App\Http\Controllers\PurchaseController::class, 'show']);
    Route::delete('/purchases/{id}', [\App\Http\Controllers\PurchaseController::class, 'destroy']);
    Route::post('/purchases', [\App\Http\Controllers\PurchaseController::class, 'store']);
    Route::put('/purchases/{id}', [\App\Http\Controllers\PurchaseController::class, 'update']);
    Route::get('/purchases/product/{productId}', [\App\Http\Controllers\PurchaseController::class, 'getByProduct']);

    // Suppliers endpoints for purchases dropdown
    Route::get('/suppliers', [\App\Http\Controllers\SupplierController::class, 'index']);
    Route::get('/suppliers/{id}', [\App\Http\Controllers\SupplierController::class, 'show']);
    Route::post('/suppliers', [\App\Http\Controllers\SupplierController::class, 'store']);
    Route::put('/suppliers/{id}', [\App\Http\Controllers\SupplierController::class, 'update']);
    Route::delete('/suppliers/{id}', [\App\Http\Controllers\SupplierController::class, 'destroy']);

    // Purchases analytics endpoints
    Route::get('/purchases/analytics/overview', [\App\Http\Controllers\PurchasesAnalyticsController::class, 'overview']);
    Route::get('/purchases/analytics/trends', [\App\Http\Controllers\PurchasesAnalyticsController::class, 'trends']);
    Route::get('/purchases/analytics/top-products', [\App\Http\Controllers\PurchasesAnalyticsController::class, 'topProducts']);
    Route::get('/purchases/analytics/suppliers', [\App\Http\Controllers\PurchasesAnalyticsController::class, 'suppliers']);
    Route::get('/purchases/analytics/categories', [\App\Http\Controllers\PurchasesAnalyticsController::class, 'categories']);
    Route::get('/purchases/analytics/purchasing-team', [\App\Http\Controllers\PurchasesAnalyticsController::class, 'purchasingTeam']);
    Route::get('/purchases/analytics/cost-analysis', [\App\Http\Controllers\PurchasesAnalyticsController::class, 'costAnalysis']);

    // Stock validation endpoints
    Route::prefix('stock-validation')->group(function () {
        Route::post('/validate-product', [\App\Http\Controllers\StockValidationController::class, 'validateProductStock']);
        Route::post('/validate-multiple', [\App\Http\Controllers\StockValidationController::class, 'validateMultipleProductsStock']);
        Route::post('/stock-levels', [\App\Http\Controllers\StockValidationController::class, 'getStockLevels']);
        Route::get('/product/{productId}/stock-info', [\App\Http\Controllers\StockValidationController::class, 'getProductStockInfo']);
    });

    // Notification endpoints - Clean and organized routes
    Route::prefix('notifications')->group(function () {
        // Main notification CRUD operations
        Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']); // Get user notifications with pagination
        Route::get('/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount']); // Get unread count
        Route::get('/low-stock', [\App\Http\Controllers\NotificationController::class, 'lowStock']); // Get low stock notifications
        Route::get('/stats', [\App\Http\Controllers\NotificationController::class, 'stats']); // Admin: Get statistics
        Route::get('/{id}', [\App\Http\Controllers\NotificationController::class, 'show']); // Get specific notification
        
        // Notification actions
        Route::patch('/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']); // Mark as read
        Route::patch('/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']); // Mark all as read
        
        // Admin operations
        Route::post('/', [\App\Http\Controllers\NotificationController::class, 'store']); // Create notification (admin)
        Route::delete('/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy']); // Delete notification
    });

    // Reports endpoints
    Route::prefix('reports')->group(function () {
        Route::get('/sales', [\App\Http\Controllers\ReportsController::class, 'sales']);
        Route::get('/purchases', [\App\Http\Controllers\ReportsController::class, 'purchases']);
        Route::get('/stock-movements', [\App\Http\Controllers\ReportsController::class, 'stockMovements']);
        Route::get('/products-sold', [\App\Http\Controllers\ReportsController::class, 'productsSold']);
        Route::get('/products-purchased', [\App\Http\Controllers\ReportsController::class, 'productsPurchased']);
        Route::get('/low-stock', [\App\Http\Controllers\ReportsController::class, 'lowStock']);
    });

    // Inventory endpoints
    Route::prefix('inventory')->group(function () {
        Route::get('/', [\App\Http\Controllers\InventoryController::class, 'overview']);
        Route::post('/adjustments', [\App\Http\Controllers\InventoryController::class, 'adjust']);
        Route::get('/history', [\App\Http\Controllers\InventoryController::class, 'history']);
        Route::get('/history/export', [\App\Http\Controllers\InventoryController::class, 'export']);
        Route::get('/dashboard/kpis', [\App\Http\Controllers\InventoryController::class, 'kpis']);
    });

    // Categories CRUD + Analytics
    Route::prefix('categories')->group(function () {
        Route::get('/', [\App\Http\Controllers\CategoryController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\CategoryController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\CategoryController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\CategoryController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\CategoryController::class, 'destroy']);

        Route::get('/analytics/overview', [\App\Http\Controllers\CategoryController::class, 'analytics']);
        Route::get('/analytics/top-selling', [\App\Http\Controllers\CategoryController::class, 'topSelling']);
        Route::get('/analytics/top-purchased', [\App\Http\Controllers\CategoryController::class, 'topPurchased']);
        Route::get('/analytics/profit-distribution', [\App\Http\Controllers\CategoryController::class, 'profitDistribution']);
        Route::get('/analytics/metrics', [\App\Http\Controllers\CategoryController::class, 'metrics']);
    });

    // Universal Search endpoint
    Route::get('/search', [\App\Http\Controllers\SearchController::class, 'searchAll']);
});

    // Add your protected routes here
    // routes/web.php




require __DIR__.'/auth.php';
