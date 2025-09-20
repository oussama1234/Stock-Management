<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockMovement>
 */
class StockMovementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */



    public function definition(): array
    {

        $sourceType = $this->faker->randomElement([
            \App\Models\PurchaseItem::class,
            \App\Models\SaleItem::class,
        ]);

        $type = $sourceType === \App\Models\PurchaseItem::class ? 'in' : 'out';

        // Create the actual record depending on type

        $source = $sourceType::factory()->create();

        return [
            //define the stock movement factory fields

            'product_id' => \App\Models\Product::factory(),
            'type' => $type,
            'quantity' => $this->faker->numberBetween(1, 100),
            'source_type' => $sourceType,
            'source_id' => $source->id,
            'movement_date' => $this->faker->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
        ];
    }
}




   

    

