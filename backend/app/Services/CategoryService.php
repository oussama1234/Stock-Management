<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Support\CacheHelper;
use App\Support\CategoryCacheHelper;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CategoryService
{
    /**
     * Paginated list with filtering & search.
     * Filters: search, stock_status, min_sales, min_purchases, min_profit.
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $page = max((int) ($params['page'] ?? 1), 1);
        $perPage = max((int) ($params['per_page'] ?? 10), 1);

        $query = Category::query()
            ->withCount(['products'])
            ->with(['products' => function ($q) {
                $q->select('id', 'category_id', 'stock', 'price', 'low_stock_threshold');
            }]);

        if ($term = trim((string) ($params['search'] ?? ''))) {
            $query->search($term);
        }

        if ($status = ($params['stock_status'] ?? null)) {
            $query->stockStatus($status);
        }

        // Calculate all-time metrics via aggregated subqueries
        // These are all-time totals, not date-filtered
        if (isset($params['min_sales']) || isset($params['min_profit']) || isset($params['min_purchases'])) {
            $query->addSelect([
                'sold_qty' => function ($q) {
                    // All-time sold quantity
                    $q->from('sale_items as si')
                        ->selectRaw('COALESCE(SUM(si.quantity),0)')
                        ->join('products as p', 'p.id', '=', 'si.product_id')
                        ->whereColumn('p.category_id', 'categories.id');
                },
                'purchased_qty' => function ($q) {
                    // All-time purchased quantity
                    $q->from('purchase_items as pi')
                        ->selectRaw('COALESCE(SUM(pi.quantity),0)')
                        ->join('products as p', 'p.id', '=', 'pi.product_id')
                        ->whereColumn('p.category_id', 'categories.id');
                },
                'profit_estimate' => function ($q) {
                    // All-time profit = total revenue - total cost for category
                    // Direct calculation without going through products table to avoid cardinality issues
                    $q->selectRaw('(
                        COALESCE((
                            SELECT SUM(si.quantity * si.price) 
                            FROM sale_items si
                            JOIN products p ON p.id = si.product_id
                            WHERE p.category_id = categories.id
                        ), 0) - 
                        COALESCE((
                            SELECT SUM(pi.quantity * pi.price) 
                            FROM purchase_items pi
                            JOIN products p2 ON p2.id = pi.product_id
                            WHERE p2.category_id = categories.id
                        ), 0)
                    )')
                        ->from(DB::raw('DUAL'));
                },
            ]);

            if (($minSales = (int) ($params['min_sales'] ?? 0)) > 0) {
                $query->having('sold_qty', '>=', $minSales);
            }
            if (($minPurchases = (int) ($params['min_purchases'] ?? 0)) > 0) {
                $query->having('purchased_qty', '>=', $minPurchases);
            }
            if (isset($params['min_profit']) && is_numeric($params['min_profit'])) {
                $query->having('profit_estimate', '>=', (float) $params['min_profit']);
            }
        }

        // Sorting
        $sortBy = in_array(($params['sort_by'] ?? ''), ['name','products_count','sold_qty','purchased_qty','profit_estimate']) ? $params['sort_by'] : 'name';
        $sortOrder = strtolower(($params['sort_order'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    /** Show single */
    public function show(int $id): Category
    {
        $category = Category::with('products:id,category_id,name,stock,price')->find($id);
        if (!$category) throw new ModelNotFoundException("Category not found");
        return $category;
    }

    /** Create */
    public function store(array $data): Category
    {
        $cat = Category::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);
        // Invalidate caches for categories/analytics
        CacheHelper::bump('categories');
        CategoryCacheHelper::clearAllCaches();
        return $cat->fresh();
    }

    /** Update */
    public function update(int $id, array $data): Category
    {
        $cat = Category::findOrFail($id);
        $cat->fill([
            'name' => $data['name'] ?? $cat->name,
            'description' => $data['description'] ?? $cat->description,
        ])->save();
        CacheHelper::bump('categories');
        CategoryCacheHelper::clearAllCaches();
        return $cat->fresh();
    }

    /** Delete */
    public function destroy(int $id): void
    {
        $cat = Category::findOrFail($id);
        $cat->delete();
        CacheHelper::bump('categories');
        CategoryCacheHelper::clearAllCaches();
    }

    /**
     * Category analytics: products count, sold qty, pct of stock sold, pct of all sold, profit totals, avg days in stock.
     */
    public function analytics(array $params = []): array
    {
        $days = max((int) ($params['range_days'] ?? 90), 1);
        $from = now()->subDays($days)->startOfDay();
        $key = CategoryCacheHelper::analyticsKey(['days' => $days]);

        return CategoryCacheHelper::cacheAnalytics($key, function () use ($from) {
            $totalSoldSystem = (int) SaleItem::whereHas('sale', fn($q) => $q->where('sale_date', '>=', $from))->sum('quantity');
            $totalProfitSystem = (float) (Sale::where('sale_date', '>=', $from)->sum('total_amount') - Purchase::where('purchase_date', '>=', $from)->sum('total_amount'));

            $rows = DB::table('categories as c')
                ->select([
                    'c.id','c.name','c.description',
                    DB::raw('(SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as products_count'),
                    // Sold qty in range
                    DB::raw('(SELECT COALESCE(SUM(si.quantity),0)
                              FROM sale_items si
                              JOIN sales s ON s.id = si.sale_id
                              JOIN products p ON p.id = si.product_id
                              WHERE p.category_id = c.id AND s.sale_date >= "'.$from->toDateTimeString().'"
                             ) as sold_qty'),
                    // Purchased qty in range
                    DB::raw('(SELECT COALESCE(SUM(pi.quantity),0)
                              FROM purchase_items pi
                              JOIN purchases pu ON pu.id = pi.purchase_id
                              JOIN products p2 ON p2.id = pi.product_id
                              WHERE p2.category_id = c.id AND pu.purchase_date >= "'.$from->toDateTimeString().'"
                             ) as purchased_qty'),
                    // Revenue approx (proportional revenue could be heavier; use raw sum qty*price as approximation)
                    DB::raw('(SELECT COALESCE(SUM(si.quantity*si.price),0)
                              FROM sale_items si
                              JOIN sales s ON s.id = si.sale_id
                              JOIN products p ON p.id = si.product_id
                              WHERE p.category_id = c.id AND s.sale_date >= "'.$from->toDateTimeString().'"
                             ) as revenue_approx'),
                    DB::raw('(SELECT COALESCE(SUM(pi.quantity*pi.price),0)
                              FROM purchase_items pi
                              JOIN purchases pu ON pu.id = pi.purchase_id
                              JOIN products p2 ON p2.id = pi.product_id
                              WHERE p2.category_id = c.id AND pu.purchase_date >= "'.$from->toDateTimeString().'"
                             ) as cost_approx'),
                    // Avg days in stock - proper calculation
                    // If no sales, use current stock as days (assuming 1 unit per day baseline)
                    // If has sales, calculate based on velocity
                    DB::raw('(SELECT AVG(
                                CASE
                                    WHEN COALESCE(sold_daily.v, 0) <= 0 THEN 
                                        CASE 
                                            WHEN p.stock = 0 THEN 0
                                            ELSE LEAST(p.stock, 365)  -- Cap at 365 days for products with no sales
                                        END
                                    ELSE 
                                        LEAST(p.stock / sold_daily.v, 365)  -- Calculate days based on velocity, cap at 365
                                END
                              )
                              FROM products p
                              LEFT JOIN (
                                SELECT si.product_id, 
                                       COALESCE(SUM(si.quantity), 0) / GREATEST(DATEDIFF(NOW(), "'.$from->toDateTimeString().'"), 1) as v
                                FROM sale_items si
                                JOIN sales s3 ON s3.id = si.sale_id
                                WHERE s3.sale_date >= "'.$from->toDateTimeString().'"
                                GROUP BY si.product_id
                              ) as sold_daily ON sold_daily.product_id = p.id
                              WHERE p.category_id = c.id
                             ) as avg_days_in_stock')
                ])
                ->orderBy('c.name')
                ->get();

            return $rows->map(function ($r) use ($totalSoldSystem, $totalProfitSystem) {
                $sold = (int) $r->sold_qty;
                $purchased = (int) $r->purchased_qty;
                $revenue = (float) $r->revenue_approx;
                $cost = (float) $r->cost_approx;
                $profit = $revenue - $cost;
                $pctOfAllSold = $totalSoldSystem > 0 ? round($sold / $totalSoldSystem * 100, 2) : 0.0;
                $pctOfProfit = $totalProfitSystem != 0.0 ? round($profit / $totalProfitSystem * 100, 2) : 0.0;

                return [
                    'id' => (int) $r->id,
                    'name' => $r->name,
                    'description' => $r->description,
                    'products_count' => (int) $r->products_count,
                    'sold_qty' => $sold,
                    'purchased_qty' => $purchased,
                    'revenue_approx' => round($revenue, 2),
                    'cost_approx' => round($cost, 2),
                    'profit_approx' => round($profit, 2),
                    'pct_of_all_sold' => $pctOfAllSold,
                    'pct_of_total_profit' => $pctOfProfit,
                    'avg_days_in_stock' => round((float) $r->avg_days_in_stock, 2),
                ];
            })->toArray();
        });
    }

    /** Top-selling categories by units sold */
    public function topSelling(int $limit = 10, array $params = []): array
    {
        $days = max((int) ($params['range_days'] ?? 90), 1);
        $from = now()->subDays($days)->startOfDay();
        $key = CategoryCacheHelper::topSellingKey($limit, ['days' => $days]);

        return CategoryCacheHelper::cacheTopCategories($key, function () use ($from, $limit) {
            return DB::table('sale_items as si')
                ->join('sales as s', 's.id', '=', 'si.sale_id')
                ->join('products as p', 'p.id', '=', 'si.product_id')
                ->join('categories as c', 'c.id', '=', 'p.category_id')
                ->where('s.sale_date', '>=', $from)
                ->selectRaw('c.id, c.name, SUM(si.quantity) as qty')
                ->groupBy('c.id','c.name')
                ->orderByDesc('qty')
                ->limit($limit)
                ->get()
                ->map(fn($r) => ['id' => (int) $r->id, 'name' => $r->name, 'qty' => (int) $r->qty])
                ->toArray();
        });
    }

    /** Top-purchased categories by units */
    public function topPurchased(int $limit = 10, array $params = []): array
    {
        $days = max((int) ($params['range_days'] ?? 90), 1);
        $from = now()->subDays($days)->startOfDay();
        $key = CategoryCacheHelper::topPurchasedKey($limit, ['days' => $days]);

        return CategoryCacheHelper::cacheTopCategories($key, function () use ($from, $limit) {
            return DB::table('purchase_items as pi')
                ->join('purchases as pu', 'pu.id', '=', 'pi.purchase_id')
                ->join('products as p', 'p.id', '=', 'pi.product_id')
                ->join('categories as c', 'c.id', '=', 'p.category_id')
                ->where('pu.purchase_date', '>=', $from)
                ->selectRaw('c.id, c.name, SUM(pi.quantity) as qty')
                ->groupBy('c.id','c.name')
                ->orderByDesc('qty')
                ->limit($limit)
                ->get()
                ->map(fn($r) => ['id' => (int) $r->id, 'name' => $r->name, 'qty' => (int) $r->qty])
                ->toArray();
        });
    }

    /** Profit distribution across categories */
    public function profitDistribution(array $params = []): array
    {
        $days = max((int) ($params['range_days'] ?? 90), 1);
        $from = now()->subDays($days)->startOfDay();
        $key = CategoryCacheHelper::profitDistributionKey(['days' => $days]);

        return CategoryCacheHelper::cacheAnalytics($key, function () use ($from) {
            $rows = DB::table('categories as c')
                ->select([
                    'c.id','c.name',
                    DB::raw('(SELECT COALESCE(SUM(si.quantity*si.price),0)
                              FROM sale_items si
                              JOIN sales s ON s.id = si.sale_id
                              JOIN products p ON p.id = si.product_id
                              WHERE p.category_id = c.id AND s.sale_date >= "'.$from->toDateTimeString().'"
                             ) as revenue_approx'),
                    DB::raw('(SELECT COALESCE(SUM(pi.quantity*pi.price),0)
                              FROM purchase_items pi
                              JOIN purchases pu ON pu.id = pi.purchase_id
                              JOIN products p2 ON p2.id = pi.product_id
                              WHERE p2.category_id = c.id AND pu.purchase_date >= "'.$from->toDateTimeString().'"
                             ) as cost_approx')
                ])
                ->get();

            $totalProfit = 0.0;
            $data = [];
            foreach ($rows as $r) {
                $profit = (float) $r->revenue_approx - (float) $r->cost_approx;
                $data[] = ['id' => (int) $r->id, 'name' => $r->name, 'profit' => round($profit, 2)];
                $totalProfit += $profit;
            }
            foreach ($data as &$row) {
                $row['percent'] = $totalProfit != 0.0 ? round(($row['profit'] / $totalProfit) * 100, 2) : 0.0;
            }
            return $data;
        });
    }
}
