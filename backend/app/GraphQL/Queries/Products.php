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
            'category' => [
                'name' => 'category',
                'type' => Type::int(),
                'description' => 'Filter by category id',
            ],
            'stockFilter' => [
                'name' => 'stockFilter',
                'type' => Type::string(),
                'description' => 'Filter by stock status: in_stock | low_stock | out_of_stock',
            ],
            'sortBy' => [
                'name' => 'sortBy',
                'type' => Type::string(),
                'description' => 'Sort field: name | price | stock | created_at | category',
            ],
            'sortOrder' => [
                'name' => 'sortOrder',
                'type' => Type::string(),
                'description' => 'Sort order: asc | desc',
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
        $search = $args['search'] ?? null;
        $category = $args['category'] ?? null;
        $stockFilter = $args['stockFilter'] ?? null;
        $sortBy = $args['sortBy'] ?? null;
        $sortOrder = strtolower($args['sortOrder'] ?? 'asc');
        if (!in_array($sortOrder, ['asc','desc'], true)) $sortOrder = 'asc';

        // Build a stable cache key for this products list result using a namespaced approach
        $cacheKey = CacheHelper::key('products', 'list', [
            'page' => $page,
            'limit' => $limit,
            'search' => $search,
            'category' => $category,
            'stockFilter' => $stockFilter,
            'sortBy' => $sortBy,
            'sortOrder' => $sortOrder,
            'select' => $select,
            'with' => array_keys($with),
        ]);

        // TTL is configurable via env GRAPHQL_PRODUCTS_TTL (in seconds), default 60s.
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_PRODUCTS_TTL', 60);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($with, $select, $limit, $page, $search, $category, $stockFilter, $sortBy, $sortOrder) {
            $query = Product::with($with)->select($select);

            // Search across product fields and category name
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('products.name', 'like', '%' . $search . '%')
                      ->orWhere('products.description', 'like', '%' . $search . '%')
                      ->orWhere('products.price', $search)
                      ->orWhere('products.stock', $search)
                      ->orWhereHas('category', function ($cq) use ($search) {
                          $cq->where('name', 'like', '%' . $search . '%');
                      });
                });
            }

            // Category filter
            if ($category) {
                $query->where('products.category_id', (int)$category);
            }

            // Stock status filter
            if ($stockFilter) {
                if ($stockFilter === 'out_of_stock') {
                    $query->where('products.stock', '=', 0);
                } else if ($stockFilter === 'low_stock') {
                    $query->whereBetween('products.stock', [1, 10]);
                } else if ($stockFilter === 'in_stock') {
                    $query->where('products.stock', '>', 10);
                }
            }

            // Sorting
            if ($sortBy === 'category') {
                // Qualify select columns to avoid ambiguity after join
                $qualified = array_map(function($col) {
                    return str_contains($col, '.') ? $col : ('products.' . $col);
                }, $select);
                $query->select($qualified)
                      ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                      ->orderBy('categories.name', $sortOrder)
                      ->orderBy('products.id', $sortOrder);
            } else if (in_array($sortBy, ['name','price','stock','created_at'], true)) {
                $query->orderBy('products.' . $sortBy, $sortOrder)
                      ->orderBy('products.id', $sortOrder);
            } else {
                // Default sort by name asc for determinism
                $query->orderBy('products.name', 'asc')
                      ->orderBy('products.id', 'asc');
            }

            return $query->paginate($limit, ['*'], 'page', $page ?? null);
        });
    }
}
