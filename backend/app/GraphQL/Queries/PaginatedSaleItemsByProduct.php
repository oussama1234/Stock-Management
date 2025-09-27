<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\SaleItem as SaleItemModel;
use App\Support\CacheHelper; // Namespaced cache helper
use Closure;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Cache; // Laravel cache
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\SelectFields;
use Rebing\GraphQL\Support\Query;

class PaginatedSaleItemsByProduct extends Query
{
    protected $attributes = [
        'name' => 'paginatedSaleItemsByProduct',
        'description' => 'A paginated query for sale items by product',
    ];

    public function type(): Type
    {
        return GraphQL::type('SaleItemsPaginated');
    }

    public function args(): array
    {
        return [
            'product_id' => [
                'name' => 'product_id',
                'type' => Type::nonNull(Type::int()),
                'description' => 'The ID of the product to filter sale items by',
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

        $key = CacheHelper::key('paginated_sale_items', 'by_product', [
            'product_id' => $productId,
            'page' => $page,
            'per_page' => $perPage,
            'select' => $select,
            'with' => array_keys($with),
        ]);
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_SALE_ITEMS_TTL', 10); // Reduced from 120 to 10 seconds for real-time updates

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($productId, $page, $perPage, $with) {
            // Get total count first
            $totalQuery = SaleItemModel::where('product_id', $productId);
            $total = $totalQuery->count();
            
            $lastPage = max(1, (int) ceil($total / $perPage));
            $currentPage = min($page, $lastPage);
            $offset = ($currentPage - 1) * $perPage;

            // Get the actual data
            $items = SaleItemModel::where('product_id', $productId)
                ->with($with)
                ->skip($offset)
                ->take($perPage)
                ->orderBy('created_at', 'desc')
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