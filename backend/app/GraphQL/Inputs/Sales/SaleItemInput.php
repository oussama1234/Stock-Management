<?php

declare(strict_types=1);

namespace App\GraphQL\Inputs\Sales;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\InputType;

class SaleItemInput extends InputType
{
    protected $attributes = [
        'name' => 'saleItemInput',
        'description' => 'An input for a sale item',
    ];

    public function fields(): array
    {
        return [
            'product_id' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'The id of the product',
            ],
            'quantity' => [
                'type' => Type::nonNull(Type::int()),
                'description' => 'The quantity of the product in the sale item',
            ],
            'price' => [
                'type' => Type::nonNull(Type::float()),
                'description' => 'The price of the product in the sale item',
            ],

            'tax' => [
                'type' => Type::float(),
                'description' => 'The tax of the sale item',
            ],

            'discount' => [
                'type' => Type::float(),
                'description' => 'The discount of the sale item',
            ],

            'customer_name' => [
                'type' => Type::string(),
                'description' => 'The customer name of the sale item',
            ],



        ];
    }
}
