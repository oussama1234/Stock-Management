<?php

declare(strict_types=1);

namespace App\GraphQL\Inputs\Products;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\InputType;

class ProductInput extends InputType
{
    protected $attributes = [
        'name' => 'productInput',
        'description' => 'An input for a product',
    ];

    public function fields(): array
    {
        return [
            'name' => [
                'type' => Type::nonNull(Type::string()),
            ],
            'description' => [
                'type' => Type::string(),
            ],
            'category_id' => [
                'type' => Type::int(),
            ],
            'price' => [
                'type' => Type::float(),
            ],
            'stock' => [
                'type' => Type::int(),
            ],
            'image' => [
                'type' => GraphQL::type('Upload'),
            ],

        ];
    }
}
