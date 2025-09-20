<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Product;
use App\Support\CacheHelper; // Namespaced cache helper
use Closure;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Cache; // Laravel cache
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\SelectFields;
use Rebing\GraphQL\Support\Query;

class ProductById extends Query
{
    protected $attributes = [
        'name' => 'productById',
        'description' => 'A query for getting a product by ID',
    ];

    public function type(): Type
    {
        return GraphQL::type('Product');
    }

    public function args(): array
    {
        return [
            'id' => [
                'name' => 'id',
                'type' => Type::nonNull(Type::int()),
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        /** @var SelectFields $fields */
        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();
        
        $id = $args['id'];

        // Cache key includes requested id and field selections
        $cacheKey = CacheHelper::key('products', 'by_id', [
            'id' => $id,
            'select' => $select,
            'with' => array_keys($with),
        ]);
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_PRODUCT_BY_ID_TTL', 120);

        return Cache::remember($cacheKey, now()->addSeconds($ttl), function () use ($with, $select, $id) {
            return Product::with($with)->select($select)->find($id);
        });
    }
}
