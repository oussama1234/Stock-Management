<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;




// list of all the protected routes for authenticating users api
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/profile/update', [UserController::class, 'updateProfile']);
    Route::apiResource('users', UserController::class)->only(['index','destroy','store']);
    Route::post(('/users/update/{id}'), [UserController::class, 'update']);

    // Dashboard analytics
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);

    // Sales endpoints (paginated, filtered) with caching
    Route::get('/sales', [\App\Http\Controllers\SaleController::class, 'index']);
    Route::get('/sales/export', [\App\Http\Controllers\SaleController::class, 'export']);
    Route::get('/sales/{id}', [\App\Http\Controllers\SaleController::class, 'show']);
    Route::post('/sales', [\App\Http\Controllers\SaleController::class, 'store']);
    Route::put('/sales/{id}', [\App\Http\Controllers\SaleController::class, 'update']);
    Route::delete('/sales/{id}', [\App\Http\Controllers\SaleController::class, 'destroy']);

    // Products endpoints for sales dropdown
    Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
    Route::get('/products/{id}', [\App\Http\Controllers\ProductController::class, 'show']);

    // Sales analytics endpoints
    Route::get('/sales/analytics/overview', [\App\Http\Controllers\SalesAnalyticsController::class, 'overview']);
    Route::get('/sales/analytics/trends', [\App\Http\Controllers\SalesAnalyticsController::class, 'trends']);
    Route::get('/sales/analytics/top-products', [\App\Http\Controllers\SalesAnalyticsController::class, 'topProducts']);
    Route::get('/sales/analytics/customers', [\App\Http\Controllers\SalesAnalyticsController::class, 'customers']);
    Route::get('/sales/analytics/categories', [\App\Http\Controllers\SalesAnalyticsController::class, 'categories']);
    Route::get('/sales/analytics/sales-people', [\App\Http\Controllers\SalesAnalyticsController::class, 'salesPeople']);
    Route::get('/sales/analytics/low-stock-alerts', [\App\Http\Controllers\SalesAnalyticsController::class, 'lowStockAlerts']);
});

    // Add your protected routes here
    // routes/web.php




require __DIR__.'/auth.php';
