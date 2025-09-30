<?php

namespace App\Support;

use App\Support\CacheHelper;
use Illuminate\Support\Facades\Cache;

/**
 * Centralized caching utility for categories analytics
 * Reduces code duplication and improves performance
 */
class CategoryCacheHelper
{
    /**
     * Cache TTL constants
     */
    const ANALYTICS_TTL = 300; // 5 minutes
    const TOP_CATEGORIES_TTL = 600; // 10 minutes
    const METRICS_TTL = 180; // 3 minutes

    /**
     * Generate cache key for category analytics
     */
    public static function analyticsKey(array $params = []): string
    {
        return CacheHelper::key('category_analytics', 'overview', $params);
    }

    /**
     * Generate cache key for top selling categories
     */
    public static function topSellingKey(int $limit, array $params = []): string
    {
        return CacheHelper::key('category_analytics', 'top_selling', array_merge($params, ['limit' => $limit]));
    }

    /**
     * Generate cache key for top purchased categories
     */
    public static function topPurchasedKey(int $limit, array $params = []): string
    {
        return CacheHelper::key('category_analytics', 'top_purchased', array_merge($params, ['limit' => $limit]));
    }

    /**
     * Generate cache key for profit distribution
     */
    public static function profitDistributionKey(array $params = []): string
    {
        return CacheHelper::key('category_analytics', 'profit_distribution', $params);
    }

    /**
     * Generate cache key for category metrics
     */
    public static function metricsKey(array $params = []): string
    {
        return CacheHelper::key('category_analytics', 'metrics', $params);
    }

    /**
     * Cache analytics data with automatic TTL
     */
    public static function cacheAnalytics(string $key, callable $callback): mixed
    {
        return Cache::remember($key, now()->addSeconds(self::ANALYTICS_TTL), $callback);
    }

    /**
     * Cache top categories data with automatic TTL
     */
    public static function cacheTopCategories(string $key, callable $callback): mixed
    {
        return Cache::remember($key, now()->addSeconds(self::TOP_CATEGORIES_TTL), $callback);
    }

    /**
     * Cache metrics data with automatic TTL
     */
    public static function cacheMetrics(string $key, callable $callback): mixed
    {
        return Cache::remember($key, now()->addSeconds(self::METRICS_TTL), $callback);
    }

    /**
     * Clear all category analytics caches
     */
    public static function clearAllCaches(): void
    {
        CacheHelper::bump('category_analytics');
    }

    /**
     * Get comprehensive category metrics for dashboard
     */
    public static function getCategoryMetrics(int $days = 30): array
    {
        $key = self::metricsKey(['days' => $days]);
        
        return self::cacheMetrics($key, function () use ($days) {
            $from = now()->subDays($days)->startOfDay();
            
            // Calculate average products per category manually
            $totalCategories = \App\Models\Category::count();
            $totalProducts = \App\Models\Product::count();
            $avgProductsPerCategory = $totalCategories > 0 ? ($totalProducts / $totalCategories) : 0;
            
            return [
                'total_categories' => $totalCategories,
                'active_categories' => \App\Models\Category::whereHas('products', function ($q) {
                    $q->where('stock', '>', 0);
                })->count(),
                'categories_with_sales' => \App\Models\Category::whereHas('products.saleItems.sale', function ($q) use ($from) {
                    $q->where('sale_date', '>=', $from);
                })->count(),
                'avg_products_per_category' => round($avgProductsPerCategory, 2),
                'top_performer' => self::getTopPerformer($from),
                'growth_rate' => self::calculateGrowthRate($from, $days)
            ];
        });
    }

    /**
     * Get top performing category
     */
    private static function getTopPerformer($from): ?array
    {
        $result = \Illuminate\Support\Facades\DB::table('categories')
            ->select('categories.id', 'categories.name', \Illuminate\Support\Facades\DB::raw('COALESCE(SUM(sale_items.quantity), 0) as total_sales'))
            ->leftJoin('products', 'products.category_id', '=', 'categories.id')
            ->leftJoin('sale_items', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('sales', function($join) use ($from) {
                $join->on('sales.id', '=', 'sale_items.sale_id')
                     ->where('sales.sale_date', '>=', $from);
            })
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_sales')
            ->first();

        return $result ? [
            'id' => $result->id,
            'name' => $result->name,
            'sales' => $result->total_sales ?? 0
        ] : null;
    }

    /**
     * Calculate category sales growth rate
     */
    private static function calculateGrowthRate($from, int $days): float
    {
        $currentPeriod = \App\Models\SaleItem::whereHas('sale', function ($q) use ($from) {
            $q->where('sale_date', '>=', $from);
        })->sum('quantity');

        $previousFrom = $from->copy()->subDays($days);
        $previousPeriod = \App\Models\SaleItem::whereHas('sale', function ($q) use ($previousFrom, $from) {
            $q->whereBetween('sale_date', [$previousFrom, $from->copy()->subSecond()]);
        })->sum('quantity');

        if ($previousPeriod == 0) {
            return $currentPeriod > 0 ? 100.0 : 0.0;
        }

        return round((($currentPeriod - $previousPeriod) / $previousPeriod) * 100, 2);
    }
}