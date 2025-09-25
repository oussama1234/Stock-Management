<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';

echo "=== NOTIFICATION SYSTEM TEST ===" . PHP_EOL;

// Check notifications table
$notificationCount = \Illuminate\Support\Facades\DB::table('notifications')->count();
echo "Notifications in database: $notificationCount" . PHP_EOL;

if ($notificationCount > 0) {
    $recentNotifications = \Illuminate\Support\Facades\DB::table('notifications')
        ->orderBy('created_at', 'desc')
        ->limit(3)
        ->get(['id', 'type', 'title', 'created_at']);
    
    echo "Recent notifications:" . PHP_EOL;
    foreach ($recentNotifications as $notification) {
        echo "  - ID: {$notification->id}, Type: {$notification->type}, Title: {$notification->title}, Created: {$notification->created_at}" . PHP_EOL;
    }
}

// Check jobs table
$jobCount = \Illuminate\Support\Facades\DB::table('jobs')->count();
echo "Jobs in queue: $jobCount" . PHP_EOL;

if ($jobCount > 0) {
    $recentJobs = \Illuminate\Support\Facades\DB::table('jobs')
        ->orderBy('created_at', 'desc')
        ->limit(3)
        ->get(['id', 'queue', 'payload', 'created_at']);
    
    echo "Recent jobs:" . PHP_EOL;
    foreach ($recentJobs as $job) {
        $payload = json_decode($job->payload, true);
        $className = $payload['displayName'] ?? 'Unknown';
        echo "  - ID: {$job->id}, Queue: {$job->queue}, Job: {$className}, Created: {$job->created_at}" . PHP_EOL;
    }
}

// Check failed jobs
$failedJobCount = \Illuminate\Support\Facades\DB::table('failed_jobs')->count();
echo "Failed jobs: $failedJobCount" . PHP_EOL;

if ($failedJobCount > 0) {
    $failedJobs = \Illuminate\Support\Facades\DB::table('failed_jobs')
        ->orderBy('failed_at', 'desc')
        ->limit(3)
        ->get(['id', 'queue', 'payload', 'exception', 'failed_at']);
    
    echo "Recent failed jobs:" . PHP_EOL;
    foreach ($failedJobs as $job) {
        $payload = json_decode($job->payload, true);
        $className = $payload['displayName'] ?? 'Unknown';
        echo "  - ID: {$job->id}, Queue: {$job->queue}, Job: {$className}, Failed: {$job->failed_at}" . PHP_EOL;
        echo "    Exception: " . substr($job->exception, 0, 100) . "..." . PHP_EOL;
    }
}

// Check low stock products
$lowStockProducts = \Illuminate\Support\Facades\DB::table('products')
    ->whereRaw('stock <= 10')  // Using 10 as default threshold
    ->get(['id', 'name', 'stock']);

echo "Low stock products (stock <= 10): " . $lowStockProducts->count() . PHP_EOL;
foreach ($lowStockProducts as $product) {
    echo "  - ID: {$product->id}, Name: {$product->name}, Stock: {$product->stock}" . PHP_EOL;
}

// Check recent sales
$recentSales = \Illuminate\Support\Facades\DB::table('sales')
    ->orderBy('created_at', 'desc')
    ->limit(3)
    ->get(['id', 'total_amount', 'user_id', 'created_at']);

echo "Recent sales: " . $recentSales->count() . PHP_EOL;
foreach ($recentSales as $sale) {
    echo "  - ID: {$sale->id}, Amount: {$sale->total_amount}, User: {$sale->user_id}, Created: {$sale->created_at}" . PHP_EOL;
}

echo "=== END TEST ===" . PHP_EOL;