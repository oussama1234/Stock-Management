<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Support\CacheHelper;

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
        $product = Product::find($item->product_id);
        if (!$product) return;

        $previous = (int) $product->stock;
        $delta = -(int) $item->quantity; // sale is stock OUT
        $new = $previous + $delta;

        $product->stock = $new;
        $product->save();

        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'out',
            'quantity' => (int) $item->quantity,
            'previous_stock' => $previous,
            'new_stock' => $new,
            'source_type' => \App\Models\SaleItem::class,
            'source_id' => $item->id,
            'movement_date' => now(),
        ]);

        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');
    }

    /**
     * If the sale item quantity changes, adjust stock and write a corrective movement.
     */
    public function updated(SaleItem $item): void
    {
        if (!$item->isDirty('quantity')) return;
        $product = Product::find($item->product_id);
        if (!$product) return;

        $originalQty = (int) $item->getOriginal('quantity');
        $newQty = (int) $item->quantity;
        $diff = $newQty - $originalQty; // positive means more sold -> reduce stock more
        if ($diff === 0) return;

        $previous = (int) $product->stock;
        $new = $previous - $diff; // reduce by diff
        $product->stock = $new;
        $product->save();

        StockMovement::create([
            'product_id' => $product->id,
            'type' => $diff > 0 ? 'out' : 'in',
            'quantity' => abs($diff),
            'previous_stock' => $previous,
            'new_stock' => $new,
            'source_type' => \App\Models\SaleItem::class,
            'source_id' => $item->id,
            'movement_date' => now(),
        ]);

        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');
    }

    /**
     * When deleting a sale item, restore stock and write a compensating IN movement.
     */
    public function deleted(SaleItem $item): void
    {
        $product = Product::find($item->product_id);
        if (!$product) return;

        $previous = (int) $product->stock;
        $new = $previous + (int) $item->quantity; // restore
        $product->stock = $new;
        $product->save();

        StockMovement::create([
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => (int) $item->quantity,
            'previous_stock' => $previous,
            'new_stock' => $new,
            'source_type' => \App\Models\SaleItem::class,
            'source_id' => $item->id,
            'movement_date' => now(),
        ]);

        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');
    }
}
