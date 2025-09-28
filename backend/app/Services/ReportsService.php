<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockMovement;
use App\Models\Product;
use App\Support\CacheHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * ReportsService
 *
 * Centralized, read-optimized reporting service. Controllers should delegate to
 * these methods and keep logic minimal. All methods accept flexible date ranges
 * and optional filters. Where possible, we reuse existing analytics logic.
 */
class ReportsService
{
    public function __construct(
        protected AnalyticsService $analyticsService,
    ) {}

    /**
     * Map a date range token to [from, to] Carbon instances (inclusive).
     * Supported tokens: last_7_days, last_14_days, last_30_days, last_60_days,
     * last_90_days, last_6_months, last_year, custom.
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
     * Sales report: summary + trends + optional top products within date range.
     * Filters: product_id (optional), user_id (optional), group_by day|week|month, limit.
     */
    public function getSalesReport(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange(
            $filters['date_range'] ?? 'last_30_days',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null,
        );

        $productId = isset($filters['product_id']) ? (int) $filters['product_id'] : null;
        $userId = isset($filters['user_id']) ? (int) $filters['user_id'] : null;
        $groupBy = $filters['group_by'] ?? 'day';
        $limit = isset($filters['limit']) ? max(1, min(100, (int) $filters['limit'])) : 10;

        $cacheKey = CacheHelper::key('reports', 'sales', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'product_id' => $productId,
            'user_id' => $userId,
            'group_by' => $groupBy,
            'limit' => $limit,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_REPORTS_TTL', 120);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($from, $to, $productId, $userId, $groupBy, $limit) {
            $summaryQuery = Sale::query()
                ->when($userId, fn($q) => $q->where('user_id', $userId))
                ->when($productId, function ($q) use ($productId) {
                    $q->whereHas('items', fn($iq) => $iq->where('product_id', $productId));
                })
                ->whereBetween('sale_date', [$from, $to]);

            $summary = [
                'orders_count' => (int) (clone $summaryQuery)->count(),
                'total_sales_amount' => (float) (clone $summaryQuery)->sum('total_amount'),
                'avg_order_value' => (float) (clone $summaryQuery)->avg('total_amount'),
            ];

            $dateFormat = match ($groupBy) {
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d',
            };

            $trends = Sale::whereBetween('sale_date', [$from, $to])
                ->when($userId, fn($q) => $q->where('user_id', $userId))
                ->when($productId, function ($q) use ($productId) {
                    $q->whereHas('items', fn($iq) => $iq->where('product_id', $productId));
                })
                ->select([
                    DB::raw("DATE_FORMAT(sale_date, '$dateFormat') as period"),
                    DB::raw('COUNT(*) as orders'),
                    DB::raw('SUM(total_amount) as revenue'),
                    DB::raw('AVG(total_amount) as avg_order_value'),
                ])
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->toArray();

            // Top sold products within the date range
            $topProducts = SaleItem::query()
                ->select([
                    'sale_items.product_id',
                    'products.name as product_name',
                    'products.image as product_image',
                    'products.price as product_price',
                    'products.stock as product_stock',
                    DB::raw('SUM(sale_items.quantity) as qty'),
                    DB::raw('SUM(sale_items.quantity * sale_items.price) as gross_revenue'),
                ])
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->whereBetween('sales.sale_date', [$from, $to])
                ->when($productId, fn($q) => $q->where('sale_items.product_id', $productId))
                ->groupBy('sale_items.product_id', 'products.name', 'products.image', 'products.price', 'products.stock')
                ->orderByDesc('qty')
                ->limit($limit)
                ->get()
                ->map(function ($row) {
                    return [
                        'product_id' => (int) $row->product_id,
                        'qty' => (int) $row->qty,
                        'gross_revenue' => (float) $row->gross_revenue,
                        'product' => [
                            'id' => (int) $row->product_id,
                            'name' => $row->product_name,
                            'image' => $row->product_image,
                            'price' => (float) $row->product_price,
                            'stock' => (int) $row->product_stock,
                        ],
                    ];
                })
                ->toArray();

            return [
                'meta' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                    'group_by' => $groupBy,
                ],
                'summary' => $summary,
                'trends' => $trends,
                'top_products' => $topProducts,
            ];
        });
    }

    /**
     * Purchases report: summary + trends + top purchased products.
     */
    public function getPurchasesReport(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange(
            $filters['date_range'] ?? 'last_30_days',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null,
        );

        $productId = isset($filters['product_id']) ? (int) $filters['product_id'] : null;
        $supplierId = isset($filters['supplier_id']) ? (int) $filters['supplier_id'] : null;
        $groupBy = $filters['group_by'] ?? 'day';
        $limit = isset($filters['limit']) ? max(1, min(100, (int) $filters['limit'])) : 10;

        $cacheKey = CacheHelper::key('reports', 'purchases', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'product_id' => $productId,
            'supplier_id' => $supplierId,
            'group_by' => $groupBy,
            'limit' => $limit,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_REPORTS_TTL', 120);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($from, $to, $productId, $supplierId, $groupBy, $limit) {
            $summaryQuery = Purchase::query()
                ->when($supplierId, fn($q) => $q->where('supplier_id', $supplierId))
                ->when($productId, function ($q) use ($productId) {
                    $q->whereHas('purchaseItems', fn($iq) => $iq->where('product_id', $productId));
                })
                ->whereBetween('purchase_date', [$from, $to]);

            $summary = [
                'purchases_count' => (int) (clone $summaryQuery)->count(),
                'total_purchases_amount' => (float) (clone $summaryQuery)->sum('total_amount'),
                'avg_order_value' => (float) (clone $summaryQuery)->avg('total_amount'),
            ];

            $dateFormat = match ($groupBy) {
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d',
            };

            $trends = Purchase::whereBetween('purchase_date', [$from, $to])
                ->when($supplierId, fn($q) => $q->where('supplier_id', $supplierId))
                ->when($productId, function ($q) use ($productId) {
                    $q->whereHas('purchaseItems', fn($iq) => $iq->where('product_id', $productId));
                })
                ->select([
                    DB::raw("DATE_FORMAT(purchase_date, '$dateFormat') as period"),
                    DB::raw('COUNT(*) as purchases'),
                    DB::raw('SUM(total_amount) as amount'),
                    DB::raw('AVG(total_amount) as avg_order_value'),
                ])
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->toArray();

            $topProducts = PurchaseItem::query()
                ->select([
                    'purchase_items.product_id',
                    'products.name as product_name',
                    'products.image as product_image',
                    'categories.name as category_name',
                    DB::raw('SUM(purchase_items.quantity) as total_quantity'),
                    DB::raw('SUM(purchase_items.quantity * purchase_items.price) as total_value'),
                ])
                ->join('products', 'purchase_items.product_id', '=', 'products.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->whereBetween('purchases.purchase_date', [$from, $to])
                ->when($productId, fn($q) => $q->where('purchase_items.product_id', $productId))
                ->groupBy('purchase_items.product_id', 'products.name', 'products.image', 'categories.name')
                ->orderByDesc('total_quantity')
                ->limit($limit)
                ->get()
                ->toArray();

            return [
                'meta' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                    'group_by' => $groupBy,
                ],
                'summary' => $summary,
                'trends' => $trends,
                'top_products' => $topProducts,
            ];
        });
    }

    /**
     * Stock movements report: totals and series of in/out quantities.
     */
    public function getStockMovementsReport(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange(
            $filters['date_range'] ?? 'last_30_days',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null,
        );

        $productId = isset($filters['product_id']) ? (int) $filters['product_id'] : null;
        $type = $filters['movement_type'] ?? 'all'; // in|out|all
        $groupBy = $filters['group_by'] ?? 'day';

        $cacheKey = CacheHelper::key('reports', 'stock_movements', [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'product_id' => $productId,
            'type' => $type,
            'group_by' => $groupBy,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_REPORTS_TTL', 120);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($from, $to, $productId, $type, $groupBy) {
            $base = StockMovement::query()
                ->whereBetween('movement_date', [$from, $to])
                ->when($productId, fn($q) => $q->where('product_id', $productId))
                ->when(in_array($type, ['in','out'], true), fn($q) => $q->where('type', $type));

            $summary = [
                'total_in' => (int) (clone $base)->where('type', 'in')->sum('quantity'),
                'total_out' => (int) (clone $base)->where('type', 'out')->sum('quantity'),
            ];

            $dateFormat = match ($groupBy) {
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d',
            };

            $series = StockMovement::query()
                ->whereBetween('movement_date', [$from, $to])
                ->when($productId, fn($q) => $q->where('product_id', $productId))
                ->select([
                    DB::raw("DATE_FORMAT(movement_date, '$dateFormat') as period"),
                    DB::raw("SUM(CASE WHEN type='in' THEN quantity ELSE 0 END) as in_qty"),
                    DB::raw("SUM(CASE WHEN type='out' THEN quantity ELSE 0 END) as out_qty"),
                ])
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->toArray();

            return [
                'meta' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                    'group_by' => $groupBy,
                ],
                'summary' => $summary,
                'series' => $series,
            ];
        });
    }

    /**
     * Products sold list: returns ranked products by quantity and revenue in range.
     */
    public function getProductsSold(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange(
            $filters['date_range'] ?? 'last_30_days',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null,
        );
        $limit = isset($filters['limit']) ? max(1, min(100, (int) $filters['limit'])) : 20;
        $categoryId = isset($filters['category_id']) ? (int) $filters['category_id'] : null;

        $cacheKey = CacheHelper::key('reports', 'products_sold', [
            'from' => $from->toDateString(), 'to' => $to->toDateString(), 'limit' => $limit, 'category_id' => $categoryId,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_REPORTS_TTL', 120);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($from, $to, $limit, $categoryId) {
            $rows = SaleItem::query()
                ->select([
                    'sale_items.product_id',
                    'products.name as product_name',
                    'products.image as product_image',
                    'products.stock as product_stock',
                    'categories.name as category_name',
                    DB::raw('SUM(sale_items.quantity) as total_quantity'),
                    DB::raw('SUM(sale_items.quantity * sale_items.price) as gross_revenue'),
                    DB::raw('COUNT(DISTINCT sale_items.sale_id) as orders'),
                ])
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->whereBetween('sales.sale_date', [$from, $to])
                ->when($categoryId, fn($q) => $q->where('products.category_id', $categoryId))
                ->groupBy('sale_items.product_id', 'products.name', 'products.image', 'products.stock', 'categories.name')
                ->orderByDesc('total_quantity')
                ->limit($limit)
                ->get()
                ->toArray();

            return [
                'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                'products' => $rows,
            ];
        });
    }

    /**
     * Products purchased list: ranked by quantity and total value.
     */
    public function getProductsPurchased(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange(
            $filters['date_range'] ?? 'last_30_days',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null,
        );
        $limit = isset($filters['limit']) ? max(1, min(100, (int) $filters['limit'])) : 20;
        $categoryId = isset($filters['category_id']) ? (int) $filters['category_id'] : null;

        $cacheKey = CacheHelper::key('reports', 'products_purchased', [
            'from' => $from->toDateString(), 'to' => $to->toDateString(), 'limit' => $limit, 'category_id' => $categoryId,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_REPORTS_TTL', 120);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($from, $to, $limit, $categoryId) {
            $rows = PurchaseItem::query()
                ->select([
                    'purchase_items.product_id',
                    'products.name as product_name',
                    'products.image as product_image',
                    'categories.name as category_name',
                    DB::raw('SUM(purchase_items.quantity) as total_quantity'),
                    DB::raw('SUM(purchase_items.quantity * purchase_items.price) as total_value'),
                    DB::raw('COUNT(DISTINCT purchase_items.purchase_id) as purchases'),
                ])
                ->join('products', 'purchase_items.product_id', '=', 'products.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->whereBetween('purchases.purchase_date', [$from, $to])
                ->when($categoryId, fn($q) => $q->where('products.category_id', $categoryId))
                ->groupBy('purchase_items.product_id', 'products.name', 'products.image', 'categories.name')
                ->orderByDesc('total_quantity')
                ->limit($limit)
                ->get()
                ->toArray();

            return [
                'meta' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                'products' => $rows,
            ];
        });
    }

    /**
     * Low stock report: reuse AnalyticsService low stock alerts with velocity.
     * For custom ranges we approximate using days difference between from/to.
     */
    public function getLowStockReport(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange(
            $filters['date_range'] ?? 'last_30_days',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null,
        );
        $threshold = isset($filters['threshold']) ? max(0, (int) $filters['threshold']) : 10;

        $days = max(1, $from->diffInDays($to) + 1);

        $cacheKey = CacheHelper::key('reports', 'low_stock', [
            'days' => $days, 'threshold' => $threshold
        ]);
        $ttl = CacheHelper::ttlSeconds('API_REPORTS_TTL', 300);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($days, $threshold, $from, $to) {
            $rows = $this->analyticsService->getLowStockAlerts($days, $threshold);
            return [
                'meta' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                    'days' => $days,
                    'threshold' => $threshold,
                ],
                'items' => $rows,
            ];
        });
    }
}