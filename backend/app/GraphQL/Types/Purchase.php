<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class Purchase extends GraphQLType
{
    protected $attributes = [
        'name' => 'Purchase',
        'description' => 'A type',
        'model' => \App\Models\Purchase::class
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
            'supplier_id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'total_amount' => [
                'type' => Type::float(),
            ],
            'purchase_date' => [
                'type' => Type::string(),
            ],

            'supplier' => [
                'type' => GraphQL::type('Supplier'),
                'resolve' => function ($purchase) {
                    return $purchase->supplier;
                },
            ],
            'user' => [
                'type' => GraphQL::type('User'),
                'resolve' => function ($purchase) {
                    return $purchase->user;
                },
            ],
            'purchaseItems' => [
                'type' => Type::listOf(GraphQL::type('PurchaseItem')),
                'resolve' => function ($purchase) {
                    return $purchase->purchaseItems;
                },
            ],
        ];
    }
}


/*

   protected $fillable = [
        'user_id',
        'supplier_id',
        'total_amount',
        'purchase_date',
    ];

    // relationship with suppliers

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    // relationship with users

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // relationship with purchase items

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    */