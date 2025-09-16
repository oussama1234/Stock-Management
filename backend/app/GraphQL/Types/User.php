<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class User extends GraphQLType
{
    protected $attributes = [
        'name' => 'User',
        'description' => 'A type',
        'model' => \App\Models\User::class
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
            'role' => [
                'type' => Type::string(),
            ],
            'profileImage' => [
                'type' => Type::string(),
            ],

            'purchases' => [
                'type' => Type::listOf(GraphQL::type('Purchase')),
                'resolve' => function ($user) {
                    return $user->purchases;
                },
            ],
            'sales' => [
                'type' => Type::listOf(GraphQl::type('Sale')),
                'resolve' => function ($user) {
                    return $user->sales;
                },
            ],
        ];
    }
}

/* 

public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

*/