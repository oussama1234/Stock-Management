<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class Product extends GraphQLType
{
    protected $attributes = [
        'name' => 'Product',
        'description' => 'A type',
        'model' => \App\Models\Product::class
    ];

    public function fields(): array
    {
        return [

            // define methods and fields of Product type

            'id' => [
                'type' => Type::nonNull(Type::int())
            ],
            'name' => [
                'type' => Type::string(),
            ],
            'description' => [
                'type' => Type::string(),
            ],
            'image' => [
                'type' => Type::string(),
            ],
            'price' => [
                'type' => Type::float(),
            ],
            'stock' => [
                'type' => Type::int(),
            ],
           'created_at' => [
                'type' => Type::string(),
            ],
              'updated_at' => [
                 'type' => Type::string(),
            ],

            'category' => [
                'type' => GraphQl::type('Category'),
                'resolve' => function ($product) {
                    return $product->category;
                },
            ],
            'stock_movements' => [
                'type' => Type::listOf(GraphQL::type('StockMovement')),
                'resolve' => function ($product) {
                    return $product->stockMovements;
                },
            ],
            'purchase_items' => [
                'type' => Type::listOf(GraphQL::type('PurchaseItem')),
                'resolve' => function ($product) {
                    return $product->purchaseItems;
                },
            ],
            'sale_items' => [
                'type' => Type::listOf(GraphQL::type('SaleItem')),
                'resolve' => function ($product) {
                    return $product->saleItems;
                },
            ]

        ];
    }
}


/* 
 protected $fillable = [
        'name',
        'description',
        'image',
        'price',
        'stock',
        'category_id',
        'sku',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    // adding relationships of purchase items and sale items with products

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    */