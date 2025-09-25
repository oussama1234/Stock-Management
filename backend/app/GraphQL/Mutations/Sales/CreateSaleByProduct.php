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
            $sale->user_id = Auth::id();

            // Tax and discount are now stored as percentages (0-100)
            // Input can be either percentage or absolute amount - we'll determine based on context
            $subtotal = (float) $price * (int) $quantity;
            
            if(isset($saleItemValues['tax'])) {
                $taxValue = (float) $saleItemValues['tax'];
                // If tax seems to be an absolute amount (greater than subtotal/10), convert to percentage
                if ($taxValue > 100 || ($taxValue > ($subtotal * 0.1) && $subtotal > 0)) {
                    // Convert absolute amount to percentage
                    $sale->tax = $subtotal > 0 ? min(100, ($taxValue / $subtotal) * 100) : 0;
                } else {
                    // Already a percentage
                    $sale->tax = min(100, max(0, $taxValue));
                }
            }

            if(isset($saleItemValues['discount'])) {
                $discountValue = (float) $saleItemValues['discount'];
                // If discount seems to be an absolute amount, convert to percentage
                if ($discountValue > 100 || ($discountValue > ($subtotal * 0.1) && $subtotal > 0)) {
                    // Convert absolute amount to percentage
                    $sale->discount = $subtotal > 0 ? min(100, ($discountValue / $subtotal) * 100) : 0;
                } else {
                    // Already a percentage
                    $sale->discount = min(100, max(0, $discountValue));
                }
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

            // Calculate tax and discount amounts from percentages
            $taxAmount = ($sale->tax / 100) * $total;
            $discountAmount = ($sale->discount / 100) * $total;
            $totalWithTaxDiscount = $total + $taxAmount - $discountAmount;
            $sale->total_amount = max(0, $totalWithTaxDiscount);
            $sale->save(); 



        
        // Check if there is enough stock
        if ($product->stock < $quantity) {
            throw new \Exception('Not enough stock');
        }
        // Create the sale item (this will trigger the SaleItemObserver::created event)
        $saleItem = \App\Models\SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'price' => $price,
        ]);
        
        // Load relationships for the observer
        $saleItem->load(['sale.user', 'product']);
        // invalidate cache
        CacheHelper::bump('Sale');
        CacheHelper::bump('Product');
        CacheHelper::bump('SaleItem');
        CacheHelper::bump('StockMovement');
        CacheHelper::bump('DashboardMetrics');
        

        return $saleItem;
    }
}
