<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Support\CacheHelper; // Centralized cache keys & TTLs
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function metrics(Request $request)
    {
        $rangeDays = (int) $request->input('range_days', 30);
        $lowStockThreshold = (int) $request->input('low_stock_threshold', 5);

        // Cache key includes the range and low stock threshold
        $cacheKey = CacheHelper::key('dashboard_metrics', 'summary', [
            'range_days' => $rangeDays,
            'low_stock_threshold' => $lowStockThreshold,
        ]);
        $ttl = CacheHelper::ttlSeconds('DASHBOARD_METRICS_TTL', 60);

        $result = Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($rangeDays, $lowStockThreshold) {
            $now = Carbon::now();
            $from = $now->copy()->subDays($rangeDays)->startOfDay();
            $prevFrom = $now->copy()->subDays($rangeDays * 2)->startOfDay();
            $prevTo = $from->copy()->subSecond();

            // Core counts
            $totalProducts = Product::count();
            $totalCategories = Category::count();
            $totalSuppliers = Supplier::count();
            $totalUsers = User::count();

            // Sales & purchases aggregates
            $totalSalesAmount = (float) (Sale::sum('total_amount') ?? 0);
            $salesCount = (int) Sale::count();
            $avgOrderValue = (float) (Sale::avg('total_amount') ?? 0);

            $totalPurchasesAmount = (float) (Purchase::sum('total_amount') ?? 0);
            $purchasesCount = (int) Purchase::count();

            // Series (last N days)
            $salesSeries = Sale::selectRaw("DATE(sale_date) as date, SUM(total_amount) as total")
                ->where('sale_date', '>=', $from)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            $purchaseSeries = Purchase::selectRaw("DATE(purchase_date) as date, SUM(total_amount) as total")
                ->where('purchase_date', '>=', $from)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Stock movements series (last N days)
            $movementSeries = StockMovement::selectRaw(
                "DATE(movement_date) as date,\n             SUM(CASE WHEN type='in' THEN quantity ELSE 0 END) as in_qty,\n             SUM(CASE WHEN type='out' THEN quantity ELSE 0 END) as out_qty"
            )
                ->where('movement_date', '>=', $from)
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Top selling products (by qty) last N days
            $topSelling = SaleItem::selectRaw('product_id, SUM(quantity) as qty, SUM(quantity * price) as revenue')
                ->whereHas('sale', function ($q) use ($from) {
                    $q->where('sale_date', '>=', $from);
                })
                ->groupBy('product_id')
                ->orderByDesc('qty')
                ->with(['product:id,name,image,price,stock'])
                ->limit(5)
                ->get();

            // Low stock products
            $lowStock = Product::where('stock', '<=', $lowStockThreshold)
                ->orderBy('stock')
                ->limit(10)
                ->get(['id', 'name', 'stock', 'image']);

            // Stock values
            $products = Product::select('id', 'stock', 'price')->get();
            $retailStockValue = (float) $products->sum(fn ($p) => $p->stock * $p->price);

            $avgPurchasePriceByProduct = PurchaseItem::selectRaw('product_id, AVG(price) as avg_price')
                ->groupBy('product_id')
                ->pluck('avg_price', 'product_id');

            $costStockValue = (float) $products->sum(function ($p) use ($avgPurchasePriceByProduct) {
                $avg = (float) ($avgPurchasePriceByProduct[$p->id] ?? 0);
                return $p->stock * $avg;
            });

            // Revenue and simplified profit calculation
            $grossSaleRevenue = (float) (SaleItem::select(DB::raw('SUM(quantity * price) as gross'))->value('gross') ?? 0);

            // Simplified profit: Total sales amount - Total purchases amount
            $simpleProfit = $totalSalesAmount - $totalPurchasesAmount;

            // Keep COGS calculation for reference but use simple profit as primary metric
            $soldQtyByProduct = SaleItem::selectRaw('product_id, SUM(quantity) as qty')
                ->groupBy('product_id')
                ->pluck('qty', 'product_id');

            $approxCOGS = 0.0;
            foreach ($soldQtyByProduct as $productId => $qty) {
                $avg = (float) ($avgPurchasePriceByProduct[$productId] ?? 0);
                $approxCOGS += ((int) $qty) * $avg;
            }
            $approxProfit = $grossSaleRevenue - $approxCOGS;

            // Category distribution by sold qty (last N days)
            $categoryDistribution = DB::table('sale_items as si')
                ->join('products as p', 'p.id', '=', 'si.product_id')
                ->join('categories as c', 'c.id', '=', 'p.category_id')
                ->join('sales as s', 's.id', '=', 'si.sale_id')
                ->where('s.sale_date', '>=', $from)
                ->selectRaw('c.name as category, SUM(si.quantity) as qty')
                ->groupBy('c.name')
                ->orderByDesc('qty')
                ->get();

            // Period deltas - multiple time ranges
            $salesCurrent = (float) (Sale::whereBetween('sale_date', [$from, $now])->sum('total_amount') ?? 0);
            $salesPrev = (float) (Sale::whereBetween('sale_date', [$prevFrom, $prevTo])->sum('total_amount') ?? 0);

            $purchasesCurrent = (float) (Purchase::whereBetween('purchase_date', [$from, $now])->sum('total_amount') ?? 0);
            $purchasesPrev = (float) (Purchase::whereBetween('purchase_date', [$prevFrom, $prevTo])->sum('total_amount') ?? 0);

            $delta = function (float $current, float $prev) {
                if ($prev == 0.0) {
                    return $current > 0 ? 100.0 : 0.0;
                }
                return (($current - $prev) / $prev) * 100.0;
            };

            // Calculate deltas for multiple time periods (7d, 14d, 30d, 90d, 180d, 365d)
            $timeRanges = [7, 14, 30, 90, 180, 365];
            $salesDeltas = [];
            $purchasesDeltas = [];
            $profitDeltas = [];

            foreach ($timeRanges as $days) {
                $currentFrom = $now->copy()->subDays($days)->startOfDay();
                $prevFrom = $now->copy()->subDays($days * 2)->startOfDay();
                $prevTo = $currentFrom->copy()->subSecond();

                $salesCur = (float) (Sale::whereBetween('sale_date', [$currentFrom, $now])->sum('total_amount') ?? 0);
                $salesPrevPeriod = (float) (Sale::whereBetween('sale_date', [$prevFrom, $prevTo])->sum('total_amount') ?? 0);

                $purchasesCur = (float) (Purchase::whereBetween('purchase_date', [$currentFrom, $now])->sum('total_amount') ?? 0);
                $purchasesPrevPeriod = (float) (Purchase::whereBetween('purchase_date', [$prevFrom, $prevTo])->sum('total_amount') ?? 0);

                $profitCur = $salesCur - $purchasesCur;
                $profitPrevPeriod = $salesPrevPeriod - $purchasesPrevPeriod;

                $salesDeltas["{$days}d"] = round($delta($salesCur, $salesPrevPeriod), 2);
                $purchasesDeltas["{$days}d"] = round($delta($purchasesCur, $purchasesPrevPeriod), 2);
                $profitDeltas["{$days}d"] = round($delta($profitCur, $profitPrevPeriod), 2);
            }

            $uniqueCustomers = (int) Sale::whereNotNull('customer_name')
                ->distinct('customer_name')
                ->count('customer_name');

            return [
                'meta' => [
                    'range_days' => $rangeDays,
                    'generated_at' => $now->toIso8601String(),
                ],
                'counts' => [
                    'products' => $totalProducts,
                    'categories' => $totalCategories,
                    'suppliers' => $totalSuppliers,
                    'users' => $totalUsers,
                    'sales' => $salesCount,
                    'purchases' => $purchasesCount,
                    'unique_customers' => $uniqueCustomers,
                ],
                'financials' => [
                    'total_sales_amount' => round($totalSalesAmount, 2),
                    'total_purchases_amount' => round($totalPurchasesAmount, 2),
                    'avg_order_value' => round($avgOrderValue, 2),
                    'gross_revenue' => round($grossSaleRevenue, 2),
                    'approx_cogs' => round($approxCOGS, 2),
                    'approx_profit' => round($approxProfit, 2),
                    'simple_profit' => round($simpleProfit, 2),
                    'retail_stock_value' => round($retailStockValue, 2),
                    'cost_stock_value' => round($costStockValue, 2),
                    'sales_delta_pct' => round($delta($salesCurrent, $salesPrev), 2),
                    'purchases_delta_pct' => round($delta($purchasesCurrent, $purchasesPrev), 2),
                    'sales_deltas' => $salesDeltas,
                    'purchases_deltas' => $purchasesDeltas,
                    'profit_deltas' => $profitDeltas,
                ],
                'series' => [
                    'sales' => $salesSeries,
                    'purchases' => $purchaseSeries,
                    'movements' => $movementSeries,
                ],
                'top_selling' => $topSelling,
                'low_stock' => $lowStock,
                'category_distribution' => $categoryDistribution,
            ];
        });

        return response()->json($result);
    }
}
