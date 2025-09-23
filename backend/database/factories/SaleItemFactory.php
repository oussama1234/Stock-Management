<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SaleItem>
 */
class SaleItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sale_id' => 1, // Will be set by seeder
            'product_id' => $this->faker->numberBetween(1, 64), // Reference existing products
            'quantity' => $this->faker->numberBetween(1, 10), // Retail quantities
            'price' => $this->faker->randomFloat(2, 20, 1500), // Retail prices
        ];
    }
}
