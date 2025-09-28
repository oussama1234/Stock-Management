<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class StockMovement extends GraphQLType
{
    protected $attributes = [
        'name' => 'StockMovement',
        'description' => 'A type',
        'model' => \App\Models\StockMovement::class
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'product_id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'type' => [
                'type' => Type::string(),
            ],
'quantity' => [
                'type' => Type::int(),
            ],
            'previous_stock' => [
                'type' => Type::int(),
                'description' => 'Stock level before this movement',
            ],
            'new_stock' => [
                'type' => Type::int(),
                'description' => 'Stock level after this movement',
            ],
            'source_type' => [
                'type' => Type::string(),
            ],
            'source_id' => [
                'type' => Type::int(),
            ],
            'movement_date' => [
'type' => Type::string(),
            ],
            'reason' => [
                'type' => Type::string(),
            ],
            'user_id' => [
                'type' => Type::int(),
            ],
            'user_name' => [
                'type' => Type::string(),
                'resolve' => function ($stockMovement) {
                    $u = \App\Models\User::find($stockMovement->user_id);
                    if (!$u) return null;
                    return $u->name ?? $u->full_name ?? $u->email ?? ('User #' . $u->id);
                },
            ],
            'created_at' => [
                'type' => Type::string(),
            ],
            'updated_at' => [
                'type' => Type::string(),
            ],

            'product' => [
                'type' => GraphQL::type('Product'),
                'resolve' => function ($stockMovement) {
                    return $stockMovement->product;
                },
            ],

            'source' => [
                'type' => GraphQL::type('SourceUnion'),
                'resolve' => function ($stockMovement) {
                    return $stockMovement->source;
                },
            ],
        ];
    }
}



/*

    protected $fillable = [
        'product_id',
        'type',
        'quantity',
        'source_type',
        'source_id',
        'movement_date',
    ];

    // relationship with product
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // polymorphic relationship to source (purchase or sale)
    public function source()
    {
        return $this->morphTo(null, 'source_type', 'source_id');
    }
*/