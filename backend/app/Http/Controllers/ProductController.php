<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Support\CacheHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource with caching for performance.
     * Caches product listings based on pagination and search parameters.
     */
    public function index(Request $request)
    {
        // Validate and sanitize input parameters
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(10, (int) $request->input('per_page', 50)));
        $search = trim((string) $request->input('search', ''));
        
        // Create cache key based on parameters
        $key = CacheHelper::key('products', 'list', [
            'page' => $page,
            'per_page' => $perPage,
            'search' => $search,
        ]);
        
        // Set cache TTL (Time To Live) from config or default to 5 minutes
        $ttl = CacheHelper::ttlSeconds('API_PRODUCTS_TTL', 300);
        
        // Cache the query result for better performance
        $result = Cache::remember($key, now()->addSeconds($ttl), function () use ($page, $perPage, $search) {
            $query = Product::with('category:id,name')
                ->select('id', 'name', 'price', 'stock', 'category_id', 'image');
                
            // Apply search filter if provided
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                      ->orWhereHas('category', function ($cq) use ($search) {
                          $cq->where('name', 'like', "%$search%");
                      });
                });
            }
            
            // Order by name and paginate
            return $query->orderBy('name')
                         ->paginate($perPage, ['*'], 'page', $page);
        });
                         
        return response()->json($result);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     * Creates product and invalidates related caches for performance.
     */
    public function store(StoreProductRequest $request)
    {
        $validated = $request->validated();
        
        // Create new product
        $product = Product::create($validated);
        
        // Invalidate product-related caches since we added a new product
        CacheHelper::bump('products');
        CacheHelper::bump('dashboard_metrics'); // Products affect dashboard metrics
        
        return response()->json($product->load('category:id,name'), 201);
    }

    /**
     * Display the specified resource with caching.
     * Caches individual product data for better performance.
     */
    public function show(Product $product)
    {
        // Create cache key for individual product
        $key = CacheHelper::key('products', 'by_id', ['id' => $product->id]);
        $ttl = CacheHelper::ttlSeconds('API_PRODUCTS_TTL', 300);
        
        // Cache the product with its category
        $result = Cache::remember($key, now()->addSeconds($ttl), function () use ($product) {
            $product->load('category:id,name');
            return $product;
        });
        
        return response()->json($result);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     * Updates product and invalidates related caches for performance.
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        $validated = $request->validated();
        
        // Update the product
        $product->update($validated);
        
        // Invalidate product-related caches since we updated a product
        CacheHelper::bump('products');
        CacheHelper::bump('dashboard_metrics'); // Product changes affect dashboard
        
        return response()->json($product->fresh()->load('category:id,name'));
    }

    /**
     * Remove the specified resource from storage.
     * Deletes product and invalidates related caches for performance.
     */
    public function destroy(Product $product)
    {
        // Delete the product
        $product->delete();
        
        // Invalidate all related caches since we deleted a product
        CacheHelper::bump('products');
        CacheHelper::bump('sales'); // Product deletion affects sales
        CacheHelper::bump('stock_movements'); // And stock movements
        CacheHelper::bump('dashboard_metrics'); // And dashboard metrics
        
        return response()->json(['message' => 'Product deleted successfully'], 200);
    }
}
