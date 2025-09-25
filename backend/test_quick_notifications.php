<?php

require __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sale;
use App\Models\Purchase;
use App\Services\NotificationService;

echo "🧪 Quick Notification Test\n";
echo "==========================\n\n";

$notificationService = app(NotificationService::class);

try {
    // Test sale notification directly
    $sale = Sale::with(['items.product', 'user'])->first();
    if ($sale) {
        echo "📄 Testing sale notification for Sale ID: {$sale->id}\n";
        $notification = $notificationService->createSaleNotification($sale);
        echo "✅ Sale notification created: ID {$notification->id}\n\n";
    } else {
        echo "❌ No sales found to test\n\n";
    }

    // Test purchase notification directly
    $purchase = Purchase::with(['items.product', 'supplier', 'user'])->first();
    if ($purchase) {
        echo "📄 Testing purchase notification for Purchase ID: {$purchase->id}\n";
        $notification = $notificationService->createPurchaseNotification($purchase);
        echo "✅ Purchase notification created: ID {$notification->id}\n\n";
    } else {
        echo "❌ No purchases found to test\n\n";
    }

    // Check total notifications
    $total = \App\Models\Notification::count();
    echo "📊 Total notifications in database: $total\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}