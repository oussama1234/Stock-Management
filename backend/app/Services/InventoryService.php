<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use App\Support\CacheHelper;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * InventoryService
 *
 * Centralized business logic for inventory overview, adjustments, and audit history.
 * Optimized for performance and readability. Controllers must remain minimal.
 */
class InventoryService
{
    public function __construct(
        protected NotificationService $notificationService,
    ) {}

    /**
     * Get paginated stock overview per product with filters and caching
     */
    public function getStockOverview(array $filters): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $search = trim((string) ($filters['search'] ?? ''));
        $categoryId = $filters['category_id'] ?? null;
        $supplierId = $filters['supplier_id'] ?? null; // via purchases relation if needed
        $stockStatus = $filters['stock_status'] ?? null; // low|out|in
        $sortBy = $filters['sort_by'] ?? 'updated_at';
        $sortOrder = in_array(($filters['sort_order'] ?? 'desc'), ['asc','desc'], true) ? $filters['sort_order'] : 'desc';

        $allowedSort = ['name','stock','reserved_stock','updated_at','created_at'];
        if (!in_array($sortBy, $allowedSort, true)) $sortBy = 'updated_at';

        $cacheKey = CacheHelper::key('inventory', 'overview', compact('page','perPage','search','categoryId','supplierId','stockStatus','sortBy','sortOrder'));
        $ttl = CacheHelper::ttlSeconds('API_INVENTORY_TTL', 30);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($page,$perPage,$search,$categoryId,$supplierId,$stockStatus,$sortBy,$sortOrder) {
            $query = Product::query()
                ->select(['id','name','price','image','category_id','stock','reserved_stock','low_stock_threshold','updated_at'])
                ->with(['category:id,name'])
                ->when($search !== '', function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%");
                })
                ->when($categoryId, fn($q) => $q->where('category_id', (int) $categoryId))
                ->when($supplierId, function ($q) use ($supplierId) {
                    $q->whereHas('purchaseItems.purchase', fn($p) => $p->where('supplier_id', (int) $supplierId));
                })
                ->when($stockStatus, fn($q) => $q->stockStatus($stockStatus))
                ->orderBy($sortBy, $sortOrder)
                ->orderBy('id', $sortOrder);

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            // Map with computed available stock and alert flag
            $data = $paginator->getCollection()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'image' => $p->image,
                    'price' => (float) $p->price,
                    'category' => $p->category,
                    'stock' => (int) $p->stock,
                    'reserved_stock' => (int) ($p->reserved_stock ?? 0),
                    'available_stock' => max(0, (int) $p->stock - (int) ($p->reserved_stock ?? 0)),
                    'low_stock_threshold' => (int) ($p->low_stock_threshold ?? 10),
                    'low_stock' => (int) $p->stock <= (int) ($p->low_stock_threshold ?? 10),
                    'updated_at' => $p->updated_at,
                ];
            });

            return [
                'data' => $data->toArray(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ]
            ];
        });
    }

    /**
     * Perform a stock adjustment for a product
     */
    public function adjustInventory(int $productId, int $newQty, string $reason, int $userId): array
    {
        return DB::transaction(function () use ($productId, $newQty, $reason, $userId) {
            $product = Product::lockForUpdate()->findOrFail($productId);
            $previous = (int) $product->stock;
            $new = max(0, (int) $newQty);
            $diff = $new - $previous;

            if ($diff === 0) {
                return [
                    'product' => $product,
                    'movement' => null,
                    'message' => 'No change in quantity.'
                ];
            }

            $product->stock = $new;
            $product->save();

            $movement = StockMovement::create([
                'product_id' => $product->id,
                'type' => $diff > 0 ? 'in' : 'out',
                'quantity' => abs($diff),
                'previous_stock' => $previous,
                'new_stock' => $new,
'source_type' => \App\Models\Product::class,
                'source_id' => $product->id,
                'movement_date' => now(),
                'reason' => $reason,
                'user_id' => $userId,
            ]);

            // Clear low-stock alerts if we crossed above threshold
            $threshold = $product->low_stock_threshold ?? 10;
            if ($previous <= $threshold && $new > $threshold) {
                $this->notificationService->clearLowStockAlertsForProduct($product->id);
            }
            // Trigger a low stock check if we dropped to/below threshold
            if ($new <= $threshold && $previous > $threshold) {
                \App\Jobs\CheckLowStockJob::dispatch()->delay(now()->addMinutes(1));
            }

            // Bump caches
            CacheHelper::bump('products');
            CacheHelper::bump('stock_movements');
            CacheHelper::bump('dashboard_metrics');
            CacheHelper::bump('notifications');

            return [
                'product' => $product->fresh(['category']),
                'movement' => $movement,
                'message' => 'Inventory adjusted successfully.'
            ];
        });
    }

    /**
     * Inventory history (audit) with filters and pagination
     */
    public function getInventoryHistory(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange(
            $filters['date_range'] ?? 'last_30_days',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null,
        );

        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(200, (int) ($filters['per_page'] ?? 50)));
        $productId = isset($filters['product_id']) ? (int) $filters['product_id'] : null;
        $type = $filters['type'] ?? null; // in|out|null
        $reason = $filters['reason'] ?? null;
        $userId = isset($filters['user_id']) ? (int) $filters['user_id'] : null;
        $sortOrder = in_array(($filters['sort_order'] ?? 'desc'), ['asc','desc'], true) ? $filters['sort_order'] : 'desc';

        $cacheKey = CacheHelper::key('inventory', 'history', [
            'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'page' => $page, 'per' => $perPage, 'product_id' => $productId,
            'type' => $type, 'reason' => $reason, 'user_id' => $userId, 'order' => $sortOrder
        ]);
        $ttl = CacheHelper::ttlSeconds('API_INVENTORY_TTL', 30);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($from,$to,$page,$perPage,$productId,$type,$reason,$userId,$sortOrder) {
            $query = StockMovement::query()
                ->with([
                    'product:id,name,category_id',
                    'product.category:id,name',
                    'user:id,name,email'
                ])
                ->whereBetween('movement_date', [$from, $to])
                ->when($productId, fn($q) => $q->where('product_id', $productId))
                ->when(in_array($type, ['in','out'], true), fn($q) => $q->where('type', $type))
                ->when($reason, fn($q) => $q->where('reason', $reason))
                ->when($userId, fn($q) => $q->where('user_id', $userId))
                ->orderBy('movement_date', $sortOrder)
                ->orderBy('id', $sortOrder);

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ]
            ];
        });
    }

    /**
     * Export inventory history in CSV (PDF stubbed)
     */
    public function exportInventoryHistory(array $filters, string $format = 'csv'): array
    {
        $filters['per_page'] = 10000; // large export size
        $filters['page'] = 1;
        $result = $this->getInventoryHistory($filters);
        $rows = $result['data'];

        if ($format === 'csv') {
            $csv = $this->toCsv($rows);
            return ['format' => 'csv', 'content' => $csv];
        }

        // PDF export can be implemented via a PDF library (stubbed)
        return ['format' => 'pdf', 'content' => 'PDF export not implemented'];
    }

    private function toCsv($rows): string
    {
        $out = fopen('php://temp', 'r+');
        fputcsv($out, ['ID','Product','Category','Type','Quantity','Previous','New','Reason','User','Date']);
        foreach ($rows as $r) {
            // Accept both arrays and objects
            $productName = is_array($r) ? ($r['product']['name'] ?? null) : ($r->product->name ?? null);
            $categoryName = is_array($r) ? ($r['product']['category']['name'] ?? null) : ($r->product->category->name ?? null);
            $userName = is_array($r)
                ? ($r['user']['name'] ?? $r['user_name'] ?? null)
                : (($r->user->name ?? $r->user_name ?? null));
            fputcsv($out, [
                is_array($r) ? ($r['id'] ?? null) : $r->id,
                $productName,
                $categoryName,
                is_array($r) ? ($r['type'] ?? null) : $r->type,
                is_array($r) ? ($r['quantity'] ?? null) : $r->quantity,
                is_array($r) ? ($r['previous_stock'] ?? null) : $r->previous_stock,
                is_array($r) ? ($r['new_stock'] ?? null) : $r->new_stock,
                is_array($r) ? ($r['reason'] ?? null) : $r->reason,
                $userName,
                is_array($r) ? ($r['movement_date'] ?? null) : $r->movement_date,
            ]);
        }
        rewind($out);
        return stream_get_contents($out);
    }

    /**
     * Resolve date ranges consistent with ReportsService
     */
    public function resolveDateRange(string $range, ?string $from = null, ?string $to = null): array
    {
        $now = Carbon::now();
        $end = $to ? Carbon::parse($to)->endOfDay() : $now->endOfDay();
        $start = match ($range) {
            'last_7_days' => $end->copy()->subDays(6)->startOfDay(),
            'last_14_days' => $end->copy()->subDays(13)->startOfDay(),
            'last_30_days' => $end->copy()->subDays(29)->startOfDay(),
            'last_60_days' => $end->copy()->subDays(59)->startOfDay(),
            'last_90_days' => $end->copy()->subDays(89)->startOfDay(),
            'last_6_months' => $end->copy()->subMonthsNoOverflow(6)->startOfDay(),
            'last_year' => $end->copy()->subYear()->startOfDay(),
            'custom' => $from ? Carbon::parse($from)->startOfDay() : $now->copy()->subDays(29)->startOfDay(),
            default => $end->copy()->subDays(29)->startOfDay(),
        };
        return [$start, $end];
    }

    /**
     * Dashboard KPIs for inventory
     */
    public function getDashboardKpis(int $rangeDays = 30): array
    {
        $from = Carbon::now()->subDays($rangeDays)->startOfDay();
        $to = Carbon::now()->endOfDay();

        $totalStock = (int) Product::sum('stock');
        $reserved = (int) Product::sum('reserved_stock');
        $available = max(0, $totalStock - $reserved);

        $sold = (int) DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->sum('sale_items.quantity');

        $purchased = (int) DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->whereBetween('purchases.purchase_date', [$from, $to])
            ->sum('purchase_items.quantity');

        $adjusted = (int) StockMovement::whereBetween('movement_date', [$from, $to])
            ->whereNotNull('reason')
            ->sum('quantity');

        return [
            'range_days' => $rangeDays,
            'totals' => [
                'stock' => $totalStock,
                'reserved' => $reserved,
                'available' => $available,
                'sold' => $sold,
                'purchased' => $purchased,
                'adjusted' => $adjusted,
            ]
        ];
    }
}