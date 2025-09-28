<?php

namespace App\Http\Controllers;

use App\Http\Requests\InventoryListRequestInputs;
use App\Http\Requests\InventoryAdjustmentRequestInputs;
use App\Http\Requests\InventoryHistoryRequestInputs;
use App\Services\InventoryService;
use Illuminate\Support\Facades\Auth;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService,
    ) {}

    public function overview(InventoryListRequestInputs $request)
    {
        return response()->json($this->inventoryService->getStockOverview($request->sanitized()));
    }

    public function adjust(InventoryAdjustmentRequestInputs $request)
    {
        $data = $request->sanitized();
        $result = $this->inventoryService->adjustInventory(
            (int) $data['product_id'],
            (int) $data['new_quantity'],
            (string) $data['reason'],
            Auth::id()
        );
        return response()->json($result);
    }

    public function history(InventoryHistoryRequestInputs $request)
    {
        return response()->json($this->inventoryService->getInventoryHistory($request->sanitized()));
    }

    public function export(InventoryHistoryRequestInputs $request)
    {
        $format = $request->input('format', 'csv');
        $export = $this->inventoryService->exportInventoryHistory($request->sanitized(), $format);

        if ($export['format'] === 'csv') {
            return response($export['content'], 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="inventory_history.csv"'
            ]);
        }
        return response()->json($export);
    }

    public function kpis()
    {
        $days = (int) request()->input('range_days', 30);
        return response()->json($this->inventoryService->getDashboardKpis($days));
    }
}