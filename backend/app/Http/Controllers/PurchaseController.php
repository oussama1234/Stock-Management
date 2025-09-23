<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Support\CacheHelper; // Namespaced cache helper
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PurchaseController extends Controller
{
    /**
     * List purchases with pagination and filters.
     * Filters: search across supplier_name, product name, category name, user name
     * Caching: CacheHelper key includes page/per_page/search
     */
    public function index(Request $request)
    {
        // Debug: Log all request parameters
        Log::info('Purchases API Request', ['all_params' => $request->all()]);
        
        $page = max(1, (int) $request->input('page', 1));
        $perPage = max(1, min(100, (int) $request->input('per_page', 20)));
        $search = (string) $request->input('search', '');
        $sortBy = (string) $request->input('sort_by', 'purchase_date');
        $sortOrder = (string) $request->input('sort_order', 'desc');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $minAmount = $request->input('min_amount');
        $maxAmount = $request->input('max_amount');
        $supplierId = $request->input('supplier_id');
        $userId = $request->input('user_id');
        
        // Debug: Log parsed parameters
        Log::info('Purchases API Parsed', [
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'minAmount' => $minAmount,
            'maxAmount' => $maxAmount,
            'sortBy' => $sortBy,
            'sortOrder' => $sortOrder
        ]);

        // Validate sort parameters
        $allowedSortColumns = ['purchase_date', 'total_amount', 'created_at'];
        if (!in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'purchase_date';
        }
        if (!in_array($sortOrder, ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        $key = CacheHelper::key('purchases', 'list', [
            'page' => $page,
            'per_page' => $perPage,
            'search' => $search,
            'sort_by' => $sortBy,
            'sort_order' => $sortOrder,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'min_amount' => $minAmount,
            'max_amount' => $maxAmount,
            'supplier_id' => $supplierId,
            'user_id' => $userId,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_TTL', 60);

        $result = Cache::remember($key, now()->addSeconds($ttl), function () use ($page, $perPage, $search, $sortBy, $sortOrder, $dateFrom, $dateTo, $minAmount, $maxAmount, $supplierId, $userId) {
            $query = Purchase::query()
                ->with([
                    'user:id,name,email,role',
                    'supplier:id,name,email,phone',
                    'purchaseItems' => function ($q) {
                        $q->select('id','purchase_id','product_id','quantity','price','created_at');
                    },
                    'purchaseItems.product:id,name,category_id,image,price',
                    'purchaseItems.product.category:id,name',
                ]);

            // Apply search filters
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('supplier', function ($sq) use ($search) {
                          $sq->where('name', 'like', "%$search%");
                      })
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('name', 'like', "%$search%");
                      })
                      ->orWhereHas('purchaseItems.product', function ($pq) use ($search) {
                          $pq->where('name', 'like', "%$search%")
                             ->orWhereHas('category', function ($cq) use ($search) {
                                 $cq->where('name', 'like', "%$search%");
                             });
                      });
                });
            }

            // Apply date range filters
            if ($dateFrom) {
                $query->where('purchase_date', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->where('purchase_date', '<=', $dateTo . ' 23:59:59');
            }

            // Apply amount range filters
            if ($minAmount !== null && is_numeric($minAmount)) {
                $query->where('total_amount', '>=', (float) $minAmount);
            }
            if ($maxAmount !== null && is_numeric($maxAmount)) {
                $query->where('total_amount', '<=', (float) $maxAmount);
            }

            // Apply supplier filter
            if ($supplierId && is_numeric($supplierId)) {
                $query->where('supplier_id', (int) $supplierId);
            }

            // Apply user filter
            if ($userId && is_numeric($userId)) {
                $query->where('user_id', (int) $userId);
            }

            // Apply sorting
            if ($sortBy === 'purchase_date') {
                $query->orderBy('purchase_date', $sortOrder);
            } elseif ($sortBy === 'total_amount') {
                $query->orderBy('total_amount', $sortOrder);
            } elseif ($sortBy === 'created_at') {
                $query->orderBy('created_at', $sortOrder);
            } else {
                $query->orderByDesc('purchase_date');
            }

            return $query->paginate($perPage, ['*'], 'page', $page);
        });

        return response()->json($result);
    }

    /**
     * Show a single purchase with related items and product details.
     * Optimized with caching for better performance on repeated requests.
     */
    public function show($id)
    {
        // Create cache key for individual purchase lookup
        $key = CacheHelper::key('purchases', 'by_id', ['id' => (int) $id]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_TTL', 60); // Default 1 minute cache

        // Cache the purchase data with all relationships to reduce database queries
        $purchase = Cache::remember($key, now()->addSeconds($ttl), function () use ($id) {
            return Purchase::with([
                'user:id,name,email,role', // Only essential user fields
                'supplier:id,name,email,phone', // Supplier details
                'purchaseItems:id,purchase_id,product_id,quantity,price,created_at', // Purchase item details
                'purchaseItems.product:id,name,price,category_id,image,stock', // Product info
                'purchaseItems.product.category:id,name', // Category name for display
            ])->findOrFail($id);
        });

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
            'purchase_date' => ['nullable','string'], // Accept string and parse manually
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','integer','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.price' => ['required','numeric','min:0'],
        ]);

        $userId = Auth::id();

        $purchase = DB::transaction(function () use ($validated, $userId) {
            $purchase = new Purchase();
            $purchase->supplier_id = (int) $validated['supplier_id'];
            
            // Handle purchase_date with proper timezone parsing
            if (!empty($validated['purchase_date'])) {
                try {
                    $purchase->purchase_date = Carbon::parse($validated['purchase_date'])->setTimezone(config('app.timezone'));
                } catch (\Exception $e) {
                    $purchase->purchase_date = now();
                }
            } else {
                $purchase->purchase_date = now();
            }
            
            $purchase->user_id = $userId;
            $purchase->total_amount = 0; // will compute below
            $purchase->save();

            $total = 0.0;
            foreach ($validated['items'] as $item) {
                $lineTotal = (float) $item['price'] * (int) $item['quantity'];
                $total += $lineTotal;

                // Create purchase item
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => (int) $item['product_id'],
                    'quantity' => (int) $item['quantity'],
                    'price' => (float) $item['price'],
                ]);

                // Update product stock (increase for purchases)
                $product = Product::find($item['product_id']);
                if ($product) {
                    $product->increment('stock', (int) $item['quantity']);
                }
            }

            $purchase->total_amount = $total;
            $purchase->save();

            return $purchase->load([
                'user:id,name,email,role',
                'supplier:id,name,email,phone',
                'purchaseItems:id,purchase_id,product_id,quantity,price,created_at',
                'purchaseItems.product:id,name,price,category_id,image,stock',
                'purchaseItems.product.category:id,name',
            ]);
        });

        // Invalidate caches for purchases, products, stock movements, dashboard
        CacheHelper::bump('purchases');
        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');

        return response()->json($purchase, 201);
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
        // Comprehensive validation for both basic and full updates
        $validated = $request->validate([
            'supplier_id' => ['sometimes','integer','exists:suppliers,id'],
            'purchase_date' => ['nullable','string'], // Accept ISO string and parse manually
            'items' => ['sometimes','array','min:1'], // Optional but if provided must be valid
            'items.*.product_id' => ['required_with:items','integer','exists:products,id'],
            'items.*.quantity' => ['required_with:items','integer','min:1'],
            'items.*.price' => ['required_with:items','numeric','min:0'],
        ]);

        // Use database transaction for data integrity
        $purchase = DB::transaction(function () use ($validated, $id) {
            // Find purchase with items for potential updates
            $purchase = Purchase::with('purchaseItems')->findOrFail($id);
            
            // Update basic purchase fields
            if (isset($validated['supplier_id'])) {
                $purchase->supplier_id = (int) $validated['supplier_id'];
            }
            
            // Handle purchase_date with proper timezone parsing and error handling
            if (!empty($validated['purchase_date'])) {
                try {
                    $purchase->purchase_date = Carbon::parse($validated['purchase_date'])->setTimezone(config('app.timezone'));
                } catch (\Exception $e) {
                    Log::warning('Failed to parse purchase_date in update', [
                        'purchase_id' => $id,
                        'purchase_date' => $validated['purchase_date'],
                        'error' => $e->getMessage()
                    ]);
                    // Keep existing purchase_date if parsing fails
                }
            }
            
            // Handle items update if provided (complete replacement strategy)
            if (isset($validated['items'])) {
                // Restore stock from existing items before deletion
                foreach ($purchase->purchaseItems as $item) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->decrement('stock', $item->quantity);
                    }
                }
                
                // Delete existing items
                $purchase->purchaseItems()->delete();
                
                // Create new items and calculate new total
                $total = 0.0;
                foreach ($validated['items'] as $item) {
                    $lineTotal = (float) $item['price'] * (int) $item['quantity'];
                    $total += $lineTotal;

                    PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => (int) $item['product_id'],
                        'quantity' => (int) $item['quantity'],
                        'price' => (float) $item['price'],
                    ]);
                    
                    // Update product stock (increase for new purchases)
                    $product = Product::find($item['product_id']);
                    if ($product) {
                        $product->increment('stock', (int) $item['quantity']);
                    }
                }
                
                $purchase->total_amount = $total;
            }
            
            // Save the updated purchase
            $purchase->save();
            
            // Return purchase with fresh relationships
            return $purchase->load([
                'user:id,name,email,role',
                'supplier:id,name,email,phone',
                'purchaseItems:id,purchase_id,product_id,quantity,price,created_at',
                'purchaseItems.product:id,name,price,category_id,image,stock',
                'purchaseItems.product.category:id,name',
            ]);
        });

        // Invalidate relevant caches for performance consistency
        CacheHelper::bump('purchases'); // Clear all purchase-related caches
        CacheHelper::bump('products'); // Product stock may have changed
        CacheHelper::bump('stock_movements'); // Stock movements affected
        CacheHelper::bump('dashboard_metrics'); // Dashboard data needs refresh

        return response()->json($purchase);
    }

    /**
     * Delete a purchase and its items.
     */
    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            $purchase = Purchase::with('purchaseItems')->findOrFail($id);
            
            // Restore stock from purchase items before deletion
            foreach ($purchase->purchaseItems as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->decrement('stock', $item->quantity);
                }
            }
            
            // Delete items and purchase
            $purchase->purchaseItems()->delete();
            $purchase->delete();
        });

        CacheHelper::bump('purchases');
        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');

        return response()->json(['success' => true]);
    }

    /**
     * Export purchases data to CSV
     */
    public function export(Request $request)
    {
        $search = (string) $request->input('search', '');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $format = $request->input('format', 'csv'); // csv or json

        $query = Purchase::query()
            ->with([
                'user:id,name,email',
                'supplier:id,name,email,phone',
                'purchaseItems:id,purchase_id,product_id,quantity,price',
                'purchaseItems.product:id,name,category_id',
                'purchaseItems.product.category:id,name',
            ])
            ->orderByDesc('purchase_date');

        // Apply search filters (same as index method)
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->whereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%$search%");
                  })
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%$search%");
                  })
                  ->orWhereHas('purchaseItems.product', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%$search%")
                         ->orWhereHas('category', function ($cq) use ($search) {
                             $cq->where('name', 'like', "%$search%");
                         });
                  });
            });
        }

        // Apply date filters
        if ($dateFrom) {
            $query->where('purchase_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('purchase_date', '<=', $dateTo . ' 23:59:59');
        }

        $purchases = $query->limit(1000)->get(); // Limit to prevent memory issues

        if ($format === 'json') {
            return response()->json($purchases);
        }

        // Generate CSV
        $filename = 'purchases_export_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Pragma' => 'public',
        ];

        $callback = function() use ($purchases) {
            $file = fopen('php://output', 'w');
            
            // CSV Header
            fputcsv($file, [
                'Purchase ID',
                'Date',
                'Supplier',
                'Supplier Email',
                'Purchaser',
                'Total Amount',
                'Product Name',
                'Category',
                'Quantity',
                'Unit Price',
                'Line Total'
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
                    // Purchase with no items
                    fputcsv($file, [
                        $purchase->id,
                        $purchase->purchase_date,
                        $purchase->supplier->name ?? '',
                        $purchase->supplier->email ?? '',
                        $purchase->user->name ?? '',
                        $purchase->total_amount,
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
     * Get purchases for a specific product - used by ProductDetails page.
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
        
        // Create cache key for product-specific purchases
        $key = CacheHelper::key('purchases', 'by_product', ['product_id' => $productId]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_TTL', 60); // 1 minute cache
        
        // Cache the purchases data to reduce database load
        $purchases = Cache::remember($key, now()->addSeconds($ttl), function () use ($productId) {
            return Purchase::with([
                'user:id,name,email,role',
                'supplier:id,name,email,phone',
                'purchaseItems' => function ($query) use ($productId) {
                    // Only get items for this specific product
                    $query->where('product_id', $productId)
                          ->select('id', 'purchase_id', 'product_id', 'quantity', 'price', 'created_at');
                },
                'purchaseItems.product:id,name,price,category_id,image',
                'purchaseItems.product.category:id,name',
            ])
            ->whereHas('purchaseItems', function ($query) use ($productId) {
                // Only purchases that contain this product
                $query->where('product_id', $productId);
            })
            ->orderByDesc('purchase_date')
            ->limit(50) // Limit to recent 50 purchases for performance
            ->get()
            ->map(function ($purchase) {
                // Transform data for frontend compatibility
                return [
                    'id' => $purchase->id,
                    'purchase_date' => $purchase->purchase_date,
                    'total_amount' => $purchase->total_amount,
                    'user' => $purchase->user,
                    'supplier' => $purchase->supplier,
                    'created_at' => $purchase->created_at,
                    // Only include items for this product
                    'items' => $purchase->purchaseItems->map(function ($item) {
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
        
        return response()->json($purchases);
    }
}
