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
                'description' => 'The id of the sale item',
            ],
            'sale_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'The id of the sale',
            ],
            'product_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'The id of the product',
            ],
            'quantity' => [
                'type' => Type::int(),
                'description' => 'The quantity of the product in the sale item',
            ],
            'price' => [
                'type' => Type::float(),
                'description' => 'The price of the product in the sale item',
            ],
        
            'created_at' => [
                'type' => Type::string(),
                'description' => 'The creation date of the sale item',
            ],
            'updated_at' => [
                'type' => Type::string(),
                'description' => 'The update date of the sale item',
            ],

            'sale' => [
                'type' => GraphQL::type('Sale'),
                'description' => 'The sale of the sale item',
                'resolve' => function ($saleItem) {
                    return $saleItem->sale;
                },
            ],
            'product' => [
                'type' => GraphQL::type('Product'),
                'description' => 'The product of the sale item',
                'resolve' => function ($saleItem) {
                    return $saleItem->product;
                },
            ],
        ];
    }
}

                    
    