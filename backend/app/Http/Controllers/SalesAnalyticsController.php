<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\AnalyticsService;
use App\Support\CacheHelper;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SalesAnalyticsController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get sales overview statistics
     */
    public function overview(Request $request)
    {
        $period = (int) $request->input('period', 30);
        $data = $this->analyticsService->getSalesOverview($period);
        return response()->json($data);
    }

    /**
     * Get sales trends over time
     */
    public function trends(Request $request)
    {
        $period = (int) $request->input('period', 30);
        $interval = $request->input('interval', 'day');
        $data = $this->analyticsService->getSalesTrends($period, $interval);
        return response()->json($data);
    }

    /**
     * Get top selling products with CORRECTED revenue calculation
     */
    public function topProducts(Request $request)
    {
        $period = (int) $request->input('period', 30);
        $limit = min(50, max(5, (int) $request->input('limit', 10)));
        $data = $this->analyticsService->getSalesTopProducts($period, $limit);
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