<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Support\CacheHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PurchasesAnalyticsController extends Controller
{
    /**
     * Get purchases overview analytics with caching
     * Returns total purchases, average order value, top suppliers, etc.
     */
    public function overview(Request $request)
    {
        $dateRange = (int) $request->input('range_days', 30);
        $dateFrom = now()->subDays($dateRange)->startOfDay();
        $dateTo = now()->endOfDay();

        // Create cache key
        $key = CacheHelper::key('purchases_analytics', 'overview', [
            'range_days' => $dateRange,
            'date_from' => $dateFrom->format('Y-m-d'),
            'date_to' => $dateTo->format('Y-m-d')
        ]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_ANALYTICS_TTL', 300); // 5 minutes

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($dateFrom, $dateTo, $dateRange) {
            // Total purchases in period
            $totalPurchases = Purchase::whereBetween('purchase_date', [$dateFrom, $dateTo])->count();
            
            // Total purchase amount in period
            $totalAmount = Purchase::whereBetween('purchase_date', [$dateFrom, $dateTo])->sum('total_amount');
            
            // Average order value
            $avgOrderValue = $totalPurchases > 0 ? $totalAmount / $totalPurchases : 0;
            
            // Previous period for comparison
            $prevDateFrom = $dateFrom->copy()->subDays($dateRange);
            $prevDateTo = $dateFrom->copy()->subDay();
            
            $prevTotalPurchases = Purchase::whereBetween('purchase_date', [$prevDateFrom, $prevDateTo])->count();
            $prevTotalAmount = Purchase::whereBetween('purchase_date', [$prevDateFrom, $prevDateTo])->sum('total_amount');
            
            // Calculate growth percentages
            $purchasesGrowth = $prevTotalPurchases > 0 ? (($totalPurchases - $prevTotalPurchases) / $prevTotalPurchases) * 100 : 0;
            $amountGrowth = $prevTotalAmount > 0 ? (($totalAmount - $prevTotalAmount) / $prevTotalAmount) * 100 : 0;
            
            // Top suppliers by purchase amount
            $topSuppliers = Purchase::select('suppliers.name', 'suppliers.id')
                ->selectRaw('SUM(purchases.total_amount) as total_spent')
                ->selectRaw('COUNT(purchases.id) as purchase_count')
                ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
                ->whereBetween('purchase_date', [$dateFrom, $dateTo])
                ->groupBy('suppliers.id', 'suppliers.name')
                ->orderByDesc('total_spent')
                ->limit(10)
                ->get();

            // Most purchased products
            $topProducts = PurchaseItem::select('products.name', 'products.id')
                ->selectRaw('SUM(purchase_items.quantity) as total_quantity')
                ->selectRaw('SUM(purchase_items.quantity * purchase_items.price) as total_value')
                ->selectRaw('COUNT(DISTINCT purchase_items.purchase_id) as purchase_count')
                ->join('products', 'purchase_items.product_id', '=', 'products.id')
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->whereBetween('purchases.purchase_date', [$dateFrom, $dateTo])
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('total_quantity')
                ->limit(10)
                ->get();

            // Purchase frequency by day of week
            $purchasesByDayOfWeek = Purchase::select(DB::raw('DAYOFWEEK(purchase_date) as day_of_week'))
                ->selectRaw('COUNT(*) as purchase_count')
                ->selectRaw('SUM(total_amount) as total_amount')
                ->whereBetween('purchase_date', [$dateFrom, $dateTo])
                ->groupBy('day_of_week')
                ->orderBy('day_of_week')
                ->get()
                ->mapWithKeys(function ($item) {
                    $days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    return [$days[$item->day_of_week - 1] => [
                        'count' => $item->purchase_count,
                        'amount' => $item->total_amount
                    ]];
                });

            return [
                'summary' => [
                    'total_purchases' => $totalPurchases,
                    'total_amount' => (float) $totalAmount,
                    'avg_order_value' => (float) $avgOrderValue,
                    'purchases_growth' => (float) $purchasesGrowth,
                    'amount_growth' => (float) $amountGrowth,
                ],
                'top_suppliers' => $topSuppliers,
                'top_products' => $topProducts,
                'purchases_by_day_of_week' => $purchasesByDayOfWeek,
            ];
        });

        return response()->json($data);
    }

    /**
     * Get purchase trends over time with caching
     * Returns daily/weekly/monthly purchase trends
     */
    public function trends(Request $request)
    {
        $dateRange = (int) $request->input('range_days', 30);
        $groupBy = $request->input('group_by', 'day'); // day, week, month
        
        $dateFrom = now()->subDays($dateRange)->startOfDay();
        $dateTo = now()->endOfDay();

        // Create cache key
        $key = CacheHelper::key('purchases_analytics', 'trends', [
            'range_days' => $dateRange,
            'group_by' => $groupBy
        ]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_ANALYTICS_TTL', 300); // 5 minutes

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($dateFrom, $dateTo, $groupBy) {
            // Determine date format based on groupBy
            $dateFormat = match($groupBy) {
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d'
            };

            $trends = Purchase::select(DB::raw("DATE_FORMAT(purchase_date, '$dateFormat') as period"))
                ->selectRaw('COUNT(*) as purchase_count')
                ->selectRaw('SUM(total_amount) as total_amount')
                ->selectRaw('AVG(total_amount) as avg_amount')
                ->whereBetween('purchase_date', [$dateFrom, $dateTo])
                ->groupBy('period')
                ->orderBy('period')
                ->get();

            return [
                'trends' => $trends,
                'group_by' => $groupBy,
                'date_range' => [
                    'from' => $dateFrom->format('Y-m-d'),
                    'to' => $dateTo->format('Y-m-d')
                ]
            ];
        });

        return response()->json($data);
    }

    /**
     * Get top purchased products analytics with caching
     */
    public function topProducts(Request $request)
    {
        $dateRange = (int) $request->input('range_days', 30);
        $limit = min(50, (int) $request->input('limit', 20));
        
        $dateFrom = now()->subDays($dateRange)->startOfDay();
        $dateTo = now()->endOfDay();

        // Create cache key
        $key = CacheHelper::key('purchases_analytics', 'top_products', [
            'range_days' => $dateRange,
            'limit' => $limit
        ]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($dateFrom, $dateTo, $limit) {
            $topProducts = PurchaseItem::select(
                    'products.id',
                    'products.name',
                    'products.image',
                    'categories.name as category_name'
                )
                ->selectRaw('SUM(purchase_items.quantity) as total_quantity')
                ->selectRaw('SUM(purchase_items.quantity * purchase_items.price) as total_value')
                ->selectRaw('COUNT(DISTINCT purchase_items.purchase_id) as purchase_count')
                ->selectRaw('AVG(purchase_items.price) as avg_price')
                ->join('products', 'purchase_items.product_id', '=', 'products.id')
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->whereBetween('purchases.purchase_date', [$dateFrom, $dateTo])
                ->groupBy('products.id', 'products.name', 'products.image', 'categories.name')
                ->orderByDesc('total_quantity')
                ->limit($limit)
                ->get();

            return [
                'products' => $topProducts,
                'total_products' => $topProducts->count()
            ];
        });

        return response()->json($data);
    }

    /**
     * Get supplier analytics with caching
     */
    public function suppliers(Request $request)
    {
        $dateRange = (int) $request->input('range_days', 30);
        $limit = min(50, (int) $request->input('limit', 20));
        
        $dateFrom = now()->subDays($dateRange)->startOfDay();
        $dateTo = now()->endOfDay();

        // Create cache key
        $key = CacheHelper::key('purchases_analytics', 'suppliers', [
            'range_days' => $dateRange,
            'limit' => $limit
        ]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($dateFrom, $dateTo, $limit) {
            $topSuppliers = Purchase::select(
                    'suppliers.id',
                    'suppliers.name',
                    'suppliers.email',
                    'suppliers.phone'
                )
                ->selectRaw('COUNT(purchases.id) as purchase_count')
                ->selectRaw('SUM(purchases.total_amount) as total_spent')
                ->selectRaw('AVG(purchases.total_amount) as avg_order_value')
                ->selectRaw('MAX(purchases.purchase_date) as last_purchase_date')
                ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
                ->whereBetween('purchases.purchase_date', [$dateFrom, $dateTo])
                ->groupBy('suppliers.id', 'suppliers.name', 'suppliers.email', 'suppliers.phone')
                ->orderByDesc('total_spent')
                ->limit($limit)
                ->get();

            // Calculate supplier performance metrics
            $suppliersWithMetrics = $topSuppliers->map(function ($supplier) use ($dateFrom, $dateTo) {
                // Get purchase frequency (purchases per week)
                $weeks = $dateFrom->diffInWeeks($dateTo) ?: 1;
                $frequency = $supplier->purchase_count / $weeks;

                // Get consistency score (how regular are the purchases)
                $purchases = Purchase::where('supplier_id', $supplier->id)
                    ->whereBetween('purchase_date', [$dateFrom, $dateTo])
                    ->orderBy('purchase_date')
                    ->pluck('purchase_date')
                    ->toArray();

                $consistency = 0;
                if (count($purchases) > 1) {
                    $intervals = [];
                    for ($i = 1; $i < count($purchases); $i++) {
                        $intervals[] = Carbon::parse($purchases[$i])->diffInDays(Carbon::parse($purchases[$i-1]));
                    }
                    $avgInterval = array_sum($intervals) / count($intervals);
                    $variance = array_sum(array_map(function($x) use ($avgInterval) { return pow($x - $avgInterval, 2); }, $intervals)) / count($intervals);
                    $consistency = max(0, 100 - sqrt($variance)); // Simple consistency score
                }

                return array_merge($supplier->toArray(), [
                    'frequency_per_week' => round($frequency, 2),
                    'consistency_score' => round($consistency, 1)
                ]);
            });

            return [
                'suppliers' => $suppliersWithMetrics,
                'total_suppliers' => $suppliersWithMetrics->count()
            ];
        });

        return response()->json($data);
    }

    /**
     * Get category-wise purchase analytics
     */
    public function categories(Request $request)
    {
        $dateRange = (int) $request->input('range_days', 30);
        
        $dateFrom = now()->subDays($dateRange)->startOfDay();
        $dateTo = now()->endOfDay();

        // Create cache key
        $key = CacheHelper::key('purchases_analytics', 'categories', [
            'range_days' => $dateRange
        ]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($dateFrom, $dateTo) {
            $categoryAnalytics = PurchaseItem::select(
                    'categories.id',
                    'categories.name'
                )
                ->selectRaw('COUNT(DISTINCT purchase_items.id) as item_count')
                ->selectRaw('SUM(purchase_items.quantity) as total_quantity')
                ->selectRaw('SUM(purchase_items.quantity * purchase_items.price) as total_value')
                ->selectRaw('COUNT(DISTINCT products.id) as unique_products')
                ->selectRaw('COUNT(DISTINCT purchases.id) as purchase_count')
                ->join('products', 'purchase_items.product_id', '=', 'products.id')
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->whereBetween('purchases.purchase_date', [$dateFrom, $dateTo])
                ->groupBy('categories.id', 'categories.name')
                ->orderByDesc('total_value')
                ->get();

            // Calculate percentages
            $totalValue = $categoryAnalytics->sum('total_value');
            $categoriesWithPercentages = $categoryAnalytics->map(function ($category) use ($totalValue) {
                return array_merge($category->toArray(), [
                    'percentage' => $totalValue > 0 ? round(($category->total_value / $totalValue) * 100, 2) : 0
                ]);
            });

            return [
                'categories' => $categoriesWithPercentages,
                'total_categories' => $categoriesWithPercentages->count(),
                'total_value' => $totalValue
            ];
        });

        return response()->json($data);
    }

    /**
     * Get purchasing team performance analytics
     */
    public function purchasingTeam(Request $request)
    {
        $dateRange = (int) $request->input('range_days', 30);
        
        $dateFrom = now()->subDays($dateRange)->startOfDay();
        $dateTo = now()->endOfDay();

        // Create cache key
        $key = CacheHelper::key('purchases_analytics', 'purchasing_team', [
            'range_days' => $dateRange
        ]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($dateFrom, $dateTo) {
            $teamPerformance = Purchase::select(
                    'users.id',
                    'users.name',
                    'users.email'
                )
                ->selectRaw('COUNT(purchases.id) as purchase_count')
                ->selectRaw('SUM(purchases.total_amount) as total_amount')
                ->selectRaw('AVG(purchases.total_amount) as avg_order_value')
                ->selectRaw('MAX(purchases.purchase_date) as last_purchase_date')
                ->join('users', 'purchases.user_id', '=', 'users.id')
                ->whereBetween('purchases.purchase_date', [$dateFrom, $dateTo])
                ->groupBy('users.id', 'users.name', 'users.email')
                ->orderByDesc('total_amount')
                ->get();

            return [
                'team_members' => $teamPerformance,
                'total_team_members' => $teamPerformance->count()
            ];
        });

        return response()->json($data);
    }

    /**
     * Get cost savings and efficiency analytics
     */
    public function costAnalysis(Request $request)
    {
        $dateRange = (int) $request->input('range_days', 30);
        
        $dateFrom = now()->subDays($dateRange)->startOfDay();
        $dateTo = now()->endOfDay();

        // Create cache key
        $key = CacheHelper::key('purchases_analytics', 'cost_analysis', [
            'range_days' => $dateRange
        ]);
        $ttl = CacheHelper::ttlSeconds('API_PURCHASES_ANALYTICS_TTL', 600); // 10 minutes for complex query

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($dateFrom, $dateTo) {
            // Average price trends for products
            $priceAnalysis = PurchaseItem::select('products.name', 'products.id')
                ->selectRaw('AVG(purchase_items.price) as avg_price')
                ->selectRaw('MIN(purchase_items.price) as min_price')
                ->selectRaw('MAX(purchase_items.price) as max_price')
                ->selectRaw('COUNT(purchase_items.id) as purchase_frequency')
                ->join('products', 'purchase_items.product_id', '=', 'products.id')
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->whereBetween('purchases.purchase_date', [$dateFrom, $dateTo])
                ->groupBy('products.id', 'products.name')
                ->having('purchase_frequency', '>', 1) // Only products purchased multiple times
                ->orderByDesc('purchase_frequency')
                ->limit(20)
                ->get();

            // Calculate potential savings
            $potentialSavings = $priceAnalysis->map(function ($product) {
                $priceRange = $product->max_price - $product->min_price;
                $potentialSavingPerUnit = $product->avg_price - $product->min_price;
                return array_merge($product->toArray(), [
                    'price_range' => $priceRange,
                    'potential_saving_per_unit' => $potentialSavingPerUnit,
                    'price_volatility' => $product->avg_price > 0 ? ($priceRange / $product->avg_price) * 100 : 0
                ]);
            });

            return [
                'price_analysis' => $potentialSavings,
                'summary' => [
                    'total_products_analyzed' => $potentialSavings->count(),
                    'avg_price_volatility' => $potentialSavings->avg('price_volatility'),
                    'potential_total_savings' => $potentialSavings->sum('potential_saving_per_unit')
                ]
            ];
        });

        return response()->json($data);
    }
}