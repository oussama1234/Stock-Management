<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class Supplier extends GraphQLType
{
    protected $attributes = [
        'name' => 'Supplier',
        'description' => 'A type',
        'model' => \App\Models\Supplier::class
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
            'email' => [
                'type' => Type::string(),
            ],
            'phone' => [
                'type' => Type::string(),
            ],
            'address' => [
                'type' => Type::string(),
            ],

            'purchases' => [
                'type' => Type::listOf(GraphQL::type('Purchase')),
                'resolve' => function ($supplier) {
                    return $supplier->purchases;
                },
            ],

        ];
    }
}


/*      protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
    ];

    // relationship with purchases
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    */