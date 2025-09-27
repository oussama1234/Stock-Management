<?php

namespace App\Http\Controllers;

use App\Services\StockValidationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Product;

class StockValidationController extends Controller
{
    protected $stockValidationService;

    public function __construct(StockValidationService $stockValidationService)
    {
        $this->stockValidationService = $stockValidationService;
    }

    /**
     * Validate stock for a single product
     */
    public function validateProductStock(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $validation = $this->stockValidationService->checkProductStock(
            $request->product_id,
            $request->quantity
        );

        return response()->json([
            'success' => true,
            'data' => $validation
        ]);
    }

    /**
     * Validate stock for multiple products (for multi-item sales)
     */
    public function validateMultipleProductsStock(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1'
        ]);

        $validation = $this->stockValidationService->validateStockForNewSale($request->items);

        return response()->json([
            'success' => true,
            'data' => $validation
        ]);
    }

    /**
     * Get current stock levels for products
     */
    public function getStockLevels(Request $request): JsonResponse
    {
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'required|integer|exists:products,id'
        ]);

        $stockLevels = $this->stockValidationService->getStockLevels($request->product_ids);

        return response()->json([
            'success' => true,
            'data' => $stockLevels
        ]);
    }

    /**
     * Get real-time stock information for a product (useful for frontend)
     */
    public function getProductStockInfo(int $productId): JsonResponse
    {
        $product = Product::find($productId);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $lowStockThreshold = $product->low_stock_threshold ?? 10;
        $isLowStock = $product->stock <= $lowStockThreshold;
        $isOutOfStock = $product->stock <= 0;

        return response()->json([
            'success' => true,
            'data' => [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'current_stock' => (int) $product->stock,
                'low_stock_threshold' => $lowStockThreshold,
                'is_out_of_stock' => $isOutOfStock,
                'is_low_stock' => $isLowStock && !$isOutOfStock,
                'stock_status' => $isOutOfStock ? 'out_of_stock' : ($isLowStock ? 'low_stock' : 'in_stock'),
                'last_updated' => $product->updated_at
            ]
        ]);
    }
}