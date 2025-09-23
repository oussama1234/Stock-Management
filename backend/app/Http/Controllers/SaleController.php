<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Support\CacheHelper; // Namespaced cache helper
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SaleController extends Controller
{
    /**
     * List sales with pagination and filters.
     * Filters: search across customer_name, product name, category name, user name
     * Caching: CacheHelper key includes page/per_page/search
     */
    public function index(Request $request)
    {
        // Debug: Log all request parameters
        Log::info('Sales API Request', ['all_params' => $request->all()]);
        
        $page = max(1, (int) $request->input('page', 1));
        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));
        $search = (string) $request->input('search', '');
        $sortBy = (string) $request->input('sort_by', 'sale_date');
        $sortOrder = (string) $request->input('sort_order', 'desc');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $minAmount = $request->input('min_amount');
        $maxAmount = $request->input('max_amount');
        $customerId = $request->input('customer_id');
        $userId = $request->input('user_id');
        
        // Debug: Log parsed parameters
        Log::info('Sales API Parsed', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'minAmount' => $minAmount,
            'maxAmount' => $maxAmount,
            'sortBy' => $sortBy,
            'sortOrder' => $sortOrder
        ]);

        // Validate sort parameters
        $allowedSortColumns = ['sale_date', 'total_amount', 'customer_name', 'created_at'];
        if (!in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'sale_date';
        }
        if (!in_array($sortOrder, ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $key = CacheHelper::key('sales', 'list', [
            'page' => $page,
            'per_page' => $perPage,
            'search' => $search,
            'sort_by' => $sortBy,
            'sort_order' => $sortOrder,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'min_amount' => $minAmount,
            'max_amount' => $maxAmount,
            'customer_id' => $customerId,
            'user_id' => $userId,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_TTL', 60);

        $result = Cache::remember($key, now()->addSeconds($ttl), function () use ($page, $perPage, $search, $sortBy, $sortOrder, $dateFrom, $dateTo, $minAmount, $maxAmount, $customerId, $userId) {
            $query = Sale::query()
                ->with([
                    'user:id,name,email,role',
                    'items' => function ($q) {
                        $q->select('id','sale_id','product_id','quantity','price','created_at');
                    },
                    'items.product:id,name,category_id,image,price',
                    'items.product.category:id,name',
                ]);

            // Apply search filters
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('customer_name', 'like', "%$search%")
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('name', 'like', "%$search%");
                      })
                      ->orWhereHas('items.product', function ($pq) use ($search) {
                          $pq->where('name', 'like', "%$search%")
                             ->orWhereHas('category', function ($cq) use ($search) {
                                 $cq->where('name', 'like', "%$search%");
                             });
                      });
                });
            }

            // Apply date range filters
            if ($dateFrom) {
                $query->where('sale_date', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->where('sale_date', '<=', $dateTo . ' 23:59:59');
            }

            // Apply amount range filters
            if ($minAmount !== null && is_numeric($minAmount)) {
                $query->where('total_amount', '>=', (float) $minAmount);
            }
            if ($maxAmount !== null && is_numeric($maxAmount)) {
                $query->where('total_amount', '<=', (float) $maxAmount);
            }

            // Apply customer filter
            if ($customerId) {
                $query->where('customer_name', 'like', "%$customerId%");
            }

            // Apply user filter
            if ($userId && is_numeric($userId)) {
                $query->where('user_id', (int) $userId);
            }

            // Apply sorting
            if ($sortBy === 'sale_date') {
                $query->orderBy('sale_date', $sortOrder);
            } elseif ($sortBy === 'total_amount') {
                $query->orderBy('total_amount', $sortOrder);
            } elseif ($sortBy === 'customer_name') {
                $query->orderBy('customer_name', $sortOrder);
            } elseif ($sortBy === 'created_at') {
                $query->orderBy('created_at', $sortOrder);
            } else {
                $query->orderByDesc('sale_date');
            }

            return $query->paginate($perPage, ['*'], 'page', $page);
        });

        return response()->json($result);
    }

    /**
     * Show a single sale with related items and product details.
     * Optimized with caching for better performance on repeated requests.
     */
    public function show($id)
    {
        // Create cache key for individual sale lookup
        $key = CacheHelper::key('sales', 'by_id', ['id' => (int) $id]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_TTL', 60); // Default 1 minute cache

        // Cache the sale data with all relationships to reduce database queries
        $sale = Cache::remember($key, now()->addSeconds($ttl), function () use ($id) {
            return Sale::with([
                'user:id,name,email,role', // Only essential user fields
                'items:id,sale_id,product_id,quantity,price,created_at', // Sale item details
                'items.product:id,name,price,category_id,image,stock', // Product info
                'items.product.category:id,name', // Category name for display
            ])->findOrFail($id);
        });

        return response()->json($sale);
    }

    /**
     * Create a sale with line items.
     * Expected JSON:
     * {
     *   customer_name?: string,
     *   tax?: number,
     *   discount?: number,
     *   sale_date?: datetime (ISO string),
     *   items: [{ product_id:int, quantity:int>0, price:number>0 }]
     * }
     * Stock updates and stock movements are handled by SaleItemObserver.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => ['nullable','string','max:255'],
            'tax' => ['nullable','numeric','min:0'],
            'discount' => ['nullable','numeric','min:0'],
            'sale_date' => ['nullable','string'], // Accept string and parse manually
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','integer','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.price' => ['required','numeric','min:0'],
        ]);

        $userId = Auth::id();

        $sale = DB::transaction(function () use ($validated, $userId) {
            $sale = new Sale();
            $sale->customer_name = $validated['customer_name'] ?? null;
            $sale->tax = (float) ($validated['tax'] ?? 0);
            $sale->discount = (float) ($validated['discount'] ?? 0);
            
            // Handle sale_date with proper timezone parsing
            if (!empty($validated['sale_date'])) {
                try {
                    $sale->sale_date = Carbon::parse($validated['sale_date'])->setTimezone(config('app.timezone'));
                } catch (\Exception $e) {
                    $sale->sale_date = now();
                }
            } else {
                $sale->sale_date = now();
            }
            
            $sale->user_id = $userId;
            $sale->total_amount = 0; // will compute below
            $sale->save();

            $total = 0.0;
            foreach ($validated['items'] as $item) {
                $lineTotal = (float) $item['price'] * (int) $item['quantity'];
                $total += $lineTotal;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => (int) $item['product_id'],
                    'quantity' => (int) $item['quantity'],
                    'price' => (float) $item['price'],
                ]);
            }

            // Apply tax and discount to total_amount if needed
            $totalWithTax = $total + $sale->tax - $sale->discount;
            $sale->total_amount = max(0, $totalWithTax);
            $sale->save();

            return $sale->load([
                'user:id,name,email,role',
                'items:id,sale_id,product_id,quantity,price,created_at',
                'items.product:id,name,price,category_id,image,stock',
                'items.product.category:id,name',
            ]);
        });

        // Invalidate caches for sales, products, stock movements, dashboard
        CacheHelper::bump('sales');
        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');

        return response()->json($sale, 201);
    }

    /**
     * Update a sale with full editing capability including items.
     * Supports both basic field updates and complete sale reconstruction.
     * Optimized with caching and transaction safety.
     * 
     * Expected JSON payloads:
     * Basic update: { customer_name?, tax?, discount?, sale_date? }
     * Full update: { customer_name?, tax?, discount?, sale_date?, items: [{ product_id, quantity, price }] }
     */
    public function update(Request $request, $id)
    {
        // Comprehensive validation for both basic and full updates
        $validated = $request->validate([
            'customer_name' => ['nullable','string','max:255'],
            'tax' => ['nullable','numeric','min:0'],
            'discount' => ['nullable','numeric','min:0'],
            'sale_date' => ['nullable','string'], // Accept ISO string and parse manually
            'items' => ['sometimes','array','min:1'], // Optional but if provided must be valid
            'items.*.product_id' => ['required_with:items','integer','exists:products,id'],
            'items.*.quantity' => ['required_with:items','integer','min:1'],
            'items.*.price' => ['required_with:items','numeric','min:0'],
        ]);

        // Use database transaction for data integrity
        $sale = DB::transaction(function () use ($validated, $id) {
            // Find sale with items for potential updates
            $sale = Sale::with('items')->findOrFail($id);
            
            // Update basic sale fields
            $sale->customer_name = $validated['customer_name'] ?? $sale->customer_name;
            $sale->tax = isset($validated['tax']) ? (float) $validated['tax'] : $sale->tax;
            $sale->discount = isset($validated['discount']) ? (float) $validated['discount'] : $sale->discount;
            
            // Handle sale_date with proper timezone parsing and error handling
            if (!empty($validated['sale_date'])) {
                try {
                    $sale->sale_date = Carbon::parse($validated['sale_date'])->setTimezone(config('app.timezone'));
                } catch (\Exception $e) {
                    Log::warning('Failed to parse sale_date in update', [
                        'sale_id' => $id,
                        'sale_date' => $validated['sale_date'],
                        'error' => $e->getMessage()
                    ]);
                    // Keep existing sale_date if parsing fails
                }
            }
            
            // Handle items update if provided (complete replacement strategy)
            if (isset($validated['items'])) {
                // Delete existing items (triggers stock restoration via observer)
                $sale->items()->delete();
                
                // Create new items and calculate new total
                $total = 0.0;
                foreach ($validated['items'] as $item) {
                    $lineTotal = (float) $item['price'] * (int) $item['quantity'];
                    $total += $lineTotal;

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => (int) $item['product_id'],
                        'quantity' => (int) $item['quantity'],
                        'price' => (float) $item['price'],
                    ]);
                }
                
                // Recalculate total with tax and discount
                $totalWithTax = $total + $sale->tax - $sale->discount;
                $sale->total_amount = max(0, $totalWithTax);
            } else {
                // If no items updated, just recalculate total with new tax/discount
                $itemsTotal = $sale->items->sum(function($item) {
                    return $item->quantity * $item->price;
                });
                $totalWithTax = $itemsTotal + $sale->tax - $sale->discount;
                $sale->total_amount = max(0, $totalWithTax);
            }
            
            // Save the updated sale
            $sale->save();
            
            // Return sale with fresh relationships
            return $sale->load([
                'user:id,name,email,role',
                'items:id,sale_id,product_id,quantity,price,created_at',
                'items.product:id,name,price,category_id,image,stock',
                'items.product.category:id,name',
            ]);
        });

        // Invalidate relevant caches for performance consistency
        CacheHelper::bump('sales'); // Clear all sale-related caches
        CacheHelper::bump('products'); // Product stock may have changed
        CacheHelper::bump('stock_movements'); // Stock movements affected
        CacheHelper::bump('dashboard_metrics'); // Dashboard data needs refresh

        return response()->json($sale);
    }

    /**
     * Delete a sale and its items.
     */
    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            $sale = Sale::with('items')->findOrFail($id);
            // Deleting items will trigger observer to restore stock
            $sale->items()->delete();
            $sale->delete();
        });

        CacheHelper::bump('sales');
        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');

        return response()->json(['success' => true]);
    }

    /**
     * Export sales data to CSV
     */
    public function export(Request $request)
    {
        $search = (string) $request->input('search', '');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $format = $request->input('format', 'csv'); // csv or json

        $query = Sale::query()
            ->with([
                'user:id,name,email',
                'items:id,sale_id,product_id,quantity,price',
                'items.product:id,name,category_id',
                'items.product.category:id,name',
            ])
            ->orderByDesc('sale_date');

        // Apply search filters (same as index method)
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%$search%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%$search%");
                  })
                  ->orWhereHas('items.product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%$search%")
                         ->orWhereHas('category', function ($cq) use ($search) {
                             $cq->where('name', 'like', "%$search%");
                         });
                  });
            });
        }

        // Apply date filters
        if ($dateFrom) {
            $query->where('sale_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('sale_date', '<=', $dateTo . ' 23:59:59');
        }

        $sales = $query->limit(1000)->get(); // Limit to prevent memory issues

        if ($format === 'json') {
            return response()->json($sales);
        }

        // Generate CSV
        $filename = 'sales_export_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Pragma' => 'public',
        ];

        $callback = function() use ($sales) {
            $file = fopen('php://output', 'w');
            
            // CSV Header
            fputcsv($file, [
                'Sale ID',
                'Date',
                'Customer',
                'Sales Person',
                'Total Amount',
                'Tax',
                'Discount',
                'Product Name',
                'Category',
                'Quantity',
                'Unit Price',
                'Line Total'
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
                    // Sale with no items
                    fputcsv($file, [
                        $sale->id,
                        $sale->sale_date,
                        $sale->customer_name ?: 'Walk-in Customer',
                        $sale->user->name ?? '',
                        $sale->total_amount,
                        $sale->tax,
                        $sale->discount,
                        '',
                        '',
                        '',
                        '',
                        ''
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
        // Validate product ID
        $productId = (int) $productId;
        if ($productId <= 0) {
            return response()->json(['error' => 'Invalid product ID'], 400);
        }
        
        // Create cache key for product-specific sales
        $key = CacheHelper::key('sales', 'by_product', ['product_id' => $productId]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_TTL', 60); // 1 minute cache
        
        // Cache the sales data to reduce database load
        $sales = Cache::remember($key, now()->addSeconds($ttl), function () use ($productId) {
            return Sale::with([
                'user:id,name,email,role',
                'items' => function ($query) use ($productId) {
                    // Only get items for this specific product
                    $query->where('product_id', $productId)
                          ->select('id', 'sale_id', 'product_id', 'quantity', 'price', 'created_at');
                },
                'items.product:id,name,price,category_id,image',
                'items.product.category:id,name',
            ])
            ->whereHas('items', function ($query) use ($productId) {
                // Only sales that contain this product
                $query->where('product_id', $productId);
            })
            ->orderByDesc('sale_date')
            ->limit(50) // Limit to recent 50 sales for performance
            ->get()
            ->map(function ($sale) {
                // Transform data for frontend compatibility
                return [
                    'id' => $sale->id,
                    'customer_name' => $sale->customer_name,
                    'sale_date' => $sale->sale_date,
                    'tax' => $sale->tax,
                    'discount' => $sale->discount,
                    'total_amount' => $sale->total_amount,
                    'user' => $sale->user,
                    'created_at' => $sale->created_at,
                    // Only include items for this product
                    'items' => $sale->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'created_at' => $item->created_at,
                        ];
                    })
                ];
            });
        });
        
        return response()->json($sales);
    }
}
