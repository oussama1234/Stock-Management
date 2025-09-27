<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\StockValidationService;
use App\Support\CacheHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SalesService
 * 
 * Business logic for sales operations including creation, updates, listing, and calculations.
 * Handles stock validation, cache management, and data integrity.
 */
class SalesService
{
    protected StockValidationService $stockValidationService;

    public function __construct(StockValidationService $stockValidationService)
    {
        $this->stockValidationService = $stockValidationService;
    }

    /**
     * Get paginated list of sales with filters and caching
     */
    public function getPaginatedSales(array $filters): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $search = (string) ($filters['search'] ?? '');
        $sortBy = (string) ($filters['sort_by'] ?? 'updated_at');
        $sortOrder = (string) ($filters['sort_order'] ?? 'desc');
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;
        $minAmount = $filters['min_amount'] ?? null;
        $maxAmount = $filters['max_amount'] ?? null;
        $customerId = $filters['customer_id'] ?? null;
        $userId = $filters['user_id'] ?? null;
        
        // Validate sort parameters
        $allowedSortColumns = ['sale_date', 'total_amount', 'customer_name', 'created_at', 'updated_at'];
        if (!in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'updated_at';
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

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($page, $perPage, $search, $sortBy, $sortOrder, $dateFrom, $dateTo, $minAmount, $maxAmount, $customerId, $userId) {
            $query = Sale::query()
                ->with([
                    'user:id,name,email,role',
                    'items' => function ($q) {
                        $q->select('id','sale_id','product_id','quantity','price','created_at');
                    },
                    'items.product:id,name,category_id,image,price',
                    'items.product.category:id,name',
                ]);

            $this->applyFilters($query, $search, $dateFrom, $dateTo, $minAmount, $maxAmount, $customerId, $userId);
            $this->applySorting($query, $sortBy, $sortOrder);

            return $query->paginate($perPage, ['*'], 'page', $page)->toArray();
        });
    }

    /**
     * Get single sale by ID with relationships and caching
     */
    public function getSaleById(int $id): Sale
    {
        $key = CacheHelper::key('sales', 'by_id', ['id' => $id]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_TTL', 60);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($id) {
            return Sale::with([
                'user:id,name,email,role',
                'items:id,sale_id,product_id,quantity,price,created_at',
                'items.product:id,name,price,category_id,image,stock',
                'items.product.category:id,name',
            ])->findOrFail($id);
        });
    }

    /**
     * Create a new sale with stock validation and proper calculations
     */
    public function createSale(array $data, int $userId): Sale
    {
        // Validate stock availability before creating sale
        $stockValidation = $this->stockValidationService->validateStockForNewSale($data['items']);
        
        if (!$stockValidation['valid']) {
            $errorMessage = 'Stock validation failed: ';
            $stockErrors = [];
            
            foreach ($stockValidation['errors'] as $error) {
                $stockErrors[] = $error['error'];
            }
            
            throw new \Exception($errorMessage . implode(', ', $stockErrors));
        }

        return DB::transaction(function () use ($data, $userId) {
            // Create sale record
            $sale = new Sale();
            $sale->user_id = $userId;
            $sale->customer_name = $data['customer_name'] ?? null;
            $sale->tax = isset($data['tax']) ? (float) $data['tax'] : 0;
            $sale->discount = isset($data['discount']) ? (float) $data['discount'] : 0;
            $sale->sale_date = isset($data['sale_date']) && $data['sale_date'] 
                ? Carbon::parse($data['sale_date']) 
                : now();

            // Calculate totals
            $totals = $this->calculateSaleTotals($data['items'], $sale->tax, $sale->discount);
            $sale->total_amount = $totals['total'];
            $sale->save();

            // Create sale items (this triggers SaleItemObserver for stock updates)
            foreach ($data['items'] as $itemData) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => (int) $itemData['product_id'],
                    'quantity' => (int) $itemData['quantity'],
                    'price' => (float) $itemData['price'],
                ]);
            }

            // Invalidate caches
            $this->invalidateCaches();

            // Load relationships and return
            return $sale->load([
                'user:id,name,email,role',
                'items:id,sale_id,product_id,quantity,price,created_at',
                'items.product:id,name,price,category_id,image,stock',
                'items.product.category:id,name',
            ]);
        });
    }

    /**
     * Update an existing sale
     */
    public function updateSale(int $id, array $data): Sale
    {
        return DB::transaction(function () use ($id, $data) {
            $sale = Sale::with('items')->findOrFail($id);

            // Update basic fields
            if (isset($data['customer_name'])) {
                $sale->customer_name = $data['customer_name'];
            }
            if (isset($data['tax'])) {
                $sale->tax = (float) $data['tax'];
            }
            if (isset($data['discount'])) {
                $sale->discount = (float) $data['discount'];
            }
            if (isset($data['sale_date']) && $data['sale_date']) {
                $sale->sale_date = Carbon::parse($data['sale_date']);
            }

            // Handle items update if provided
            if (isset($data['items'])) {
                // Validate stock for updated items
                $stockValidation = $this->stockValidationService->validateStockForSaleUpdate($id, $data['items']);
                
                if (!$stockValidation['valid']) {
                    $errorMessage = 'Stock validation failed: ';
                    $stockErrors = [];
                    
                    foreach ($stockValidation['errors'] as $error) {
                        $stockErrors[] = $error['error'];
                    }
                    
                    throw new \Exception($errorMessage . implode(', ', $stockErrors));
                }

                // Delete existing items (observer will restore stock)
                $sale->items()->delete();

                // Create new items
                foreach ($data['items'] as $itemData) {
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => (int) $itemData['product_id'],
                        'quantity' => (int) $itemData['quantity'],
                        'price' => (float) $itemData['price'],
                    ]);
                }

                // Recalculate total with new items
                $totals = $this->calculateSaleTotals($data['items'], $sale->tax, $sale->discount);
                $sale->total_amount = $totals['total'];
            } else {
                // Recalculate total if tax/discount changed but items didn't
                if (isset($data['tax']) || isset($data['discount'])) {
                    $items = $sale->items->map(fn($item) => [
                        'quantity' => $item->quantity,
                        'price' => $item->price
                    ])->toArray();
                    
                    $totals = $this->calculateSaleTotals($items, $sale->tax, $sale->discount);
                    $sale->total_amount = $totals['total'];
                }
            }

            $sale->save();
            $this->invalidateCaches();

            return $sale->load([
                'user:id,name,email,role',
                'items:id,sale_id,product_id,quantity,price,created_at',
                'items.product:id,name,price,category_id,image,stock',
                'items.product.category:id,name',
            ]);
        });
    }

    /**
     * Delete a sale and its items
     */
    public function deleteSale(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $sale = Sale::with('items')->findOrFail($id);
            
            // Delete items (observer will restore stock)
            $sale->items()->delete();
            
            // Delete sale
            $sale->delete();
            
            $this->invalidateCaches();
            
            return true;
        });
    }

    /**
     * Export sales data
     */
    public function exportSales(array $filters): \Illuminate\Database\Eloquent\Collection
    {
        $query = Sale::query()
            ->with([
                'user:id,name,email',
                'items:id,sale_id,product_id,quantity,price',
                'items.product:id,name,category_id',
                'items.product.category:id,name',
            ]);

        $search = $filters['search'] ?? '';
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;

        $this->applyFilters($query, $search, $dateFrom, $dateTo);

        return $query->orderBy('sale_date', 'desc')->get();
    }

    /**
     * Get sales for a specific product (for ProductDetails)
     */
    public function getSalesByProduct(int $productId): array
    {
        $key = CacheHelper::key('sales', 'by_product', ['product_id' => $productId]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_TTL', 60);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($productId) {
            return Sale::with([
                'user:id,name,email,role',
                'items' => function ($query) use ($productId) {
                    $query->where('product_id', $productId)
                          ->select('id', 'sale_id', 'product_id', 'quantity', 'price', 'created_at');
                },
                'items.product:id,name,price,category_id,image',
                'items.product.category:id,name',
            ])
            ->whereHas('items', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->orderByDesc('sale_date')
            ->limit(50)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'customer_name' => $sale->customer_name,
                    'sale_date' => $sale->sale_date,
                    'tax' => $sale->tax,
                    'discount' => $sale->discount,
                    'total_amount' => $sale->total_amount,
                    'user' => $sale->user,
                    'created_at' => $sale->created_at,
                    'items' => $sale->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'created_at' => $item->created_at,
                        ];
                    })
                ];
            })->toArray();
        });
    }

    /**
     * Apply filters to query
     */
    private function applyFilters($query, string $search = '', $dateFrom = null, $dateTo = null, $minAmount = null, $maxAmount = null, $customerId = null, $userId = null): void
    {
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

        if ($dateFrom) {
            $query->where('sale_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('sale_date', '<=', $dateTo . ' 23:59:59');
        }
        if ($minAmount !== null && is_numeric($minAmount)) {
            $query->where('total_amount', '>=', (float) $minAmount);
        }
        if ($maxAmount !== null && is_numeric($maxAmount)) {
            $query->where('total_amount', '<=', (float) $maxAmount);
        }
        if ($customerId) {
            $query->where('customer_name', 'like', "%$customerId%");
        }
        if ($userId && is_numeric($userId)) {
            $query->where('user_id', (int) $userId);
        }
    }

    /**
     * Apply sorting to query
     */
    private function applySorting($query, string $sortBy, string $sortOrder): void
    {
        switch ($sortBy) {
            case 'sale_date':
                $query->orderBy('sale_date', $sortOrder)->orderBy('id', $sortOrder);
                break;
            case 'total_amount':
                $query->orderBy('total_amount', $sortOrder)->orderBy('id', 'desc');
                break;
            case 'customer_name':
                $query->orderBy('customer_name', $sortOrder)->orderBy('id', 'desc');
                break;
            case 'created_at':
                $query->orderBy('created_at', $sortOrder)->orderBy('id', $sortOrder);
                break;
            case 'updated_at':
                $query->orderBy('updated_at', $sortOrder)->orderBy('id', $sortOrder);
                break;
            default:
                $query->orderBy('updated_at', 'desc')->orderBy('id', 'desc');
                break;
        }
    }

    /**
     * Calculate sale totals including tax and discount
     */
    private function calculateSaleTotals(array $items, float $tax = 0, float $discount = 0): array
    {
        $subtotal = 0.0;
        
        foreach ($items as $item) {
            $lineTotal = (float) $item['price'] * (int) $item['quantity'];
            $subtotal += $lineTotal;
        }
        
        $taxAmount = ($tax / 100) * $subtotal;
        $discountAmount = ($discount / 100) * $subtotal;
        $total = $subtotal + $taxAmount - $discountAmount;
        
        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'discount_amount' => $discountAmount,
            'total' => max(0, $total)
        ];
    }

    /**
     * Invalidate relevant caches
     */
    private function invalidateCaches(): void
    {
        CacheHelper::bump('sales');
        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');
        CacheHelper::bump('Sale');
        CacheHelper::bump('Product');
        CacheHelper::bump('SaleItem');
        CacheHelper::bump('StockMovement');
        CacheHelper::bump('DashboardMetrics');
    }
}