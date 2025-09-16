<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class Category extends GraphQLType
{
    protected $attributes = [
        'name' => 'Category',
        'description' => 'A type',
        'model' => \App\Models\Category::class
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'name' => [
                'type' => Type::string(),
            ],
            'description' => [
                'type' => Type::string(),
            ],

            'products' => [
                'type' => Type::listOf(GraphQL::type('Product')),
                'resolve' => function ($category) {
                    return $category->products;
                },
            ],
        ];
    }
}

/*

   protected $fillable = [
        'name',
        'description',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

*/