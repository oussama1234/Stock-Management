<?php

namespace App\Http\Controllers;

use App\Services\AnalyticsService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected AnalyticsService $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function metrics(Request $request)
    {
        $rangeDays = (int) $request->input('range_days', 30);
        $lowStockThreshold = (int) $request->input('low_stock_threshold', 5);

        $result = $this->analyticsService->getDashboardMetrics($rangeDays, $lowStockThreshold);

        return response()->json($result);
    }

    /**
     * Get accurate sales overview using AnalyticsService
     */
    public function salesOverview(Request $request)
    {
        $period = (int) $request->input('period', 30);
        $data = $this->analyticsService->getSalesOverview($period);
        return response()->json($data);
    }

    /**
     * Get accurate sales trends using AnalyticsService
     */
    public function salesTrends(Request $request)
    {
        $period = (int) $request->input('period', 30);
        $interval = $request->input('interval', 'day');
        $data = $this->analyticsService->getSalesTrends($period, $interval);
        return response()->json($data);
    }

    /**
     * Get low stock alerts with sales velocity analysis using AnalyticsService
     */
    public function lowStockAlerts(Request $request)
    {
        $days = min(90, max(7, (int) $request->input('days', 30)));
        $threshold = max(0, (int) $request->input('threshold', 10));
        
        $data = $this->analyticsService->getLowStockAlerts($days, $threshold);
        return response()->json($data);
    }
}
