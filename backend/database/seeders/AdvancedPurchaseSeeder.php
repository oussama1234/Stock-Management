<?php

namespace Database\Seeders;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdvancedPurchaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Creating purchases with accurate stock management...\n";

        // Create 20 purchase orders
        for ($i = 1; $i <= 20; $i++) {
            // Create purchase order
            $purchase = Purchase::create([
                'user_id' => fake()->numberBetween(1, 10),
                'supplier_id' => fake()->numberBetween(1, 10),
                'total_amount' => 0, // Will calculate below
                'purchase_date' => fake()->dateTimeBetween('-6 months', 'now'),
            ]);

            $totalAmount = 0;
            $numItems = fake()->numberBetween(2, 6); // 2-6 items per purchase

            // Create purchase items
            for ($j = 1; $j <= $numItems; $j++) {
                $product = Product::inRandomOrder()->first();
                $quantity = fake()->numberBetween(10, 100);
                $wholesalePrice = $product->price * 0.7; // 70% of retail price

                $purchaseItem = PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'price' => $wholesalePrice,
                ]);

                $itemTotal = $quantity * $wholesalePrice;
                $totalAmount += $itemTotal;

                // Update product stock (add purchased quantity)
                $previousStock = $product->stock;
                $newStock = $previousStock + $quantity;
                $product->update(['stock' => $newStock]);

                // Create stock movement record
                StockMovement::create([
                    'product_id' => $product->id,
                    'type' => 'in',
                    'quantity' => $quantity,
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'source_type' => PurchaseItem::class,
                    'source_id' => $purchaseItem->id,
                    'movement_date' => $purchase->purchase_date,
                ]);
            }

            // Update purchase total
            $purchase->update(['total_amount' => $totalAmount]);
        }

        echo "Created 20 purchase orders with accurate stock updates and movements\n";
    }
}