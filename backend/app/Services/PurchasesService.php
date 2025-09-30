<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Support\CacheHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;

/**
 * PurchasesService
 *
 * Centralizes business logic for purchases: listing, fetching, creating,
 * updating, deleting, and exporting. Also handles stock updates and cache
 * invalidation to keep controllers minimal.
 */
class PurchasesService
{
    public function __construct(
        protected NotificationService $notificationService,
    ) {}

    /**
     * Get paginated list of purchases with filters and caching
     */
    public function getPaginatedPurchases(array $filters): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $search = (string) ($filters['search'] ?? '');
        $sortBy = (string) ($filters['sort_by'] ?? 'purchase_date');
        $sortOrder = (string) ($filters['sort_order'] ?? 'desc');
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;
        $minAmount = $filters['min_amount'] ?? null;
        $maxAmount = $filters['max_amount'] ?? null;
        $supplierId = $filters['supplier_id'] ?? null;
        $userId = $filters['user_id'] ?? null;

        // Validate sort params
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

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($page, $perPage, $search, $sortBy, $sortOrder, $dateFrom, $dateTo, $minAmount, $maxAmount, $supplierId, $userId) {
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

            $this->applyFilters($query, $search, $dateFrom, $dateTo, $minAmount, $maxAmount, $supplierId, $userId);
            $this->applySorting($query, $sortBy, $sortOrder);

            return $query->paginate($perPage, ['*'], 'page', $page)->toArray();
        });
    }

    /**
     * Get single purchase by ID with relationships and caching
     */
    public function getPurchaseById(int $id): Purchase
    {
        $key = CacheHelper::key('purchases', 'by_id', ['id' => $id]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_TTL', 60);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($id) {
            return Purchase::with([
                'user:id,name,email,role',
                'supplier:id,name,email,phone',
                'purchaseItems:id,purchase_id,product_id,quantity,price,created_at',
                'purchaseItems.product:id,name,price,category_id,image,stock',
                'purchaseItems.product.category:id,name',
            ])->findOrFail($id);
        });
    }

    /**
     * Create a new purchase; updates stock and calculates totals
     */
    public function createPurchase(array $data, int $userId): Purchase
    {
        return DB::transaction(function () use ($data, $userId) {
            $purchase = new Purchase();
            $purchase->user_id = $userId;
            $purchase->supplier_id = (int) $data['supplier_id'];
            $purchase->purchase_date = isset($data['purchase_date']) && $data['purchase_date']
                ? Carbon::parse($data['purchase_date'])
                : now();
            $purchase->tax = isset($data['tax']) ? (float) $data['tax'] : 0;
            $purchase->discount = isset($data['discount']) ? (float) $data['discount'] : 0;

            $totals = $this->calculateTotals($data['items'], $purchase->tax, $purchase->discount);
            $purchase->total_amount = $totals['total'];
            $purchase->save();

            // Create items and increment stock + record stock movements
            foreach ($data['items'] as $itemData) {
                $purchaseItem = PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => (int) $itemData['product_id'],
                    'quantity' => (int) $itemData['quantity'],
                    'price' => (float) $itemData['price'],
                ]);

                $this->adjustStockWithMovement(
                    (int) $itemData['product_id'],
                    (int) $itemData['quantity'],
                    'in',
                    $purchaseItem->id,
                    'purchase_create',
                    (int) $userId
                );
            }

            $this->invalidateCaches();

            return $purchase->load([
                'user:id,name,email,role',
                'supplier:id,name,email,phone',
                'purchaseItems:id,purchase_id,product_id,quantity,price,created_at',
                'purchaseItems.product:id,name,price,category_id,image,stock',
                'purchaseItems.product.category:id,name',
            ]);
        });
    }

    /**
     * Update an existing purchase; handles stock adjustments
     */
    public function updatePurchase(int $id, array $data): Purchase
    {
        return DB::transaction(function () use ($id, $data) {
            $purchase = Purchase::with('purchaseItems')->findOrFail($id);

            if (isset($data['supplier_id'])) {
                $purchase->supplier_id = (int) $data['supplier_id'];
            }
            if (isset($data['tax'])) {
                $purchase->tax = (float) $data['tax'];
            }
            if (isset($data['discount'])) {
                $purchase->discount = (float) $data['discount'];
            }
            if (isset($data['purchase_date']) && $data['purchase_date']) {
                $purchase->purchase_date = Carbon::parse($data['purchase_date']);
            }

            if (isset($data['items'])) {
                // Restore stock from existing items (reverse the original increments) and record OUT movements
                foreach ($purchase->purchaseItems as $item) {
                    $this->adjustStockWithMovement(
                        (int) $item->product_id,
                        (int) $item->quantity,
                        'out',
                        (int) $item->id,
                        'purchase_update_remove',
                        $this->currentUserId()
                    );
                }

                // Delete existing items
                $purchase->purchaseItems()->delete();

                // Create new items and increment stock + record IN movements
                foreach ($data['items'] as $itemData) {
                    $purchaseItem = PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => (int) $itemData['product_id'],
                        'quantity' => (int) $itemData['quantity'],
                        'price' => (float) $itemData['price'],
                    ]);

                    $this->adjustStockWithMovement(
                        (int) $itemData['product_id'],
                        (int) $itemData['quantity'],
                        'in',
                        $purchaseItem->id,
                        'purchase_update_add',
                        $this->currentUserId()
                    );
                }

                // Recalculate totals with new items
                $totals = $this->calculateTotals($data['items'], $purchase->tax, $purchase->discount);
                $purchase->total_amount = $totals['total'];
            } else {
                // If only tax/discount changed, recalc totals based on existing items
                if (isset($data['tax']) || isset($data['discount'])) {
                    $items = $purchase->purchaseItems->map(fn($item) => [
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                    ])->toArray();
                    $totals = $this->calculateTotals($items, $purchase->tax, $purchase->discount);
                    $purchase->total_amount = $totals['total'];
                }
            }

            $purchase->save();
            $this->invalidateCaches();

            return $purchase->load([
                'user:id,name,email,role',
                'supplier:id,name,email,phone',
                'purchaseItems:id,purchase_id,product_id,quantity,price,created_at',
                'purchaseItems.product:id,name,price,category_id,image,stock',
                'purchaseItems.product.category:id,name',
            ]);
        });
    }

    /**
     * Delete a purchase and reverse stock changes
     */
    public function deletePurchase(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $purchase = Purchase::with('purchaseItems')->findOrFail($id);

            foreach ($purchase->purchaseItems as $item) {
                $this->adjustStockWithMovement(
                    (int) $item->product_id,
                    (int) $item->quantity,
                    'out',
                    (int) $item->id,
                    'purchase_delete',
                    $this->currentUserId()
                );
            }

            $purchase->purchaseItems()->delete();
            $purchase->delete();

            $this->invalidateCaches();
            return true;
        });
    }

    /**
     * Export purchases data (returns a collection)
     */
    public function exportPurchases(array $filters): \Illuminate\Database\Eloquent\Collection
    {
        $query = Purchase::query()
            ->with([
                'user:id,name,email',
                'supplier:id,name,email,phone',
                'purchaseItems:id,purchase_id,product_id,quantity,price',
                'purchaseItems.product:id,name,category_id',
                'purchaseItems.product.category:id,name',
            ]);

        $search = $filters['search'] ?? '';
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo = $filters['date_to'] ?? null;

        $this->applyFilters($query, $search, $dateFrom, $dateTo);

        return $query->orderBy('purchase_date', 'desc')->get();
    }

    /**
     * Get purchases for a specific product (for ProductDetails)
     */
    public function getPurchasesByProduct(int $productId): array
    {
        $key = CacheHelper::key('purchases', 'by_product', ['product_id' => $productId]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_TTL', 60);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($productId) {
            return Purchase::with([
                'user:id,name,email,role',
                'supplier:id,name,email,phone',
                'purchaseItems' => function ($query) use ($productId) {
                    $query->where('product_id', $productId)
                          ->select('id', 'purchase_id', 'product_id', 'quantity', 'price', 'created_at');
                },
                'purchaseItems.product:id,name,price,category_id,image',
                'purchaseItems.product.category:id,name',
            ])
            ->whereHas('purchaseItems', function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->orderByDesc('purchase_date')
            ->limit(50)
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_date' => $purchase->purchase_date,
                    'total_amount' => $purchase->total_amount,
                    'user' => $purchase->user,
                    'supplier' => $purchase->supplier,
                    'created_at' => $purchase->created_at,
                    'items' => $purchase->purchaseItems->map(function ($item) {
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
     * Apply filters to purchases query
     */
    private function applyFilters($query, string $search = '', $dateFrom = null, $dateTo = null, $minAmount = null, $maxAmount = null, $supplierId = null, $userId = null): void
    {
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

        if ($dateFrom) {
            $query->where('purchase_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->where('purchase_date', '<=', $dateTo . ' 23:59:59');
        }
        if ($minAmount !== null && is_numeric($minAmount)) {
            $query->where('total_amount', '>=', (float) $minAmount);
        }
        if ($maxAmount !== null && is_numeric($maxAmount)) {
            $query->where('total_amount', '<=', (float) $maxAmount);
        }
        if ($supplierId && is_numeric($supplierId)) {
            $query->where('supplier_id', (int) $supplierId);
        }
        if ($userId && is_numeric($userId)) {
            $query->where('user_id', (int) $userId);
        }
    }

    /**
     * Apply sorting to purchases query
     */
    private function applySorting($query, string $sortBy, string $sortOrder): void
    {
        switch ($sortBy) {
            case 'purchase_date':
                $query->orderBy('purchase_date', $sortOrder);
                break;
            case 'total_amount':
                $query->orderBy('total_amount', $sortOrder);
                break;
            case 'created_at':
                $query->orderBy('created_at', $sortOrder);
                break;
            default:
                $query->orderBy('purchase_date', 'desc');
                break;
        }
    }

    /**
     * Calculate totals including tax and discount percentages
     */
    private function calculateTotals(array $items, float $tax = 0, float $discount = 0): array
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
            'total' => max(0, $total),
        ];
    }

    /**
     * Invalidate caches related to purchases and inventory
     */
    private function invalidateCaches(): void
    {
        CacheHelper::bump('purchases');
        CacheHelper::bump('products');
        CacheHelper::bump('stock_movements');
        CacheHelper::bump('dashboard_metrics');
        CacheHelper::bump('Purchase');
        CacheHelper::bump('Product');
        CacheHelper::bump('PurchaseItem');
        
        // Invalidate GraphQL specific caches
        CacheHelper::bump('paginated_purchase_items');
        CacheHelper::bump('paginated_sale_items');
        CacheHelper::bump('paginated_stock_movements');
    }

    /**
     * Adjust product stock and record a StockMovement in one place.
     * $direction must be 'in' or 'out'.
     */
    private function adjustStockWithMovement(
        int $productId,
        int $quantity,
        string $direction,
        int $sourceId,
        string $reason,
        int $userId
    ): void {
        if ($quantity <= 0) {
            return;
        }

        $product = Product::lockForUpdate()->find($productId);
        if (!$product) {
            return;
        }

        $previous = (int) $product->stock;

        if ($direction === 'in') {
            $new = $previous + $quantity;
            $product->increment('stock', $quantity);
        } else {
            $new = max(0, $previous - $quantity);
            $product->decrement('stock', $quantity);
        }

        StockMovement::create([
            'product_id' => $product->id,
            'type' => $direction === 'in' ? 'in' : 'out',
            'quantity' => $quantity,
            'previous_stock' => $previous,
            'new_stock' => $new,
            'source_type' => \App\Models\PurchaseItem::class,
            'source_id' => $sourceId,
            'movement_date' => now(),
            'reason' => $reason,
            'user_id' => $userId,
        ]);

        // Clear low-stock alerts if stock was replenished above threshold
        if ($direction === 'in') {
            $threshold = $product->low_stock_threshold ?? 10;
            if ($previous <= $threshold && $new > $threshold) {
                $this->notificationService->clearLowStockAlertsForProduct($product->id);
            }
        }
    }

    private function currentUserId(): int
    {
        return (int) (Auth::id() ?? 0);
    }
}
