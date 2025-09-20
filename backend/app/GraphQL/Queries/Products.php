<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Product;
use App\Support\CacheHelper; // Helper for namespaced cache keys & TTL
use Closure;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Cache; // Laravel Cache facade
use Illuminate\Support\Facades\DB;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\SelectFields;
use Rebing\GraphQL\Support\Query;


class Products extends Query
{
    protected $attributes = [
        'name' => 'products',
        'description' => 'A query for products',
    ];

    public function type(): Type
    {
        return GraphQL::paginate('Product');
    }

    public function args(): array
    {
        return [
            'page' => [
                'name' => 'page',
                'type' => Type::int(),
                'description' => 'The page number to retrieve',
            ],
            'limit' => [
                'name' => 'limit',
                'type' => Type::int(),
                'description' => 'The number of items per page',
            ],
            'search' => [
                'name' => 'search',
                'type' => Type::string(),
                'description' => 'The search query to filter products',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        /** @var SelectFields $fields */
        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();

        // Extract arguments used to drive pagination and filtering
        $limit = $args['limit'];
        $page = $args['page'];
        $search = $args['search'];

        // Build a stable cache key for this products list result using a namespaced approach
        $cacheKey = CacheHelper::key('products', 'list', [
            'page' => $page,
            'limit' => $limit,
            'search' => $search,
            'select' => $select,
            // Only the relation names affect the shape; avoid hashing entire selections per relation
            'with' => array_keys($with),
        ]);

        // TTL is configurable via env GRAPHQL_PRODUCTS_TTL (in seconds), default 60s.
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_PRODUCTS_TTL', 60);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($with, $select, $limit, $page, $search) {
            // Apply optional search filter and return Laravel paginator (serializable for cache)
            if ($search) {
                return Product::with($with)
                    ->select($select)
                    ->when($search, function ($query) use ($search) {
                        $query->where('products.name', 'like', '%' . $search . '%')
                            ->orWhere('products.description', 'like', '%' . $search . '%')
                            ->orWhere('products.price', $search)
                            ->orWhere('products.stock', $search)
                            ->orWhereHas('category', function ($q) use ($search) {
                                $q->where('name', 'like', '%' . $search . '%');
                            });
                    })
                    ->paginate($limit, ['*'], 'page', $page ?? null);
            }

            return Product::with($with)
                ->select($select)
                ->paginate($limit, ['*'], 'page', $page ?? null);
        });
    }
}
