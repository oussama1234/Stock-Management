<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportRequestInputs;
use App\Services\ReportsService;

class ReportsController extends Controller
{
    public function __construct(
        protected ReportsService $reportsService,
    ) {}

    /**
     * GET /reports/sales
     */
    public function sales(ReportRequestInputs $request)
    {
        $data = $this->reportsService->getSalesReport($request->sanitized());
        return response()->json($data);
    }

    /**
     * GET /reports/purchases
     */
    public function purchases(ReportRequestInputs $request)
    {
        $data = $this->reportsService->getPurchasesReport($request->sanitized());
        return response()->json($data);
    }

    /**
     * GET /reports/stock-movements
     */
    public function stockMovements(ReportRequestInputs $request)
    {
        $data = $this->reportsService->getStockMovementsReport($request->sanitized());
        return response()->json($data);
    }

    /**
     * GET /reports/products-sold
     */
    public function productsSold(ReportRequestInputs $request)
    {
        $data = $this->reportsService->getProductsSold($request->sanitized());
        return response()->json($data);
    }

    /**
     * GET /reports/products-purchased
     */
    public function productsPurchased(ReportRequestInputs $request)
    {
        $data = $this->reportsService->getProductsPurchased($request->sanitized());
        return response()->json($data);
    }

    /**
     * GET /reports/low-stock
     */
    public function lowStock(ReportRequestInputs $request)
    {
        $data = $this->reportsService->getLowStockReport($request->sanitized());
        return response()->json($data);
    }
}