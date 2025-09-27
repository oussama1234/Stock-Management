<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Support\Collection;

/**
 * StockValidationService
 * 
 * Handles all stock validation logic to prevent overselling and maintain inventory integrity.
 * This service can be reused across different parts of the application.
 */
class StockValidationService
{
    /**
     * Validate stock availability for new sale items
     *
     * @param array $items Array of items with product_id and quantity
     * @return array Returns validation result with success status and details
     */
    public function validateStockForNewSale(array $items): array
    {
        $errors = [];
        $warnings = [];
        
        // Group items by product_id to handle multiple entries for same product
        $groupedItems = collect($items)->groupBy('product_id')->map(function ($group) {
            return [
                'product_id' => $group->first()['product_id'],
                'total_quantity' => $group->sum('quantity'),
                'items' => $group->toArray()
            ];
        });

        foreach ($groupedItems as $productId => $data) {
            $product = Product::find($productId);
            
            if (!$product) {
                $errors[] = [
                    'product_id' => $productId,
                    'error' => 'Product not found',
                    'code' => 'PRODUCT_NOT_FOUND'
                ];
                continue;
            }

            $requestedQuantity = $data['total_quantity'];
            $availableStock = $product->stock;

            if ($requestedQuantity > $availableStock) {
                $errors[] = [
                    'product_id' => $productId,
                    'product_name' => $product->name,
                    'requested_quantity' => $requestedQuantity,
                    'available_stock' => $availableStock,
                    'error' => "Insufficient stock for {$product->name}. Requested: {$requestedQuantity}, Available: {$availableStock}",
                    'code' => 'INSUFFICIENT_STOCK'
                ];
            } elseif ($requestedQuantity == $availableStock) {
                $warnings[] = [
                    'product_id' => $productId,
                    'product_name' => $product->name,
                    'message' => "This sale will deplete all stock for {$product->name}",
                    'code' => 'STOCK_DEPLETED'
                ];
            } elseif ($availableStock - $requestedQuantity < 5) {
                $warnings[] = [
                    'product_id' => $productId,
                    'product_name' => $product->name,
                    'remaining_stock' => $availableStock - $requestedQuantity,
                    'message' => "Low stock warning: Only " . ($availableStock - $requestedQuantity) . " units will remain for {$product->name}",
                    'code' => 'LOW_STOCK_WARNING'
                ];
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'validated_items' => $groupedItems->values()->toArray()
        ];
    }

    /**
     * Validate stock availability for updating an existing sale
     *
     * @param int $saleId The ID of the sale being updated
     * @param array $newItems Array of new items with product_id and quantity
     * @return array Returns validation result with success status and details
     */
    public function validateStockForSaleUpdate(int $saleId, array $newItems): array
    {
        $errors = [];
        $warnings = [];
        
        // Get current sale items to calculate the difference
        $existingSale = Sale::with('items')->find($saleId);
        if (!$existingSale) {
            return [
                'valid' => false,
                'errors' => [['error' => 'Sale not found', 'code' => 'SALE_NOT_FOUND']],
                'warnings' => []
            ];
        }

        // Calculate current quantities by product
        $currentQuantities = collect($existingSale->items)->groupBy('product_id')->map(function ($group) {
            return $group->sum('quantity');
        });

        // Calculate new quantities by product
        $newQuantities = collect($newItems)->groupBy('product_id')->map(function ($group) {
            return collect($group)->sum('quantity');
        });

        // Get all affected products
        $allProductIds = $currentQuantities->keys()->concat($newQuantities->keys())->unique();
        
        foreach ($allProductIds as $productId) {
            $product = Product::find($productId);
            
            if (!$product) {
                $errors[] = [
                    'product_id' => $productId,
                    'error' => 'Product not found',
                    'code' => 'PRODUCT_NOT_FOUND'
                ];
                continue;
            }

            $currentQuantity = $currentQuantities->get($productId, 0);
            $newQuantity = $newQuantities->get($productId, 0);
            $quantityDifference = $newQuantity - $currentQuantity;

            // If we're increasing the quantity, we need to check stock
            if ($quantityDifference > 0) {
                $availableStock = $product->stock;
                
                if ($quantityDifference > $availableStock) {
                    $errors[] = [
                        'product_id' => $productId,
                        'product_name' => $product->name,
                        'current_quantity' => $currentQuantity,
                        'new_quantity' => $newQuantity,
                        'additional_needed' => $quantityDifference,
                        'available_stock' => $availableStock,
                        'error' => "Insufficient stock for {$product->name}. Need {$quantityDifference} more units, but only {$availableStock} available",
                        'code' => 'INSUFFICIENT_STOCK_UPDATE'
                    ];
                } elseif ($quantityDifference == $availableStock) {
                    $warnings[] = [
                        'product_id' => $productId,
                        'product_name' => $product->name,
                        'message' => "This update will use all remaining stock for {$product->name}",
                        'code' => 'STOCK_DEPLETED_UPDATE'
                    ];
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'quantity_changes' => $allProductIds->mapWithKeys(function ($productId) use ($currentQuantities, $newQuantities) {
                return [
                    $productId => [
                        'current' => $currentQuantities->get($productId, 0),
                        'new' => $newQuantities->get($productId, 0),
                        'difference' => $newQuantities->get($productId, 0) - $currentQuantities->get($productId, 0)
                    ]
                ];
            })->toArray()
        ];
    }

    /**
     * Check stock for a single product
     *
     * @param int $productId
     * @param int $quantity
     * @return array
     */
    public function checkProductStock(int $productId, int $quantity): array
    {
        $product = Product::find($productId);
        
        if (!$product) {
            return [
                'valid' => false,
                'error' => 'Product not found',
                'code' => 'PRODUCT_NOT_FOUND'
            ];
        }

        if ($quantity > $product->stock) {
            return [
                'valid' => false,
                'product_name' => $product->name,
                'requested_quantity' => $quantity,
                'available_stock' => $product->stock,
                'error' => "Insufficient stock for {$product->name}. Requested: {$quantity}, Available: {$product->stock}",
                'code' => 'INSUFFICIENT_STOCK'
            ];
        }

        return [
            'valid' => true,
            'product_name' => $product->name,
            'requested_quantity' => $quantity,
            'available_stock' => $product->stock,
            'remaining_after_sale' => $product->stock - $quantity
        ];
    }

    /**
     * Get current stock levels for multiple products
     *
     * @param array $productIds
     * @return array
     */
    public function getStockLevels(array $productIds): array
    {
        return Product::whereIn('id', $productIds)
            ->select('id', 'name', 'stock')
            ->get()
            ->keyBy('id')
            ->toArray();
    }
}