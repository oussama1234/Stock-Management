<?php

declare(strict_types=1);

namespace App\GraphQL\Mutations\Sales;

use App\Models\Product;
use App\Models\Sale;
use App\Support\CacheHelper;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Auth;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Mutation;
use Rebing\GraphQL\Support\SelectFields;

class CreateSaleByProduct extends Mutation
{
    protected $attributes = [
        'name' => 'createSaleByProduct',
        'description' => 'A mutation for creating a new saleItem by product',
    ];

    public function type(): Type
    {
        return GraphQL::type('SaleItem');
    }

    public function args(): array
    {
        return [
            'saleItem' => [
                'name' => 'saleItem',
                'type' => GraphQL::type('saleItemInput'),
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {




        $fields = $getSelectFields();
        $select = $fields->getSelect();
        $with = $fields->getRelations();

        $saleItemValues = $args['saleItem'];
        $product = Product::find($saleItemValues['product_id']);
       
     
        // Check if the product exists
        if (!$product) {
            throw new \Exception('Product not found');
        }
           $quantity = $saleItemValues['quantity'];
        $price = $saleItemValues['price'];
        // Create a new sale
        $sale = new Sale();
            $sale->user_id = Auth::id(); // Default to user ID 1 if not authenticateds

            if(isset($saleItemValues['tax'])) {
                $sale->tax = $saleItemValues['tax'];
            }

            if(isset($saleItemValues['discount'])) {
                $sale->discount = $saleItemValues['discount'];
            }

            if(isset($saleItemValues['sale_date'])) {
                $sale->sale_date = $saleItemValues['sale_date'];
            }

            if(isset($saleItemValues['customer_name'])) {
                $sale->customer_name = $saleItemValues['customer_name'];
            }

            $total = 0.0;
            $lineTotal = (float) $price * (int) $quantity;
            $total += $lineTotal;

            // Apply tax and discount to total_amount if needed
            $totalWithTax = $total + $sale->tax - $sale->discount;
            $sale->total_amount = max(0, $totalWithTax);
            $sale->save(); 



        
        // Check if there is enough stock
        if ($product->stock < $quantity) {
            throw new \Exception('Not enough stock');
        }
        // Create the sale item
        $saleItem = new \App\Models\SaleItem();
        $saleItem->sale_id = $sale->id;
        $saleItem->product_id = $product->id;
        $saleItem->quantity = $quantity;
        $saleItem->price = $price;
        $saleItem->save();
        // invalidate cache
        CacheHelper::bump('Sale');
        CacheHelper::bump('Product');
        CacheHelper::bump('SaleItem');
        CacheHelper::bump('StockMovement');
        CacheHelper::bump('DashboardMetrics');
        

        return $saleItem;
    }
}
