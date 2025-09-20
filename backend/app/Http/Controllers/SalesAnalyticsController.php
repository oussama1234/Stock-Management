<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Support\CacheHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesAnalyticsController extends Controller
{
    /**
     * Get sales overview statistics
     */
    public function overview(Request $request)
    {
        $period = $request->input('period', '30'); // days
        $startDate = Carbon::now()->subDays((int) $period)->startOfDay();

        $key = CacheHelper::key('sales', 'overview', ['period' => $period]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_ANALYTICS_TTL', 300); // 5 minutes

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate) {
            return [
                'total_sales' => Sale::where('sale_date', '>=', $startDate)->sum('total_amount'),
                'total_orders' => Sale::where('sale_date', '>=', $startDate)->count(),
                'average_order_value' => Sale::where('sale_date', '>=', $startDate)->avg('total_amount'),
                'total_items_sold' => SaleItem::whereHas('sale', function ($q) use ($startDate) {
                    $q->where('sale_date', '>=', $startDate);
                })->sum('quantity'),
                'unique_customers' => Sale::where('sale_date', '>=', $startDate)
                    ->whereNotNull('customer_name')
                    ->distinct('customer_name')
                    ->count(),
            ];
        });

        return response()->json($data);
    }

    /**
     * Get sales trends over time
     */
    public function trends(Request $request)
    {
        $period = $request->input('period', '30'); // days
        $interval = $request->input('interval', 'day'); // day, week, month
        $startDate = Carbon::now()->subDays((int) $period)->startOfDay();

        $key = CacheHelper::key('sales', 'trends', [
            'period' => $period,
            'interval' => $interval,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate, $interval) {
            $dateFormat = match ($interval) {
                'week' => '%Y-%u',
                'month' => '%Y-%m',
                default => '%Y-%m-%d',
            };

            return Sale::where('sale_date', '>=', $startDate)
                ->select([
                    DB::raw("DATE_FORMAT(sale_date, '$dateFormat') as period"),
                    DB::raw('COUNT(*) as orders'),
                    DB::raw('SUM(total_amount) as revenue'),
                    DB::raw('AVG(total_amount) as avg_order_value'),
                ])
                ->groupBy('period')
                ->orderBy('period')
                ->get();
        });

        return response()->json($data);
    }

    /**
     * Get top selling products
     */
    public function topProducts(Request $request)
    {
        $period = $request->input('period', '30');
        $limit = min(50, max(5, (int) $request->input('limit', 10)));
        $startDate = Carbon::now()->subDays((int) $period)->startOfDay();

        $key = CacheHelper::key('sales', 'top_products', [
            'period' => $period,
            'limit' => $limit,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate, $limit) {
            return SaleItem::query()
                ->select([
                    'product_id',
                    DB::raw('SUM(quantity) as total_quantity'),
                    DB::raw('SUM(quantity * price) as total_revenue'),
                    DB::raw('COUNT(DISTINCT sale_id) as times_sold'),
                    DB::raw('AVG(price) as avg_price'),
                ])
                ->whereHas('sale', function ($q) use ($startDate) {
                    $q->where('sale_date', '>=', $startDate);
                })
                ->with([
                    'product:id,name,category_id,image,stock',
                    'product.category:id,name'
                ])
                ->groupBy('product_id')
                ->orderByDesc('total_quantity')
                ->limit($limit)
                ->get();
        });

        return response()->json($data);
    }

    /**
     * Get customer analytics
     */
    public function customers(Request $request)
    {
        $period = $request->input('period', '30');
        $limit = min(50, max(5, (int) $request->input('limit', 10)));
        $startDate = Carbon::now()->subDays((int) $period)->startOfDay();

        $key = CacheHelper::key('sales', 'top_customers', [
            'period' => $period,
            'limit' => $limit,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate, $limit) {
            return Sale::query()
                ->select([
                    'customer_name',
                    DB::raw('COUNT(*) as total_orders'),
                    DB::raw('SUM(total_amount) as total_spent'),
                    DB::raw('AVG(total_amount) as avg_order_value'),
                    DB::raw('MAX(sale_date) as last_purchase'),
                ])
                ->where('sale_date', '>=', $startDate)
                ->whereNotNull('customer_name')
                ->where('customer_name', '!=', '')
                ->groupBy('customer_name')
                ->orderByDesc('total_spent')
                ->limit($limit)
                ->get();
        });

        return response()->json($data);
    }

    /**
     * Get sales by category
     */
    public function categories(Request $request)
    {
        $period = $request->input('period', '30');
        $startDate = Carbon::now()->subDays((int) $period)->startOfDay();

        $key = CacheHelper::key('sales', 'by_category', ['period' => $period]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate) {
            return SaleItem::query()
                ->select([
                    'categories.id as category_id',
                    'categories.name as category_name',
                    DB::raw('SUM(sale_items.quantity) as total_quantity'),
                    DB::raw('SUM(sale_items.quantity * sale_items.price) as total_revenue'),
                    DB::raw('COUNT(DISTINCT sale_items.sale_id) as total_orders'),
                ])
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->join('categories', 'products.category_id', '=', 'categories.id')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->where('sales.sale_date', '>=', $startDate)
                ->groupBy(['categories.id', 'categories.name'])
                ->orderByDesc('total_revenue')
                ->get();
        });

        return response()->json($data);
    }

    /**
     * Get sales by sales person (user)
     */
    public function salesPeople(Request $request)
    {
        $period = $request->input('period', '30');
        $startDate = Carbon::now()->subDays((int) $period)->startOfDay();

        $key = CacheHelper::key('sales', 'by_salesperson', ['period' => $period]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_ANALYTICS_TTL', 300);

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($startDate) {
            return Sale::query()
                ->select([
                    'users.id as user_id',
                    'users.name as user_name',
                    DB::raw('COUNT(*) as total_sales'),
                    DB::raw('SUM(total_amount) as total_revenue'),
                    DB::raw('AVG(total_amount) as avg_sale_value'),
                ])
                ->join('users', 'sales.user_id', '=', 'users.id')
                ->where('sale_date', '>=', $startDate)
                ->groupBy(['users.id', 'users.name'])
                ->orderByDesc('total_revenue')
                ->get();
        });

        return response()->json($data);
    }

    /**
     * Get low stock alerts based on recent sales velocity
     */
    public function lowStockAlerts(Request $request)
    {
        $days = min(90, max(7, (int) $request->input('days', 30)));
        $threshold = max(0, (int) $request->input('threshold', 10));

        $key = CacheHelper::key('sales', 'low_stock_alerts', [
            'days' => $days,
            'threshold' => $threshold,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_SALES_ANALYTICS_TTL', 600); // 10 minutes

        $data = Cache::remember($key, now()->addSeconds($ttl), function () use ($days, $threshold) {
            $startDate = Carbon::now()->subDays($days)->startOfDay();

            return Product::query()
                ->select([
                    'products.id',
                    'products.name',
                    'products.stock',
                    'products.price',
                    'categories.name as category_name',
                    DB::raw('COALESCE(SUM(sale_items.quantity), 0) as sold_quantity'),
                    DB::raw('COALESCE(SUM(sale_items.quantity), 0) / ' . $days . ' as daily_velocity'),
                    DB::raw('CASE WHEN COALESCE(SUM(sale_items.quantity), 0) = 0 THEN 9999 ELSE products.stock / (COALESCE(SUM(sale_items.quantity), 0) / ' . $days . ') END as days_remaining'),
                ])
                ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->leftJoin('sale_items', function ($join) use ($startDate) {
                    $join->on('products.id', '=', 'sale_items.product_id')
                         ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                         ->where('sales.sale_date', '>=', $startDate);
                })
                ->where('products.stock', '<=', $threshold)
                ->groupBy([
                    'products.id', 
                    'products.name', 
                    'products.stock', 
                    'products.price', 
                    'categories.name'
                ])
                ->having('daily_velocity', '>', 0)
                ->orderBy('days_remaining')
                ->limit(50)
                ->get();
        });

        return response()->json($data);
    }
}