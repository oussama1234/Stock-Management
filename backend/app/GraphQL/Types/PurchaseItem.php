<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class PurchaseItem extends GraphQLType
{
    protected $attributes = [
        'name' => 'PurchaseItem',
        'description' => 'A type',
        'model' => \App\Models\PurchaseItem::class
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'purchase_id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'product_id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'quantity' => [
                'type' => Type::int(),
            ],
            'price' => [
                'type' => Type::float(),
            ],

            'product' => [
                'type' => GraphQL::type('Product'),
                'resolve' => function ($purchaseItem) {
                    return $purchaseItem->product;
                },
            ],

            'purchase' => [
                'type' => GraphQL::type('Purchase'),
                'resolve' => function ($purchaseItem) {
                    return $purchaseItem->purchase;
                },
            ],
        ];
    }
}


/*    protected $fillable = [
        'purchase_id',
        'product_id',
        'quantity',
        'price',
    ];

    // relationship with purchase
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);

    
    }

    // relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    */