<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class Sale extends GraphQLType
{
    protected $attributes = [
        'name' => 'Sale',
        'description' => 'A type',
        'model' => \App\Models\Sale::class
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'user_id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'total_amount' => [
                'type' => Type::float(),
            ],
            'tax' => [
                'type' => Type::float(),
            ],
            'discount' => [
                'type' => Type::float(),
            ],
            'sale_date' => [
                'type' => Type::string(),
            ],
            'customer_name' => [
                'type' => Type::string(),
            ],

            'created_at' => [
                'type' => Type::string(),
            ],
            'updated_at' => [
                'type' => Type::string(),
            ],

            'user' => [
                'type' => GraphQL::type('User'),
                'resolve' => function ($sale) {
                    return $sale->user;
                },
            ],

            'saleItems' => [
                'type' => Type::listOf(GraphQL::type('SaleItem')),
                'resolve' => function ($sale) {
                    return $sale->saleItems;
                },
            ],
        ];
    }
}


/*     protected $fillable = [
        'user_id',
        'total_amount',
        'tax',
        'discount',
        'sale_date',
    ];

    // relationship with users
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // relationship with sale items
    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    */