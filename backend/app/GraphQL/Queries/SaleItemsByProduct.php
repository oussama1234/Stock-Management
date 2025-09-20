<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\GraphQL\Types\SaleItem;
use App\Models\SaleItem as SaleItemModel;
use App\Support\CacheHelper; // Namespaced cache helper
use Closure;
use GraphQL\Type\Definition\Type;
use GraphQL\Type\Definition\ResolveInfo;
use Illuminate\Support\Facades\Cache; // Laravel cache
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\SelectFields;
use Rebing\GraphQL\Support\Query;

class SaleItemsByProduct extends Query
{
    protected $attributes = [
        'name' => 'saleItemsByProduct',
        'description' => 'A query for saleItemsByProduct',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('SaleItem'));
    }

    public function args(): array
    {
        return [
            // Define any arguments needed for the query here
            'product_id' => [
                'name' => 'product_id',
                'type' => Type::int(),
                'description' => 'The ID of the product to filter sale items by',
            ]
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        /** @var SelectFields $fields */
        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();
        // Implement the logic to fetch sale items by product here
        $productId = $args['product_id'];

        $key = CacheHelper::key('sale_items', 'by_product', [
            'product_id' => $productId,
            'select' => $select,
            'with' => array_keys($with),
        ]);
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_SALE_ITEMS_TTL', 120);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($productId, $with, $select) {
            return SaleItemModel::where('product_id', $productId)->with($with)->select($select)->get();
        });
    }
}
