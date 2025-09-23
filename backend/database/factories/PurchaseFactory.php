<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Purchase>
 */
class PurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => $this->faker->numberBetween(1, 10), // Reference existing users
            'supplier_id' => $this->faker->numberBetween(1, 10), // Reference existing suppliers
            'total_amount' => 0, // Will be calculated based on purchase items
            'purchase_date' => $this->faker->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
