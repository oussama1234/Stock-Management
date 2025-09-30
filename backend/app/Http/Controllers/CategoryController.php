<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Services\CategoryService;
use App\Support\CategoryCacheHelper;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(protected CategoryService $service)
    {
    }

    /** List categories (paginated) with filters */
    public function index(Request $request)
    {
        $data = $this->service->paginate($request->all());
        return response()->json($data);
    }

    /** Create */
    public function store(StoreCategoryRequest $request)
    {
        $cat = $this->service->store($request->validated());
        return response()->json($cat, 201);
    }

    /** Show */
    public function show(int $id)
    {
        $cat = $this->service->show($id);
        return response()->json($cat);
    }

    /** Update */
    public function update(UpdateCategoryRequest $request, int $id)
    {
        $cat = $this->service->update($id, $request->validated());
        return response()->json($cat);
    }

    /** Delete */
    public function destroy(int $id)
    {
        $this->service->destroy($id);
        return response()->json(['message' => 'Deleted']);
    }

    /** Analytics overview per category */
    public function analytics(Request $request)
    {
        $rows = $this->service->analytics($request->all());
        return response()->json(['data' => $rows]);
    }

    /** Top selling categories */
    public function topSelling(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $rows = $this->service->topSelling($limit, $request->all());
        return response()->json(['data' => $rows]);
    }

    /** Top purchased categories */
    public function topPurchased(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $rows = $this->service->topPurchased($limit, $request->all());
        return response()->json(['data' => $rows]);
    }

    /** Profit distribution */
    public function profitDistribution(Request $request)
    {
        $rows = $this->service->profitDistribution($request->all());
        return response()->json(['data' => $rows]);
    }

    /** Category metrics for dashboard */
    public function metrics(Request $request)
    {
        $days = (int) $request->input('range_days', 30);
        $metrics = CategoryCacheHelper::getCategoryMetrics($days);
        return response()->json(['data' => $metrics]);
    }
}
