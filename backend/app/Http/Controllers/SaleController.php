<?php

namespace App\Http\Controllers;

use App\Services\SalesService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SaleController extends Controller
{
    protected SalesService $salesService;

    public function __construct(SalesService $salesService)
    {
        $this->salesService = $salesService;
    }

    /**
     * List sales with pagination and filters.
     */
    public function index(Request $request)
    {
        $result = $this->salesService->getPaginatedSales($request->all());
        return response()->json($result);
    }

    /**
     * Show a single sale with related items and product details.
     * Optimized with caching for better performance on repeated requests.
     */
    public function show($id)
    {
        $sale = $this->salesService->getSaleById((int) $id);
        return response()->json($sale);
    }

    /**
     * Create a sale with line items.
     * Expected JSON:
     * {
     *   customer_name?: string,
     *   tax?: number (percentage 0-100),
     *   discount?: number (percentage 0-100),
     *   sale_date?: datetime (ISO string),
     *   items: [{ product_id:int, quantity:int>0, price:number>0 }]
     * }
     * Stock updates and stock movements are handled by SaleItemObserver.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => ['nullable','string','max:255'],
            'tax' => ['nullable','numeric','min:0','max:100'],
            'discount' => ['nullable','numeric','min:0','max:100'],
            'sale_date' => ['nullable','string'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','integer','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.price' => ['required','numeric','min:0'],
        ]);

        try {
            $sale = $this->salesService->createSale($validated, Auth::id());
            return response()->json($sale, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update a sale with full editing capability including items.
     * Supports both basic field updates and complete sale reconstruction.
     * Optimized with caching and transaction safety.
     * 
     * Expected JSON payloads:
     * Basic update: { customer_name?, tax?(percentage 0-100), discount?(percentage 0-100), sale_date? }
     * Full update: { customer_name?, tax?(percentage 0-100), discount?(percentage 0-100), sale_date?, items: [{ product_id, quantity, price }] }
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'customer_name' => ['nullable','string','max:255'],
            'tax' => ['nullable','numeric','min:0','max:100'],
            'discount' => ['nullable','numeric','min:0','max:100'],
            'sale_date' => ['nullable','string'],
            'items' => ['sometimes','array','min:1'],
            'items.*.product_id' => ['required_with:items','integer','exists:products,id'],
            'items.*.quantity' => ['required_with:items','integer','min:1'],
            'items.*.price' => ['required_with:items','numeric','min:0'],
        ]);

        try {
            $sale = $this->salesService->updateSale((int) $id, $validated);
            return response()->json($sale);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Delete a sale and its items.
     */
    public function destroy($id)
    {
        $this->salesService->deleteSale((int) $id);
        return response()->json(['success' => true]);
    }

    /**
     * Export sales data to CSV
     */
    public function export(Request $request)
    {
        $format = $request->input('format', 'csv');
        $sales = $this->salesService->exportSales($request->all());

        if ($format === 'json') {
            return response()->json($sales);
        }

        $filename = 'sales_export_' . date('Y-m-d_H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Pragma' => 'public',
        ];

        $callback = function() use ($sales) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Sale ID', 'Date', 'Customer', 'Sales Person', 'Total Amount', 'Tax', 'Discount', 'Product Name', 'Category', 'Quantity', 'Unit Price', 'Line Total'
            ]);

            foreach ($sales as $sale) {
                if ($sale->items && $sale->items->count() > 0) {
                    foreach ($sale->items as $item) {
                        fputcsv($file, [
                            $sale->id,
                            $sale->sale_date,
                            $sale->customer_name ?: 'Walk-in Customer',
                            $sale->user->name ?? '',
                            $sale->total_amount,
                            $sale->tax,
                            $sale->discount,
                            $item->product->name ?? '',
                            $item->product->category->name ?? '',
                            $item->quantity,
                            $item->price,
                            $item->quantity * $item->price
                        ]);
                    }
                } else {
                    fputcsv($file, [
                        $sale->id,
                        $sale->sale_date,
                        $sale->customer_name ?: 'Walk-in Customer',
                        $sale->user->name ?? '',
                        $sale->total_amount,
                        $sale->tax,
                        $sale->discount,
                        '', '', '', '', ''
                    ]);
                }
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
    
    /**
     * Get sales for a specific product - used by ProductDetails page.
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

        $sales = $this->salesService->getSalesByProduct($productId);
        return response()->json($sales);
    }
}
