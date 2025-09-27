<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Support\CacheHelper; // Namespaced cache helper
use App\Services\PurchasesService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PurchaseController extends Controller
{
    protected PurchasesService $purchasesService;

    public function __construct(PurchasesService $purchasesService)
    {
        $this->purchasesService = $purchasesService;
    }
    /**
     * List purchases with pagination and filters.
     * Filters: search across supplier_name, product name, category name, user name
     * Caching: CacheHelper key includes page/per_page/search
     */
    public function index(Request $request)
    {
        $result = $this->purchasesService->getPaginatedPurchases($request->all());
        return response()->json($result);
    }

    /**
     * Show a single purchase with related items and product details.
     * Optimized with caching for better performance on repeated requests.
     */
    public function show($id)
    {
        $purchase = $this->purchasesService->getPurchaseById((int) $id);
        return response()->json($purchase);
    }

    /**
     * Create a purchase with line items.
     * Expected JSON:
     * {
     *   supplier_id: int,
     *   purchase_date?: datetime (ISO string),
     *   items: [{ product_id:int, quantity:int>0, price:number>0 }]
     * }
     * Stock updates and stock movements are handled automatically.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => ['required','integer','exists:suppliers,id'],
            'purchase_date' => ['nullable','string'],
            'tax' => ['nullable','numeric','min:0','max:100'],
            'discount' => ['nullable','numeric','min:0','max:100'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','integer','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.price' => ['required','numeric','min:0'],
        ]);

        try {
            $purchase = $this->purchasesService->createPurchase($validated, Auth::id());
            return response()->json($purchase, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update a purchase with full editing capability including items.
     * Supports both basic field updates and complete purchase reconstruction.
     * Optimized with caching and transaction safety.
     * 
     * Expected JSON payloads:
     * Basic update: { supplier_id?, purchase_date? }
     * Full update: { supplier_id?, purchase_date?, items: [{ product_id, quantity, price }] }
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'supplier_id' => ['sometimes','integer','exists:suppliers,id'],
            'purchase_date' => ['nullable','string'],
            'tax' => ['sometimes','numeric','min:0','max:100'],
            'discount' => ['sometimes','numeric','min:0','max:100'],
            'items' => ['sometimes','array','min:1'],
            'items.*.product_id' => ['required_with:items','integer','exists:products,id'],
            'items.*.quantity' => ['required_with:items','integer','min:1'],
            'items.*.price' => ['required_with:items','numeric','min:0'],
        ]);

        try {
            $purchase = $this->purchasesService->updatePurchase((int) $id, $validated);
            return response()->json($purchase);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a purchase and its items.
     */
    public function destroy($id)
    {
        $this->purchasesService->deletePurchase((int) $id);
        return response()->json(['success' => true]);
    }

    /**
     * Export purchases data to CSV
     */
    public function export(Request $request)
    {
        $format = $request->input('format', 'csv');
        $purchases = $this->purchasesService->exportPurchases($request->all());

        if ($format === 'json') {
            return response()->json($purchases);
        }

        $filename = 'purchases_export_' . date('Y-m-d_H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Pragma' => 'public',
        ];

        $callback = function() use ($purchases) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Purchase ID','Date','Supplier','Supplier Email','Purchaser','Total Amount','Product Name','Category','Quantity','Unit Price','Line Total'
            ]);

            foreach ($purchases as $purchase) {
                if ($purchase->purchaseItems && $purchase->purchaseItems->count() > 0) {
                    foreach ($purchase->purchaseItems as $item) {
                        fputcsv($file, [
                            $purchase->id,
                            $purchase->purchase_date,
                            $purchase->supplier->name ?? '',
                            $purchase->supplier->email ?? '',
                            $purchase->user->name ?? '',
                            $purchase->total_amount,
                            $item->product->name ?? '',
                            $item->product->category->name ?? '',
                            $item->quantity,
                            $item->price,
                            $item->quantity * $item->price
                        ]);
                    }
                } else {
                    fputcsv($file, [
                        $purchase->id,
                        $purchase->purchase_date,
                        $purchase->supplier->name ?? '',
                        $purchase->supplier->email ?? '',
                        $purchase->user->name ?? '',
                        $purchase->total_amount,
                        '', '', '', '', ''
                    ]);
                }
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
    
    /**
     * Get purchases for a specific product - used by ProductDetails page.
     * Optimized with caching for performance.
     * 
     * @param int $productId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByProduct($productId)
    {
        $productId = (int) $productId;
        if ($productId <= 0) {
            return response()->json(['error' => 'Invalid product ID'], 400);
        }

        $purchases = $this->purchasesService->getPurchasesByProduct($productId);
        return response()->json($purchases);
    }
}
