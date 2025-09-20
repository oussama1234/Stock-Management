<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Support\CacheHelper; // Namespaced cache helper
use Closure;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Cache; // Laravel cache
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\SelectFields;
use Rebing\GraphQL\Support\Query;

class StockMovementsByProduct extends Query
{
    protected $attributes = [
        'name' => 'stockMovementsByProduct',
        'description' => 'A query for stockMovementsByProduct',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('StockMovement'));
    }

    public function args(): array
    {
        return [
            'product_id' => [
                'name' => 'product_id',
                'type' => Type::int(),
                'description' => 'The ID of the product to filter stock movements by',
            ]
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        /** @var SelectFields $fields */
        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();

        $productId = $args['product_id'];

        $key = CacheHelper::key('stock_movements', 'by_product', [
            'product_id' => $productId,
            'select' => $select,
            'with' => array_keys($with),
        ]);
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_STOCK_MOVEMENTS_TTL', 120);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($productId, $with, $select) {
            return \App\Models\StockMovement::where('product_id', $productId)->with($with)->select($select)->get();
        });
        
    }
}
