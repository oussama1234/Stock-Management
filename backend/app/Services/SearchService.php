<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\StockMovement;
use App\Models\User;
use App\Support\CacheHelper;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SearchService
{
    /**
     * Universal search across multiple entities with lightweight pagination per type
     *
     * @param array{q:string,page:int,per_page:int,filters:array} $params
     */
    public function searchAll(array $params): array
    {
        $q = trim($params['q'] ?? '');
        $page = max(1, (int) ($params['page'] ?? 1));
        $per = max(1, min(100, (int) ($params['per_page'] ?? 5)));
        $filters = $params['filters'] ?? [];

        $cacheKey = CacheHelper::key('search', 'universal', [
            'q' => $q,
            'page' => $page,
            'per' => $per,
            'filters' => $filters,
        ]);
        $ttl = CacheHelper::ttlSeconds('API_SEARCH_TTL', 20);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($q, $page, $per, $filters) {
            $offset = ($page - 1) * $per;

            // Products
            $productsQuery = Product::query()
                ->with(['category:id,name'])
                ->select(['id','name','image','price','category_id','stock','reserved_stock','low_stock_threshold'])
                ->search($q)
                ->when(!empty($filters['category_id']), fn($q2) => $q2->where('category_id', (int) $filters['category_id']))
                ->orderBy('updated_at', 'desc');
            $productsTotal = (clone $productsQuery)->count();
            $products = $productsQuery->skip($offset)->take($per)->get()->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'image' => $p->image,
                    'category' => $p->category?->name,
                    'stock' => (int) $p->stock,
                    'reserved' => (int) ($p->reserved_stock ?? 0),
                    'available' => max(0, (int) $p->stock - (int) ($p->reserved_stock ?? 0)),
                    'price' => (float) $p->price,
                ];
            });

            // Suppliers
            $suppliersQuery = Supplier::query()->search($q)->orderBy('name');
            $suppliersTotal = (clone $suppliersQuery)->count();
            $suppliers = $suppliersQuery->skip($offset)->take($per)->get(['id','name','email','phone']);

            // Sales (orders)
            $salesQuery = Sale::query()
                ->with(['items:id,sale_id,product_id,quantity','items.product:id,name'])
                ->search($q)
                ->orderBy('sale_date', 'desc');
            $salesTotal = (clone $salesQuery)->count();
            $sales = $salesQuery->skip($offset)->take($per)->get(['id','customer_name','total_amount','sale_date']);

            // Purchases
            $purchasesQuery = Purchase::query()
                ->with(['supplier:id,name'])
                ->search($q)
                ->orderBy('purchase_date', 'desc');
            $purchasesTotal = (clone $purchasesQuery)->count();
            $purchases = $purchasesQuery->skip($offset)->take($per)->get(['id','supplier_id','total_amount','purchase_date']);

            // Stock movements + reasons
            $movementsQuery = StockMovement::query()
                ->with(['product:id,name'])
                ->search($q)
                ->orderBy('movement_date', 'desc');
            $movementsTotal = (clone $movementsQuery)->count();
            $movements = $movementsQuery->skip($offset)->take($per)->get(['id','product_id','type','quantity','reason','movement_date']);

            $reasons = StockMovement::query()
                ->select('reason', DB::raw('COUNT(*) as cnt'))
                ->whereNotNull('reason')
                ->where('reason', 'like', '%' . str_replace('%', '\\%', $q) . '%')
                ->groupBy('reason')
                ->orderByDesc('cnt')
                ->limit($per)
                ->get();

            // Customers (distinct from sales)
            $customers = Sale::query()
                ->select('customer_name', DB::raw('MAX(sale_date) as last_sale_date'))
                ->whereNotNull('customer_name')
                ->where('customer_name', 'like', '%' . str_replace('%', '\\%', $q) . '%')
                ->groupBy('customer_name')
                ->orderByDesc('last_sale_date')
                ->limit($per)
                ->get();

            // Users
            $usersQuery = User::query()
                ->search($q)
                ->orderBy('name');
            $usersTotal = (clone $usersQuery)->count();
            $users = $usersQuery->skip($offset)->take($per)->get(['id','name','email','role','profileImage']);

            return [
                'query' => $q,
                'page' => $page,
                'per_page' => $per,
                'results' => [
                    'products' => [ 'data' => $products, 'total' => $productsTotal ],
                    'suppliers' => [ 'data' => $suppliers, 'total' => $suppliersTotal ],
                    'sales' => [ 'data' => $sales, 'total' => $salesTotal ],
                    'purchases' => [ 'data' => $purchases, 'total' => $purchasesTotal ],
                    'movements' => [ 'data' => $movements, 'total' => $movementsTotal ],
                    'customers' => [ 'data' => $customers, 'total' => $customers->count() ],
                    'reasons' => [ 'data' => $reasons, 'total' => $reasons->count() ],
                    'users' => [ 'data' => $users, 'total' => $usersTotal ],
                ],
            ];
        });
    }
}
