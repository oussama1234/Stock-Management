<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class SaleItem extends GraphQLType
{
    protected $attributes = [
        'name' => 'SaleItem',
        'description' => 'A type',
        'model' => \App\Models\SaleItem::class
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'sale_id' => [
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
                'resolve' => function ($saleItem) {
                    return $saleItem->product;
                },
            ],
            'sale' => [
                'type' => GraphQL::type('Sale'),
                'resolve' => function ($saleItem) {
                    return $saleItem->sale;
                },
            ],
        ];
    }
}


/* 
    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'price',
    ];

    // relationship with sale
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
    // relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    */
    