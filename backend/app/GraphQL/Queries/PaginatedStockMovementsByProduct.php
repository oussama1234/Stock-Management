<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\StockMovement;
use App\Support\CacheHelper; // Namespaced cache helper
use Closure;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Cache; // Laravel cache
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\SelectFields;
use Rebing\GraphQL\Support\Query;

class PaginatedStockMovementsByProduct extends Query
{
    protected $attributes = [
        'name' => 'paginatedStockMovementsByProduct',
        'description' => 'A paginated query for stock movements by product',
    ];

    public function type(): Type
    {
        return GraphQL::type('StockMovementsPaginated');
    }

    public function args(): array
    {
        return [
            'product_id' => [
                'name' => 'product_id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'The ID of the product to filter stock movements by',
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
            'type' => [
                'name' => 'type',
                'type' => Type::string(),
                'description' => 'Filter by movement type (in, out, purchase, sale, adjustment_in, adjustment_out)',
            ],
            'dateFrom' => [
                'name' => 'dateFrom',
                'type' => Type::string(),
                'description' => 'Start date (inclusive) for movement_date',
            ],
            'dateTo' => [
                'name' => 'dateTo',
                'type' => Type::string(),
                'description' => 'End date (inclusive) for movement_date',
            ],
            'userId' => [
                'name' => 'userId',
                'type' => Type::int(),
                'description' => 'Filter by user id',
            ],
            'reason' => [
                'name' => 'reason',
                'type' => Type::string(),
                'description' => 'Search in reason field',
            ],
            // Sorting
            'sortBy' => [
                'name' => 'sortBy',
                'type' => Type::string(),
                'description' => 'Column to sort by: movement_date | created_at | quantity',
                'defaultValue' => 'movement_date',
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

        $key = CacheHelper::key('paginated_stock_movements', 'by_product', [
            'product_id' => $productId,
            'page' => $page,
            'per_page' => $perPage,
            'select' => $select,
            'with' => array_keys($with),
        ]);
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_STOCK_MOVEMENTS_TTL', 10); // Reduced from 120 to 10 seconds for real-time updates

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($productId, $page, $perPage, $with, $args) {
            $base = StockMovement::query()->where('product_id', $productId);

            // Filters
            if (!empty($args['type'])) {
                $base->where('type', $args['type']);
            }
            if (!empty($args['dateFrom'])) {
                $base->whereDate('movement_date', '>=', $args['dateFrom']);
            }
            if (!empty($args['dateTo'])) {
                $base->whereDate('movement_date', '<=', $args['dateTo']);
            }
            if (!empty($args['userId'])) {
                $base->where('user_id', (int) $args['userId']);
            }
            if (!empty($args['reason'])) {
                $reason = $args['reason'];
                $base->where('reason', 'like', "%{$reason}%");
            }

            // Count after filters
            $total = (clone $base)->count();
            $lastPage = max(1, (int) ceil($total / $perPage));
            $currentPage = min($page, $lastPage);
            $offset = ($currentPage - 1) * $perPage;

            // Sorting
            $sortBy = $args['sortBy'] ?? 'movement_date';
            $sortOrder = strtolower($args['sortOrder'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
            $allowed = ['movement_date', 'created_at', 'quantity'];
            if (!in_array($sortBy, $allowed, true)) $sortBy = 'movement_date';

            $items = (clone $base)->with($with)
                ->orderBy($sortBy, $sortOrder)
                ->skip($offset)
                ->take($perPage)
                ->get();

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