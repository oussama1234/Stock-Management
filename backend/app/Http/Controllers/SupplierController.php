<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Support\CacheHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, (int) $request->input('per_page', 50));
        $search = (string) $request->input('search', '');
        
        // Create cache key
        $key = CacheHelper::key('suppliers', 'list', [
            'page' => $page,
            'per_page' => $perPage,
            'search' => $search,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_SUPPLIERS_TTL', 300); // 5 minutes cache
        
        $result = Cache::remember($key, now()->addSeconds($ttl), function () use ($search, $perPage, $page) {
            $query = Supplier::query();
            
            // Search functionality
            if ($search !== '') {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
            }
            
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
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);
        
        $supplier = Supplier::create($validated);
        
        // Invalidate suppliers cache
        CacheHelper::bump('suppliers');
        
        return response()->json($supplier, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(supplier $supplier)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(supplier $supplier)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSupplierRequest $request, Supplier $supplier)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(supplier $supplier)
    {
        //
    }
}
