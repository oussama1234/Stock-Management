<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Jobs\CheckLowStockJob;
use App\Jobs\CreateSaleNotificationJob;
use App\Support\CacheHelper;
use Illuminate\Support\Facades\Log;

/**
 * SaleItemObserver
 *
 * Handles stock adjustments and stock movement records when sale items are
 * created/updated/deleted. Also bumps related cache namespaces so clients see
 * fresh data.
 */
class SaleItemObserver
{
    /**
     * After creating a sale item, decrement product stock and insert a stock movement
     * with previous_stock and new_stock.
     */
    public function created(SaleItem $item): void
    {
        $product = Product::lockForUpdate()->find($item->product_id);
        if (!$product) return;

        $previous = (int) $product->stock;
        $qty = (int) $item->quantity;
        // Atomic decrement for OUT movement
        $product->decrement('stock', $qty);
        $new = $previous - $qty;

        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'out',
            'quantity' => $qty,
            'previous_stock' => $previous,
            'new_stock' => $new,
            'source_type' => \App\Models\SaleItem::class,
            'source_id' => $item->id,
            'movement_date' => now(),
            'reason' => 'sale_create',
            'user_id' => (int) ($item->sale?->user_id ?? 0),
        ]);

        // Load sale with relationships for notification
        $sale = $item->sale()->with(['items.product', 'user'])->withCount('items')->first();
        if ($sale && (int) $sale->items_count === 1) {
            // Dispatch sale notification job only for the first item of a new sale
            CreateSaleNotificationJob::dispatch($sale);
            Log::info('Sale notification dispatched', [
                'sale_id' => $sale->id,
                'sale_item_id' => $item->id
            ]);
        }
        
        // Dispatch low stock check if product stock is low
        if ($new <= ($product->low_stock_threshold ?? 10)) {
            CheckLowStockJob::dispatch()->delay(now()->addMinutes(1));
            Log::info('Low stock detected, dispatching check job', [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'current_stock' => $new,
                'threshold' => $product->low_stock_threshold ?? 10
            ]);
        }
        
        // Bump all relevant cache namespaces for real-time updates
        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');
        CacheHelper::bump('sales');
        CacheHelper::bump('notifications');
        
        // Bump GraphQL query cache namespaces for immediate data refresh
        CacheHelper::bump('paginated_sale_items');
        CacheHelper::bump('paginated_purchase_items');
        CacheHelper::bump('paginated_stock_movements');
        CacheHelper::bump('analytics_service');
    }

    /**
     * If the sale item quantity changes, adjust stock and write a corrective movement.
     */
    public function updated(SaleItem $item): void
    {
        if (!$item->isDirty('quantity')) return;
        $product = Product::lockForUpdate()->find($item->product_id);
        if (!$product) return;

        $originalQty = (int) $item->getOriginal('quantity');
        $newQty = (int) $item->quantity;
        $diff = $newQty - $originalQty; // positive means more sold -> reduce stock more
        if ($diff === 0) return;

        $previous = (int) $product->stock;
        if ($diff > 0) {
            // Need to reduce stock more by diff
            $product->decrement('stock', $diff);
        } else {
            // Reduced sale quantity, restore stock by -diff
            $product->increment('stock', -$diff);
        }
        $new = $diff > 0 ? ($previous - $diff) : ($previous + (-$diff));

        StockMovement::create([
            'product_id' => $product->id,
            'type' => $diff > 0 ? 'out' : 'in',
            'quantity' => abs($diff),
            'previous_stock' => $previous,
            'new_stock' => $new,
            'source_type' => \App\Models\SaleItem::class,
            'source_id' => $item->id,
            'movement_date' => now(),
            'reason' => $diff > 0 ? 'sale_update_increase' : 'sale_update_decrease',
            'user_id' => (int) ($item->sale?->user_id ?? 0),
        ]);

        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');
        CacheHelper::bump('notifications');
        CacheHelper::bump('paginated_sale_items');
        CacheHelper::bump('paginated_purchase_items');
        CacheHelper::bump('paginated_stock_movements');
        CacheHelper::bump('analytics_service');
    }

    /**
     * When deleting a sale item, restore stock and write a compensating IN movement.
     */
    public function deleted(SaleItem $item): void
    {
        $product = Product::lockForUpdate()->find($item->product_id);
        if (!$product) return;

        $previous = (int) $product->stock;
        $qty = (int) $item->quantity;
        $product->increment('stock', $qty); // restore
        $new = $previous + $qty;

        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => $qty,
            'previous_stock' => $previous,
            'new_stock' => $new,
            'source_type' => \App\Models\SaleItem::class,
            'source_id' => $item->id,
            'movement_date' => now(),
            'reason' => 'sale_delete',
            'user_id' => (int) ($item->sale?->user_id ?? 0),
        ]);

        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');
        CacheHelper::bump('notifications');
        CacheHelper::bump('paginated_sale_items');
        CacheHelper::bump('paginated_purchase_items');
        CacheHelper::bump('paginated_stock_movements');
        CacheHelper::bump('analytics_service');
    }
}
