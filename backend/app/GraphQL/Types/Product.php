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
'days_in_stock' => [
                'type' => Type::int(),
                'selectable' => false,
                'resolve' => function ($product) {
                    // Cache the computed value per product and change token (updated_at)
                    $cacheKey = sprintf('product_days_in_stock:%s:%s', $product->id, optional($product->updated_at)->timestamp ?? '0');
                    $ttlSeconds = (int) (env('DAYS_IN_STOCK_TTL', 300)); // default 5 minutes
                    return \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addSeconds($ttlSeconds), function () use ($product) {
                        return $product->days_in_stock; // uses accessor on model
                    });
                },
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
            ],
            // Analytics fields for print functionality
            'total_sales_count' => [
                'type' => Type::int(),
                'resolve' => function ($product) {
                    return $product->saleItems()->sum('quantity');
                },
            ],
            'total_purchases_count' => [
                'type' => Type::int(),
                'resolve' => function ($product) {
                    return $product->purchaseItems()->sum('quantity');
                },
            ],
            'total_sales_value' => [
                'type' => Type::float(),
                'resolve' => function ($product) {
                    return $product->saleItems()->selectRaw('SUM(quantity * price) as total')->value('total') ?? 0;
                },
            ],
            'total_purchase_value' => [
                'type' => Type::float(),
                'resolve' => function ($product) {
                    return $product->purchaseItems()->selectRaw('SUM(quantity * price) as total')->value('total') ?? 0;
                },
            ],
            'profit_value' => [
                'type' => Type::float(),
                'resolve' => function ($product) {
                    $totalSalesValue = $product->saleItems()->selectRaw('SUM(quantity * price) as total')->value('total') ?? 0;
                    $totalPurchaseValue = $product->purchaseItems()->selectRaw('SUM(quantity * price) as total')->value('total') ?? 0;
                    return $totalSalesValue - $totalPurchaseValue;
                },
            ],
            'profit_percentage' => [
                'type' => Type::float(),
                'resolve' => function ($product) {
                    $totalSalesValue = $product->saleItems()->selectRaw('SUM(quantity * price) as total')->value('total') ?? 0;
                    $totalPurchaseValue = $product->purchaseItems()->selectRaw('SUM(quantity * price) as total')->value('total') ?? 0;
                    $profitValue = $totalSalesValue - $totalPurchaseValue;
                    return $totalSalesValue > 0 ? ($profitValue / $totalSalesValue) * 100 : 0;
                },
            ],
            'sales_highlight' => [
                'type' => Type::string(),
                'resolve' => function ($product) {
                    $totalSold = $product->saleItems()->sum('quantity');
                    $highlight = '';
                    
                    if ($totalSold > 100) {
                        $highlight = 'Best Seller';
                    } elseif ($totalSold > 50) {
                        $highlight = 'Popular Item';
                    } elseif ($totalSold > 20) {
                        $highlight = 'Regular Seller';
                    }
                    
                    if ($totalSold > 0) {
                        $highlight .= $highlight ? ' - ' : '';
                        $highlight .= "Sold {$totalSold} units";
                    }
                    
                    return $highlight;
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