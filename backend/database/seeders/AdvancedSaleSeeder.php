<?php

namespace Database\Seeders;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdvancedSaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Creating sales with accurate stock management...\n";

        // Create 30 sales orders
        for ($i = 1; $i <= 30; $i++) {
            $subtotal = 0;
            $taxRate = 0.08; // 8% tax
            $discount = fake()->randomFloat(2, 0, 50); // Random discount up to $50

            // Create sale order
            $sale = Sale::create([
                'user_id' => fake()->numberBetween(1, 10),
                'total_amount' => 0, // Will calculate below
                'tax' => 0, // Will calculate below
                'discount' => $discount,
                'sale_date' => fake()->dateTimeBetween('-3 months', 'now'),
                'customer_name' => fake()->name(),
            ]);

            $numItems = fake()->numberBetween(1, 4); // 1-4 items per sale

            // Create sale items
            for ($j = 1; $j <= $numItems; $j++) {
                // Get a product with sufficient stock
                $product = Product::where('stock', '>', 0)->inRandomOrder()->first();
                
                if (!$product) {
                    // Skip if no products with stock available
                    continue;
                }

                $maxQuantity = min($product->stock, 5); // Maximum 5 or available stock
                $quantity = fake()->numberBetween(1, $maxQuantity);
                $retailPrice = $product->price;

                // Check if we have enough stock
                if ($product->stock < $quantity) {
                    $quantity = $product->stock; // Use available stock
                }

                if ($quantity <= 0) {
                    continue; // Skip if no stock
                }

                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'price' => $retailPrice,
                ]);

                $itemTotal = $quantity * $retailPrice;
                $subtotal += $itemTotal;

                // Update product stock (subtract sold quantity)
                $previousStock = $product->stock;
                $newStock = $previousStock - $quantity;
                $product->update(['stock' => $newStock]);

                // Create stock movement record
                StockMovement::create([
                    'product_id' => $product->id,
                    'type' => 'out',
                    'quantity' => $quantity,
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'source_type' => SaleItem::class,
                    'source_id' => $saleItem->id,
                    'movement_date' => $sale->sale_date,
                ]);
            }

            // Calculate final totals
            $tax = $subtotal * $taxRate;
            $totalAmount = $subtotal + $tax - $discount;

            // Update sale totals
            $sale->update([
                'total_amount' => $totalAmount,
                'tax' => $tax,
            ]);
        }

        echo "Created 30 sales orders with accurate stock updates and movements\n";
    }
}