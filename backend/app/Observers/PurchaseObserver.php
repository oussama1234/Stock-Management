<?php

namespace App\Observers;

use App\Models\Purchase;
use App\Jobs\CreatePurchaseNotificationJob;
use App\Support\CacheHelper;
use Illuminate\Support\Facades\Log;

/**
 * PurchaseObserver
 *
 * Handles notification creation and cache management when purchases are
 * created, updated, or deleted. Dispatches background jobs for performance.
 */
class PurchaseObserver
{
    /**
     * Handle the Purchase "created" event.
     * 
     * @param Purchase $purchase
     */
    public function created(Purchase $purchase): void
    {
        try {
            // Load necessary relationships to avoid N+1 queries in job
            $purchase->load(['items.product', 'user', 'supplier']);
            
            // Dispatch purchase notification job
            CreatePurchaseNotificationJob::dispatch($purchase);
            
            // Clear relevant caches
            CacheHelper::bump('purchases');
            CacheHelper::bump('dashboard_metrics');
            CacheHelper::bump('notifications');
            CacheHelper::bump('paginated_purchase_items');
            CacheHelper::bump('analytics_service');
            
            Log::info('Purchase observer: created event handled', [
                'purchase_id' => $purchase->id,
                'user_id' => $purchase->user_id,
                'total_amount' => $purchase->total_amount,
                'supplier_id' => $purchase->supplier_id
            ]);
        } catch (\Exception $e) {
            Log::error('Purchase observer: failed to handle created event', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Handle the Purchase "updated" event.
     * 
     * @param Purchase $purchase
     */
    public function updated(Purchase $purchase): void
    {
        try {
            // Clear relevant caches
            CacheHelper::bump('purchases');
            CacheHelper::bump('dashboard_metrics');
            CacheHelper::bump('notifications');
            CacheHelper::bump('paginated_purchase_items');
            CacheHelper::bump('analytics_service');
            
            Log::info('Purchase observer: updated event handled', [
                'purchase_id' => $purchase->id,
                'changes' => $purchase->getChanges()
            ]);
        } catch (\Exception $e) {
            Log::error('Purchase observer: failed to handle updated event', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle the Purchase "deleted" event.
     * 
     * @param Purchase $purchase
     */
    public function deleted(Purchase $purchase): void
    {
        try {
            // Clear relevant caches
            CacheHelper::bump('purchases');
            CacheHelper::bump('dashboard_metrics');
            CacheHelper::bump('notifications');
            CacheHelper::bump('paginated_purchase_items');
            CacheHelper::bump('analytics_service');
            
            Log::info('Purchase observer: deleted event handled', [
                'purchase_id' => $purchase->id
            ]);
        } catch (\Exception $e) {
            Log::error('Purchase observer: failed to handle deleted event', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}