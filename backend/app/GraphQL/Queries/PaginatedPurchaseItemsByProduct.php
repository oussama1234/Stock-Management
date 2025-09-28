<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\PurchaseItem;
use App\Support\CacheHelper; // Namespaced cache helper
use Closure;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Cache; // Laravel cache
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\SelectFields;
use Rebing\GraphQL\Support\Query;

class PaginatedPurchaseItemsByProduct extends Query
{
    protected $attributes = [
        'name' => 'paginatedPurchaseItemsByProduct',
        'description' => 'A paginated query for purchase items by product',
    ];

    public function type(): Type
    {
        return GraphQL::type('PurchaseItemsPaginated');
    }

    public function args(): array
    {
        return [
            'product_id' => [
                'name' => 'product_id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'The ID of the product',
            ],
            'page' => [
                'name' => 'page',
                'type' => Type::int(),
                'description' => 'The page number for pagination',
                'defaultValue' => 1,
            ],
            'perPage' => [
                'name' => 'perPage',
                'type' => Type::int(),
                'description' => 'Number of items per page',
                'defaultValue' => 10,
            ],
            // Filtering
            'search' => [
                'name' => 'search',
                'type' => Type::string(),
                'description' => 'Search term applied to supplier name or product name',
            ],
            'dateFrom' => [
                'name' => 'dateFrom',
                'type' => Type::string(),
                'description' => 'Start date (inclusive) for purchase_date',
            ],
            'dateTo' => [
                'name' => 'dateTo',
                'type' => Type::string(),
                'description' => 'End date (inclusive) for purchase_date',
            ],
            'minAmount' => [
                'name' => 'minAmount',
                'type' => Type::float(),
                'description' => 'Minimum purchase total_amount filter',
            ],
            'maxAmount' => [
                'name' => 'maxAmount',
                'type' => Type::float(),
                'description' => 'Maximum purchase total_amount filter',
            ],
            'supplierId' => [
                'name' => 'supplierId',
                'type' => Type::int(),
                'description' => 'Filter by supplier id',
            ],
            'userId' => [
                'name' => 'userId',
                'type' => Type::int(),
                'description' => 'Filter by user who created the purchase',
            ],
            // Sorting
            'sortBy' => [
                'name' => 'sortBy',
                'type' => Type::string(),
                'description' => 'Column to sort by: created_at | purchase_date | quantity | price | total_amount',
                'defaultValue' => 'created_at',
            ],
            'sortOrder' => [
                'name' => 'sortOrder',
                'type' => Type::string(),
                'description' => 'Sort direction: asc | desc',
                'defaultValue' => 'desc',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        /** @var SelectFields $fields */
        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();

        $productId = $args['product_id'];
        $page = max(1, $args['page'] ?? 1);
        $perPage = min(50, max(1, $args['perPage'] ?? 10)); // Limit max per page to 50

        $key = CacheHelper::key('paginated_purchase_items', 'by_product', [
            'product_id' => $productId,
            'page' => $page,
            'per_page' => $perPage,
            'select' => $select,
            'with' => array_keys($with),
        ]);
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_PURCHASE_ITEMS_TTL', 120); // Back to original 120 seconds

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($productId, $page, $perPage, $with, $args) {
            $base = PurchaseItem::query()->where('product_id', $productId);

            // Filters
            if (!empty($args['search'])) {
                $search = $args['search'];
                $base->where(function ($q) use ($search) {
                    $q->whereHas('purchase.supplier', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    })->orWhereHas('product', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
                });
            }
            if (!empty($args['dateFrom']) || !empty($args['dateTo'])) {
                $from = $args['dateFrom'] ?? null;
                $to = $args['dateTo'] ?? null;
                $base->whereHas('purchase', function ($pq) use ($from, $to) {
                    if ($from) $pq->whereDate('purchase_date', '>=', $from);
                    if ($to) $pq->whereDate('purchase_date', '<=', $to);
                });
            }
            if (isset($args['minAmount'])) {
                $min = (float) $args['minAmount'];
                $base->whereHas('purchase', function ($pq) use ($min) { $pq->where('total_amount', '>=', $min); });
            }
            if (isset($args['maxAmount'])) {
                $max = (float) $args['maxAmount'];
                $base->whereHas('purchase', function ($pq) use ($max) { $pq->where('total_amount', '<=', $max); });
            }
            if (!empty($args['supplierId'])) {
                $sid = (int) $args['supplierId'];
                $base->whereHas('purchase', function ($pq) use ($sid) { $pq->where('supplier_id', $sid); });
            }
            if (!empty($args['userId'])) {
                $uid = (int) $args['userId'];
                $base->whereHas('purchase', function ($pq) use ($uid) { $pq->where('user_id', $uid); });
            }

            // Count after filters
            $total = (clone $base)->count();
            $lastPage = max(1, (int) ceil($total / $perPage));
            $currentPage = min($page, $lastPage);
            $offset = ($currentPage - 1) * $perPage;

            // Sorting
            $sortBy = $args['sortBy'] ?? 'created_at';
            $sortOrder = strtolower($args['sortOrder'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
            $table = $base->getModel()->getTable(); // purchase_items

            $query = (clone $base)->with($with);
            switch ($sortBy) {
                case 'purchase_date':
                    $query->leftJoin('purchases', 'purchases.id', '=', $table . '.purchase_id')
                          ->select($table . '.*')
                          ->orderBy('purchases.purchase_date', $sortOrder);
                    break;
                case 'total_amount':
                    $query->leftJoin('purchases', 'purchases.id', '=', $table . '.purchase_id')
                          ->select($table . '.*')
                          ->orderBy('purchases.total_amount', $sortOrder);
                    break;
                case 'quantity':
                case 'price':
                case 'created_at':
                default:
                    $query->orderBy($table . '.' . ($sortBy === 'price' ? 'price' : ($sortBy === 'quantity' ? 'quantity' : 'created_at')), $sortOrder);
                    break;
            }

            $items = $query->skip($offset)->take($perPage)->get();

            return [
                'data' => $items,
                'meta' => [
                    'current_page' => $currentPage,
                    'per_page' => $perPage,
                    'last_page' => $lastPage,
                    'total' => $total,
                    'from' => $total > 0 ? $offset + 1 : null,
                    'to' => $total > 0 ? min($offset + $perPage, $total) : null,
                    'has_more_pages' => $currentPage < $lastPage,
                ],
            ];
        });
    }
}