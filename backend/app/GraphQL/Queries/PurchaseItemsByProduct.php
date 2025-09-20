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

class PurchaseItemsByProduct extends Query
{
    protected $attributes = [
        'name' => 'purchaseItemsByProduct',
        'description' => 'A query for the purchase items by product',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('PurchaseItem'));
    }

    public function args(): array
    {
        return [
            'product_id' => [
                'name' => 'product_id',
                'type' => Type::int(),
                'description' => 'The ID of the product',
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

        $key = CacheHelper::key('purchase_items', 'by_product', [
            'product_id' => $productId,
            'select' => $select,
            'with' => array_keys($with),
        ]);
        $ttl = CacheHelper::ttlSeconds('GRAPHQL_PURCHASE_ITEMS_TTL', 120);

        return Cache::remember($key, now()->addSeconds($ttl), function () use ($productId, $with, $select) {
            return PurchaseItem::where('product_id', $productId)->with($with)->select($select)->get();
        });
    }
}
